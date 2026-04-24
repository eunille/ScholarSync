'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

const AUTH_UNAVAILABLE_MESSAGE =
  'Authentication service is currently unavailable. Please try again later.'
const SIGNUP_CONFIRMATION_MESSAGE =
  'Account created. Please confirm your email before logging in.'

function getSupabaseConfigError() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

  if (
    !url ||
    !anonKey ||
    url.includes('placeholder') ||
    anonKey.includes('placeholder')
  ) {
    return AUTH_UNAVAILABLE_MESSAGE
  }

  return null
}

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const configError = getSupabaseConfigError()
    if (configError) {
      setError(configError)
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/chat`,
        },
      })

      if (error) {
        const normalized = (error.message || '').toLowerCase()
        if (normalized.includes('already registered')) {
          setError('This email is already registered. Please log in instead.')
        } else {
          setError('Unable to create account right now. Please try again.')
        }
        return
      }

      setSuccess(true)
      if (data.session) {
        setSuccessMessage('Account created. Redirecting you to chat...')
        setTimeout(() => {
          router.push('/chat')
          router.refresh()
        }, 1200)
      } else {
        setSuccessMessage(SIGNUP_CONFIRMATION_MESSAGE)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create account'
      if (message.toLowerCase().includes('failed to fetch')) {
        setError(AUTH_UNAVAILABLE_MESSAGE)
      } else {
        setError('Unable to create account right now. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md space-y-4 rounded-2xl border bg-card p-6 text-center shadow-sm">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-semibold">Account Created</h1>
          <p className="text-muted-foreground">{successMessage}</p>
          {!successMessage.toLowerCase().includes('redirecting') && (
            <Link href="/login" className="text-sm font-medium text-primary hover:underline">
              Go to login
            </Link>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="space-y-3 text-center">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full border bg-background">
            <UserPlus className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Create Account</h1>
          <p className="text-muted-foreground">Join to start learning with AI</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
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
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
              disabled={loading}
              minLength={6}
            />
            <p className="text-xs text-muted-foreground">At least 6 characters</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </div>
      </div>
    </div>
  )
}
