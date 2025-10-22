'use client'

import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'

interface UpgradePromptProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const tiers = [
  {
    name: 'Free',
    questions: '10',
    price: '$0',
    period: '/month',
    features: [
      'Database-first answers',
      'AI answers with context',
      'Up to 10 questions/day',
      'Basic support',
    ],
    cta: 'Current Plan',
    disabled: true,
  },
  {
    name: 'Plus',
    questions: '100',
    price: '$9.99',
    period: '/month',
    features: [
      'Everything in Free +',
      '100 questions/day',
      'Priority support',
      'Advanced analytics',
    ],
    cta: 'Upgrade Now',
    disabled: false,
  },
  {
    name: 'Pro',
    questions: '500',
    price: '$24.99',
    period: '/month',
    features: [
      'Everything in Plus +',
      '500 questions/day',
      '24/7 premium support',
      'Custom AI training',
      'API access',
    ],
    cta: 'Upgrade Now',
    disabled: false,
    popular: true,
  },
]

/**
 * Modal showing tier comparison and upgrade options
 */
export function UpgradePrompt({ open, onOpenChange }: UpgradePromptProps) {
  const router = useRouter()

  const handleUpgrade = (tierName: string) => {
    // Navigate to pricing page with tier pre-selected
    router.push(`/pricing?tier=${tierName.toLowerCase()}`)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Questions Limit Reached</DialogTitle>
          <DialogDescription>
            You&apos;ve hit your daily question limit. Upgrade to ask more questions and unlock additional features.
          </DialogDescription>
        </DialogHeader>

        {/* Tier comparison table */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-6">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-lg border-2 p-6 transition-all ${
                tier.popular
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900'
              }`}
            >
              {/* Popular badge */}
              {tier.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Tier name */}
              <div className="mb-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {tier.name}
                </h3>
              </div>

              {/* Price */}
              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-slate-900 dark:text-white">
                    {tier.price}
                  </span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {tier.period}
                  </span>
                </div>
              </div>

              {/* Questions per day */}
              <div className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {tier.questions} questions/day
                </div>
              </div>

              {/* Features list */}
              <ul className="space-y-3 mb-6">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Button
                onClick={() => handleUpgrade(tier.name)}
                disabled={tier.disabled}
                variant={tier.popular ? 'default' : 'outline'}
                className="w-full"
              >
                {tier.cta}
              </Button>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
