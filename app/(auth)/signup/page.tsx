"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function SignupPage() {
  const router = useRouter()
  const supabase = React.useMemo(() => createClient(), [])
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // If we already have a session (e.g., after Google OAuth redirect), go to dashboard
  React.useEffect(() => {
    let active = true
    const redirect = '/dashboard'
    
    // Only check for existing session on mount
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      if (data.session) {
        router.replace(redirect)
      }
    })
    
    // Listen for authentication state changes (like after OAuth callback)
    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      if (!active) return
      // Only redirect if we just signed in via OAuth (not on every state change)
      if (event === 'SIGNED_IN' && sess) {
        router.replace(redirect)
      }
    })
    
    return () => {
      active = false
      sub?.subscription.unsubscribe()
    }
  }, [supabase, router])

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { error: signupError, data } = await supabase.auth.signUp({ email, password })
      if (signupError) throw signupError

      if (!data.user) {
        throw new Error("Sign up failed: no user created")
      }

      const userId = data.user.id

      // Ensure a user profile exists; trigger may already create this.
      await supabase
        .from("user_profiles")
        .upsert({ id: userId }, { onConflict: "id" })

      // Wait for session to be fully established, then redirect
      await new Promise(resolve => setTimeout(resolve, 1000))
      router.replace("/dashboard")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to sign up')
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setLoading(true)
    setError(null)
    try {
      const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth/callback?redirect=${encodeURIComponent('/dashboard')}` : undefined
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider: "google", 
        options: { 
          redirectTo,
          skipBrowserRedirect: false
        } 
      })
      if (error) throw error
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[100vh] items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>Sign up with email or Google</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-3 rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-base h-12"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-base h-12"
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
              {loading ? "Signing up..." : "Sign up"}
            </Button>
          </form>
          <div className="mt-4">
            <Button variant="outline" className="w-full h-12 text-base" onClick={handleGoogle} disabled={loading}>
              Continue with Google
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex-col items-start gap-2">
          <p className="text-sm text-muted-foreground">
            Already have an account? <a href="/login" className="text-primary underline-offset-4 hover:underline">Log in</a>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}