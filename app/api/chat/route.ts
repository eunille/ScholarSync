import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { chat, type Message } from '@/lib/gemini'
import type { Subject } from '@/lib/curriculum-prompts'

type StoredMessage = {
  role: 'user' | 'model'
  content: string
}

const ALLOWED_SUBJECTS: Subject[] = ['maths', 'science', 'english']
const MAX_MESSAGE_LENGTH = 2000
const MAX_FILE_CONTEXT_LENGTH = 6000
const MAX_OPTIMIZED_FILE_CONTEXT_LENGTH = 2500
const MAX_AI_HISTORY_MESSAGES = 16

const STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'that',
  'this',
  'from',
  'what',
  'when',
  'where',
  'which',
  'while',
  'would',
  'could',
  'should',
  'have',
  'has',
  'had',
  'you',
  'your',
  'about',
  'into',
  'them',
  'they',
  'their',
  'how',
  'why',
  'can',
])

function normalizeUserMessage(input: string) {
  const normalized = input
    .replace(/\bcalculos\b/gi, 'calculus')
    .replace(/\bimportante\b/gi, 'importance')
    .replace(/\bimporant\b/gi, 'important')

  return normalized.replace(/\s+/g, ' ').trim()
}

function normalizeForMatch(input: string) {
  return normalizeUserMessage(input).toLowerCase()
}

function wantsSimpleExplanation(input: string) {
  const lower = input.toLowerCase()
  return (
    lower.includes("explain like i'm 10") ||
    lower.includes('explain like i am 10') ||
    lower.includes('eli10') ||
    lower.includes('like a 10 year old')
  )
}

function extractKeywords(question: string) {
  const words = question
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word))

  return [...new Set(words)].slice(0, 10)
}

function optimizeFileContext(fileContext: string, question: string) {
  const cleaned = fileContext.replace(/\s+/g, ' ').trim()

  if (!cleaned) {
    return ''
  }

  if (cleaned.length <= MAX_OPTIMIZED_FILE_CONTEXT_LENGTH) {
    return cleaned
  }

  const keywords = extractKeywords(question)
  const chunks = cleaned
    .split(/(?<=[.!?])\s+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)

  if (keywords.length === 0 || chunks.length === 0) {
    return cleaned.slice(0, MAX_OPTIMIZED_FILE_CONTEXT_LENGTH)
  }

  const scored = chunks
    .map((chunk, index) => {
      const lower = chunk.toLowerCase()
      const score = keywords.reduce(
        (total, keyword) => total + (lower.includes(keyword) ? 1 : 0),
        0
      )
      return { chunk, index, score }
    })
    .filter((item) => item.score > 0)

  if (scored.length === 0) {
    return cleaned.slice(0, MAX_OPTIMIZED_FILE_CONTEXT_LENGTH)
  }

  const ranked = [...scored]
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .sort((a, b) => a.index - b.index)

  const selected: string[] = []
  let totalLength = 0

  for (const item of ranked) {
    const nextLength = totalLength + item.chunk.length + 1
    if (nextLength > MAX_OPTIMIZED_FILE_CONTEXT_LENGTH) {
      break
    }

    selected.push(item.chunk)
    totalLength = nextLength
  }

  if (selected.length === 0) {
    return cleaned.slice(0, MAX_OPTIMIZED_FILE_CONTEXT_LENGTH)
  }

  return selected.join(' ')
}

function trimHistoryForAi(messages: StoredMessage[]) {
  if (messages.length <= MAX_AI_HISTORY_MESSAGES) {
    return messages
  }

  return messages.slice(-MAX_AI_HISTORY_MESSAGES)
}

function isCacheableModelResponse(content: string) {
  const trimmed = content.trim()
  const lower = trimmed.toLowerCase()

  if (trimmed.length < 40) {
    return false
  }

  if (lower.startsWith('error:')) {
    return false
  }

  if (lower.includes('temporary ai limits') || lower.includes('try again')) {
    return false
  }

  if (
    lower.includes('couldn\'t find any information about "calculos"') ||
    lower.includes("couldn't find any information about 'calculos'") ||
    lower.includes('made-up term') ||
    lower.includes('still a bit of confusion')
  ) {
    return false
  }

  return true
}

