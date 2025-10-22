import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'

/**
 * POST /api/generate-analysis
 * 
 * Generate AI pre-game analysis for a specific game.
 * Requires Plus or Pro tier. Plus users get 1/week, Pro users unlimited.
 * 
 * Request: { gameId: string }
 * Response: { analysis: string; tokenCount: number }
 */

export async function POST(request: NextRequest) {
  try {
    const { gameId } = await request.json()

    if (!gameId) {
      return NextResponse.json(
        { error: 'gameId is required' },
        { status: 400 }
      )
    }

    // Get authenticated user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile with tier
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('tier, weekly_analysis_used, weekly_analysis_reset_at')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Check tier
    if (profile.tier === 'free') {
      return NextResponse.json(
        { error: 'Upgrade to Plus or Pro to generate analyses' },
        { status: 403 }
      )
    }

    // Check weekly limit for Plus tier
    if (profile.tier === 'plus') {
      const now = new Date()
      const resetDate = profile.weekly_analysis_reset_at
        ? new Date(profile.weekly_analysis_reset_at)
        : new Date()

      // Reset if week has passed
      if (now > resetDate) {
        await supabase
          .from('user_profiles')
          .update({
            weekly_analysis_used: 0,
            weekly_analysis_reset_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .eq('id', user.id)
      } else if (profile.weekly_analysis_used >= 1) {
        return NextResponse.json(
          { error: 'Weekly analysis limit reached. Pro users get unlimited.' },
          { status: 429 }
        )
      }
    }

    // Check if analysis already exists for this game
    const { data: existingAnalysis } = await supabase
      .from('ai_analyses')
      .select('id, content, token_count')
      .eq('game_id', gameId)
      .single()

    if (existingAnalysis) {
      return NextResponse.json(
        {
          analysis: existingAnalysis.content,
          tokenCount: existingAnalysis.token_count || 0,
          cached: true,
        },
        { status: 200 }
      )
    }

    // Fetch game context
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
        home_team:home_team_id(full_name, abbreviation),
        away_team:away_team_id(full_name, abbreviation)
      `
      )
      .eq('id', gameId)
      .single()

    if (gameError || !game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
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
      .eq('game_id', gameId)

    // Fetch odds
    const { data: odds } = await supabase
      .from('odds')
      .select('spread, moneyline_home, moneyline_away, total')
      .eq('game_id', gameId)
      .limit(1)
      .single()

    // Construct prompt
    const homeTeam = (game as Record<string, unknown>).home_team
    const awayTeam = (game as Record<string, unknown>).away_team

    const injuryContext = injuries
      ?.map(
        (inj: Record<string, unknown>) =>
          `${(inj.player as Record<string, unknown>)?.first_name} ${(inj.player as Record<string, unknown>)?.last_name} (${inj.injury_status}): ${inj.body_part}`
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

    // Call OpenAI GPT-4o mini (using Vercel AI SDK)
    const { text, usage } = await generateText({
      model: openai('gpt-4o-mini', {
        structuredOutputs: false,
      }),
      prompt,
      temperature: 0.7,
      maxTokens: 500,
    })

    const analysis = text

    // Store in database
    const { error: insertError } = await supabase
      .from('ai_analyses')
      .insert({
        game_id: gameId,
        content: analysis,
        generated_at: new Date().toISOString(),
        token_count: usage?.completionTokens || 0,
      })

    if (insertError) {
      console.error('Error storing analysis:', insertError)
    }

    // Increment usage counter for Plus users
    if (profile.tier === 'plus') {
      await supabase
        .from('user_profiles')
        .update({
          weekly_analysis_used: (profile.weekly_analysis_used || 0) + 1,
        })
        .eq('id', user.id)
    }

    return NextResponse.json(
      {
        analysis,
        tokenCount: usage?.completionTokens || 0,
        cached: false,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error generating analysis:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
