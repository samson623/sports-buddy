import { Game, Team } from "@/types/database"
import { cn } from "@/lib/utils"

type Props = {
  game: Game
  homeTeam: Team | null
  awayTeam: Team | null
}

function StatusBadge({ status }: { status: Game["status"] }) {
  const map: Record<Game["status"], string> = {
    scheduled: "bg-blue-100 text-blue-700",
    in_progress: "bg-green-100 text-green-700",
    completed: "bg-gray-200 text-gray-800",
    postponed: "bg-yellow-100 text-yellow-800",
    cancelled: "bg-red-100 text-red-700",
  }
  const label: Record<Game["status"], string> = {
    scheduled: "Scheduled",
    in_progress: "Live",
    completed: "Final",
    postponed: "Postponed",
    cancelled: "Cancelled",
  }
  return (
    <span className={cn("inline-flex items-center rounded px-2 py-0.5 text-xs font-medium", map[status])}>
      {label[status]}
    </span>
  )
}

export function GameHeader({ game, homeTeam, awayTeam }: Props) {
  const kickoff = game.kickoff_utc ? new Date(game.kickoff_utc) : null
  const dateStr = kickoff?.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
  const timeStr = kickoff?.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })

  return (
    <div className="w-full border-b pb-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded bg-gray-200" />
            <div className="text-sm font-medium">{awayTeam?.abbreviation ?? "AWY"}</div>
          </div>
          <div className="text-xs text-muted-foreground">at</div>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded bg-gray-200" />
            <div className="text-sm font-medium">{homeTeam?.abbreviation ?? "HOME"}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold">
            {game.away_score ?? 0} - {game.home_score ?? 0}
          </div>
          <StatusBadge status={game.status} />
        </div>
      </div>
      <div className="mt-2 text-xs text-muted-foreground">
        <div>
          {dateStr} {timeStr} {game.venue ? `• ${game.venue}` : ""}
        </div>
      </div>
    </div>
  )
}

export default GameHeader
