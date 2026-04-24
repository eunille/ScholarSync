'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  BookOpen,
  Calculator,
  FileText,
  FlaskConical,
  GraduationCap,
  History,
  Loader2,
  LogOut,
  MessageSquarePlus,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { createClient, hasSupabaseBrowserEnv } from '@/lib/supabase'
import { ChatMessage } from '@/components/ChatMessage'
import { ChatInput } from '@/components/ChatInput'
import type { Subject } from '@/lib/curriculum-prompts'
import { Button } from '@/components/ui/button'

type ChatMode = 'standard' | 'file'
type FileScope = 'subject' | 'general'

interface Message {
  id: string
  role: 'user' | 'model'
  content: string
  created_at: string
}

interface SessionItem {
  id: string
  subject: Subject
  createdAt: string
  previewText: string
}

interface SessionRecord {
  id: string
  subject: string
  created_at: string
}

interface SessionPreviewRecord {
  session_id: string
  content: string
  created_at: string
}

const emptyStateIcons: Record<Subject, React.ComponentType<{ className?: string }>> = {
  maths: Calculator,
  science: FlaskConical,
  english: BookOpen,
}

function getSafeChatErrorMessage(raw: string) {
  const message = raw.toLowerCase()

  if (message.includes('unauthorized')) return 'Your session expired. Please log in again.'

  if (
    message.includes('rate limit reached') ||
    message.includes('quota') ||
    message.includes('too many requests') ||
    message.includes('429')
  ) {
    return 'Rate limit reached. Please wait about 30 seconds and try again.'
  }

  if (
    message.includes('ai service is temporarily unavailable') ||
    message.includes('googlegenerativeai') ||
    message.includes('model')
  ) {
    return 'AI service is temporarily unavailable. Please try again.'
  }

  if (message.includes('message must be')) return raw

  if (message.includes('valid message and subject are required')) {
    return 'Please enter a valid message and subject.'
  }

  return 'Unable to send message right now. Please try again.'
}

