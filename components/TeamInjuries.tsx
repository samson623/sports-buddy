'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Database } from '@/types/database'
import { AlertCircle } from 'lucide-react'

interface TeamInjuriesProps {
  injuries: (Database['public']['Tables']['injuries']['Row'] & {
    player?: Database['public']['Tables']['players']['Row'] | null
  })[]
}

function getInjuryColor(status: string | null) {
  switch (status) {
    case 'out':
      return 'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200'
    case 'doubtful':
      return 'border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-200'
    case 'questionable':
      return 'border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-900 dark:bg-yellow-950 dark:text-yellow-200'
    case 'probable':
      return 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200'
    default:
      return 'border-gray-200 bg-gray-50 text-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200'
  }
}

function getInjuryStatusLabel(status: string | null) {
  switch (status) {
    case 'out':
      return 'Out'
    case 'doubtful':
      return 'Doubtful'
    case 'questionable':
      return 'Questionable'
    case 'probable':
      return 'Probable'
    default:
      return 'Unknown'
  }
}

export function TeamInjuries({ injuries }: TeamInjuriesProps) {
  // Sort injuries by severity
  const sortedInjuries = [...injuries].sort((a, b) => {
    const severity = { out: 0, doubtful: 1, questionable: 2, probable: 3 }
    const aSeverity = severity[a.injury_status as keyof typeof severity] ?? 4
    const bSeverity = severity[b.injury_status as keyof typeof severity] ?? 4
    return aSeverity - bSeverity
  })

  if (injuries.length === 0) {
    return (
      <Card className="p-8 text-center">
        <AlertCircle className="mx-auto mb-2 h-8 w-8 text-green-500" />
        <p className="font-semibold text-green-700 dark:text-green-400">No Active Injuries</p>
        <p className="text-sm text-muted-foreground">Team is healthy!</p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {sortedInjuries.map((injury) => {
        const colorClass = getInjuryColor(injury.injury_status)
        const statusLabel = getInjuryStatusLabel(injury.injury_status)

        return (
          <Card key={injury.id} className={`border p-4 ${colorClass}`}>
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div className="flex-1">
                <p className="font-semibold">
                  {injury.player?.first_name} {injury.player?.last_name}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`border-current ${
                      injury.injury_status === 'out'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                        : injury.injury_status === 'doubtful'
                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100'
                          : injury.injury_status === 'questionable'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                    }`}
                  >
                    {statusLabel}
                  </Badge>
                  {injury.body_part && (
                    <span className="text-sm text-current opacity-75">{injury.body_part}</span>
                  )}
                </div>
                {injury.description && (
                  <p className="mt-2 text-sm italic opacity-75">{injury.description}</p>
                )}
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-xs opacity-75">
                  Reported {new Date(injury.reported_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
