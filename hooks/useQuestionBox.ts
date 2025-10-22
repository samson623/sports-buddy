'use client'

import { useState, useCallback } from 'react'

export type QuestionState = {
  question: string
  answer: string | null
  loading: boolean
  error: string | null
  remaining: number
  limit: number
  routedToDb: boolean
  timestamp: Date | null
}

export type QuestionResponse = {
  answer: string
  tokens_used: number
  routed_to_db: boolean
  tier: string
  quota?: {
    used: number
    limit: number
    remaining: number
  }
  rate_limit: {
    remaining: number
    reset_in_seconds: number
  }
}

export type QuestionError = {
  error: string
  message: string
  remaining?: number
  reset_in_seconds?: number
  tier?: string
  limit?: number
  used?: number
}

/**
 * Custom hook for managing Q&A state and API calls
 */
export function useQuestionBox(gameId?: string) {
  const [state, setState] = useState<QuestionState>({
    question: '',
    answer: null,
    loading: false,
    error: null,
    remaining: 10, // Default free tier
    limit: 10,
    routedToDb: false,
    timestamp: null,
  })

  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const [rateLimitError, setRateLimitError] = useState<string | null>(null)

  /**
   * Submit a question to the API
   */
  const submitQuestion = useCallback(
    async (question: string) => {
      // Validate input
      if (!question.trim()) {
        setState((prev) => ({
          ...prev,
          error: 'Please enter a question',
        }))
        return false
      }

      if (question.length > 500) {
        setState((prev) => ({
          ...prev,
          error: 'Question must be 500 characters or less',
        }))
        return false
      }

      setState((prev) => ({
        ...prev,
        question,
        loading: true,
        error: null,
      }))

      try {
        const response = await fetch('/api/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question,
            gameId,
          }),
        })

        const data = (await response.json()) as QuestionResponse | QuestionError

        // Handle errors
        if (!response.ok) {
          const errorData = data as QuestionError

          if (response.status === 429) {
            // Rate limited or quota exceeded
            if (errorData.error === 'rate_limited') {
              setRateLimitError(
                `Rate limited. Try again in ${errorData.reset_in_seconds}s.`
              )
            } else if (errorData.error === 'limit_reached') {
              // Show upgrade prompt
              setShowUpgradePrompt(true)
              setState((prev) => ({
                ...prev,
                loading: false,
                error: `You've reached your ${errorData.tier} tier limit (${errorData.limit} questions/day).`,
                remaining: 0,
              }))
              return false
            }
          } else {
            setState((prev) => ({
              ...prev,
              loading: false,
              error: errorData.message || 'Failed to get answer',
            }))
          }
          return false
        }

        // Success
        const successData = data as QuestionResponse
        setState((prev) => ({
          ...prev,
          loading: false,
          answer: successData.answer,
          remaining: successData.quota?.remaining ?? prev.remaining,
          limit: successData.quota?.limit ?? prev.limit,
          routedToDb: successData.routed_to_db,
          timestamp: new Date(),
          error: null,
        }))

        // Clear rate limit error on success
        setRateLimitError(null)

        return true
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to submit question'
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }))
        return false
      }
    },
    [gameId]
  )

  /**
   * Clear state
   */
  const clearAnswer = useCallback(() => {
    setState((prev) => ({
      ...prev,
      answer: null,
      error: null,
      question: '',
      timestamp: null,
    }))
  }, [])

  /**
   * Clear rate limit error
   */
  const clearRateLimitError = useCallback(() => {
    setRateLimitError(null)
  }, [])

  return {
    ...state,
    submitQuestion,
    clearAnswer,
    showUpgradePrompt,
    setShowUpgradePrompt,
    rateLimitError,
    clearRateLimitError,
  }
}
