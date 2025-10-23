'use client'

import Link from "next/link"
import { ArrowRight, Zap, Users, BarChart3, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/AuthProvider"

export default function Home() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // If logged in, show the schedule/dashboard
  if (user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 text-3xl font-bold">Welcome to Sports Buddy 🏈</div>
        <p className="mb-8 text-lg text-muted-foreground">
          Get AI-powered insights, schedules, and analysis for NFL games
        </p>
        <div className="grid gap-4 mb-8">
          <Link href="/dashboard" className="block">
            <Button className="w-full h-12 text-base">
              View Schedule <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/teams" className="block">
            <Button variant="outline" className="w-full h-12 text-base">
              Browse Teams
            </Button>
          </Link>
          <Link href="/pricing" className="block">
            <Button variant="outline" className="w-full h-12 text-base">
              Upgrade Plan
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Landing page for logged-out users
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4 py-12 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl sm:text-6xl font-bold mb-6 tracking-tight">
            Your AI-Powered NFL Companion
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-xl mx-auto">
            Get real-time schedules, injury updates, AI-powered analysis, and intelligent Q&A about NFL games
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/signup">
              <Button size="lg" className="h-12 px-8 text-base">
                Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-12 bg-muted/50">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">Why Sports Buddy?</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: BarChart3,
                title: "Real-Time Stats",
                description: "Get instant access to schedules, scores, and detailed game data"
              },
              {
                icon: Zap,
                title: "AI Insights",
                description: "Ask anything about NFL games and get instant AI-powered answers"
              },
              {
                icon: Users,
                title: "Player Info",
                description: "Track injuries, rosters, depth charts, and player performance"
              },
              {
                icon: Shield,
                title: "Premium Features",
                description: "Unlock advanced analysis and unlimited questions with Plus/Pro"
              }
            ].map((feature) => {
              const Icon = feature.icon
              return (
                <div key={feature.title} className="text-center">
                  <div className="flex justify-center mb-4">
                    <Icon className="h-12 w-12 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-12">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to get started?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of NFL fans using Sports Buddy for the best game insights
          </p>
          <Link href="/signup">
            <Button size="lg" className="h-12 px-8 text-base">
              Sign Up Now <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
