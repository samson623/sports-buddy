import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { Database } from '@/types/database'

const PUBLIC_PATHS = ['/login', '/signup', '/forgot-password']
const PUBLIC_PREFIXES = ['/legal/', '/auth/', '/_next', '/favicon', '/images', '/api/public']
const PROTECTED_PREFIXES: string[] = [] // protect everything that isn't explicitly public

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Refresh session if expired and read current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const url = request.nextUrl
  const path = url.pathname

  const isPublicExplicit = PUBLIC_PATHS.includes(path)
  const isPublicPrefix = PUBLIC_PREFIXES.some((p) => path.startsWith(p))
  const isProtected = PROTECTED_PREFIXES.length ? PROTECTED_PREFIXES.some((p) => path.startsWith(p)) : true

  // Allow OAuth callback to complete (Supabase appends `code` and `state`)
  const isOAuthCallback = url.searchParams.has('code') && url.searchParams.has('state')

  if (!user && isProtected && !isPublicExplicit && !isPublicPrefix && !isOAuthCallback) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

