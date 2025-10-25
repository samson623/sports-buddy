# Google OAuth Sign-In Fix Guide

## Problem Identified
Google OAuth sign-in was failing because:
1. Query parameters were being added to the OAuth redirect URL that could interfere with Supabase's OAuth flow
2. The `code` and `state` parameters returned by Supabase after Google authentication were at risk of being stripped or overwritten
3. This prevented the session exchange from completing, causing sign-in to fail

## Root Cause
- The `redirectTo` URL passed to `supabase.auth.signInWithOAuth()` could accumulate unwanted query parameters
- While the middleware had logic to preserve OAuth parameters, the redirect URL construction wasn't clean enough

## Solution Implemented

### 1. Fixed Login Page (`app/(auth)/login/page.tsx`)
**Before:**
```typescript
const redirectTo = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`
```

**After:**
```typescript
const callbackUrl = new URL(`${window.location.origin}/auth/callback`)
callbackUrl.searchParams.set('redirect', encodeURIComponent(redirect))
const redirectTo = callbackUrl.toString()
```

**Benefit:** Uses proper URL construction to ensure only the intended parameters are included.

### 2. Fixed Signup Page (`app/(auth)/signup/page.tsx`)
Applied the same fix to the signup page's OAuth handler.

**Result:** Both authentication pages now construct clean redirect URLs without any extra query parameters.

### 3. Enhanced Middleware (`middleware.ts`)
Added explicit comments and safeguards to ensure OAuth parameters (code, state) are always preserved:
- Middleware loops through ALL query parameters
- Each parameter is explicitly set on the callback URL
- A guard check ensures `redirect` parameter is only added if not already present

**Result:** Multiple safety layers ensure OAuth parameters can never be lost during the redirect process.

## How the Fix Works

### OAuth Flow (With Fix)
1. **User clicks "Continue with Google"** on login/signup page
2. **Frontend constructs clean redirect URL:**
   - `https://yourapp.com/auth/callback?redirect=%2Fdashboard`
   - No extra parameters, just the callback endpoint and redirect destination
3. **Frontend calls `supabase.auth.signInWithOAuth()`**
   - Supabase redirects user to Google OAuth
4. **After user authorizes:**
   - Google redirects back to Supabase
   - Supabase appends authentication code: `?code=XXX&state=YYY`
5. **Middleware intercepts the redirect:**
   - Detects `code` and `state` parameters
   - Preserves them while normalizing the path to `/auth/callback`
   - Example URL: `/auth/callback?code=XXX&state=YYY&redirect=%2Fdashboard`
6. **Backend exchanges code for session:**
   - `/auth/callback` route extracts the `code` parameter
   - Calls `supabase.auth.exchangeCodeForSession(code)`
   - Session is established successfully
7. **User is redirected to their final destination:**
   - `/dashboard` (or the redirect parameter value)

## Testing the Fix

### Prerequisites
1. Google OAuth credentials configured in Supabase
2. Redirect URI configured: `https://yourapp.com/auth/callback`
3. Development server running

### Test Steps

#### Test 1: Google Sign-Up Flow
1. Go to `http://localhost:3000/signup`
2. Click "Continue with Google"
3. Authorize with your Google account
4. Should be redirected to dashboard
5. User should be logged in

#### Test 2: Google Sign-In Flow
1. Go to `http://localhost:3000/login`
2. Click "Continue with Google"
3. Authorize with your Google account
4. Should be redirected to dashboard (or redirect parameter if provided)
5. User should be logged in

#### Test 3: OAuth Redirect with Query Parameters
1. Go to `http://localhost:3000/login?theme=dark`
2. Click "Continue with Google"
3. Authorize and sign in
4. Should work correctly (theme parameter should not interfere)

#### Test 4: Protected Route OAuth
1. Go to `http://localhost:3000/dashboard`
2. You should be redirected to `/login?redirect=%2Fdashboard`
3. Click "Continue with Google"
4. After authorization, should return to `/dashboard`
5. User should be logged in on the dashboard

### Verification Checklist
- [ ] User can sign up with Google OAuth
- [ ] User can sign in with Google OAuth  
- [ ] Theme parameters don't interfere with OAuth flow
- [ ] Redirect parameters are honored (redirect to intended destination)
- [ ] No "auth code error" page appears
- [ ] Session is properly established after OAuth
- [ ] Browser history shows clean URLs without OAuth parameters

## Browser Console Debugging

If you encounter issues, open the browser developer console and check:

```javascript
// Check if session was established
supabase.auth.getSession().then(({ data }) => console.log('Session:', data.session))

// Check for auth listeners
// Should see SIGNED_IN event when OAuth completes
```

## Technical Details

### Query Parameter Safety
- The `redirectTo` URL is constructed using `new URL()` API, which properly encodes parameters
- All OAuth parameters are explicitly preserved through the middleware
- The callback route only processes the `code` parameter, ignoring all others
- Session exchange happens on the server-side, preventing client-side tampering

### Why This Works
1. **Clean redirect URL:** Only includes necessary parameters
2. **Middleware preservation:** All query parameters are forwarded to `/auth/callback`
3. **Atomic code exchange:** Server-side session exchange prevents client-side interference
4. **Proper URL encoding:** Ensures special characters don't break the OAuth flow

## Future Improvements
- Consider adding logging to track OAuth flow completion
- Add rate limiting to prevent OAuth flow abuse
- Monitor for any other query parameters that might interfere
- Consider storing OAuth state in session storage as additional security

## Troubleshooting

### Issue: "Auth code error" page appears
- Check Supabase OAuth configuration
- Verify redirect URI matches exactly: `https://yourapp.com/auth/callback`
- Check browser console for errors
- Verify `code` parameter is present in URL during callback

### Issue: Infinite redirect loop
- Check if middleware condition `isOAuthCallback` is working
- Verify middleware is allowed to run on `/auth/callback` path
- Clear browser cache and cookies

### Issue: Session not established after OAuth
- Check if `exchangeCodeForSession()` is being called
- Verify Supabase environment variables are set correctly
- Check browser cookies are being set

## Related Files
- `app/(auth)/login/page.tsx` - Login page with fixed OAuth handler
- `app/(auth)/signup/page.tsx` - Signup page with fixed OAuth handler
- `app/auth/callback/route.ts` - Callback route that exchanges code for session
- `middleware.ts` - Enhanced middleware with OAuth parameter preservation
- `components/ThemeProvider.tsx` - Theme provider (doesn't interfere with OAuth)
- `components/ThemeToggle.tsx` - Theme toggle (doesn't manipulate query parameters)

