'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import Link from 'next/link'

interface AIAnalysisDisplayProps {
  gameId: string
  analysis?: {
    content: string
    created_at: string
  } | null
  userTier: string
  userId?: string
}

export function AIAnalysisDisplay({
  gameId,
  analysis,
  userTier,
  userId,
}: AIAnalysisDisplayProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedAnalysis, setGeneratedAnalysis] = useState(analysis)

  const handleGenerateAnalysis = async () => {
    if (!userId) return

    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId }),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Failed to generate analysis')
        return
      }

      const data = await response.json()
      setGeneratedAnalysis({
        content: data.analysis,
        created_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error generating analysis:', error)
      alert('Error generating analysis')
    } finally {
      setIsGenerating(false)
    }
  }

  if (userTier === 'plus' || userTier === 'pro') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Pre-Game Analysis</CardTitle>
          <CardDescription>
            {generatedAnalysis
              ? `Generated ${new Date(generatedAnalysis.created_at).toLocaleDateString()}`
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
    )
  }

  return (
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
  )
}
