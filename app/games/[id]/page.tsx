export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { GameDetailView } from '@/components/games/GameDetailView'
import { notFound } from 'next/navigation'

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch game details
  const { data: game, error: gameError } = await supabase
    .from('games')
    .select(
      `
      id,
      season,
      week,
      home_team_id,
      away_team_id,
      kickoff_utc,
      venue,
      status,
      home_score,
      away_score,
      home_team:home_team_id(id, full_name, abbreviation, logo_url),
      away_team:away_team_id(id, full_name, abbreviation, logo_url)
    `
    )
    .eq('id', id)
    .single()

  if (gameError || !game) {
    notFound()
  }

  // Get current user for tier check
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let userTier = 'free'
  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tier')
      .eq('id', user.id)
      .single()

    if (profile) {
      userTier = profile.tier
    }
  }

  // Fetch AI analysis if exists
  let analysis = null
  if (userTier === 'plus' || userTier === 'pro') {
    const { data: aiData } = await supabase
      .from('ai_analyses')
      .select('content, generated_at')
      .eq('game_id', id)
      .single()

    analysis = aiData
  }

  // Fetch injuries
  const { data: injuries } = await supabase
    .from('injuries')
    .select(
      `
      id,
      injury_status,
      body_part,
      player:player_id(first_name, last_name)
    `
    )
    .eq('game_id', id)

  // Fetch odds
  const { data: odds } = await supabase
    .from('odds')
    .select('spread, moneyline_home, moneyline_away, total, bookmaker')
    .eq('game_id', id)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <GameDetailView
        game={game}
        analysis={analysis}
        injuries={injuries || []}
        odds={odds || []}
        userTier={userTier}
        userId={user?.id}
      />
    </div>
  )
}
