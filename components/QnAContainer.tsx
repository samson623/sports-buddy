"use client"

import * as React from "react"
import { QuestionPanel } from "@/components/desktop/QuestionPanel"
import { QuestionOverlay } from "@/components/mobile/QuestionOverlay"
import { QuestionFAB } from "@/components/mobile/QuestionFAB"
import { useQuestionBox } from "@/hooks/useQuestionBox"

type Props = {
  gameId?: string
}

/**
 * Global Q&A container
 * - Desktop (lg+): fixed right sidebar QuestionPanel
 * - Mobile: floating action button + overlay
 */
export default function QnAContainer({ gameId }: Props) {
  const [open, setOpen] = React.useState(false)

  // For mobile FAB badge only; overlay manages its own state internally
  const qb = useQuestionBox(gameId)

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <QuestionPanel gameId={gameId} />
      </div>

      {/* Mobile FAB + overlay */}
      <div className="lg:hidden">
        <QuestionFAB remaining={qb.remaining} onClick={() => setOpen(true)} />
        <QuestionOverlay open={open} onClose={() => setOpen(false)} gameId={gameId} />
      </div>
    </>
  )
}
