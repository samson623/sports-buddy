import { createClient } from "@/lib/supabase/server"
import GameHeader from "@/components/GameHeader"
import RosterTable from "@/components/RosterTable"
import InjuryList from "@/components/InjuryList"
import OddsDisplay from "@/components/OddsDisplay"
import MobileGameTabs from "@/components/MobileGameTabs"
import { Card } from "@/components/ui/card"
import { Game, Player, Team, Injury, Odds, AIAnalysis } from "@/types/database"

type Params = { params: { id: string } }

type PlayerWithDepth = Player & { depth_chart?: { position: string; rank: number }[] }
type InjuryWithPlayer = Injury & { player: Player | null }

export default async function GamePage({ params }: Params) {
  const supabase = await createClient()
  const gameId = params.id

  const { data: gameData, error } = await supabase
    .from("games")
    .select(
      `*,
       home_team:teams!games_home_team_id_fkey(*),
       away_team:teams!games_away_team_id_fkey(*),
       injuries:injuries(*, player:players(*)),
       odds:odds(*),
       ai_analyses:ai_analyses(*)`
    )
    .eq("id", gameId)
    .single<
      Game & {
        home_team: Team | null
        away_team: Team | null
        injuries: (Injury & { player: Player | null })[]
        odds: Odds[]
        ai_analyses: AIAnalysis[]
      }
    >()

  if (error || !gameData) {
    return (
      <div className="p-6">
        <div className="text-sm text-red-600">Failed to load game.</div>
      </div>
    )
  }

  const homeId = gameData.home_team?.id ?? null
  const awayId = gameData.away_team?.id ?? null

  let homePlayers: PlayerWithDepth[] = []
  let awayPlayers: PlayerWithDepth[] = []
  if (homeId) {
    const { data } = await supabase
      .from("players")
      .select("id, first_name, last_name, position, jersey_number, status, depth_chart(position, rank)")
      .eq("team_id", homeId)
      .order("last_name", { ascending: true })
    homePlayers = (data ?? []) as unknown as PlayerWithDepth[]
  }
  if (awayId) {
    const { data } = await supabase
      .from("players")
      .select("id, first_name, last_name, position, jersey_number, status, depth_chart(position, rank)")
      .eq("team_id", awayId)
      .order("last_name", { ascending: true })
    awayPlayers = (data ?? []) as unknown as PlayerWithDepth[]
  }

  const overview = (
    <div className="space-y-4">
      <GameHeader game={gameData} homeTeam={gameData.home_team} awayTeam={gameData.away_team} />
      {gameData.ai_analyses && gameData.ai_analyses.length > 0 ? (
        <Card className="p-4">
          <div className="mb-2 text-sm font-semibold">AI Analysis</div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {gameData.ai_analyses[0].content}
          </p>
        </Card>
      ) : (
        <Card className="p-4 text-sm text-muted-foreground">AI analysis unavailable for your tier.</Card>
      )}
    </div>
  )

  const rosters = (
    <RosterTable
      homeTeam={gameData.home_team}
      awayTeam={gameData.away_team}
      homePlayers={homePlayers}
      awayPlayers={awayPlayers}
    />
  )

  const injuries = (
    <InjuryList homeTeam={gameData.home_team} awayTeam={gameData.away_team} injuries={gameData.injuries as InjuryWithPlayer[]} />
  )

  const odds = <OddsDisplay odds={gameData.odds} />

  return (
    <div className="px-4 py-6">
      {/* Mobile (<768px): swipeable tabs */}
      <div className="md:hidden">
        <MobileGameTabs overview={overview} rosters={rosters} injuries={injuries} odds={odds} />
      </div>

      {/* Desktop (>=1024px): three columns */}
      <div className="hidden lg:grid lg:grid-cols-12 lg:gap-6">
        <nav className="lg:col-span-2">
          <ul className="sticky top-16 space-y-2 text-sm">
            <li>
              <a href="#overview" className="text-foreground hover:underline">
                Overview
              </a>
            </li>
            <li>
              <a href="#rosters" className="text-foreground hover:underline">
                Rosters
              </a>
            </li>
            <li>
              <a href="#injuries" className="text-foreground hover:underline">
                Injuries
              </a>
            </li>
            <li>
              <a href="#odds" className="text-foreground hover:underline">
                Odds
              </a>
            </li>
          </ul>
        </nav>
        <main className="lg:col-span-7 space-y-8">
          <section id="overview">{overview}</section>
          <section id="rosters">{rosters}</section>
          <section id="injuries">{injuries}</section>
          <section id="odds">{odds}</section>
        </main>
        <aside className="lg:col-span-3">
          <Card className="sticky top-16 p-4">
            <div className="mb-2 text-sm font-semibold">Q&A</div>
            <p className="text-sm text-muted-foreground">Ask about this game (coming soon).</p>
          </Card>
        </aside>
      </div>
    </div>
  )
}
