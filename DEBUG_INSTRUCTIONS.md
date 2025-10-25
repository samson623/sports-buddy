# Debugging Theme Toggle & Google OAuth

## Quick Test Instructions

### Step 1: Clear Cache & Restart Dev Server
```bash
# Stop the current dev server (Ctrl+C in the terminal)
# Then run:
Remove-Item ".next" -Recurse -Force
npm run dev
```

### Step 2: Hard Refresh Browser
- Go to http://localhost:3000
- Press **Ctrl+Shift+R** (or Cmd+Shift+R on Mac)
- This clears the Next.js cache

### Step 3: Check Console Logs

1. **Open DevTools**: Press **F12**
2. **Go to Console tab**
3. **Test Theme Toggle**:
   - Click the theme toggle button (Sun/Moon icon)
   - You should see console logs like:
     ```
     ThemeToggle mounted, theme: dark, resolvedTheme: dark, systemTheme: dark
     Toggling theme from dark to light
     ```

4. **Test Google OAuth**:
   - Go to http://localhost:3000/login
   - Click "Continue with Google"
   - You should see console logs like:
     ```
     Starting Google OAuth with redirectTo: http://localhost:3000/auth/callback?redirect=%2Fdashboard
     Google OAuth response: {data: {...}, error: null}
     ```

## Expected Behavior

### Theme Toggle
- ✅ Button should respond immediately
- ✅ Background should change from dark to light (or vice versa)
- ✅ Console should show "Toggling theme..." logs
- ❌ If nothing happens, check console for errors

### Google OAuth
- ✅ Browser should redirect to Google login page
- ✅ Console should show "Starting Google OAuth..." log
- ✅ URL should show Google OAuth parameters
- ❌ If nothing happens, check console for errors

## Common Issues & Fixes

### Issue: Theme toggle not working
**Possible causes:**
- Browser still cached old version
- next-themes not properly initialized
- Hydration mismatch

**Fix:**
```bash
Remove-Item ".next" -Recurse -Force
npm run dev
# Hard refresh: Ctrl+Shift+R
```

### Issue: Google OAuth not redirecting
**Possible causes:**
- Supabase keys not properly configured
- CORS issue with callback URL
- localStorage blocking OAuth

**Fix:**
- Check `.env.local` has correct `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Check Supabase project has Google OAuth provider enabled
- Check browser privacy settings aren't blocking localStorage

## Files Modified for Debugging

- `components/ThemeToggle.tsx` - Added console.log statements
- `app/(auth)/login/page.tsx` - Added console.log statements for Google OAuth

These logs will help diagnose the exact issue when you test locally.
