export default function Loading() {
  return (
    <div className="flex h-screen flex-col">
      {/* Header skeleton */}
      <div className="flex items-center justify-between border-b bg-background px-4 py-3">
        <div className="h-6 w-32 animate-pulse rounded bg-muted" />
        <div className="h-9 w-24 animate-pulse rounded bg-muted" />
      </div>

      {/* Subject tabs skeleton */}
      <div className="flex gap-2 border-b bg-background px-4 py-3">
        <div className="h-9 w-32 animate-pulse rounded-full bg-muted" />
        <div className="h-9 w-24 animate-pulse rounded-full bg-muted" />
        <div className="h-9 w-28 animate-pulse rounded-full bg-muted" />
      </div>

      {/* Messages skeleton */}
      <div className="flex-1 space-y-4 p-4">
        <div className="flex justify-end">
          <div className="h-16 w-64 animate-pulse rounded-2xl bg-muted" />
        </div>
        <div className="flex justify-start">
          <div className="h-20 w-80 animate-pulse rounded-2xl bg-muted" />
        </div>
        <div className="flex justify-end">
          <div className="h-12 w-48 animate-pulse rounded-2xl bg-muted" />
        </div>
      </div>

      {/* Input skeleton */}
      <div className="border-t bg-background p-4">
        <div className="h-[60px] w-full animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  )
}
