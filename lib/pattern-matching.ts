import { createClient as createServerClient } from '@/lib/supabase/server'

export type RoutedAnswer = {
  answer: string
  routed_to_db: boolean
}

const QB_RE = /who\s+is\s+starting\s+qb\s+for\s+(.+?)\?/i
const TIME_RE = /what\s+time\s+is\s+(.+?)\s+game\?/i
const INJ_RE = /who\s+is\s+injured\s+on\s+(.+?)\?/i
const ODDS_RE = /what\s+are\s+odds\s+for\s+(.+?)\?/i

const TEAM_ALIASES: Record<string, string> = {
  '49ers': 'San Francisco 49ers',
  niners: 'San Francisco 49ers',
  pats: 'New England Patriots',
  'g-men': 'New York Giants',
}

function normalizeTeamName(name: string) {
  const key = name.trim().toLowerCase()
  return TEAM_ALIASES[key] || name
}

async function findTeamIdByName(team: string) {
  const needle = normalizeTeamName(team)
  const supabase = await createServerClient()
  // try full name contains
  const { data } = await supabase
    .from('teams')
    .select('id, abbreviation, full_name')
    .ilike('full_name', `%${needle}%`)
    .limit(1)
    .maybeSingle()
  if (data?.id) return data.id
  // try abbreviation contains
  const { data: abbr } = await supabase
    .from('teams')
    .select('id, abbreviation, full_name')
    .ilike('abbreviation', `%${needle}%`)
    .limit(1)
    .maybeSingle()
  return abbr?.id || null
}

export async function routeQuestionToDB(q: string): Promise<RoutedAnswer | null> {
  // Starting QB
  let m = q.match(QB_RE)
  if (m) {
    const teamName = m[1].trim()
    const teamId = await findTeamIdByName(teamName)
    if (!teamId) return null
    const supabase = await createServerClient()
    const { data: rows } = await supabase
      .from('depth_chart')
      .select('rank, position, players(first_name,last_name)')
      .eq('team_id', teamId)
      .eq('position', 'QB')
      .order('rank', { ascending: true })
      .limit(1)
    const starter = rows?.[0]?.players
    if (!starter) return null
    return { answer: `Starting QB: ${starter.first_name} ${starter.last_name}.`, routed_to_db: true }
  }

  // Next game time for team
  m = q.match(TIME_RE)
  if (m) {
    const teamName = m[1].trim()
    const teamId = await findTeamIdByName(teamName)
    if (!teamId) return null
    const supabase = await createServerClient()
    const { data: game } = await supabase
      .from('games')
      .select('kickoff_utc, home_team_id, away_team_id')
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
      .order('kickoff_utc', { ascending: true })
      .limit(1)
      .maybeSingle()
    if (!game?.kickoff_utc) return null
    const when = new Date(game.kickoff_utc).toLocaleString()
    return { answer: `Kickoff: ${when} (local time).`, routed_to_db: true }
  }

  // Injuries for team
  m = q.match(INJ_RE)
  if (m) {
    const teamName = m[1].trim()
    const teamId = await findTeamIdByName(teamName)
    if (!teamId) return null
    const supabase = await createServerClient()
    const { data: rows } = await supabase
      .from('injuries')
      .select('injury_status, description, players(first_name,last_name)')
      .in('player_id', (
        (await supabase.from('players').select('id').eq('team_id', teamId)).data?.map((p) => p.id) || []
      ))
      .limit(10)
    if (!rows?.length) return null
    const list = rows
      .map((r) => `${r.players?.first_name} ${r.players?.last_name}: ${r.injury_status || 'N/A'}${r.description ? ` – ${r.description}` : ''}`)
      .join('\n')
    return { answer: list, routed_to_db: true }
  }

  // Odds for a game (best-effort: use latest odds for any game mentioning team text)
  m = q.match(ODDS_RE)
  if (m) {
    const needle = m[1].trim()
    const teamId = await findTeamIdByName(needle)
    const supabase = await createServerClient()
    if (teamId) {
      const { data: game } = await supabase
        .from('games')
        .select('id')
        .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
        .order('kickoff_utc', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (game?.id) {
        const { data: odds } = await supabase
          .from('odds')
          .select('bookmaker, spread, moneyline_home, moneyline_away, total')
          .eq('game_id', game.id)
          .order('retrieved_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (odds) {
          const a = `Odds (${odds.bookmaker}): spread ${odds.spread ?? 'N/A'}, ML home ${odds.moneyline_home ?? 'N/A'}, ML away ${odds.moneyline_away ?? 'N/A'}, total ${odds.total ?? 'N/A'}`
          return { answer: a, routed_to_db: true }
        }
      }
    }
    return null
  }

  return null
}
