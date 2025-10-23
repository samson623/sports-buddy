"use client"

type Variant = 'no_games' | 'no_injuries' | 'no_questions'

const messages: Record<Variant, { title: string; subtitle: string }> = {
  no_games: {
    title: 'No games to show',
    subtitle: 'Check back later for schedules and results.'
  },
  no_injuries: {
    title: 'No injuries reported',
    subtitle: 'All players are healthy as of the latest update.'
  },
  no_questions: {
    title: 'No questions yet',
    subtitle: 'Ask something to get AI-powered insights.'
  },
}

export default function EmptyState({ variant = 'no_games' as Variant }) {
  const { title, subtitle } = messages[variant]
  return (
    <div className="rounded-lg border p-8 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  )
}
