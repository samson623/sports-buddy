'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Check, Copy } from 'lucide-react'

interface AnswerDisplayProps {
  answer: string
  timestamp?: Date | null
  routedToDb?: boolean
  tokensUsed?: number
}

/**
 * Display answer with markdown rendering, copy button, and source info
 */
export function AnswerDisplay({
  answer,
  timestamp,
  routedToDb,
  tokensUsed,
}: AnswerDisplayProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(answer)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="space-y-3">
      {/* Header with copy button and source */}
      <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 dark:bg-slate-900 px-3 py-2">
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <span className="inline-flex px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium">
            {routedToDb ? '📊 Database' : '🤖 AI Generated'}
          </span>
          {timestamp && (
            <span>
              {timestamp.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          aria-label="Copy answer"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Markdown content */}
      <div className="prose prose-sm dark:prose-invert max-w-none px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <ReactMarkdown
          components={{
            p: ({ ...props }) => (
              <p className="text-slate-800 dark:text-slate-200 leading-relaxed" {...props} />
            ),
            ul: ({ ...props }) => (
              <ul className="list-disc list-inside text-slate-800 dark:text-slate-200 space-y-1" {...props} />
            ),
            ol: ({ ...props }) => (
              <ol className="list-decimal list-inside text-slate-800 dark:text-slate-200 space-y-1" {...props} />
            ),
            li: ({ ...props }) => (
              <li className="text-slate-800 dark:text-slate-200" {...props} />
            ),
            strong: ({ ...props }) => (
              <strong className="font-semibold text-slate-900 dark:text-slate-100" {...props} />
            ),
            em: ({ ...props }) => (
              <em className="italic text-slate-700 dark:text-slate-300" {...props} />
            ),
            code: ({ ...props }) => (
              <code className="bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-sm" {...props} />
            ),
            blockquote: ({ ...props }) => (
              <blockquote className="border-l-4 border-blue-500 pl-3 italic text-slate-700 dark:text-slate-300 my-2" {...props} />
            ),
            a: ({ ...props }) => (
              <a className="text-blue-600 dark:text-blue-400 hover:underline" {...props} />
            ),
          }}
        >
          {answer}
        </ReactMarkdown>
      </div>

      {/* Footer with token count */}
      {tokensUsed !== undefined && (
        <div className="text-xs text-slate-500 dark:text-slate-400 text-right">
          {tokensUsed} tokens used
        </div>
      )}
    </div>
  )
}
