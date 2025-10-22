'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, AlertCircle, Loader2 } from 'lucide-react'
import { AnswerDisplay } from '@/components/AnswerDisplay'
import { UpgradePrompt } from '@/components/UpgradePrompt'
import { useQuestionBox } from '@/hooks/useQuestionBox'

interface QuestionOverlayProps {
  open: boolean
  onClose: () => void
  gameId?: string
}

/**
 * Full-screen modal for asking questions on mobile
 * Slide-up animation, swipe-down dismiss, 500 char limit
 */
export function QuestionOverlay({ open, onClose, gameId }: QuestionOverlayProps) {
  const [inputText, setInputText] = useState('')
  const [touchStart, setTouchStart] = useState(0)
  const qb = useQuestionBox(gameId)

  // Handle swipe down to close
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientY
    if (touchEnd - touchStart > 100) {
      // Swiped down
      onClose()
    }
  }

  const handleSubmit = async () => {
    const success = await qb.submitQuestion(inputText)
    if (success) {
      setInputText('')
    }
  }

  const handleClose = () => {
    setInputText('')
    qb.clearAnswer()
    onClose()
  }

  useEffect(() => {
    if (!open) {
      setInputText('')
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-950 rounded-t-2xl z-50 max-h-[90vh] overflow-y-auto flex flex-col"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-t-2xl">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Ask a Question
              </h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 space-y-4">
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
              {qb.answer && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <AnswerDisplay
                    answer={qb.answer}
                    timestamp={qb.timestamp}
                    routedToDb={qb.routedToDb}
                    tokensUsed={undefined}
                  />
                </motion.div>
              )}

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

              {/* Quota display */}
              {qb.remaining !== undefined && (
                <div className="text-sm text-slate-600 dark:text-slate-400 text-right">
                  {qb.remaining}/{qb.limit} questions left today
                </div>
              )}
            </div>

            {/* Input section */}
            <div className="sticky bottom-0 p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-3">
              {/* Character counter */}
              <div className="text-xs text-slate-500 dark:text-slate-400 text-right">
                {inputText.length}/500
              </div>

              {/* Input */}
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value.slice(0, 500))}
                placeholder="Ask about players, stats, injuries, odds..."
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                style={{ fontSize: '16px' }}
                disabled={qb.loading}
              />

              {/* Submit button */}
              <button
                onClick={handleSubmit}
                disabled={qb.loading || !inputText.trim()}
                className="w-full px-4 py-3 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
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
            </div>
          </motion.div>
        </>
      )}

      {/* Upgrade prompt */}
      <UpgradePrompt
        open={qb.showUpgradePrompt}
        onOpenChange={qb.setShowUpgradePrompt}
      />
    </AnimatePresence>
  )
}
