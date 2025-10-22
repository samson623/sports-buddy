import { Odds } from "@/types/database"

type Props = {
  odds: Odds[]
}

export default function OddsDisplay({ odds }: Props) {
  const latest = [...odds].sort((a, b) => (a.retrieved_at < b.retrieved_at ? 1 : -1))[0]
  const updated = latest ? new Date(latest.retrieved_at) : null
  return (
    <div className="space-y-3 text-sm">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded border p-3">
          <div className="text-xs text-muted-foreground">Spread</div>
          <div className="text-lg font-semibold">{latest?.spread ?? "—"}</div>
        </div>
        <div className="rounded border p-3">
          <div className="text-xs text-muted-foreground">Moneyline</div>
          <div className="text-lg font-semibold">
            H {latest?.moneyline_home ?? "—"} / A {latest?.moneyline_away ?? "—"}
          </div>
        </div>
        <div className="rounded border p-3">
          <div className="text-xs text-muted-foreground">Over/Under</div>
          <div className="text-lg font-semibold">{latest?.total ?? "—"}</div>
        </div>
      </div>
      <div className="text-xs text-muted-foreground">
        {updated ? `Last Updated: ${updated.toLocaleString()}` : "No odds available"}
      </div>
      <div className="text-xs text-muted-foreground">For entertainment only</div>
    </div>
  )
}
