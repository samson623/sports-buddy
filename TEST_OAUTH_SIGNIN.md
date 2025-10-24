# Quick Google OAuth Sign-In Test Guide

## 🚀 Start Development Server

```bash
npm run dev
```

The app will be running at `http://localhost:3000`

---

## ✅ Test Case 1: Google Sign-Up

### Steps:
1. Open `http://localhost:3000/signup`
2. Click the **"Continue with Google"** button
3. Sign in with your Google account
4. Authorize the application when prompted

### Expected Result:
- ✅ Redirected to `/dashboard`
- ✅ You see the dashboard (not auth pages)
- ✅ User is logged in

### If It Fails:
- Check browser console for errors (F12)
- Look for "auth code error" page
- See **Troubleshooting** section below

---

## ✅ Test Case 2: Google Sign-In

### Steps:
1. First, sign up with Google (Test Case 1)
2. Log out (if there's a logout button)
3. Go to `http://localhost:3000/login`
4. Click the **"Continue with Google"** button
5. Sign in with the same Google account

### Expected Result:
- ✅ Redirected to `/dashboard`
- ✅ You see the dashboard
- ✅ User is logged in

---

## ✅ Test Case 3: OAuth with Theme Parameter (Verify Theme Doesn't Break OAuth)

### Steps:
1. Go to `http://localhost:3000/login?theme=dark`
2. Click the **"Continue with Google"** button
3. Sign in with your Google account

### Expected Result:
- ✅ OAuth flow works normally
- ✅ Theme parameter doesn't interfere
- ✅ Redirected to dashboard after signing in

---

## ✅ Test Case 4: Redirect Parameter

### Steps:
1. Go to `http://localhost:3000/login?redirect=%2Fteams`
2. Click the **"Continue with Google"** button
3. Sign in with your Google account

### Expected Result:
- ✅ After authentication, you're redirected to `/teams`
- ✅ The redirect parameter was honored
- ✅ Logged in and viewing the teams page

---

## ✅ Test Case 5: Protected Route OAuth Flow

### Steps:
1. Make sure you're logged out (clear cookies if needed)
2. Go to `http://localhost:3000/dashboard`
3. You should be redirected to `/login?redirect=%2Fdashboard`
4. Click the **"Continue with Google"** button
5. Sign in with your Google account

### Expected Result:
- ✅ After authentication, returned to `/dashboard`
- ✅ Logged in on the dashboard
- ✅ The redirect parameter preserved your destination

---

## 🔍 Browser Console Debugging

Open the browser console (F12) and run:

```javascript
// Check if you're logged in
await supabase.auth.getSession().then(({ data }) => {
  console.log('Session:', data.session);
  console.log('User:', data.session?.user?.email);
});

// Check auth state
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth Event:', event, 'Session:', !!session);
});
```

---

## 🐛 Troubleshooting

### Issue: "Auth code error" page appears

**Causes:**
- Missing or invalid Google OAuth credentials
- Redirect URI not configured in Supabase

**Solutions:**
1. Check Supabase Dashboard → Authentication → Providers → Google
2. Verify redirect URI is exactly: `http://localhost:3000/auth/callback`
3. Verify Google OAuth credentials are correct

### Issue: Infinite redirect loop

**Causes:**
- Middleware condition not working
- Browser cache issues

**Solutions:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Clear cookies for localhost
3. Hard refresh (Ctrl+F5)
4. Check middleware.ts is deployed

### Issue: Session not being created

**Causes:**
- OAuth parameters not being passed correctly
- Code exchange failing on backend

**Solutions:**
1. Check browser network tab (F12) for the callback request
2. Verify the `code` parameter is in the URL
3. Check Supabase logs for any errors
4. Ensure Supabase credentials are correct

### Issue: User redirected to login instead of dashboard

**Causes:**
- Session not being detected
- Auth state not updating

**Solutions:**
1. Check browser cookies are enabled
2. Wait a moment after login (session takes time to sync)
3. Hard refresh the page
4. Check browser console for errors

---

## 📋 Complete Success Criteria

For the fix to be considered working, all of these should be true:

- ✅ Can sign up with Google
- ✅ Can sign in with Google
- ✅ Theme parameters don't break OAuth
- ✅ Redirect parameters are honored
- ✅ No "auth code error" page
- ✅ Session is established after OAuth
- ✅ User stays logged in after page refresh
- ✅ No errors in browser console

---

## 🎯 Next Steps

Once you confirm all tests pass:

1. **Commit your changes** to git
   ```bash
   git add app/(auth)/login/page.tsx app/(auth)/signup/page.tsx middleware.ts
   git commit -m "fix: improve OAuth redirect URL handling to prevent parameter loss"
   ```

2. **Push to your branch**
   ```bash
   git push origin chore/perf-polish-task-14
   ```

3. **Create a Pull Request** with reference to this fix

4. **Deploy to staging** for additional testing

---

## 📞 Support

If you encounter issues that aren't listed above:
1. Check the `OAUTH_FIX_GUIDE.md` for detailed technical information
2. Review the code changes in `OAUTH_CHANGES.md`
3. Check Supabase documentation for OAuth configuration
4. Review browser network requests in DevTools

---

**Happy testing! The OAuth sign-in should now work reliably. 🎉**

