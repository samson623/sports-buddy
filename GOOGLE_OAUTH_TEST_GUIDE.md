# 🔍 Google OAuth Debug & Test Guide

**YOU MUST TEST IN YOUR BROWSER** - This guide will help you identify the real issue.

---

## Step 1: Start the Dev Server

```bash
npm run dev
```

Wait for: `✓ Ready in X.Xs`

---

## Step 2: Open Browser DevTools

1. Go to `http://localhost:3000/login`
2. Press **F12** to open DevTools
3. Go to **Console** tab
4. Keep this window OPEN while testing

---

## Step 3: Test Google Sign-In

1. On the login page, click **"Continue with Google"**
2. **WATCH THE CONSOLE** - you should see:
   - `[DEBUG] Google sign-in clicked`
   - `[DEBUG] NEXT_PUBLIC_SUPABASE_URL: https://...`
   - `[DEBUG] NEXT_PUBLIC_SUPABASE_ANON_KEY exists: true`
   - `[DEBUG] Redirect URL: http://localhost:3000/auth/callback?redirect=%2F`
   - `[DEBUG] OAuth error: null` (or see what error appears)

---

## 🎯 What to Look For

### ✅ **WORKING** - This sequence should appear:
1. Click button
2. Google sign-in dialog opens
3. User logs in with Google account
4. Redirected back to app
5. Redirected to `/dashboard` (if logged in)

### ❌ **NOT WORKING** - One of these will happen:
1. **Nothing happens** → Check console for errors
2. **"Invalid API key"** → `.env.local` problem
3. **"OAuth error"** → Supabase Google OAuth not configured
4. **Redirects but stays logged out** → Session not persisting

---

## 🐛 Common Issues & Fixes

###1. **Nothing happens when clicking button**

**Console shows:**
- Nothing appears in console
- No errors

**Fix:**
```bash
# Environment variables not loaded
# Restart dev server:
npm run dev
# Refresh browser: Ctrl+R
```

---

### 2. **"Invalid Redirect URI"**

**Console shows:**
```
[DEBUG] OAuth error: {
  error: 'invalid_request',
  error_description: 'The Redirect URI provided does not match...'
}
```

**Cause:** The redirect URL in Supabase doesn't match what we're sending

**Fix:** Go to Supabase Dashboard:
1. Authentication → Providers → Google
2. Check "Redirect URLs" section
3. Should have: `http://localhost:3000/auth/callback`
4. If different, update it!

---

### 3. **"Provider not configured"**

**Console shows:**
```
[DEBUG] OAuth error: {
  error: 'invalid_grant',
  error_description: 'Google OAuth provider is not configured'
}
```

**Cause:** Google OAuth not enabled in Supabase

**Fix:** 
1. Go to Supabase Dashboard
2. Authentication → Providers
3. Find **Google**
4. Toggle it **ON**
5. Fill in Google Client ID and Secret (if needed)
6. Save

---

### 4. **Process env vars undefined**

**Console shows:**
```
[DEBUG] NEXT_PUBLIC_SUPABASE_URL: undefined
[DEBUG] NEXT_PUBLIC_SUPABASE_ANON_KEY exists: false
```

**Cause:** `.env.local` not created or values missing

**Fix:** Create/update `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY-HERE
```

Get values from Supabase Dashboard → Settings → API

---

### 5. **"Invalid API key"**

**Console shows:**
```
Invalid API key (header token signature does not match secret, jwt payload "sub" is required)
```

**Cause:** Wrong anon key in `.env.local`

**Fix:** Copy the correct anon key from Supabase

---

### 6. **Redirects but you're not logged in**

**What happens:**
- Google sign-in works
- Redirects to `/dashboard`
- But you're back at login page?

**Cause:** Session not persisting in cookies

**Fix:** Check in Network tab:
1. After callback, look for requests with "Set-Cookie"
2. Should set `sb-auth-token` or similar
3. If no cookies set, there's a server-side issue

---

## 📊 Step-by-Step Browser Test

### Part A: Check Environment

Open browser console and run:
```javascript
console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...')
```

**Expected:** Both should show values, not `undefined`

### Part B: Test Google Button

1. Click "Continue with Google"
2. Check console for debug messages (should appear immediately)
3. One of these happens:
   - ✅ Google sign-in popup opens → **WORKING!**
   - ❌ Error in console → **SEE ERROR SECTION ABOVE**

### Part C: Complete OAuth Flow

If Google dialog opens:
1. Sign in with your Google account
2. Allow permissions
3. Automatically redirected to `/auth/callback`
4. Check console for success message
5. Should redirect to `/dashboard`

If you see `/dashboard` → **LOGIN WORKS!**

---

## 🔧 Advanced Debugging

### Check Supabase Session

Open console and paste:
```javascript
// Get the current session
const { data: { session } } = await supabaseClient.auth.getSession()
console.log('Current session:', session)
```

Should show user info if logged in.

### Check Cookies

In DevTools:
1. Go to **Application** tab
2. Click **Cookies**
3. Look for `localhost`
4. Should see `sb-*` cookies (like `sb-auth-token`)

If no cookies, session isn't being set!

### Check Network

In DevTools:
1. Go to **Network** tab
2. Reload page
3. Click "Continue with Google"
4. Watch for requests:
   - Should see request to Google
   - Then request to your `/auth/callback`
   - Then requests with `Set-Cookie` headers

---

## ✨ What Success Looks Like

```
1. Click button
2. Console shows: "[DEBUG] Google sign-in clicked"
3. Google sign-in dialog opens
4. After signing in with Google...
5. Automatically redirects to http://localhost:3000/auth/callback?code=abc123&state=xyz
6. Callback exchanges code for session
7. Redirects to http://localhost:3000/dashboard
8. You see the dashboard (you're logged in!)
9. Refresh page, still logged in
```

---

## 📋 Checklist

Before testing, verify:

- [ ] `.env.local` exists in project root
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set (from Supabase Settings → API)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set (public, anon key)
- [ ] Supabase project is active (check Status in dashboard)
- [ ] Google OAuth is **ENABLED** in Supabase
- [ ] Redirect URL `http://localhost:3000/auth/callback` is registered in Supabase
- [ ] Dev server is running with `npm run dev`
- [ ] Browser refreshed after changing `.env.local`
- [ ] DevTools Console is open while testing

---

## 🆘 Still Stuck?

If Google Sign-In STILL doesn't work after trying above:

1. **Share the console error message** - The exact error tells us what's wrong
2. **Check Network tab** - See what requests are failing
3. **Verify redirect URL** - Make sure Supabase has exactly: `http://localhost:3000/auth/callback`

---

**NOW TEST IT IN YOUR BROWSER AND TELL ME WHAT THE CONSOLE SAYS! 🚀**
