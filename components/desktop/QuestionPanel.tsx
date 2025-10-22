'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, AlertCircle, Loader2 } from 'lucide-react'
import { AnswerDisplay } from '@/components/AnswerDisplay'
import { UpgradePrompt } from '@/components/UpgradePrompt'
import { useQuestionBox } from '@/hooks/useQuestionBox'

interface QuestionPanelProps {
  gameId?: string
}

/**
 * Desktop sidebar panel for asking questions
 * Keyboard shortcut: Cmd/Ctrl+K to focus
 */
export function QuestionPanel({ gameId }: QuestionPanelProps) {
  const [inputText, setInputText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const qb = useQuestionBox(gameId)

  // Keyboard shortcut Cmd/Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        textareaRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSubmit = async () => {
    const success = await qb.submitQuestion(inputText)
    if (success) {
      setInputText('')
    }
  }

  const handleClearAnswer = () => {
    qb.clearAnswer()
    setInputText('')
  }

  return (
    <>
      {/* Sidebar Panel */}
      <motion.div
        className="fixed right-0 top-0 bottom-0 w-96 bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-lg overflow-y-auto"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <div className="sticky top-0 p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Ask Questions
            </h2>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
              Cmd+K
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {qb.remaining}/{qb.limit} questions left today
          </p>
        </div>

        <div className="p-4 space-y-4">
          {/* Rate limit error */}
          {qb.rateLimitError && (
            <motion.div
              className="flex items-center gap-2 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg text-sm"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{qb.rateLimitError}</span>
            </motion.div>
          )}

          {/* Answer display */}
          <AnimatePresence>
            {qb.answer && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="space-y-2">
                  <AnswerDisplay
                    answer={qb.answer}
                    timestamp={qb.timestamp}
                    routedToDb={qb.routedToDb}
                    tokensUsed={undefined}
                  />
                  <button
                    onClick={handleClearAnswer}
                    className="w-full text-sm px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    Ask another
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error display */}
          {qb.error && !qb.answer && (
            <motion.div
              className="flex items-start gap-2 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg text-sm"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{qb.error}</span>
            </motion.div>
          )}

          {/* Input section - only show if no answer */}
          {!qb.answer && (
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {/* Character counter */}
              <div className="text-xs text-slate-500 dark:text-slate-400 text-right">
                {inputText.length}/500
              </div>

              {/* Input */}
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value.slice(0, 500))}
                placeholder="Ask about players, stats, injuries, odds..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                rows={4}
                disabled={qb.loading}
                style={{ fontSize: '14px' }}
              />

              {/* Submit button */}
              <button
                onClick={handleSubmit}
                disabled={qb.loading || !inputText.trim()}
                className="w-full px-3 py-2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {qb.loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Thinking...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Ask</span>
                  </>
                )}
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Upgrade prompt */}
      <UpgradePrompt
        open={qb.showUpgradePrompt}
        onOpenChange={qb.setShowUpgradePrompt}
      />
    </>
  )
}
