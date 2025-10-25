import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  // Redirect URL after successful OAuth
  const redirectTo = searchParams.get('redirect') || '/dashboard'

  // If there's a code, exchange it for a session
  if (code && state) {
    try {
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('OAuth exchange error:', error)
        return NextResponse.redirect(new URL(`/login?error=oauth_error`, request.url))
      }

      // Successfully exchanged code for session, redirect to intended destination
      return NextResponse.redirect(new URL(redirectTo, request.url))
    } catch (err) {
      console.error('Callback error:', err)
      return NextResponse.redirect(new URL(`/login?error=callback_error`, request.url))
    }
  }

  // If no code or state, redirect to login
  return NextResponse.redirect(new URL('/login', request.url))
}