function formatSessionTime(isoDate: string) {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return 'Unknown time'

  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function truncatePreview(text: string, maxLength = 120) {
  const compact = text.replace(/\s+/g, ' ').trim()
  if (compact.length <= maxLength) return compact
  return `${compact.slice(0, maxLength)}...`
}

function detectSubjectFromMessage(input: string, fallbackSubject: Subject = 'science'): Subject {
  const message = input.toLowerCase()

  const mathHits = [
    'equation',
    'algebra',
    'geometry',
    'fraction',
    'decimal',
    'calculus',
    'solve',
    'probability',
    'statistics',
    'ratio',
    'percentage',
  ]
  const scienceHits = [
    'experiment',
    'cell',
    'energy',
    'force',
    'atom',
    'biology',
    'chemistry',
    'physics',
    'planet',
    'solar system',
    'sun',
    'star',
    'gravity',
    'orbit',
    'earth',
    'mars',
    'temperature',
    'molecule',
  ]
  const englishHits = [
    'essay',
    'grammar',
    'paragraph',
    'poem',
    'theme',
    'character',
    'verb',
    'narrative',
    'comprehension',
    'punctuation',
  ]

  const score = (keywords: string[]) => keywords.filter((word) => message.includes(word)).length

  const mathsScore = score(mathHits)
  const scienceScore = score(scienceHits)
  const englishScore = score(englishHits)

  if (scienceScore > mathsScore && scienceScore > englishScore) return 'science'
  if (englishScore > mathsScore && englishScore > scienceScore) return 'english'
  if (mathsScore > scienceScore && mathsScore > englishScore) return 'maths'

  return fallbackSubject
}

export default function ChatPage() {
  const [subject, setSubject] = useState<Subject>('maths')
  const [messages, setMessages] = useState<Message[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const [lastSendAt, setLastSendAt] = useState(0)
  const [chatMode, setChatMode] = useState<ChatMode>('standard')
  const [selectedFileName, setSelectedFileName] = useState('')
  const [extractedFileContext, setExtractedFileContext] = useState('')
  const [fileExtracting, setFileExtracting] = useState(false)
  const [fileExtractError, setFileExtractError] = useState('')
  const [fileWasTruncated, setFileWasTruncated] = useState(false)
  const [fileScope, setFileScope] = useState<FileScope>('subject')
  const [recentSessions, setRecentSessions] = useState<SessionItem[]>([])
  const [recentLoading, setRecentLoading] = useState(false)
  const [deleteTargetSession, setDeleteTargetSession] = useState<SessionItem | null>(null)
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null)
  const [sessionActionError, setSessionActionError] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inlineFileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    loadRecentSessions()
  }, [])

  async function loadRecentSessions() {
    if (!supabase || !hasSupabaseBrowserEnv()) {
      setRecentSessions([])
      setRecentLoading(false)
      return
    }

    setRecentLoading(true)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        setRecentSessions([])
        return
      }

      const { data: sessions, error: sessionError } = await supabase
        .from('chat_sessions')
        .select('id, subject, created_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (sessionError || !sessions) {
        setRecentSessions([])
        return
      }

      const typedSessions = sessions as SessionRecord[]
      const filtered = typedSessions.filter(
        (item: SessionRecord) =>
          item.subject === 'maths' || item.subject === 'science' || item.subject === 'english'
      )

      if (!filtered.length) {
        setRecentSessions([])
        return
      }

      const sessionIds = filtered.map((item) => item.id)
      const { data: allMessages } = await supabase
        .from('messages')
        .select('session_id, content, created_at')
        .in('session_id', sessionIds)
        .order('created_at', { ascending: false })

      const previewMap = new Map<string, string>()
      for (const msg of (allMessages as SessionPreviewRecord[] | null) || []) {
        if (!previewMap.has(msg.session_id)) {
          previewMap.set(msg.session_id, msg.content)
        }
      }

      const sessionItems: SessionItem[] = filtered.map((item: SessionRecord) => ({
        id: item.id,
        subject: item.subject as Subject,
        createdAt: item.created_at,
        previewText: previewMap.get(item.id) || 'No messages yet.',
      }))

      setRecentSessions(sessionItems)
    } catch {
      setRecentSessions([])
    } finally {
      setRecentLoading(false)
    }
  }

  async function loadSessionById(targetSessionId: string, targetSubject: Subject) {
    if (!supabase) {
      setHistoryError('Chat service is unavailable right now. Please refresh and try again.')
      return
    }

    setInitialLoading(true)
    setHistoryError('')
    setSessionActionError('')

    try {
      const { data: messageData, error: messagesError } = await supabase
        .from('messages')
        .select('id, role, content, created_at')
        .eq('session_id', targetSessionId)
        .order('created_at', { ascending: true })

      if (messagesError) throw messagesError

      setSubject(targetSubject)
      setSessionId(targetSessionId)
      setMessages(messageData || [])
      setChatMode('standard')
    } catch {
      setHistoryError('Unable to load chat history right now. Please refresh and try again.')
    } finally {
      setInitialLoading(false)
    }
  }

  function startNewSession() {
    setSessionId(null)
    setMessages([])
    setHistoryError('')
    setSessionActionError('')
    setInitialLoading(false)
    setChatMode('standard')
  }

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setSelectedFileName(file.name)
    setFileExtractError('')
    setFileExtracting(true)
    setExtractedFileContext('')
    setFileWasTruncated(false)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/extract', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json().catch(() => ({ error: 'File extraction failed' }))

      if (!response.ok) {
        throw new Error(data.error || 'File extraction failed')
      }

      setExtractedFileContext(data.extractedText || '')
      setFileWasTruncated(Boolean(data.truncated))
      setFileScope('subject')
      setChatMode('file')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'File extraction failed'
      setFileExtractError(message)
    } finally {
      setFileExtracting(false)
    }
  }

  async function handleSendMessage(message: string) {
    const now = Date.now()
    if (loading || fileExtracting || now - lastSendAt < 800) return

    if (chatMode === 'file' && !extractedFileContext) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'model',
        content: 'Error: Upload a supported file and wait for extraction before sending a file-assisted question.',
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
      return
    }

    const fileAwareDetectionText =
      chatMode === 'file'
        ? `${message}\n${extractedFileContext.slice(0, 2200)}`
        : message

    const resolvedSubject = sessionId
      ? subject
      : detectSubjectFromMessage(fileAwareDetectionText, chatMode === 'file' ? 'science' : subject)
    if (!sessionId) setSubject(resolvedSubject)

    setLastSendAt(now)
    setLoading(true)

    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: message,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempUserMessage])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          subject: resolvedSubject,
          sessionId,
          inputMode: chatMode,
          fileName: selectedFileName || undefined,
          fileContext: extractedFileContext || undefined,
          fileScope: chatMode === 'file' ? fileScope : undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to send message' }))

        setMessages((prev) => prev.filter((msg) => msg.id !== tempUserMessage.id))

        const safeMessage = getSafeChatErrorMessage(errorData.error || 'Failed to send message')
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: 'model',
          content: `Error: ${safeMessage}`,
          created_at: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, errorMessage])
        return
      }

      const data = await response.json()

      if (!sessionId && data.sessionId) {
        setSessionId(data.sessionId)
      }

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'model',
        content: data.response,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, aiMessage])
      await loadRecentSessions()
    } catch (error: unknown) {
      setMessages((prev) => prev.filter((msg) => msg.id !== tempUserMessage.id))

      const rawMessage = error instanceof Error ? error.message : 'Failed to send message'
      const safeMessage = getSafeChatErrorMessage(rawMessage)

      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'model',
        content: `Error: ${safeMessage}`,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  function handleOpenInlineFilePicker() {
    inlineFileInputRef.current?.click()
  }

  function openDeleteConfirmation(session: SessionItem) {
    if (deletingSessionId) return
    setSessionActionError('')
    setDeleteTargetSession(session)
  }

  function closeDeleteConfirmation() {
    if (deletingSessionId) return
    setDeleteTargetSession(null)
  }

  async function handleDeleteSession() {
    if (!deleteTargetSession || deletingSessionId) return

    const targetSessionId = deleteTargetSession.id
    setDeletingSessionId(targetSessionId)
    setSessionActionError('')

    try {
      const response = await fetch(`/api/chat/session/${targetSessionId}`, {
        method: 'DELETE',
      })

      const data = await response.json().catch(() => ({ error: 'Failed to delete session' }))

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete session')
      }

      setRecentSessions((prev) => prev.filter((item) => item.id !== targetSessionId))

      if (sessionId === targetSessionId) {
        startNewSession()
      }

      setDeleteTargetSession(null)
      await loadRecentSessions()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to delete session.'
      setSessionActionError(message)
    } finally {
      setDeletingSessionId(null)
    }
  }

  function handleDetachFile() {
    setSelectedFileName('')
    setExtractedFileContext('')
    setFileExtractError('')
    setFileWasTruncated(false)
    if (chatMode === 'file') setChatMode('standard')
  }

  async function handleLogout() {
    if (supabase) {
      await supabase.auth.signOut()
    }

    router.push('/login')
    router.refresh()
  }

  const SubjectIcon = emptyStateIcons[subject]
  const hasBlockingFileError =
    Boolean(selectedFileName) && Boolean(fileExtractError) && !Boolean(extractedFileContext)

  return (
    <div className="flex h-screen flex-col bg-background">
      <div className="flex items-center justify-between border-b bg-background/95 px-5 py-3 backdrop-blur">
        <div className="inline-flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">AI Subject Tutor</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-80 shrink-0 border-r bg-muted/10 p-4 lg:block">
          <div className="mb-4 space-y-2">
            <Button className="w-full justify-start" onClick={startNewSession}>
              <MessageSquarePlus className="mr-2 h-4 w-4" />
              New chat session
            </Button>
          </div>

          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground/90">
            Recent Sessions
          </div>

          <div className="space-y-2 overflow-y-auto pb-2 pr-1">
            {recentSessions.map((item) => (
              <div
                key={item.id}
                className={`rounded-xl border p-2 transition hover:border-primary/40 hover:bg-background ${
                  sessionId === item.id ? 'border-primary/60 bg-primary/10 shadow-sm' : 'bg-background/70'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    className="flex-1 rounded-lg p-1 text-left"
                    onClick={() => loadSessionById(item.id, item.subject)}
                    disabled={deletingSessionId === item.id}
                  >
                    <div className="text-xs text-muted-foreground/90">{formatSessionTime(item.createdAt)}</div>
                    <div className="mt-1 text-sm text-foreground/90">{truncatePreview(item.previewText, 90)}</div>
                  </button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-red-600"
                    onClick={() => openDeleteConfirmation(item)}
                    disabled={deletingSessionId === item.id}
                    aria-label="Delete session"
                  >
                    {deletingSessionId === item.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}

            {!recentSessions.length && !recentLoading && (
              <div className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
                No sessions yet. Start a new chat.
              </div>
            )}
          </div>
        </aside>

        <div className="flex min-h-0 flex-1 flex-col">
          {chatMode === 'file' && (
            <div className="border-b bg-muted/30 px-4 py-2 text-sm text-muted-foreground">
              <div className="flex flex-wrap items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>File-assisted mode: {selectedFileName || 'No file selected yet'}</span>
                {fileExtracting && (
                  <span className="inline-flex items-center gap-1 text-primary">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Extracting text...
                  </span>
                )}
                {!fileExtracting && extractedFileContext && (
                  <span className="text-emerald-700 dark:text-emerald-400">
                    Context ready{fileWasTruncated ? ' (truncated to fit limits)' : ''}
                  </span>
                )}
                {fileExtractError && (
                  <span className="inline-flex items-center gap-1 text-red-700 dark:text-red-400">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {fileExtractError}
                  </span>
                )}
              </div>

              <div className="mt-2 inline-flex rounded-md border bg-background p-0.5 shadow-sm">
                <button
                  type="button"
                  className={`rounded px-2.5 py-1 text-xs ${
                    fileScope === 'subject' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                  }`}
                  onClick={() => setFileScope('subject')}
                >
                  Subject scope
                </button>
                <button
                  type="button"
                  className={`rounded px-2.5 py-1 text-xs ${
                    fileScope === 'general' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                  }`}
                  onClick={() => setFileScope('general')}
                >
                  General scope
                </button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {fileScope === 'subject'
                  ? `Subject scope keeps answers aligned to ${subject} using the uploaded file.`
                  : 'General scope uses the uploaded file across subjects when relevant.'}
              </p>
            </div>
          )}

          <div className="flex-1 overflow-y-auto bg-background">
            {(historyError || sessionActionError) && (
              <div className="px-4 pt-4">
                {historyError && (
                  <div className="inline-flex w-full items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300">
                    <AlertCircle className="mt-0.5 h-4 w-4" />
                    <span>{historyError}</span>
                  </div>
                )}
                {sessionActionError && (
                  <div className="mt-2 inline-flex w-full items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                    <AlertCircle className="mt-0.5 h-4 w-4" />
                    <span>{sessionActionError}</span>
                  </div>
                )}
              </div>
            )}

            {initialLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full items-center justify-center p-6">
                <div className="w-full max-w-xl rounded-2xl border bg-muted/20 p-8 text-center">
                  <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full border bg-background">
                    <SubjectIcon className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold">Tutor Session</h2>
                  <p className="mt-2 text-muted-foreground">
                    Ask anything. You will get clear, easy-to-understand answers aligned to curriculum expectations.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-1 py-4">
                {messages.map((msg) => (
                  <ChatMessage key={msg.id} role={msg.role} content={msg.content} />
                ))}
                {loading && (
                  <div className="flex justify-start px-4 py-3">
                    <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-2.5 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing request...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <div className="border-t bg-background px-2 py-2">
            <div className="mb-2 flex flex-wrap items-center gap-2 px-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleOpenInlineFilePicker}
                disabled={fileExtracting}
              >
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                Attach file
              </Button>
              <input
                ref={inlineFileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,.md"
                className="hidden"
                onChange={handleFileSelect}
              />

              {selectedFileName && (
                <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                  <span>{selectedFileName}</span>
                  <button
                    type="button"
                    aria-label="Detach file"
                    className="rounded p-0.5 hover:bg-muted"
                    onClick={handleDetachFile}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {fileExtracting && (
                <span className="inline-flex items-center gap-1 text-xs text-primary">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Extracting
                </span>
              )}

              {!fileExtracting && extractedFileContext && (
                <span className="text-xs text-emerald-700 dark:text-emerald-400">File context ready</span>
              )}

              {hasBlockingFileError && (
                <span className="inline-flex items-center gap-2 text-xs text-red-700 dark:text-red-400">
                  <AlertCircle className="h-3 w-3" />
                  File extraction failed. Replace or remove the file.
                </span>
              )}
            </div>

            <ChatInput
              onSend={handleSendMessage}
              disabled={loading || fileExtracting || hasBlockingFileError}
            />
          </div>
        </div>
      </div>
      {deleteTargetSession && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-session-title"
        >
          <div className="w-full max-w-md rounded-2xl border bg-background p-5 shadow-2xl">
            <h2 id="delete-session-title" className="text-lg font-semibold">
              Delete chat session?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This will permanently remove the selected chat and all messages in it.
            </p>
            <div className="mt-4 rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              <div>Created: {formatSessionTime(deleteTargetSession.createdAt)}</div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={closeDeleteConfirmation}
                disabled={Boolean(deletingSessionId)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteSession}
                disabled={Boolean(deletingSessionId)}
              >
                {deletingSessionId ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </span>
                ) : (
                  'Delete session'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
