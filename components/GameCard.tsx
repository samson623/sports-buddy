import Link from "next/link"
import type { Game, Team, Odds } from "@/types/database"

type Props = {
  game: Game & {
    home_team?: Team | null
    away_team?: Team | null
    odds?: Odds | null
  }
}

export default function GameCard({ game }: Props) {
  const home = (game as any).home_team as Team | undefined
  const away = (game as any).away_team as Team | undefined
  const odds = (game as any).odds as Odds | undefined

  const dt = game.kickoff_utc ? new Date(game.kickoff_utc) : null
  const formatter = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  })

  return (
    <Link
      href={`/games/${game.id}`}
      className="border rounded-lg p-4 hover:shadow-lg transition min-h-[120px] flex flex-col justify-between"
    >
      <div className="font-medium">
        {away?.abbreviation ?? "AWY"} @ {home?.abbreviation ?? "HOM"}
      </div>
      <div className="text-sm text-gray-600">
        {dt ? `${formatter.format(dt)} ET` : "TBD"}
      </div>
      {odds && (
        <div className="text-xs text-gray-500">Spread: {odds.spread ?? "-"}</div>
      )}
    </Link>
  )
}
