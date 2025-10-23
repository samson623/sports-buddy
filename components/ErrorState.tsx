"use client"

import { Button } from '@/components/ui/button'

type Variant = 'network' | '404' | '500'

const messages: Record<Variant, { title: string; subtitle: string }> = {
  network: {
    title: 'Network error',
    subtitle: 'Please check your connection and try again.'
  },
  '404': {
    title: 'Not found',
    subtitle: 'The content you’re looking for does not exist.'
  },
  '500': {
    title: 'Server error',
    subtitle: 'Something went wrong on our side. Please retry.'
  },
}

export default function ErrorState({ variant = 'network' as Variant, onRetry }: { variant?: Variant; onRetry?: () => void }) {
  const { title, subtitle } = messages[variant]
  return (
    <div className="rounded-lg border p-8 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
      {onRetry && (
        <Button className="mt-4" onClick={onRetry} variant="default">Retry</Button>
      )}
    </div>
  )
}
