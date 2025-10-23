'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
const ReactMarkdown = dynamic(() => import('react-markdown'), { ssr: false })
import SmartImage from '@/components/SmartImage'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface Team {
  id: string
  full_name: string
  abbreviation: string
  logo_url: string | null
}

interface Game {
  id: string
  season: number
  week: number
  home_team_id: string | null
  away_team_id: string | null
  kickoff_utc: string | null
  venue: string | null
  status: string
  home_score: number | null
  away_score: number | null
  home_team: Team | null
  away_team: Team | null
}

interface Injury {
  id: string
  injury_status: string | null
  body_part: string | null
  player: { first_name: string; last_name: string } | null
}

interface Odds {
  spread: number | null
  moneyline_home: number | null
  moneyline_away: number | null
  total: number | null
  bookmaker: string
}

interface Analysis {
  content: string
  generated_at: string
}

interface GameDetailViewProps {
  game: Game
  analysis: Analysis | null
  injuries: Injury[]
  odds: Odds[]
  userTier: string
  userId?: string
}

export function GameDetailView({
  game,
  analysis,
  injuries,
  odds,
  userTier,
  userId,
}: GameDetailViewProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedAnalysis, setGeneratedAnalysis] = useState(analysis)

  const handleGenerateAnalysis = async () => {
    if (!userId) return
    
    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: game.id }),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Failed to generate analysis')
        return
      }

      const data = await response.json()
      setGeneratedAnalysis({
        content: data.analysis,
        generated_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error generating analysis:', error)
      alert('Error generating analysis')
    } finally {
      setIsGenerating(false)
    }
  }

  const kickoffDate = game.kickoff_utc ? new Date(game.kickoff_utc) : null
  const homeTeam = game.home_team
  const awayTeam = game.away_team

  return (
    <div className="space-y-8">
      {/* Game Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold">
            {awayTeam?.abbreviation} @ {homeTeam?.abbreviation}
          </h1>
          <Badge variant={game.status === 'completed' ? 'secondary' : 'default'}>
            {game.status.charAt(0).toUpperCase() + game.status.slice(1)}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-8">
          {/* Away Team */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                {awayTeam?.logo_url && (
                  <SmartImage
                    src={awayTeam.logo_url}
                    alt={awayTeam.full_name || 'Away team logo'}
                    width={64}
                    height={64}
                    className="h-16 w-16 mx-auto mb-4"
                    sizes="(max-width: 640px) 64px, 64px"
                  />
                )}
                <h2 className="text-2xl font-bold">{awayTeam?.full_name}</h2>
                <p className="text-muted-foreground">{awayTeam?.abbreviation}</p>
                {game.status === 'completed' && (
                  <p className="text-3xl font-bold mt-4">{game.away_score}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Home Team */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                {homeTeam?.logo_url && (
                  <SmartImage
                    src={homeTeam.logo_url}
                    alt={homeTeam.full_name || 'Home team logo'}
                    width={64}
                    height={64}
                    className="h-16 w-16 mx-auto mb-4"
                    sizes="(max-width: 640px) 64px, 64px"
                  />
                )}
                <h2 className="text-2xl font-bold">{homeTeam?.full_name}</h2>
                <p className="text-muted-foreground">{homeTeam?.abbreviation}</p>
                {game.status === 'completed' && (
                  <p className="text-3xl font-bold mt-4">{game.home_score}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Game Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Week</p>
                <p className="font-semibold">{game.week}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Season</p>
                <p className="font-semibold">{game.season}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Venue</p>
                <p className="font-semibold text-sm">{game.venue || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Kickoff</p>
                <p className="font-semibold text-sm">
                  {kickoffDate ? kickoffDate.toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Odds */}
      {odds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Betting Lines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {odds.map((odd, idx) => (
                <div key={idx}>
                  <p className="text-sm text-muted-foreground">{odd.bookmaker}</p>
                  <div className="space-y-1 text-sm mt-2">
                    <p>Spread: {odd.spread}</p>
                    <p>ML Home: {odd.moneyline_home}</p>
                    <p>ML Away: {odd.moneyline_away}</p>
                    <p>Total: {odd.total}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Injuries */}
      {injuries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Injuries Report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {injuries.map((injury) => (
                <div
                  key={injury.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-semibold">
                      {injury.player?.first_name} {injury.player?.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">{injury.body_part}</p>
                  </div>
                  <Badge variant="outline">{injury.injury_status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Analysis */}
      {userTier === 'plus' || userTier === 'pro' ? (
        <Card>
          <CardHeader>
            <CardTitle>AI Pre-Game Analysis</CardTitle>
            <CardDescription>
              {generatedAnalysis
                ? `Generated ${new Date(generatedAnalysis.generated_at).toLocaleDateString()}`
                : 'AI analysis not yet available'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generatedAnalysis ? (
              <div className="space-y-4">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{generatedAnalysis.content}</ReactMarkdown>
                </div>
                <p className="text-xs text-muted-foreground">
                  ⚠️ Disclaimer: AI analysis is generated for informational purposes only.
                  Always do your own research before making betting decisions.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-muted-foreground">No analysis available yet.</p>
                {userTier === 'plus' || userTier === 'pro' ? (
                  <Button onClick={handleGenerateAnalysis} disabled={isGenerating}>
                    {isGenerating ? 'Generating...' : 'Generate Analysis Now'}
                  </Button>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
          <CardHeader>
            <CardTitle>Unlock AI Pre-Game Analysis</CardTitle>
            <CardDescription>
              Get expert analysis on matchups, injuries, and predictions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Upgrade to Plus or Pro to access AI-powered analysis for every game.</p>
            <Link href="/pricing">
              <Button>View Plans</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
