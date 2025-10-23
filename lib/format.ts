export function formatSpread(value: number | null | undefined) {
  if (value == null) return '—'
  return value > 0 ? `+${value}` : `${value}`
}

export function formatMoneyline(value: number | null | undefined) {
  if (value == null) return '—'
  return value > 0 ? `+${value}` : `${value}`
}

export function formatRecord(wins?: number | null, losses?: number | null, ties?: number | null) {
  const w = wins ?? 0
  const l = losses ?? 0
  const t = ties ?? 0
  return t > 0 ? `${w}-${l}-${t}` : `${w}-${l}`
}
