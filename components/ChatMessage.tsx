'use client'

import { cn } from '@/lib/utils'

interface ChatMessageProps {
  role: 'user' | 'model'
  content: string
}

function stripLegacySourceLine(content: string) {
  return content
    .split('\n')
    .filter((line) => !/^\s*source:\s*victorian curriculum\s*-/i.test(line.trim()))
    .join('\n')
    .trim()
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === 'user'
  const displayContent = stripLegacySourceLine(content)

  return (
    <div
      className={cn(
        'flex w-full gap-3 px-4 py-3',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground'
        )}
      >
        <div className="whitespace-pre-wrap break-words">{displayContent}</div>
      </div>
    </div>
  )
}
