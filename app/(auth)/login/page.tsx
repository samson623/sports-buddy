"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  const router = useRouter()
  const supabase = React.useMemo(() => createClient(), [])
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) throw signInError
      router.replace("/dashboard")
    } catch (err: any) {
      setError(err?.message ?? "Failed to log in")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setLoading(true)
    setError(null)
    try {
      const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined
      await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } })
    } catch (err: any) {
      setError(err?.message ?? "Google sign-in failed")
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