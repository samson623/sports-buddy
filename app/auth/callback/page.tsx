"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function OAuthCallback() {
  const router = useRouter()
  const params = useSearchParams()
  const supabase = React.useMemo(() => createClient(), [])

  React.useEffect(() => {
    let active = true
    const desired = params.get("redirect") || (typeof window !== "undefined" ? window.localStorage.getItem("postAuthRedirect") || "/" : "/")

    const proceed = async () => {
      // Ensure the OAuth code in the URL is exchanged for a session
      if (typeof window !== 'undefined') {
        try {
          await supabase.auth.exchangeCodeForSession({
            currentUrl: window.location.href,
          })
        } catch {
          // no-op; if already exchanged this will throw
        }
      }
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        if (!active) return
        router.replace(desired)
      }
    }

    // Try immediately, then subscribe for changes
    proceed()
    const { data: sub } = supabase.auth.onAuthStateChange(() => proceed())
    const t = setTimeout(proceed, 800)

    return () => {
      active = false
      clearTimeout(t)
      sub.subscription.unsubscribe()
    }
  }, [router, supabase, params])

  return (
    <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
      Completing sign-in…
    </div>
  )
}
