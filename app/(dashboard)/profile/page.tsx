"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, Zap } from "lucide-react"

type UserProfile = {
  id: string
  display_name: string | null
  tier: "free" | "plus" | "pro"
  qna_quota_used: number
  qna_quota_reset_at: string
}

const QUOTA_LIMITS: Record<string, number> = {
  free: 10,
  plus: 100,
  pro: 500
}

export default function ProfilePage() {
  const router = useRouter()
  const supabase = React.useMemo(() => createClient(), [])
  const [profile, setProfile] = React.useState<UserProfile | null>(null)
  const [displayName, setDisplayName] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [portalLoading, setPortalLoading] = React.useState(false)

  // Load user profile
  React.useEffect(() => {
    const loadProfile = async () => {
      try {
        const {
          data: { user }
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/login")
          return
        }

        const { data, error: fetchError } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (fetchError) throw fetchError

        setProfile(data)
        setDisplayName(data?.display_name || "")
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile")
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [supabase, router])

  const handleSaveProfile = async () => {
    if (!profile) return

    setSaving(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({
          display_name: displayName || null
        })
        .eq("id", profile.id)

      if (updateError) throw updateError

      setProfile({ ...profile, display_name: displayName || null })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile")
    } finally {
      setSaving(false)
    }
  }

  const handleManageSubscription = async () => {
    setPortalLoading(true)
    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST"
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to open portal")
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open portal")
    } finally {
      setPortalLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error || "Failed to load profile"}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const quotaLimit = QUOTA_LIMITS[profile.tier]
  const quotaPercentage = Math.min((profile.qna_quota_used / quotaLimit) * 100, 100)
  const hoursUntilReset = Math.floor(
    (new Date(profile.qna_quota_reset_at).getTime() - Date.now()) / (1000 * 60 * 60)
  )

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
            {error}
          </div>
        )}

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>Manage your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="display-name" className="text-sm font-medium">
                Display Name
              </label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
                className="text-base h-10"
              />
            </div>
            <Button onClick={handleSaveProfile} disabled={saving} className="w-full sm:w-auto">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        {/* Current Tier */}
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>Your subscription details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-lg">
                  {profile.tier.charAt(0).toUpperCase() + profile.tier.slice(1)} Plan
                </p>
                <p className="text-sm text-muted-foreground">
                  {profile.tier === "free"
                    ? "Upgrade to unlock more questions"
                    : "Thanks for being a valued subscriber!"}
                </p>
              </div>
              <Badge variant={profile.tier === "pro" ? "default" : "secondary"}>
                {profile.tier.toUpperCase()}
              </Badge>
            </div>

            {profile.tier !== "free" && (
              <Button
                onClick={handleManageSubscription}
                disabled={portalLoading}
                variant="outline"
                className="w-full sm:w-auto"
              >
                {portalLoading ? "Loading..." : "Manage Subscription"}
              </Button>
            )}

            {profile.tier === "free" && (
              <Button
                onClick={() => router.push("/pricing")}
                className="w-full sm:w-auto"
              >
                <ArrowUpRight className="mr-2 h-4 w-4" />
                Upgrade to Plus
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Usage Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Statistics</CardTitle>
            <CardDescription>Your Q&A quota and limits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">Questions Used Today</p>
                <p className="text-2xl font-bold">
                  {profile.qna_quota_used} / {quotaLimit}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="h-3 rounded-full bg-secondary overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    quotaPercentage > 90
                      ? "bg-destructive"
                      : quotaPercentage > 70
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                  style={{ width: `${quotaPercentage}%` }}
                ></div>
              </div>

              <p className="text-sm text-muted-foreground">
                {hoursUntilReset > 0
                  ? `Resets in ${hoursUntilReset} hour${hoursUntilReset !== 1 ? "s" : ""}`
                  : "Resets soon"}
              </p>
            </div>

            {/* Features by Tier */}
            <div className="border-t pt-6">
              <h4 className="font-semibold mb-4">Your Features</h4>
              <ul className="space-y-2">
                {profile.tier === "free" && (
                  <>
                    <li className="flex items-center gap-2 text-sm">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      Basic sports data access
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      Community support
                    </li>
                  </>
                )}
                {profile.tier === "plus" && (
                  <>
                    <li className="flex items-center gap-2 text-sm">
                      <Zap className="h-4 w-4 text-blue-500" />
                      Advanced analytics
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Zap className="h-4 w-4 text-blue-500" />
                      Priority support
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Zap className="h-4 w-4 text-blue-500" />
                      Game predictions & injury alerts
                    </li>
                  </>
                )}
                {profile.tier === "pro" && (
                  <>
                    <li className="flex items-center gap-2 text-sm">
                      <Zap className="h-4 w-4 text-purple-500" />
                      Full AI analysis suite
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Zap className="h-4 w-4 text-purple-500" />
                      24/7 premium support
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Zap className="h-4 w-4 text-purple-500" />
                      API access & custom reports
                    </li>
                  </>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
