import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import type { UserTier } from '@/types/database'
import { routeQuestionToDB } from '@/lib/pattern-matching'
import { askLLM } from '@/lib/openai'
import { rateLimitConsume, rateLimitKeyFrom } from '@/lib/rate-limit'

type Body = {
  question: string
  gameId?: string
}

const LIMITS: Record<UserTier, number> = {
  free: 10,
  plus: 100,
  pro: 500,
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Auth (optional for now)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Rate limit 3/min per user (or IP if anon)
    const rl = rateLimitConsume(rateLimitKeyFrom(request, user?.id))
    if (!rl.allowed) {
      return NextResponse.json({ error: 'rate_limited', retry_after_ms: rl.retryAfterMs }, { status: 429 })
    }

    const body = (await request.json()) as Body
    const question = (body.question || '').trim()
    const gameId = body.gameId
    if (!question) return NextResponse.json({ error: 'missing_question' }, { status: 400 })

    // Load profile if logged in
    let tier: UserTier = 'free'
    let used = 0
    let resetAt = new Date(0)
    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('tier,qna_quota_used,qna_quota_reset_at')
        .eq('id', user.id)
        .maybeSingle()
      if (profile) {
        tier = profile.tier
        used = profile.qna_quota_used
        resetAt = new Date(profile.qna_quota_reset_at)
      }
      // Reset if >24h
      const now = Date.now()
      if (!resetAt || now - resetAt.getTime() > 24 * 60 * 60 * 1000) {
        await supabase
          .from('user_profiles')
          .update({ qna_quota_used: 0, qna_quota_reset_at: new Date().toISOString() })
          .eq('id', user.id)
        used = 0
      }
      // Check limit
      const limit = LIMITS[tier]
      if (used >= limit) {
        return NextResponse.json({ error: 'limit_reached', tier, limit }, { status: 429 })
      }
    }

    // Database-first routing
    const routed = await routeQuestionToDB(question)
    let answer: string
    let inputTokens: number | undefined
    let outputTokens: number | undefined
    let routed_to_db = false

    if (routed) {
      answer = routed.answer
      routed_to_db = routed.routed_to_db
    } else {
      // Compose lightweight context if gameId provided
      let context = ''
      if (gameId) {
        const { data: game } = await supabase
          .from('games')
          .select('id, home_team_id, away_team_id, kickoff_utc')
          .eq('id', gameId)
          .maybeSingle()
        if (game) {
          const [homePlayers, awayPlayers, injuries, odds] = await Promise.all([
            supabase.from('players').select('first_name,last_name,position').eq('team_id', game.home_team_id || '' ).limit(20),
            supabase.from('players').select('first_name,last_name,position').eq('team_id', game.away_team_id || '' ).limit(20),
            supabase.from('injuries').select('players(first_name,last_name), injury_status, description').eq('game_id', game.id).limit(20),
            supabase.from('odds').select('bookmaker,spread,moneyline_home,moneyline_away,total').eq('game_id', game.id).order('retrieved_at', { ascending: false }).limit(1),
          ])
          context = [
            `Game kickoff: ${game.kickoff_utc || 'unknown'}`,
            `Home roster: ${(homePlayers.data || []).map(p => `${p.first_name} ${p.last_name} (${p.position||''})`).join(', ')}`,
            `Away roster: ${(awayPlayers.data || []).map(p => `${p.first_name} ${p.last_name} (${p.position||''})`).join(', ')}`,
            `Injuries: ${(injuries.data || []).map(i => `${i.players?.first_name} ${i.players?.last_name}: ${i.injury_status}`).join('; ')}`,
            `Latest odds: ${odds.data?.[0] ? `${odds.data[0].bookmaker} spread ${odds.data[0].spread ?? 'N/A'}, total ${odds.data[0].total ?? 'N/A'}` : 'N/A'}`,
          ].join('\n')
        }
      }
      const maxTokens = tier === 'pro' ? 500 : tier === 'plus' ? 300 : 200
      const llm = await askLLM({ question, maxTokens, system: 'You are an NFL expert. Answer concisely.', context })
      answer = llm.answer
      inputTokens = llm.inputTokens
      outputTokens = llm.outputTokens
    }

    // Log
    await supabase.from('qa_logs').insert({
      user_id: user?.id ?? null,
      question,
      answer,
      input_tokens: inputTokens ?? null,
      output_tokens: outputTokens ?? null,
      routed_to_db,
    })

    // Increment quota if logged in
    if (user) {
      await supabase
        .from('user_profiles')
        .update({ qna_quota_used: (used || 0) + 1, qna_quota_reset_at: new Date().toISOString() })
        .eq('id', user.id)
    }

    return NextResponse.json({ answer, tokens_used: (inputTokens || 0) + (outputTokens || 0), routed_to_db })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown_error'
    if (msg.includes('The operation was aborted')) {
      return NextResponse.json({ error: 'timeout' }, { status: 504 })
    }
    return NextResponse.json({ error: 'server_error', detail: msg }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Rate limit
    const rl = rateLimitConsume(rateLimitKeyFrom(request, user?.id))
    if (!rl.allowed) {
      return NextResponse.json({ error: 'rate_limited', retry_after_ms: rl.retryAfterMs }, { status: 429 })
    }

    const url = new URL(request.url)
    const question = (url.searchParams.get('q') || '').trim()
    const gameId = url.searchParams.get('gameId') || undefined

    if (!question) {
      return NextResponse.json({
        status: 'ok',
        usage: {
          GET: '/api/ask?q=Your+question&gameId=optional',
          POST: { question: 'Your question', gameId: 'optional' },
        },
      })
    }

    // Load profile if logged in
    let tier: UserTier = 'free'
    let used = 0
    let resetAt = new Date(0)
    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('tier,qna_quota_used,qna_quota_reset_at')
        .eq('id', user.id)
        .maybeSingle()
      if (profile) {
        tier = profile.tier
        used = profile.qna_quota_used
        resetAt = new Date(profile.qna_quota_reset_at)
      }
      const now = Date.now()
      if (!resetAt || now - resetAt.getTime() > 24 * 60 * 60 * 1000) {
        await supabase
          .from('user_profiles')
          .update({ qna_quota_used: 0, qna_quota_reset_at: new Date().toISOString() })
          .eq('id', user.id)
        used = 0
      }
      const limit = LIMITS[tier]
      if (used >= limit) {
        return NextResponse.json({ error: 'limit_reached', tier, limit }, { status: 429 })
      }
    }

    const routed = await routeQuestionToDB(question)
    let answer: string
    let inputTokens: number | undefined
    let outputTokens: number | undefined
    let routed_to_db = false

    if (routed) {
      answer = routed.answer
      routed_to_db = routed.routed_to_db
    } else {
      let context = ''
      if (gameId) {
        const { data: game } = await supabase
          .from('games')
          .select('id, home_team_id, away_team_id, kickoff_utc')
          .eq('id', gameId)
          .maybeSingle()
        if (game) {
          const [homePlayers, awayPlayers, injuries, odds] = await Promise.all([
            supabase.from('players').select('first_name,last_name,position').eq('team_id', game.home_team_id || '' ).limit(20),
            supabase.from('players').select('first_name,last_name,position').eq('team_id', game.away_team_id || '' ).limit(20),
            supabase.from('injuries').select('players(first_name,last_name), injury_status, description').eq('game_id', game.id).limit(20),
            supabase.from('odds').select('bookmaker,spread,moneyline_home,moneyline_away,total').eq('game_id', game.id).order('retrieved_at', { ascending: false }).limit(1),
          ])
          context = [
            `Game kickoff: ${game.kickoff_utc || 'unknown'}`,
            `Home roster: ${(homePlayers.data || []).map(p => `${p.first_name} ${p.last_name} (${p.position||''})`).join(', ')}`,
            `Away roster: ${(awayPlayers.data || []).map(p => `${p.first_name} ${p.last_name} (${p.position||''})`).join(', ')}`,
            `Injuries: ${(injuries.data || []).map(i => `${i.players?.first_name} ${i.players?.last_name}: ${i.injury_status}`).join('; ')}`,
            `Latest odds: ${odds.data?.[0] ? `${odds.data[0].bookmaker} spread ${odds.data[0].spread ?? 'N/A'}, total ${odds.data[0].total ?? 'N/A'}` : 'N/A'}`,
          ].join('\n')
        }
      }
      const maxTokens = tier === 'pro' ? 500 : tier === 'plus' ? 300 : 200
      const llm = await askLLM({ question, maxTokens, system: 'You are an NFL expert. Answer concisely.', context })
      answer = llm.answer
      inputTokens = llm.inputTokens
      outputTokens = llm.outputTokens
    }

    await supabase.from('qa_logs').insert({
      user_id: user?.id ?? null,
      question,
      answer,
      input_tokens: inputTokens ?? null,
      output_tokens: outputTokens ?? null,
      routed_to_db,
    })

    if (user) {
      await supabase
        .from('user_profiles')
        .update({ qna_quota_used: (used || 0) + 1, qna_quota_reset_at: new Date().toISOString() })
        .eq('id', user.id)
    }

    return NextResponse.json({ answer, tokens_used: (inputTokens || 0) + (outputTokens || 0), routed_to_db })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown_error'
    if (msg.includes('The operation was aborted')) {
      return NextResponse.json({ error: 'timeout' }, { status: 504 })
    }
    return NextResponse.json({ error: 'server_error', detail: msg }, { status: 500 })
  }
}
