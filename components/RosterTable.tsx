"use client"

import { Player, Team } from "@/types/database"
import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

type PlayerWithDepth = Player & { depth_chart?: { position: string; rank: number }[] }

type Props = {
  homeTeam: Team | null
  awayTeam: Team | null
  homePlayers: PlayerWithDepth[]
  awayPlayers: PlayerWithDepth[]
}

type SortKey = "last_name" | "position" | "jersey_number"

function Table({ team, players }: { team: Team | null; players: PlayerWithDepth[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("last_name")
  const [asc, setAsc] = useState<boolean>(true)

  const sorted = useMemo(() => {
    const arr = [...players]
    const getVal = (p: PlayerWithDepth): string | number | undefined => {
      if (sortKey === "last_name") return p.last_name
      if (sortKey === "position") return p.position ?? ""
      if (sortKey === "jersey_number") return p.jersey_number ?? undefined
      return undefined
    }
    arr.sort((a, b) => {
      const va = getVal(a)
      const vb = getVal(b)
      if (va == null) return 1
      if (vb == null) return -1
      if (typeof va === "number" && typeof vb === "number")
        return asc ? va - vb : vb - va
      const sa = String(va)
      const sb = String(vb)
      if (sa < sb) return asc ? -1 : 1
      if (sa > sb) return asc ? 1 : -1
      return 0
    })
    return arr
  }, [players, sortKey, asc])

  function onSort(key: SortKey) {
    if (sortKey === key) setAsc((v) => !v)
    else {
      setSortKey(key)
      setAsc(true)
    }
  }

  const headerBtn = (label: string, key: SortKey) => (
    <button onClick={() => onSort(key)} className="inline-flex items-center gap-1">
      {label}
      <span className={cn("text-xs", sortKey === key ? "opacity-100" : "opacity-30")}>{asc ? "▲" : "▼"}</span>
    </button>
  )

  const isStarter = (p: PlayerWithDepth) => (p.depth_chart || []).some((d) => d.rank === 1)

  return (
    <div>
      <div className="mb-2 text-sm font-semibold">{team?.full_name ?? "Team"}</div>
      {/* Desktop table */}
      <div className="hidden lg:block overflow-x-auto rounded border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left">{headerBtn("Name", "last_name")}</th>
              <th className="px-3 py-2 text-left">{headerBtn("Pos", "position")}</th>
              <th className="px-3 py-2 text-left">{headerBtn("#", "jersey_number")}</th>
              <th className="px-3 py-2 text-left">Starter</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="px-3 py-2">
                  {p.first_name} {p.last_name}
                </td>
                <td className="px-3 py-2">{p.position ?? "-"}</td>
                <td className="px-3 py-2">{p.jersey_number ?? "-"}</td>
                <td className="px-3 py-2">
                  {isStarter(p) && (
                    <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">Starter</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden space-y-2">
        {players.map((p) => (
          <Card key={p.id} className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">
                  {p.first_name} {p.last_name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {p.position ?? "-"} • #{p.jersey_number ?? "-"}
                </div>
              </div>
              {isStarter(p) && (
                <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">Starter</span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default function RosterTable({ homeTeam, awayTeam, homePlayers, awayPlayers }: Props) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Table team={awayTeam} players={awayPlayers} />
      <Table team={homeTeam} players={homePlayers} />
    </div>
  )
}
