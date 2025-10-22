"use client"

import * as React from "react"
import { Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"

const tierBenefits: Record<string, { icon: string; text: string }[]> = {
  plus: [
    { icon: "✓", text: "100 Q&A questions per day" },
    { icon: "✓", text: "Advanced analytics and insights" },
    { icon: "✓", text: "Priority email support" },
    { icon: "✓", text: "Game predictions" },
    { icon: "✓", text: "Injury alerts" }
  ],
  pro: [
    { icon: "✓", text: "500 Q&A questions per day" },
    { icon: "✓", text: "Full AI analysis suite" },
    { icon: "✓", text: "24/7 premium support" },
    { icon: "✓", text: "API access for developers" },
    { icon: "✓", text: "Custom reports and exports" }
  ]
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get("session_id")
  const [tier, setTier] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Trigger confetti
  React.useEffect(() => {
    // Dynamically import canvas-confetti
    import("canvas-confetti").then((confetti) => {
      // Fire confetti burst
      confetti.default({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })

      // Second burst after delay
      setTimeout(() => {
        confetti.default({
          particleCount: 50,
          spread: 100,
          origin: { y: 0.7 }
        })
      }, 500)
    })
  }, [])

  // Verify session with Stripe
  React.useEffect(() => {
    const verifySession = async () => {
      if (!sessionId) {
        setError("No session found")
        setLoading(false)
        return
      }

      try {
        const response = await fetch("/api/checkout/verify-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to verify session")
        }

        setTier(data.tier)
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to verify session")
        setLoading(false)
      }
    }

    verifySession()
  }, [sessionId])

  const tierLabel = tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : "Premium"
  const benefits = tier && tier in tierBenefits ? tierBenefits[tier] : []

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
          <p className="text-muted-foreground">Processing your subscription...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-md w-full border-destructive">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-destructive">{error}</p>
            <Button onClick={() => router.push("/pricing")} className="w-full">
              Back to Pricing
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        {/* Success Card */}
        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/10">
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <CardTitle className="text-3xl">Welcome to {tierLabel}! 🎉</CardTitle>
            <p className="mt-2 text-muted-foreground">
              Your subscription is active and ready to use
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Benefits List */}
            <div>
              <h3 className="font-semibold mb-4">Your new features:</h3>
              <ul className="space-y-3">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span>{benefit.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Next Steps */}
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-4 border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-blue-900 dark:text-blue-400 mb-2">Next steps:</h4>
              <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                <li>✓ Your account has been upgraded</li>
                <li>✓ You can start using premium features immediately</li>
                <li>✓ Check your email for a confirmation receipt</li>
              </ul>
            </div>

            {/* Action Button */}
            <Button
              onClick={() => router.push("/dashboard")}
              className="w-full h-12 text-base"
            >
              Go to Dashboard
            </Button>

            {/* Link to Profile */}
            <Button
              onClick={() => router.push("/profile")}
              variant="outline"
              className="w-full h-12 text-base"
            >
              View Your Profile
            </Button>
          </CardContent>
        </Card>

        {/* Help Section */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Need help?{" "}
            <a href="mailto:support@sportsbuddy.com" className="text-primary underline hover:underline-offset-2">
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  )
}
