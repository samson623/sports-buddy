/**
 * Simple in-memory rate limiting (3 questions per minute per user)
 * For production, consider Redis or a database solution
 */

type RateLimitEntry = {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

const WINDOW_MS = 60 * 1000 // 1 minute
const MAX_REQUESTS = 3

/**
 * Check if user has exceeded rate limit
 * @param userId User ID from Supabase auth
 * @returns true if allowed, false if rate limited
 */
export function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = store.get(userId)

  if (!entry) {
    // First request, create new entry
    store.set(userId, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }

  if (now > entry.resetAt) {
    // Window expired, reset
    store.set(userId, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }

  // Window still active
  if (entry.count < MAX_REQUESTS) {
    entry.count++
    return true
  }

  // Rate limited
  return false
}

/**
 * Get remaining requests for a user
 */
export function getRemainingRequests(userId: string): number {
  const now = Date.now()
  const entry = store.get(userId)

  if (!entry) return MAX_REQUESTS

  if (now > entry.resetAt) return MAX_REQUESTS

  return Math.max(0, MAX_REQUESTS - entry.count)
}

/**
 * Get time until rate limit resets (in seconds)
 */
export function getResetTime(userId: string): number {
  const now = Date.now()
  const entry = store.get(userId)

  if (!entry) return 0

  if (now > entry.resetAt) return 0

  return Math.ceil((entry.resetAt - now) / 1000)
}

/**
 * Clean up old entries (call periodically to prevent memory leak)
 */
export function cleanupExpiredEntries(): void {
  const now = Date.now()
  for (const [userId, entry] of store.entries()) {
    if (now > entry.resetAt) {
      store.delete(userId)
    }
  }
}

// Cleanup every 5 minutes
setInterval(cleanupExpiredEntries, 5 * 60 * 1000)
