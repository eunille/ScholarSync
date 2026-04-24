import Link from 'next/link'
import { BookOpen, Calculator, FlaskConical, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'

const subjects = [
  {
    title: 'Mathematics',
    description: 'Number, Algebra, Geometry',
    icon: Calculator,
  },
  {
    title: 'Science',
    description: 'Biology, Chemistry, Physics',
    icon: FlaskConical,
  },
  {
    title: 'English',
    description: 'Reading, Writing, Literature',
    icon: BookOpen,
  },
]

export default function Page() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-background to-muted/30 px-6 py-14">
      <div className="w-full max-w-5xl space-y-10">
        <div className="space-y-4 text-center">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full border bg-background shadow-sm">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            AI Subject Tutor
          </h1>
          <p className="mx-auto max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
            Reliable support for Mathematics, Science, and English grounded in the Victorian Curriculum.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {subjects.map((subject) => {
            const Icon = subject.icon
            return (
              <div key={subject.title} className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-medium">{subject.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{subject.description}</p>
              </div>
            )
          })}
        </div>

        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="min-w-40">
            <Link href="/signup">Create Account</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="min-w-40">
            <Link href="/login">Log In</Link>
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">Powered by Gemini and Groq with Supabase authentication.</p>
      </div>
    </div>
  )
}
