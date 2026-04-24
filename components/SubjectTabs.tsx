'use client'

import { BookOpen, Calculator, FlaskConical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { subjectNames, type Subject } from '@/lib/curriculum-prompts'

interface SubjectTabsProps {
  currentSubject: Subject
  onSubjectChange: (subject: Subject) => void
  disabled?: boolean
}

const subjectIcons: Record<Subject, React.ComponentType<{ className?: string }>> = {
  maths: Calculator,
  science: FlaskConical,
  english: BookOpen,
}

export function SubjectTabs({
  currentSubject,
  onSubjectChange,
  disabled,
}: SubjectTabsProps) {
  const subjects: Subject[] = ['maths', 'science', 'english']

  return (
    <div className="flex gap-2 border-b bg-background px-4 py-3">
      {subjects.map((subject) => {
        const Icon = subjectIcons[subject]

        return (
          <button
            key={subject}
            onClick={() => onSubjectChange(subject)}
            disabled={disabled}
            className={cn(
              'inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition-colors',
              currentSubject === subject
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            <Icon className="mr-2 h-4 w-4" />
            {subjectNames[subject]}
          </button>
        )
      })}
    </div>
  )
}
