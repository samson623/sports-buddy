"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { useQuery, QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query"
import PullToRefresh from "react-pull-to-refresh"
import GameCard, { AugmentedGame } from "@/components/GameCard"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { Game, Team, Odds } from "@/types/database"

const WEEKS = Array.from({ length: 22 }, (_, i) => i + 1)

function firstThursdayOfSeptember(year: number) {
  const d = new Date(Date.UTC(year, 8, 1)) // Sept 1 UTC
  // 4 = Thursday (0=Sun)
  const day = d.getUTCDay()
  const diff = (4 - day + 7) % 7
  d.setUTCDate(d.getUTCDate() + diff)
  return d
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}

function getCurrentNFLWeek(today = new Date()) {
  const year = today.getUTCFullYear()
  const start = firstThursdayOfSeptember(year)
  const seasonStart = today < start ? firstThursdayOfSeptember(year - 1) : start
  const diffDays = Math.floor((Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) - +seasonStart) / 86_400_000)
  const week = Math.floor(diffDays / 7) + 1
  return clamp(week, 1, 22)
}

type GameRow = Game & {
  home_team: Team | null
  away_team: Team | null
  odds: Odds[]
}

function useGamesByWeek(week: number) {
  const supabase = React.useMemo(() => createClient(), [])
  return useQuery({
    queryKey: ["games", week],
    queryFn: async (): Promise<AugmentedGame[]> => {
      const { data, error } = await supabase
        .from("games")
        .select(`*, home_team:teams!games_home_team_id_fkey(*), away_team:teams!games_away_team_id_fkey(*), odds:odds(*)`)
        .eq("week", week)
        .order("kickoff_utc", { ascending: true })
      if (error) throw error
      const rows = (data ?? []) as unknown as GameRow[]
      return rows.map((g) => ({
        ...g,
        odds: g.odds?.sort((a, b) => (a.retrieved_at < b.retrieved_at ? 1 : -1))[0] ?? null,
      })) as AugmentedGame[]
    },
    staleTime: 1000 * 60, // 1 min
  })
}

function WeekSelector({ week, setWeek }: { week: number; setWeek: (w: number) => void }) {
  return (
    <div className="mb-4">
      {/* Mobile pills */}
      <div className="md:hidden overflow-x-auto">
        <div className="flex gap-2 whitespace-nowrap">
          {WEEKS.map((w) => (
            <button
              key={w}
              className={cn(
                "px-3 py-1 rounded-full text-sm border transition-colors",
                w === week
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setWeek(w)}
            >
              Week {w}
            </button>
          ))}
        </div>
      </div>
      {/* Desktop select */}
      <div className="hidden md:flex items-center gap-2">
        <label className="text-sm text-muted-foreground">Week</label>
        <select
          className="border rounded px-2 py-1 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
          value={week}
          onChange={(e) => setWeek(Number(e.target.value))}
        >
          {WEEKS.map((w) => (
            <option key={w} value={w}>
              Week {w}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

function GamesGrid({ week }: { week: number }) {
  const qc = useQueryClient()
  const { data, isLoading } = useGamesByWeek(week)

  const grid = (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {isLoading && Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-[120px] rounded-lg" />)}
      {!isLoading && data && data.length === 0 && (
        <div className="col-span-full text-sm text-muted-foreground">No games scheduled for this week</div>
      )}
      {!isLoading && data?.map((g) => <GameCard key={g.id} game={g} />)}
    </div>
  )

  return (
    <>
      {/* Pull-to-refresh on mobile */}
      <div className="md:hidden">
        <PullToRefresh onRefresh={() => qc.invalidateQueries({ queryKey: ["games", week] })}>{grid}</PullToRefresh>
      </div>
      <div className="hidden md:block">{grid}</div>
    </>
  )
}

function DashboardInner() {
  const [week, setWeek] = React.useState<number>(() => getCurrentNFLWeek())
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-2 text-2xl font-semibold">Schedule</div>
      <WeekSelector week={week} setWeek={setWeek} />
      <GamesGrid week={week} />
    </div>
  )
}

export default function DashboardPage() {
  const [client] = React.useState(() => new QueryClient())
  return (
    <QueryClientProvider client={client}>
      <DashboardInner />
    </QueryClientProvider>
  )
}
