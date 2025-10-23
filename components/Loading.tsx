"use client"

export default function Loading() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        <span className="text-sm text-muted-foreground">Loading…</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-lg border p-4">
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
            <div className="mt-3 h-3 w-2/3 animate-pulse rounded bg-muted" />
            <div className="mt-6 h-24 w-full animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}
