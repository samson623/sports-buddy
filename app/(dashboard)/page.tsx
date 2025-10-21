"use client"

import * as React from "react"
import PullToRefresh from "react-pull-to-refresh"
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import GameCard from "@/components/GameCard"
import { Skeleton } from "@/components/ui/skeleton"

function getCurrentNFLWeek(date = new Date()) {
  // Approximate: NFL regular season typically starts around early September (week 1)
  const seasonStart = new Date(date.getFullYear(), 8, 1) // Sept 1
  // Find first Sunday after Sept 1
  const day = seasonStart.getDay()
  const diffToSunday = (7 - day) % 7
  const firstSunday = new Date(seasonStart)
  firstSunday.setDate(seasonStart.getDate() + diffToSunday)
  const msPerWeek = 7 * 24 * 60 * 60 * 1000
  const week = Math.max(1, Math.min(18, Math.floor((date.getTime() - firstSunday.getTime()) / msPerWeek) + 1))
  return week
}

function WeekSelector({ week, setWeek }: { week: number; setWeek: (w: number) => void }) {
  const weeks = Array.from({ length: 18 }, (_, i) => i + 1)
  return (
    <div className="flex items-center justify-between gap-4">
      {/* Mobile pills */}
      <div className="md:hidden overflow-x-auto">
        <div className="flex gap-2 py-2">
          {weeks.map((w) => (
            <button
              key={w}
              onClick={() => setWeek(w)}
              className={`px-3 py-1 rounded-full whitespace-nowrap text-sm border ${
                w === week ? "bg-blue-600 text-white border-blue-600" : "bg-white"
              }`}
            >
              Week {w}
            </button>
          ))}
        </div>
      </div>
      {/* Desktop select */}
      <div className="hidden md:block">
        <label className="text-sm mr-2">Week</label>
        <select
          className="border rounded-md px-3 py-2"
          value={week}
          onChange={(e) => setWeek(Number(e.target.value))}
        >
          {weeks.map((w) => (
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
  const supabase = React.useMemo(() => createClient(), [])
  const year = new Date().getFullYear()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["games", year, week],
    queryFn: async () => {
      const q = supabase
        .from("games")
        .select(
          `*,
           home_team:teams!games_home_team_id_fkey(*),
           away_team:teams!games_away_team_id_fkey(*),
           odds:odds(*)`
        )
        .eq("season", year)
        .eq("week", week)
        .order("kickoff_utc", { ascending: true })
      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },
    staleTime: 60_000,
  })

  const grid = (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
    >
      {isLoading
        ? Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] w-full" />
          ))
        : data && data.length > 0
        ? data.map((g) => <GameCard key={g.id} game={g as any} />)
        : (
            <div className="col-span-full text-center text-gray-600 py-12">
              No games scheduled for this week
            </div>
          )}
    </div>
  )

  return (
    <PullToRefresh onRefresh={async () => { await refetch(); }}>
      {grid}
    </PullToRefresh>
  )
}

export default function DashboardPage() {
  const [week, setWeek] = React.useState(getCurrentNFLWeek())
  const [client] = React.useState(() => new QueryClient())
  return (
    <QueryClientProvider client={client}>
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-4">
          <WeekSelector week={week} setWeek={setWeek} />
        </div>
        <GamesGrid week={week} />
      </div>
    </QueryClientProvider>
  )
}