function findCachedResponse(messages: StoredMessage[], normalizedQuestion: string) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const current = messages[i]

    if (current.role !== 'user') {
      continue
    }

    if (normalizeForMatch(current.content) !== normalizedQuestion) {
      continue
    }

    for (let j = i + 1; j < messages.length; j += 1) {
      const next = messages[j]

      if (next.role === 'model') {
        return isCacheableModelResponse(next.content) ? next.content : null
      }

      if (next.role === 'user') {
        break
      }
    }
  }

  return null
}

async function getRecentSubjectMessages(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
  subject: Subject,
  currentSessionId: string
) {
  const { data: recentSessions, error: sessionLookupError } = await supabase
    .from('chat_sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('subject', subject)
    .neq('id', currentSessionId)
    .order('created_at', { ascending: false })
    .limit(4)

  if (sessionLookupError || !recentSessions || recentSessions.length === 0) {
    return [] as StoredMessage[]
  }

  const recentSessionIds = recentSessions.map((session) => session.id)

  const { data: recentMessages, error: messageLookupError } = await supabase
    .from('messages')
    .select('role, content, created_at')
    .in('session_id', recentSessionIds)
    .order('created_at', { ascending: true })

  if (messageLookupError || !recentMessages) {
    return [] as StoredMessage[]
  }

  return recentMessages
    .filter((msg) => msg.role === 'user' || msg.role === 'model')
    .map((msg) => ({ role: msg.role as 'user' | 'model', content: msg.content }))
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { message, subject, sessionId, inputMode, fileName, fileContext, fileScope } = body as {
      message?: string
      subject?: string
      sessionId?: string
      inputMode?: 'standard' | 'file'
      fileName?: string
      fileContext?: string
      fileScope?: 'subject' | 'general'
    }

    const normalizedMessage =
      typeof message === 'string' ? normalizeUserMessage(message) : ''
    const hasValidSubject =
      typeof subject === 'string' && ALLOWED_SUBJECTS.includes(subject as Subject)

    if (!normalizedMessage || !hasValidSubject) {
      return NextResponse.json(
        { error: 'Valid message and subject are required' },
        { status: 400 }
      )
    }

    if (normalizedMessage.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message must be ${MAX_MESSAGE_LENGTH} characters or less` },
        { status: 400 }
      )
    }

    const normalizedSubject = subject as Subject
    const isFileMode = inputMode === 'file'
    const isGeneralFileMode = isFileMode && fileScope === 'general'
    const useCache = !isFileMode
    const useSimpleMode = wantsSimpleExplanation(normalizedMessage)

    let currentSessionId = sessionId

    if (!currentSessionId) {
      const { data: newSession, error: sessionError } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: session.user.id,
          subject: normalizedSubject,
        })
        .select('id')
        .single()

      if (sessionError) throw sessionError
      currentSessionId = newSession.id
    }

    if (!currentSessionId) {
      throw new Error('Unable to resolve chat session')
    }

    const resolvedSessionId = currentSessionId

    const { data: messageHistory, error: historyError } = await supabase
      .from('messages')
      .select('role, content')
      .eq('session_id', resolvedSessionId)
      .order('created_at', { ascending: true })

    if (historyError) throw historyError

    const { error: userMessageError } = await supabase.from('messages').insert({
      session_id: resolvedSessionId,
      role: 'user',
      content: normalizedMessage,
    })

    if (userMessageError) throw userMessageError

    const normalizedComparableMessage = normalizeForMatch(normalizedMessage)
    const typedHistory = (messageHistory || [])
      .filter((msg) => msg.role === 'user' || msg.role === 'model')
      .map((msg) => ({ role: msg.role as 'user' | 'model', content: msg.content }))

    const cachedInSession = useCache
      ? findCachedResponse(typedHistory, normalizedComparableMessage)
      : null

    let cachedCrossSession: string | null = null
    if (!cachedInSession && useCache) {
      const recentSubjectMessages = await getRecentSubjectMessages(
        supabase,
        session.user.id,
        normalizedSubject,
        resolvedSessionId
      )

      cachedCrossSession = findCachedResponse(
        recentSubjectMessages,
        normalizedComparableMessage
      )
    }

    const cachedResponse = cachedInSession || cachedCrossSession

    if (cachedResponse) {
      const { error: cachedInsertError } = await supabase.from('messages').insert({
        session_id: resolvedSessionId,
        role: 'model',
        content: cachedResponse,
      })

      if (cachedInsertError) throw cachedInsertError

      return NextResponse.json({
        response: cachedResponse,
        sessionId: resolvedSessionId,
        cached: true,
      })
    }

    const safeFileContext =
      inputMode === 'file' && typeof fileContext === 'string'
        ? fileContext.slice(0, MAX_FILE_CONTEXT_LENGTH).trim()
        : ''

    const optimizedFileContext = optimizeFileContext(safeFileContext, normalizedMessage)

    if (isFileMode && !optimizedFileContext) {
      return NextResponse.json(
        { error: 'File-assisted mode requires extracted file context.' },
        { status: 400 }
      )
    }

    const fileGroundingRule =
      isFileMode && optimizedFileContext
        ? 'STRICT FILE GROUNDING: Answer using ONLY facts present in the extracted file context. If the answer is not present in the file, say exactly: "I could not find that in the uploaded file." Do not use outside knowledge.'
        : ''

    const modeContext =
      isFileMode && fileName
        ? isGeneralFileMode
          ? `Student selected file-assisted GENERAL mode using file: ${fileName}.`
          : `Student selected file-assisted SUBJECT mode using file: ${fileName}.`
        : ''

    const styleContext = useSimpleMode
      ? 'STYLE OVERRIDE: The student requested simple language. Explain in short sentences with simple words.'
      : ''

    const combinedContext = [modeContext, fileGroundingRule, styleContext, optimizedFileContext ? `Extracted file context:\n${optimizedFileContext}` : '']
      .filter(Boolean)
      .join('\n\n')

    const trimmedHistoryForAi = trimHistoryForAi(typedHistory)

    const aiMessages: Message[] = [
      ...trimmedHistoryForAi.map((msg) => ({
        role: msg.role,
        parts: msg.content,
      })),
      {
        role: 'user' as const,
        parts: combinedContext
          ? `${combinedContext}\n\nStudent question: ${normalizedMessage}`
          : normalizedMessage,
      },
    ]

    let aiResponse: string
    try {
      aiResponse = await chat(normalizedSubject, aiMessages)
    } catch (providerError) {
      const providerMessage =
        providerError instanceof Error
          ? providerError.message
          : 'AI service is temporarily unavailable'
      const lowerProviderMessage = providerMessage.toLowerCase()

      if (
        lowerProviderMessage.includes('not configured') ||
        lowerProviderMessage.includes('api key') ||
        lowerProviderMessage.includes('unauthorized') ||
        lowerProviderMessage.includes('invalid api key')
      ) {
        return NextResponse.json(
          {
            error:
              'AI provider is not configured correctly. Add valid GOOGLE_AI_API_KEY or GROQ_API_KEY in deployment settings.',
          },
          { status: 503 }
        )
      }

      const fallbackReply =
        'I could not generate a response right now due to temporary AI limits. Please wait a bit and try again.'

      const { error: fallbackInsertError } = await supabase.from('messages').insert({
        session_id: resolvedSessionId,
        role: 'model',
        content: fallbackReply,
      })

      if (fallbackInsertError) {
        throw providerError
      }

      return NextResponse.json({
        response: fallbackReply,
        sessionId: resolvedSessionId,
      })
    }

    const { error: aiMessageError } = await supabase.from('messages').insert({
      session_id: resolvedSessionId,
      role: 'model',
      content: aiResponse,
    })

    if (aiMessageError) throw aiMessageError

    return NextResponse.json({
      response: aiResponse,
      sessionId: resolvedSessionId,
      cached: false,
    })
  } catch (error: unknown) {
    console.error('Chat API error:', error)

    const message = error instanceof Error ? error.message : 'Internal server error'
    const lower = message.toLowerCase()

    if (lower.includes('429') || lower.includes('quota') || lower.includes('rate limit')) {
      return NextResponse.json(
        { error: 'Rate limit reached. Please wait about 30 seconds and try again.' },
        { status: 429 }
      )
    }

    if (lower.includes('model') || lower.includes('googlegenerativeai')) {
      return NextResponse.json(
        { error: 'AI service is temporarily unavailable. Please try again.' },
        { status: 503 }
      )
    }

    if (lower.includes('unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Unable to process your request right now. Please try again.' },
      { status: 500 }
    )
  }
}
