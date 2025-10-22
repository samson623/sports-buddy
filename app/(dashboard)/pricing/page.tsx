"use client"

import * as React from "react"
import { Check, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface PricingTier {
  name: string
  price: number
  description: string
  features: string[]
  cta: string
  isPopular?: boolean
}

const tiers: PricingTier[] = [
  {
    name: "Free",
    price: 0,
    description: "Perfect for getting started",
    features: [
      "10 Q&A questions per day",
      "Basic sports data access",
      "1 favorite team",
      "Community support"
    ],
    cta: "Get Started"
  },
  {
    name: "Plus",
    price: 4.99,
    description: "For serious fans",
    features: [
      "100 Q&A questions per day",
      "Advanced analytics",
      "5 favorite teams",
      "Priority support",
      "Game predictions",
      "Injury alerts"
    ],
    cta: "Subscribe Now",
    isPopular: true
  },
  {
    name: "Pro",
    price: 9.99,
    description: "For the ultimate enthusiast",
    features: [
      "500 Q&A questions per day",
      "Full AI analysis suite",
      "Unlimited favorite teams",
      "24/7 premium support",
      "API access",
      "Custom reports",
      "Real-time notifications"
    ],
    cta: "Subscribe Now"
  }
]

const faqs = [
  {
    question: "Can I cancel my subscription?",
    answer: "Yes! You can cancel anytime from your account settings. Your access will continue until the end of your current billing period."
  },
  {
    question: "What about refunds?",
    answer: "We offer a 7-day money-back guarantee. If you're not satisfied, contact us within 7 days for a full refund."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit and debit cards via Stripe, including Visa, Mastercard, American Express, and Discover."
  },
  {
    question: "Do you offer annual billing?",
    answer: "Currently, we offer monthly subscriptions. Annual billing options are coming soon!"
  },
  {
    question: "Can I upgrade or downgrade?",
    answer: "Absolutely! You can change your plan anytime. Changes take effect immediately, and we'll prorate any charges."
  }
]

function FAQ() {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0)

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-8 text-center text-3xl font-bold">Frequently Asked Questions</h2>
      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <div key={index} className="border rounded-lg">
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="flex w-full items-center justify-between bg-secondary/50 p-4 hover:bg-secondary transition-colors"
            >
              <h3 className="font-semibold text-left">{faq.question}</h3>
              <ChevronDown
                className={`h-5 w-5 transition-transform ${openIndex === index ? "rotate-180" : ""}`}
              />
            </button>
            {openIndex === index && (
              <div className="border-t p-4 bg-background">
                <p className="text-muted-foreground">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function PricingPage() {
  const [loading, setLoading] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const handleSubscribe = async (tierName: string) => {
    if (tierName === "Free") {
      // Free tier - no action needed
      return
    }

    setLoading(tierName)
    setError(null)

    try {
      const response = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: tierName.toLowerCase() })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session")
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      {error && (
        <div className="mb-8 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold sm:text-5xl">Simple, Transparent Pricing</h1>
          <p className="text-lg text-muted-foreground">
            Choose the plan that fits your sports enthusiasm
          </p>
        </div>

        {/* Pricing Cards - Responsive Grid */}
        <div className="mb-16 grid gap-8 sm:grid-cols-1 lg:grid-cols-3">
          {tiers.map((tier, index) => (
            <Card
              key={index}
              className={`relative flex flex-col transition-all hover:shadow-lg ${
                tier.isPopular ? "border-2 border-primary lg:scale-105" : ""
              }`}
            >
              {tier.isPopular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">${tier.price.toFixed(2)}</span>
                  {tier.price > 0 && <span className="text-muted-foreground ml-2">/month</span>}
                </div>
              </CardHeader>

              <CardContent className="flex-1">
                <Button
                  onClick={() => handleSubscribe(tier.name)}
                  disabled={loading === tier.name}
                  className="w-full mb-6"
                  variant={tier.isPopular ? "default" : "outline"}
                  size="lg"
                >
                  {loading === tier.name ? "Loading..." : tier.cta}
                </Button>

                <div className="space-y-3">
                  {tier.features.map((feature, fIndex) => (
                    <div key={fIndex} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 mb-8">
          <FAQ />
        </div>
      </div>
    </div>
  )
}
