import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import type { UserTier } from '@/types/database'
import { matchPattern } from '@/lib/pattern-matching'
import { askLLM } from '@/lib/openai'
import { checkRateLimit, getRemainingRequests, getResetTime } from '@/lib/rate-limit'

type Body = {
  question: string
  gameId?: string
}

const LIMITS: Record<UserTier, number> = {
  free: 10,
  plus: 100,
  pro: 500,
}

/**
 * Main Q&A endpoint
 * POST /api/ask
 * GET /api/ask?q=question&gameId=optional
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Authenticate user (optional - allow anon)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Rate limit: 3 questions per minute
    const userId = user?.id || request.headers.get('x-forwarded-for') || 'anon'
    if (!checkRateLimit(userId)) {
      const resetSecs = getResetTime(userId)
      return NextResponse.json(
        {
          error: 'rate_limited',
          message: `Rate limit exceeded. Try again in ${resetSecs}s.`,
          remaining: 0,
          reset_in_seconds: resetSecs,
        },
        { status: 429, headers: { 'Retry-After': String(resetSecs) } }
      )
    }

    const body = (await request.json()) as Body
    const question = (body.question || '').trim()
    const gameId = body.gameId

    if (!question) {
      return NextResponse.json({ error: 'missing_question', message: 'Question is required' }, { status: 400 })
    }

    // Load user profile if logged in
    let tier: UserTier = 'free'
    let quotaUsed = 0
    let quotaResetAt = new Date()

    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('tier, qna_quota_used, qna_quota_reset_at')
        .eq('id', user.id)
        .maybeSingle()

      if (profile) {
        tier = profile.tier
        quotaUsed = profile.qna_quota_used
        quotaResetAt = new Date(profile.qna_quota_reset_at)
      }

      // Check if quota needs reset (>24 hours)
      const now = Date.now()
      const lastReset = quotaResetAt.getTime()
      if (now - lastReset > 24 * 60 * 60 * 1000) {
        await supabase
          .from('user_profiles')
          .update({ qna_quota_used: 0, qna_quota_reset_at: new Date().toISOString() })
          .eq('id', user.id)
        quotaUsed = 0
      }

      // Check quota limit
      const limit = LIMITS[tier]
      if (quotaUsed >= limit) {
        return NextResponse.json(
          {
            error: 'limit_reached',
            message: `${tier.toUpperCase()} tier limit (${limit}/day) reached.`,
            tier,
            limit,
            used: quotaUsed,
          },
          { status: 429 }
        )
      }
    }

    // Try database-first routing
    let answer: string = ''
    let inputTokens: number | undefined
    let outputTokens: number | undefined
    let routedToDb = false

    const dbMatch = await matchPattern(question)
    if (dbMatch.matched && dbMatch.answer) {
      answer = dbMatch.answer
      routedToDb = true
    } else {
      // Fall back to OpenAI with optional context
      let context = ''
      if (gameId) {
        context = await buildGameContext(supabase, gameId)
      }

      const maxTokens = tier === 'pro' ? 500 : tier === 'plus' ? 300 : 200
      const llmResponse = await askLLM({
        question,
        maxTokens,
        system: 'You are an NFL expert. Answer concisely in 2-3 sentences.',
        context: context || undefined,
      })

      answer = llmResponse.answer
      inputTokens = llmResponse.inputTokens
      outputTokens = llmResponse.outputTokens
    }

    // Log the interaction
    await supabase.from('qa_logs').insert({
      user_id: user?.id ?? null,
      question,
      answer,
      input_tokens: inputTokens ?? null,
      output_tokens: outputTokens ?? null,
      routed_to_db: routedToDb,
    })

    // Increment quota
    if (user) {
      await supabase
        .from('user_profiles')
        .update({
          qna_quota_used: quotaUsed + 1,
          qna_quota_reset_at: new Date().toISOString(),
        })
        .eq('id', user.id)
    }

    return NextResponse.json({
      answer,
      tokens_used: (inputTokens || 0) + (outputTokens || 0),
      routed_to_db: routedToDb,
      tier: user ? tier : 'anon',
      quota: user
        ? {
            used: quotaUsed + 1,
            limit: LIMITS[tier],
            remaining: LIMITS[tier] - (quotaUsed + 1),
          }
        : undefined,
      rate_limit: {
        remaining: getRemainingRequests(userId),
        reset_in_seconds: getResetTime(userId),
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'

    // Handle timeout
    if (message.includes('abort') || message.includes('timeout')) {
      return NextResponse.json(
        { error: 'timeout', message: 'Request timed out after 10 seconds.' },
        { status: 504 }
      )
    }

    // Handle other errors
    console.error('[/api/ask] Error:', err)
    return NextResponse.json(
      {
        error: 'server_error',
        message: 'An error occurred while processing your question.',
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Rate limit
    const userId = user?.id || request.headers.get('x-forwarded-for') || 'anon'
    if (!checkRateLimit(userId)) {
      const resetSecs = getResetTime(userId)
      return NextResponse.json(
        {
          error: 'rate_limited',
          message: `Rate limit exceeded. Try again in ${resetSecs}s.`,
          remaining: 0,
          reset_in_seconds: resetSecs,
        },
        { status: 429, headers: { 'Retry-After': String(resetSecs) } }
      )
    }

    const url = new URL(request.url)
    const question = (url.searchParams.get('q') || '').trim()
    const gameId = url.searchParams.get('gameId') || undefined

    // If no question, return usage info
    if (!question) {
      return NextResponse.json({
        status: 'ok',
        message: 'Sports Buddy Q&A API',
        usage: {
          get: '/api/ask?q=Your%20question&gameId=optional',
          post: {
            body: { question: 'Your question', gameId: 'optional' },
          },
          examples: [
            'Who is starting QB for the 49ers?',
            'What time is the Chiefs game?',
            'Who is injured on the Cowboys?',
            'What are the odds for the Packers?',
          ],
        },
        quotas: {
          free: '10 questions/day',
          plus: '100 questions/day',
          pro: '500 questions/day',
        },
        rate_limit: '3 questions/minute per user',
      })
    }

    // Load profile
    let tier: UserTier = 'free'
    let quotaUsed = 0
    let quotaResetAt = new Date()

    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('tier, qna_quota_used, qna_quota_reset_at')
        .eq('id', user.id)
        .maybeSingle()

      if (profile) {
        tier = profile.tier
        quotaUsed = profile.qna_quota_used
        quotaResetAt = new Date(profile.qna_quota_reset_at)
      }

      const now = Date.now()
      const lastReset = quotaResetAt.getTime()
      if (now - lastReset > 24 * 60 * 60 * 1000) {
        await supabase
          .from('user_profiles')
          .update({ qna_quota_used: 0, qna_quota_reset_at: new Date().toISOString() })
          .eq('id', user.id)
        quotaUsed = 0
      }

      const limit = LIMITS[tier]
      if (quotaUsed >= limit) {
        return NextResponse.json(
          {
            error: 'limit_reached',
            tier,
            limit,
            used: quotaUsed,
          },
          { status: 429 }
        )
      }
    }

    // Process question
    let answer: string = ''
    let inputTokens: number | undefined
    let outputTokens: number | undefined
    let routedToDb = false

    const dbMatch = await matchPattern(question)
    if (dbMatch.matched && dbMatch.answer) {
      answer = dbMatch.answer
      routedToDb = true
    } else {
      let context = ''
      if (gameId) {
        context = await buildGameContext(supabase, gameId)
      }

      const maxTokens = tier === 'pro' ? 500 : tier === 'plus' ? 300 : 200
      const llmResponse = await askLLM({
        question,
        maxTokens,
        system: 'You are an NFL expert. Answer concisely in 2-3 sentences.',
        context: context || undefined,
      })

      answer = llmResponse.answer
      inputTokens = llmResponse.inputTokens
      outputTokens = llmResponse.outputTokens
    }

    // Log
    await supabase.from('qa_logs').insert({
      user_id: user?.id ?? null,
      question,
      answer,
      input_tokens: inputTokens ?? null,
      output_tokens: outputTokens ?? null,
      routed_to_db: routedToDb,
    })

    // Increment quota
    if (user) {
      await supabase
        .from('user_profiles')
        .update({
          qna_quota_used: quotaUsed + 1,
          qna_quota_reset_at: new Date().toISOString(),
        })
        .eq('id', user.id)
    }

    return NextResponse.json({
      answer,
      tokens_used: (inputTokens || 0) + (outputTokens || 0),
      routed_to_db: routedToDb,
      tier: user ? tier : 'anon',
      quota: user
        ? {
            used: quotaUsed + 1,
            limit: LIMITS[tier],
            remaining: LIMITS[tier] - (quotaUsed + 1),
          }
        : undefined,
      rate_limit: {
        remaining: getRemainingRequests(userId),
        reset_in_seconds: getResetTime(userId),
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'

    if (message.includes('abort') || message.includes('timeout')) {
      return NextResponse.json(
        { error: 'timeout', message: 'Request timed out after 10 seconds.' },
        { status: 504 }
      )
    }

    console.error('[/api/ask] Error:', err)
    return NextResponse.json(
      {
        error: 'server_error',
        message: 'An error occurred while processing your question.',
      },
      { status: 500 }
    )
  }
}

type GameContextData = {
  id: string
  home_team_id: string | null
  away_team_id: string | null
  kickoff_utc: string | null
}

type PlayerData = {
  first_name: string
  last_name: string
  position: string | null
}

type InjuryData = {
  player: { first_name: string; last_name: string } | null
  injury_status: string | null
}

type OddsData = {
  spread: string | null
  moneyline_home: string | null
  moneyline_away: string | null
  total: string | null
}

/**
 * Build game context for OpenAI
 */
