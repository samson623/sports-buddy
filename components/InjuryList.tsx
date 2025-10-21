import { Injury, Player, Team } from "@/types/database"

type InjuryWithPlayer = Injury & { player: Player | null }

type Props = {
  homeTeam: Team | null
  awayTeam: Team | null
  injuries: InjuryWithPlayer[]
}

const statusColor: Record<NonNullable<Injury["injury_status"]>, string> = {
  out: "bg-red-100 text-red-800",
  doubtful: "bg-orange-100 text-orange-800",
  questionable: "bg-yellow-100 text-yellow-800",
  probable: "bg-green-100 text-green-800",
}

export default function InjuryList({ homeTeam, awayTeam, injuries }: Props) {
  const byTeam = new Map<string, InjuryWithPlayer[]>()
  for (const inj of injuries) {
    const tid = inj.player?.team_id ?? "unknown"
    if (!byTeam.has(tid)) byTeam.set(tid, [])
    byTeam.get(tid)!.push(inj)
  }

  const renderTeam = (team: Team | null) => {
    const list = team ? byTeam.get(team.id) ?? [] : []
    return (
      <div>
        <div className="mb-2 text-sm font-semibold">{team?.full_name ?? "Team"}</div>
        {list.length === 0 ? (
          <div className="text-sm text-muted-foreground">No reported injuries</div>
        ) : (
          <ul className="space-y-2">
            {list.map((inj) => (
              <li key={inj.id} className="rounded border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-medium">
                      {inj.player ? `${inj.player.first_name} ${inj.player.last_name}` : "Unknown Player"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {inj.player?.position ?? "-"} • {inj.body_part ?? ""} {inj.description ? `• ${inj.description}` : ""}
                    </div>
                  </div>
                  {inj.injury_status && (
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusColor[inj.injury_status]}`}>
                      {inj.injury_status.charAt(0).toUpperCase() + inj.injury_status.slice(1)}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {renderTeam(awayTeam)}
      {renderTeam(homeTeam)}
    </div>
  )
}
