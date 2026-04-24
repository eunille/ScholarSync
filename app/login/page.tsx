'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, UserCircle2 } from 'lucide-react'
import { createClient, hasSupabaseBrowserEnv } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

const AUTH_UNAVAILABLE_MESSAGE =
  'Authentication service is currently unavailable. Please try again later.'
const AUTH_EMAIL_CONFIRMATION_MESSAGE =
  'Please confirm your email before logging in. For demo mode, disable email confirmation in Supabase Auth settings.'

function getSupabaseConfigError() {
  if (!hasSupabaseBrowserEnv()) {
    return AUTH_UNAVAILABLE_MESSAGE
  }

  return null
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const configError = getSupabaseConfigError()
    if (configError) {
      setError(configError)
      setLoading(false)
      return
    }

    if (!supabase) {
      setError(AUTH_UNAVAILABLE_MESSAGE)
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        const normalized = (error.message || '').toLowerCase()
        if (normalized.includes('email not confirmed')) {
          setError(AUTH_EMAIL_CONFIRMATION_MESSAGE)
        } else if (normalized.includes('invalid login credentials')) {
          setError('Invalid email or password.')
        } else {
          setError('Unable to log in right now. Please try again.')
        }
        return
      }

      router.push('/chat')
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to log in'
      if (message.toLowerCase().includes('failed to fetch')) {
        setError(AUTH_UNAVAILABLE_MESSAGE)
      } else {
        setError('Unable to log in right now. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="space-y-3 text-center">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full border bg-background">
            <UserCircle2 className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Welcome Back</h1>
          <p className="text-muted-foreground">Log in to continue your learning</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@school.edu.au"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
                disabled={loading}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          Do not have an account?{' '}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}
