"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = React.useMemo(() => createClient(), [])
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Check for error from callback
  React.useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      const errorMessages: Record<string, string> = {
        oauth_error: 'OAuth sign-in failed. Please try again.',
        callback_error: 'Authentication callback error. Please try again.',
      }
      setError(errorMessages[errorParam] || 'An error occurred. Please try again.')
    }
  }, [searchParams])

  // Check for existing session on mount
  React.useEffect(() => {
    let isMounted = true
    const redirectTo = searchParams.get('redirect') || '/dashboard'
    
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (isMounted && session) {
          // Already logged in, redirect immediately
          router.replace(redirectTo)
        }
      } catch (err) {
        if (isMounted) {
          console.error('Session check failed:', err)
        }
      }
    }
    
    checkSession()
    
    // Listen for auth state changes (e.g., after OAuth callback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return
        
        if (event === 'SIGNED_IN' && session) {
          // Redirect after successful sign-in
          router.replace(redirectTo)
        }
      }
    )
    
    return () => {
      isMounted = false
      subscription?.unsubscribe()
    }
  }, [supabase, router, searchParams])

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Validate inputs
    if (!email || !password) {
      setError("Email and password are required")
      return
    }
    
    setLoading(true)
    setError(null)
    try {
      const { error: signInError, data } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) throw signInError
      
      // Verify session was created
      if (!data.session) {
        throw new Error("No session created after sign in")
      }
      
      // Wait for session to be fully established, then redirect
      await new Promise(resolve => setTimeout(resolve, 1000))
      router.replace("/dashboard")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to log in')
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setLoading(true)
    setError(null)
    try {
      const redirectTo = typeof window !== 'undefined' 
        ? `${window.location.origin}/auth/callback` 
        : undefined
      
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider: "google", 
        options: { 
          redirectTo,
          skipBrowserRedirect: false,
        } 
      })
      
      if (error) throw error
      // OAuth will handle redirect automatically
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[100vh] items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Log in with email or Google</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-3 rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
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
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
              {loading ? "Logging in..." : "Log in"}
            </Button>
          </form>
          <div className="mt-4">
            <Button variant="outline" className="w-full h-12 text-base" onClick={handleGoogle} disabled={loading}>
              Continue with Google
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex-col items-start gap-2">
          <a href="/forgot-password" className="text-sm text-primary underline-offset-4 hover:underline">Forgot password?</a>
          <p className="text-sm text-muted-foreground">
            New here? <a href="/signup" className="text-primary underline-offset-4 hover:underline">Create an account</a>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  )
}