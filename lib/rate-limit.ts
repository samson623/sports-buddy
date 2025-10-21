export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterMs: number }

// Simple in-memory sliding window limiter: 3 requests / 60s per key
const WINDOW_MS = 60_000
const LIMIT = 3
const bucket = new Map<string, number[]>()

export function rateLimitConsume(key: string): RateLimitResult {
  const now = Date.now()
  const since = now - WINDOW_MS
  const arr = (bucket.get(key) || []).filter((t) => t > since)
  if (arr.length >= LIMIT) {
    const retryAfterMs = Math.max(0, arr[0] + WINDOW_MS - now)
    bucket.set(key, arr)
    return { allowed: false, retryAfterMs }
  }
  arr.push(now)
  bucket.set(key, arr)
  return { allowed: true }
}

export function rateLimitKeyFrom(request: Request, userId?: string | null) {
  const xfwd = request.headers.get('x-forwarded-for') || ''
  const ip = xfwd.split(',')[0].trim() || 'local'
  return userId ? `u:${userId}` : `ip:${ip}`
}
