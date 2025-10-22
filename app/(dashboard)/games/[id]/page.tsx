import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/types/database"
import GameHeader from "@/components/GameHeader"
import RosterTable from "@/components/RosterTable"
import InjuryList from "@/components/InjuryList"
import OddsDisplay from "@/components/OddsDisplay"
import MobileGameTabs from "@/components/MobileGameTabs"
import { Card } from "@/components/ui/card"

type PageParams = {
  params: Promise<{ id: string }>
}

export default async function GameDetailPage({ params }: PageParams) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch game with team relationships
  const { data: gameData, error: gameError } = await supabase
    .from("games")
    .select(
      `
      *,
      home_team:teams!games_home_team_id_fkey(*),
      away_team:teams!games_away_team_id_fkey(*)
    `
    )
    .eq("id", id)
    .maybeSingle()

  if (gameError || !gameData) notFound()

  const game = gameData as Database["public"]["Tables"]["games"]["Row"] & {
    home_team: Database["public"]["Tables"]["teams"]["Row"] | null
    away_team: Database["public"]["Tables"]["teams"]["Row"] | null
  }

  // Fetch players for both teams with depth chart
  const [homePlayersRes, awayPlayersRes] = await Promise.all([
    supabase
      .from("players")
      .select("*, depth_chart(*)")
      .eq("team_id", game.home_team_id || "")
      .order("last_name"),
    supabase
      .from("players")
      .select("*, depth_chart(*)")
      .eq("team_id", game.away_team_id || "")
      .order("last_name"),
  ])

  const homePlayers = (homePlayersRes.data || []) as (Database["public"]["Tables"]["players"]["Row"] & {
    depth_chart: Database["public"]["Tables"]["depth_chart"]["Row"][]
  })[]
  const awayPlayers = (awayPlayersRes.data || []) as (Database["public"]["Tables"]["players"]["Row"] & {
    depth_chart: Database["public"]["Tables"]["depth_chart"]["Row"][]
  })[]

  // Fetch injuries for this game
  const { data: injuriesData } = await supabase
    .from("injuries")
    .select("*, player:players(*)")
    .eq("game_id", id)

  const injuries = (injuriesData || []) as (Database["public"]["Tables"]["injuries"]["Row"] & {
    player: Database["public"]["Tables"]["players"]["Row"] | null
  })[]

  // Fetch odds for this game
  const { data: oddsData } = await supabase
    .from("odds")
    .select("*")
    .eq("game_id", id)
    .order("retrieved_at", { ascending: false })

  const odds = (oddsData || []) as Database["public"]["Tables"]["odds"]["Row"][]

  // Fetch AI analysis if available (premium feature)
  const { data: aiAnalysisData } = await supabase
    .from("ai_analyses")
    .select("*")
    .eq("game_id", id)
    .maybeSingle()

  const overview = (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="mb-2 font-semibold">Game Info</h3>
        <div className="grid gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Season:</span> Week {game.week}, {game.season}
          </div>
          <div>
            <span className="text-muted-foreground">Venue:</span> {game.venue || "TBD"}
          </div>
          <div>
            <span className="text-muted-foreground">Kickoff:</span>{" "}
            {game.kickoff_utc ? new Date(game.kickoff_utc).toLocaleString() : "TBD"}
          </div>
        </div>
      </Card>

      {aiAnalysisData && (
        <Card className="p-4">
          <h3 className="mb-2 font-semibold">AI Analysis</h3>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{aiAnalysisData.content}</p>
          <div className="mt-2 text-xs text-muted-foreground">
            Generated: {new Date(aiAnalysisData.created_at).toLocaleString()}
          </div>
        </Card>
      )}
    </div>
  )

  const rosters = (
    <RosterTable
      homeTeam={game.home_team}
      awayTeam={game.away_team}
      homePlayers={homePlayers}
      awayPlayers={awayPlayers}
    />
  )

  const injuriesList = <InjuryList homeTeam={game.home_team} awayTeam={game.away_team} injuries={injuries} />

  const oddsList = <OddsDisplay odds={odds} />

  return (
    <div className="min-h-screen bg-background">
      {/* Header - always visible */}
      <div className="border-b bg-card p-4">
        <GameHeader game={game} homeTeam={game.home_team} awayTeam={game.away_team} />
      </div>

      {/* Mobile layout - vertical stack with tabs */}
      <div className="md:hidden">
        <div className="p-4">
          <MobileGameTabs overview={overview} rosters={rosters} injuries={injuriesList} odds={oddsList} />
        </div>
      </div>

      {/* Desktop layout - three columns */}
      <div className="hidden md:grid md:grid-cols-3 md:gap-4 md:p-4 lg:grid-cols-4">
        {/* Main content - 2 columns on desktop, 3 on lg */}
        <div className="md:col-span-2 lg:col-span-2 space-y-4">
          <Card className="p-4">
            <h2 className="mb-3 text-lg font-semibold">Overview</h2>
            {overview}
          </Card>

          <Card className="p-4">
            <h2 className="mb-3 text-lg font-semibold">Rosters</h2>
            {rosters}
          </Card>

          <Card className="p-4">
            <h2 className="mb-3 text-lg font-semibold">Injuries</h2>
            {injuriesList}
          </Card>

          <Card className="p-4">
            <h2 className="mb-3 text-lg font-semibold">Odds</h2>
            {oddsList}
          </Card>
        </div>

        {/* Right sidebar - Q&A section */}
        <div className="md:col-span-1">
          <Card className="sticky top-4 p-4">
            <h3 className="mb-3 font-semibold">Ask about this game</h3>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>Ask AI questions about this game, teams, players, or stats.</p>
              <div className="rounded bg-muted p-2">
                <input
                  type="text"
                  placeholder="Ask a question..."
                  className="w-full border-0 bg-background px-2 py-1 text-xs"
                />
              </div>
              <div className="text-xs text-muted-foreground/60">Feature coming soon</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
