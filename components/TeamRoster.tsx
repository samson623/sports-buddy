'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Database } from '@/types/database'
import { Users } from 'lucide-react'

interface TeamRosterProps {
  players: (Database['public']['Tables']['players']['Row'] & {
    depth_chart: (Database['public']['Tables']['depth_chart']['Row'] & {
      rank?: number
    })[]
  })[]
}

// Position groupings for display
const POSITION_GROUPS = {
  Offense: ['QB', 'RB', 'WR', 'TE', 'OL', 'C', 'G', 'T'],
  Defense: ['DL', 'DE', 'DT', 'LB', 'CB', 'S', 'DB'],
  'Special Teams': ['K', 'P'],
}

function getPositionGroup(position: string | null) {
  if (!position) return 'Other'
  const upper = position.toUpperCase()
  for (const [group, positions] of Object.entries(POSITION_GROUPS)) {
    if (positions.includes(upper)) return group
  }
  return 'Other'
}

function isStarter(player: TeamRosterProps['players'][0]) {
  return player.depth_chart.some((dc) => dc.rank === 1)
}

function getDepthChartRank(player: TeamRosterProps['players'][0]) {
  const firstChart = player.depth_chart.find((dc) => dc.valid_to === null)
  return firstChart?.rank || player.depth_chart[0]?.rank
}

export function TeamRoster({ players }: TeamRosterProps) {
  // Group players by position group
  const groupedPlayers = players.reduce(
    (acc, player) => {
      const group = getPositionGroup(player.position)
      if (!acc[group]) acc[group] = []
      acc[group].push(player)
      return acc
    },
    {} as Record<string, typeof players>
  )

  // Sort players within each group by depth chart rank
  Object.keys(groupedPlayers).forEach((group) => {
    groupedPlayers[group].sort((a, b) => {
      const rankA = getDepthChartRank(a) || 999
      const rankB = getDepthChartRank(b) || 999
      return rankA - rankB
    })
  })

  const groupOrder = ['Offense', 'Defense', 'Special Teams', 'Other']

  // Mobile view (cards)
  return (
    <>
      {/* Mobile view */}
      <div className="space-y-6 md:hidden">
        {groupOrder.map((groupName) => {
          const groupPlayers = groupedPlayers[groupName]
          if (!groupPlayers || groupPlayers.length === 0) return null

          return (
            <div key={groupName}>
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase">{groupName}</h3>
              <div className="grid gap-2">
                {groupPlayers.map((player) => {
                  const starter = isStarter(player)
                  const rank = getDepthChartRank(player)

                  return (
                    <Card
                      key={player.id}
                      className={`p-3 transition-colors ${
                        starter
                          ? 'border-primary bg-primary/5'
                          : 'border-border'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-semibold">
                            {player.first_name} {player.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {player.position} • #{player.jersey_number}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {starter && (
                            <Badge variant="default" className="text-xs">
                              Starter
                            </Badge>
                          )}
                          {rank && rank > 1 && (
                            <Badge variant="outline" className="text-xs">
                              {rank}
                            </Badge>
                          )}
                          {player.status !== 'active' && (
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                player.status === 'injured'
                                  ? 'border-red-200 text-red-700 dark:border-red-900 dark:text-red-400'
                                  : 'border-yellow-200 text-yellow-700 dark:border-yellow-900 dark:text-yellow-400'
                              }`}
                            >
                              {player.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop view (table) */}
      <div className="hidden space-y-6 md:block">
        {groupOrder.map((groupName) => {
          const groupPlayers = groupedPlayers[groupName]
          if (!groupPlayers || groupPlayers.length === 0) return null

          return (
            <div key={groupName}>
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase">{groupName}</h3>
              <Card className="overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold">#</th>
                      <th className="px-4 py-2 text-left font-semibold">Name</th>
                      <th className="px-4 py-2 text-left font-semibold">Position</th>
                      <th className="px-4 py-2 text-center font-semibold">Status</th>
                      <th className="px-4 py-2 text-center font-semibold">Depth</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {groupPlayers.map((player) => {
                      const starter = isStarter(player)
                      const rank = getDepthChartRank(player)

                      return (
                        <tr
                          key={player.id}
                          className={`transition-colors ${
                            starter ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/50'
                          }`}
                        >
                          <td className="px-4 py-3 font-mono font-semibold">{player.jersey_number}</td>
                          <td className="px-4 py-3 font-medium">
                            {player.first_name} {player.last_name}
                          </td>
                          <td className="px-4 py-3">{player.position}</td>
                          <td className="px-4 py-3 text-center">
                            {player.status === 'active' ? (
                              <Badge variant="outline" className="mx-auto">
                                Active
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className={`mx-auto ${
                                  player.status === 'injured'
                                    ? 'border-red-200 text-red-700 dark:border-red-900 dark:text-red-400'
                                    : 'border-yellow-200 text-yellow-700 dark:border-yellow-900 dark:text-yellow-400'
                                }`}
                              >
                                {player.status}
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {starter ? (
                              <Badge variant="default">Starter</Badge>
                            ) : rank ? (
                              <Badge variant="outline">{rank}</Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </Card>
            </div>
          )
        })}
      </div>

      {/* Empty state */}
      {Object.keys(groupedPlayers).length === 0 && (
        <Card className="p-8 text-center">
          <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground">No roster information available</p>
        </Card>
      )}
    </>
  )
}
