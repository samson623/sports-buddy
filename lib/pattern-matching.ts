/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server"

type MatchResult = {
  matched: boolean
  type?: "starter_qb" | "game_time" | "injuries" | "odds"
  answer?: string
  queryData?: Record<string, unknown>
}

/**
 * Pattern matching for database-first routing
 * Attempts to answer question using database queries before falling back to OpenAI
 */
export async function matchPattern(question: string): Promise<MatchResult> {
  const q = question.toLowerCase().trim()
  const supabase = await createClient()

  // Pattern 1: "Who is starting QB for {team}?"
  const qbMatch = q.match(/who is\s+(?:the\s+)?starting\s+(?:qb|quarterback)\s+(?:for|of)\s+(?:the\s+)?(\w+)/i)
  if (qbMatch) {
    const teamName = qbMatch[1]
    const { data: teams } = await supabase
      .from("teams")
      .select("id, abbreviation, full_name")
      .or(`abbreviation.ilike.${teamName},full_name.ilike.%${teamName}%`)
      .limit(1)

    if (teams && teams.length > 0) {
      const teamId = teams[0].id
      const { data: depthChart } = await supabase
        .from("depth_chart")
        .select("*, player:players(*)")
        .eq("team_id", teamId)
        .eq("position", "QB")
        .eq("rank", 1)
        .maybeSingle()

      if (depthChart?.player) {
        const player = depthChart.player as any
        return {
          matched: true,
          type: "starter_qb",
          answer: `The starting QB for ${teams[0].full_name} is ${player.first_name} ${player.last_name} (#${player.jersey_number}).`,
          queryData: { team: teams[0].full_name, player, position: "QB" },
        }
      }
    }
  }

  // Pattern 2: "What time is {team} game?" or "When do {team} play?"
  const gameTimeMatch = q.match(/(?:what time|when)\s+(?:is|do)\s+(?:the\s+)?(\w+)(?:\s+playing)?(?:\s+this)?(?:\s+game|\s+play)?/i)
  if (gameTimeMatch) {
    const teamName = gameTimeMatch[1]
    const { data: teams } = await supabase
      .from("teams")
      .select("id, abbreviation, full_name")
      .or(`abbreviation.ilike.${teamName},full_name.ilike.%${teamName}%`)
      .limit(1)

    if (teams && teams.length > 0) {
      const teamId = teams[0].id
      const { data: games } = await supabase
        .from("games")
        .select("*, home_team:teams!games_home_team_id_fkey(*), away_team:teams!games_away_team_id_fkey(*)")
        .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
        .eq("status", "scheduled")
        .order("kickoff_utc", { ascending: true })
        .limit(1)

      if (games && games.length > 0) {
        const game = games[0]
        const kickoff = game.kickoff_utc ? new Date(game.kickoff_utc) : null
        const timeStr = kickoff?.toLocaleString("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          timeZoneName: "short",
        })

        const opponent =
          game.home_team_id === teamId ? (game.away_team as any)?.full_name : (game.home_team as any)?.full_name
        const homeAway = game.home_team_id === teamId ? "home" : "away"

        return {
          matched: true,
          type: "game_time",
          answer: `${teams[0].full_name} plays ${homeAway} against ${opponent} on ${timeStr}.`,
          queryData: { team: teams[0].full_name, opponent, time: timeStr, status: game.status },
        }
      }
    }
  }

  // Pattern 3: "Who is injured on {team}?"
  const injuryMatch = q.match(/(?:who|which players?)\s+(?:are|is)\s+injured\s+(?:on|for|with)\s+(?:the\s+)?(\w+)/i)
  if (injuryMatch) {
    const teamName = injuryMatch[1]
    const { data: teams } = await supabase
      .from("teams")
      .select("id, abbreviation, full_name")
      .or(`abbreviation.ilike.${teamName},full_name.ilike.%${teamName}%`)
      .limit(1)

    if (teams && teams.length > 0) {
      const teamId = teams[0].id
      const { data: injuries } = await supabase
        .from("injuries")
        .select("*, player:players(*)")
        .eq("player.team_id", teamId)
        .in("injury_status", ["out", "doubtful", "questionable"])
        .limit(10)

      if (injuries && injuries.length > 0) {
        const injuredList = (injuries as any[])
          .map((inj) => `${inj.player?.first_name} ${inj.player?.last_name} (${inj.injury_status})`)
          .join(", ")

        return {
          matched: true,
          type: "injuries",
          answer: `Injured players on ${teams[0].full_name}: ${injuredList}.`,
          queryData: { team: teams[0].full_name, injuries: injuries.length },
        }
      } else {
        return {
          matched: true,
          type: "injuries",
          answer: `No reported injuries for ${teams[0].full_name}.`,
          queryData: { team: teams[0].full_name, injuries: 0 },
        }
      }
    }
  }

  // Pattern 4: "What are odds for {game}?" or "What's the spread for {team}?"
  const oddsMatch = q.match(/(?:what|what are|what's)\s+(?:the\s+)?(?:odds|spread|over|under)\s+(?:for|on)\s+(?:the\s+)?(\w+)/i)
  if (oddsMatch) {
    const teamName = oddsMatch[1]
    const { data: teams } = await supabase
      .from("teams")
      .select("id, abbreviation, full_name")
      .or(`abbreviation.ilike.${teamName},full_name.ilike.%${teamName}%`)
      .limit(1)

    if (teams && teams.length > 0) {
      const teamId = teams[0].id
      const { data: games } = await supabase
        .from("games")
        .select("id, home_team_id, away_team_id")
        .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
        .limit(1)

      if (games && games.length > 0) {
        const gameId = games[0].id
        const { data: odds } = await supabase
          .from("odds")
          .select("*")
          .eq("game_id", gameId)
          .order("retrieved_at", { ascending: false })
          .limit(1)

        if (odds && odds.length > 0) {
          const odd = odds[0]
          return {
            matched: true,
            type: "odds",
            answer: `Current odds: Spread ${odd.spread}, Moneyline (H: ${odd.moneyline_home} / A: ${odd.moneyline_away}), Over/Under ${odd.total}.`,
            queryData: { team: teams[0].full_name, spread: odd.spread, moneyline_home: odd.moneyline_home, moneyline_away: odd.moneyline_away, total: odd.total },
          }
        }
      }
    }
  }

  // No pattern matched
  return { matched: false }
}
