'use client'

import { ShieldAlert } from 'lucide-react'

export default function Error() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="max-w-md space-y-4 text-center">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h2 className="text-2xl font-semibold">Authentication Error</h2>
        <p className="text-muted-foreground">
          There was a problem with authentication. Please log in again.
        </p>
        <a
          href="/login"
          className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Go to Login
        </a>
      </div>
    </div>
  )
}
