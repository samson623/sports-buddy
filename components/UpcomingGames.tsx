'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Database } from '@/types/database'
import { format, isBefore, isToday } from 'date-fns'
import { Trophy, MapPin } from 'lucide-react'

interface UpcomingGamesProps {
  teamId: string
  games: (Database['public']['Tables']['games']['Row'] & {
    home_team?: Database['public']['Tables']['teams']['Row'] | null
    away_team?: Database['public']['Tables']['teams']['Row'] | null
  })[]
}

export function UpcomingGames({ teamId, games }: UpcomingGamesProps) {
  if (games.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Trophy className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-muted-foreground">No upcoming games scheduled</p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {games.map((game) => {
        const isHome = game.home_team_id === teamId
        const opponent = isHome ? game.away_team : game.home_team
        const kickoffDate = game.kickoff_utc ? new Date(game.kickoff_utc) : null
        const isPast = kickoffDate && isBefore(kickoffDate, new Date())
        const isGameToday = kickoffDate && isToday(kickoffDate)

        let statusBadge = null
        if (game.status === 'completed' && isPast) {
          statusBadge = 'Final'
        } else if (game.status === 'in_progress' || isGameToday) {
          statusBadge = 'LIVE'
        } else if (kickoffDate && isBefore(kickoffDate, new Date())) {
          statusBadge = 'Final'
        } else {
          statusBadge = 'Upcoming'
        }

        return (
          <Link key={game.id} href={`/dashboard/games/${game.id}`}>
            <Card className="border border-border p-4 transition-all hover:border-primary hover:shadow-md">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Date and week */}
                <div className="flex-shrink-0 sm:min-w-[120px]">
                  {kickoffDate && (
                    <>
                      <p className="text-xs font-semibold uppercase text-muted-foreground">
                        Week {game.week}
                      </p>
                      <p className="text-sm font-semibold">{format(kickoffDate, 'MMM d')}</p>
                      <p className="text-xs text-muted-foreground">{format(kickoffDate, 'h:mm a')}</p>
                    </>
                  )}
                </div>

                {/* Opponent */}
                <div className="flex flex-1 items-center gap-3">
                  {isHome ? (
                    <>
                      <div className="flex-1 text-right">
                        <p className="font-semibold">vs</p>
                      </div>
                      {opponent?.logo_url && (
                        <img
                          src={opponent.logo_url}
                          alt={opponent.abbreviation}
                          className="h-8 w-8 object-contain"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold">{opponent?.abbreviation}</p>
                        <p className="text-xs text-muted-foreground">{opponent?.full_name}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex-1">
                        <p className="font-semibold">{opponent?.abbreviation}</p>
                        <p className="text-xs text-muted-foreground">{opponent?.full_name}</p>
                      </div>
                      {opponent?.logo_url && (
                        <img
                          src={opponent.logo_url}
                          alt={opponent.abbreviation}
                          className="h-8 w-8 object-contain"
                        />
                      )}
                      <div className="flex-1 text-left">
                        <p className="font-semibold">@</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Status and location */}
                <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-1">
                  <Badge variant={statusBadge === 'LIVE' ? 'default' : 'secondary'}>
                    {statusBadge}
                  </Badge>
                  {game.venue && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {game.venue}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
