export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TeamHeader } from '@/components/TeamHeader'
import { UpcomingGames } from '@/components/UpcomingGames'
import { TeamRoster } from '@/components/TeamRoster'
import { TeamInjuries } from '@/components/TeamInjuries'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { ChevronRight, Calendar, Users, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface PageParams {
  params: Promise<{ abbrev: string }>
}

export async function generateMetadata({ params }: PageParams) {
  const { abbrev } = await params
  const supabase = await createClient()

  const { data: team } = await supabase
    .from('teams')
    .select('full_name')
    .eq('abbreviation', abbrev.toUpperCase())
    .single()

  if (!team) {
    return { title: 'Team Not Found' }
  }

  return {
    title: `${team.full_name} - Roster, Schedule | Sports Buddy`,
    description: `${team.full_name} roster, schedule, and injury updates.`,
  }
}

export default async function TeamPage({ params }: PageParams) {
  const { abbrev } = await params
  const supabase = await createClient()

  // Fetch team
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('*')
    .eq('abbreviation', abbrev.toUpperCase())
    .single()

  if (teamError || !team) {
    notFound()
  }

  // Fetch players with depth chart
  const { data: players } = await supabase
    .from('players')
    .select('*, depth_chart(*)')
    .eq('team_id', team.id)
    .order('last_name', { ascending: true })

  // Fetch upcoming games (next 3)
  const today = new Date().toISOString().split('T')[0]
  const { data: games } = await supabase
    .from('games')
    .select(
      `
      *,
      home_team:teams!games_home_team_id_fkey(*),
      away_team:teams!games_away_team_id_fkey(*)
    `
    )
    .or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`)
    .gte('kickoff_utc', today)
    .order('kickoff_utc', { ascending: true })
    .limit(3)

  // Fetch injuries
  const playerIds = players?.map((p) => p.id) || []
  const { data: injuries } = playerIds.length > 0
    ? await supabase
        .from('injuries')
        .select(`*, player:player_id(*)`)
        .in('player_id', playerIds)
    : { data: [] }

  // Group and count stats
  const activePlayersCount =
    players?.filter((p) => p.status === 'active').length || 0
  const injuriesCount = injuries?.length || 0

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b bg-card px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2 text-sm">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
            Home
          </Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <Link href="/dashboard/teams" className="text-muted-foreground hover:text-foreground">
            Teams
          </Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-foreground">{team.full_name}</span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Team Header */}
        <TeamHeader team={team} />

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          <Card className="p-3 text-center sm:p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Games</div>
            <div className="text-2xl font-bold">{games?.length || 0}</div>
          </Card>
          <Card className="p-3 text-center sm:p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Players</div>
            <div className="text-2xl font-bold">{activePlayersCount}</div>
          </Card>
          <Card className="p-3 text-center sm:p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Injuries</div>
            <div className="text-2xl font-bold text-red-600">{injuriesCount}</div>
          </Card>
          <Card className="hidden p-3 text-center sm:block sm:p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Draft</div>
            <div className="text-2xl font-bold">TBD</div>
          </Card>
        </div>

        {/* Mobile Tabs */}
        <div className="md:hidden">
          <Tabs defaultValue="games" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="games" className="flex items-center gap-2">
                <Calendar className="h-4 w-4 md:hidden" />
                <span className="hidden sm:inline">Games</span>
              </TabsTrigger>
              <TabsTrigger value="roster" className="flex items-center gap-2">
                <Users className="h-4 w-4 md:hidden" />
                <span className="hidden sm:inline">Roster</span>
              </TabsTrigger>
              <TabsTrigger value="injuries" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 md:hidden" />
                <span className="hidden sm:inline">Injuries</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="games" className="mt-6 space-y-3">
              {games && games.length > 0 ? (
                <UpcomingGames teamId={team.id} games={games} />
              ) : (
                <Card className="p-8 text-center">
                  <Calendar className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-muted-foreground">No upcoming games</p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="roster" className="mt-6">
              {players && players.length > 0 ? (
                <TeamRoster players={players} />
              ) : (
                <Card className="p-8 text-center">
                  <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-muted-foreground">No roster information</p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="injuries" className="mt-6">
              {injuries && injuries.length > 0 ? (
                <TeamInjuries injuries={injuries} />
              ) : (
                <Card className="p-8 text-center">
                  <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-green-500" />
                  <p className="font-semibold text-green-700 dark:text-green-400">No injuries</p>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Desktop Stacked Layout */}
        <div className="hidden space-y-8 md:block">
          {/* Upcoming Games Section */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <h2 className="text-2xl font-bold">Upcoming Games</h2>
            </div>
            {games && games.length > 0 ? (
              <UpcomingGames teamId={team.id} games={games} />
            ) : (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No upcoming games</p>
              </Card>
            )}
          </div>

          {/* Roster Section */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              <h2 className="text-2xl font-bold">Roster</h2>
            </div>
            {players && players.length > 0 ? (
              <TeamRoster players={players} />
            ) : (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No roster information</p>
              </Card>
            )}
          </div>

          {/* Injuries Section */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <h2 className="text-2xl font-bold">Injuries</h2>
            </div>
            {injuries && injuries.length > 0 ? (
              <TeamInjuries injuries={injuries} />
            ) : (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No active injuries</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
