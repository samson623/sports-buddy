import type { Team } from '@/types/database'
import { Trophy } from 'lucide-react'
import SmartImage from '@/components/SmartImage'

interface TeamHeaderProps {
  team: Team
}

export function TeamHeader({ team }: TeamHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
      {/* Logo */}
      <div className="flex h-24 w-24 items-center justify-center rounded-lg border-2 border-muted bg-muted/50">
        {team.logo_url ? (
          <SmartImage
            src={team.logo_url}
            alt={team.full_name}
            width={80}
            height={80}
            className="h-20 w-20 object-contain"
            sizes="(max-width: 640px) 80px, 80px"
          />
        ) : (
          <Trophy className="h-12 w-12 text-muted-foreground" />
        )}
      </div>

      {/* Team Info */}
      <div className="flex-1">
        <div className="mb-1 text-sm text-muted-foreground">
          {team.conference && team.division ? `${team.conference} • ${team.division}` : 'NFL Team'}
        </div>
        <h1 className="mb-2 text-4xl font-bold">{team.full_name}</h1>
        <p className="text-lg text-muted-foreground">{team.city}</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-4">
        <div className="rounded-lg border bg-card p-3 text-center">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Record</div>
          <div className="text-xl font-bold">TBD</div>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Next Game</div>
          <div className="text-sm font-semibold">See Below</div>
        </div>
      </div>
    </div>
  )
}
