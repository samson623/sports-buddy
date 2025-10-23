import { format, formatDistanceToNowStrict } from 'date-fns'

export function formatGameTime(iso: string | null | undefined) {
  if (!iso) return 'TBD'
  try {
    const d = new Date(iso)
    return format(d, 'MMM d, h:mm a')
  } catch {
    return 'TBD'
  }
}

export function formatRelativeTime(iso: string | null | undefined) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return formatDistanceToNowStrict(d, { addSuffix: true })
  } catch {
    return ''
  }
}

// Simple current NFL week calculator (assumes season starts early Sep). Adjust as needed.
export function getCurrentNFLWeek(baseSeasonStartISO?: string) {
  const start = baseSeasonStartISO ? new Date(baseSeasonStartISO) : new Date(new Date().getFullYear(), 8, 1)
  const now = new Date()
  const msInWeek = 7 * 24 * 60 * 60 * 1000
  const diff = Math.max(0, now.getTime() - start.getTime())
  return Math.min(18, Math.floor(diff / msInWeek) + 1)
}
