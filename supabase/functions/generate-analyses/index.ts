import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

interface Game {
  id: string
  week: number
  season: number
  home_team_id: string | null
  away_team_id: string | null
  home_team: { full_name: string; abbreviation: string } | null
  away_team: { full_name: string; abbreviation: string } | null
}

interface Injury {
  player: { first_name: string; last_name: string } | null
  injury_status: string | null
  body_part: string | null
}

interface Odds {
  spread: number | null
  moneyline_home: number | null
  moneyline_away: number | null
  total: number | null
}

async function generateAnalysis(game: Game, injuries: Injury[], odds: Odds | null): Promise<string> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openaiKey) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  const homeTeam = game.home_team
  const awayTeam = game.away_team

  const injuryContext = injuries
    ?.map(
      (inj) =>
        `${inj.player?.first_name} ${inj.player?.last_name} (${inj.injury_status}): ${inj.body_part}`
    )
    .join('\n') || 'No reported injuries'

  const oddsContext = odds
    ? `Spread: ${odds.spread}, Moneyline Home: ${odds.moneyline_home}, Moneyline Away: ${odds.moneyline_away}, Total: ${odds.total}`
    : 'No odds available'

  const prompt = `You are an expert NFL analyst. Write a compelling 300-word pre-game analysis for ${homeTeam?.full_name} (${homeTeam?.abbreviation}) vs ${awayTeam?.full_name} (${awayTeam?.abbreviation}), Week ${game.week}, Season ${game.season}.

Injuries:
${injuryContext}

Betting Lines:
${oddsContext}

Focus your analysis on:
1. Key Matchup: The critical battle that will determine the game
2. Injury Impact: How injuries affect team strength
3. Why the Favorite is Favored: What gives the favored team an edge
4. Prediction: Your confident pick with reasoning

Keep the tone professional yet engaging. Make it compelling for sports fans.`

  // Call GPT-4o mini via OpenAI API
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${error}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || ''
}

Deno.serve(async (req) => {
  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get current week's games
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 7)

    console.log(`Fetching games between ${startOfWeek} and ${endOfWeek}`)

    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select(
        `
        id,
        week,
        season,
        home_team_id,
        away_team_id,
        home_team:home_team_id(full_name, abbreviation),
        away_team:away_team_id(full_name, abbreviation)
      `
      )
      .gte('kickoff_utc', startOfWeek.toISOString())
      .lt('kickoff_utc', endOfWeek.toISOString())

    if (gamesError) {
      throw new Error(`Error fetching games: ${gamesError.message}`)
    }

    console.log(`Found ${games?.length || 0} games for this week`)

    if (!games || games.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No games found for this week' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    let successCount = 0
    let errorCount = 0

    // Process each game
    for (const game of games) {
      try {
        // Check if analysis already exists
        const { data: existingAnalysis } = await supabase
          .from('ai_analyses')
          .select('id')
          .eq('game_id', game.id)
          .limit(1)
          .single()

        if (existingAnalysis) {
          console.log(`Analysis already exists for game ${game.id}`)
          continue
        }

        // Fetch injuries for this game
        const { data: injuries, error: injuriesError } = await supabase
          .from('injuries')
          .select(
            `
          id,
          injury_status,
          body_part,
          player:player_id(first_name, last_name)
        `
          )
          .eq('game_id', game.id)

        if (injuriesError) {
          console.warn(`Error fetching injuries for game ${game.id}: ${injuriesError.message}`)
        }

        // Fetch odds for this game
        const { data: odds, error: oddsError } = await supabase
          .from('odds')
          .select('spread, moneyline_home, moneyline_away, total')
          .eq('game_id', game.id)
          .limit(1)
          .single()

        if (oddsError && oddsError.code !== 'PGRST116') {
          console.warn(`Error fetching odds for game ${game.id}: ${oddsError.message}`)
        }

        // Generate analysis
        console.log(`Generating analysis for game ${game.id}`)
        const analysis = await generateAnalysis(game as Game, injuries || [], odds || null)

        // Store in database
        const { error: insertError } = await supabase
          .from('ai_analyses')
          .insert({
            game_id: game.id,
            content: analysis,
            generated_at: new Date().toISOString(),
            token_count: Math.ceil(analysis.split(' ').length * 1.3), // Rough token estimate
          })

        if (insertError) {
          console.error(`Error storing analysis for game ${game.id}: ${insertError.message}`)
          errorCount++
        } else {
          console.log(`Successfully generated analysis for game ${game.id}`)
          successCount++
        }

        // Rate limiting: 1 second delay between API calls
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`Error processing game ${game.id}:`, error)
        errorCount++
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Analysis generation completed',
        totalGames: games.length,
        successCount,
        errorCount,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in generate-analyses function:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