async function buildGameContext(supabase: Awaited<ReturnType<typeof createServerClient>>, gameId: string): Promise<string> {
  try {
    const { data: game } = await supabase
      .from('games')
      .select('id, home_team_id, away_team_id, kickoff_utc')
      .eq('id', gameId)
      .maybeSingle()

    if (!game) return ''

    const gameData = game as GameContextData

    const [homePlayers, awayPlayers, injuries, odds] = await Promise.all([
      supabase
        .from('players')
        .select('first_name, last_name, position')
        .eq('team_id', gameData.home_team_id || '')
        .limit(15),
      supabase
        .from('players')
        .select('first_name, last_name, position')
        .eq('team_id', gameData.away_team_id || '')
        .limit(15),
      supabase
        .from('injuries')
        .select('player:players(first_name, last_name), injury_status')
        .eq('game_id', gameData.id)
        .limit(10),
      supabase
        .from('odds')
        .select('spread, moneyline_home, moneyline_away, total')
        .eq('game_id', gameData.id)
        .order('retrieved_at', { ascending: false })
        .limit(1),
    ])

    const homePlayerList = (homePlayers.data || []) as PlayerData[]
    const awayPlayerList = (awayPlayers.data || []) as PlayerData[]
    const injuriesList = (injuries.data || []) as InjuryData[]
    const oddsList = (odds.data || []) as OddsData[]

    const parts = [
      `Game: ${new Date(gameData.kickoff_utc || '').toLocaleDateString()}`,
      `Home Roster: ${homePlayerList.map((p) => `${p.first_name} ${p.last_name} (${p.position || 'N/A'})`).join(', ') || 'N/A'}`,
      `Away Roster: ${awayPlayerList.map((p) => `${p.first_name} ${p.last_name} (${p.position || 'N/A'})`).join(', ') || 'N/A'}`,
      injuriesList.length > 0
        ? `Injuries: ${injuriesList.map((i) => `${i.player?.first_name} ${i.player?.last_name} (${i.injury_status})`).join(', ')}`
        : 'No reported injuries',
      oddsList[0]
        ? `Odds: Spread ${oddsList[0].spread || 'N/A'}, Moneyline (H: ${oddsList[0].moneyline_home || 'N/A'} / A: ${oddsList[0].moneyline_away || 'N/A'}), Total ${oddsList[0].total || 'N/A'}`
        : 'No odds available',
    ]

    return parts.join('\n')
  } catch {
    return ''
  }
}
