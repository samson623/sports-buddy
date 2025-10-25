# 🔧 Supabase Setup for Google OAuth

## ⚠️ IMPORTANT: You're missing Supabase credentials!

This is why clicking "Continue with Google" does nothing - the app can't connect to Supabase.

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Get Your Supabase Credentials

1. **Go to Supabase Dashboard**
   - Visit: https://app.supabase.com
   - Sign in or create an account

2. **Select or Create a Project**
   - Click on your project (or create a new one)

3. **Get Your API Credentials**
   - Click **Settings** (⚙️ icon) in the left sidebar
   - Click **API** in the settings menu
   - Copy these two values:
     - **Project URL** (looks like: `https://xxxxx.supabase.co`)
     - **anon public** key (under "Project API keys")

### Step 2: Configure Your `.env.local` File

1. **Open the `.env.local` file** (I just created it in your project root)

2. **Replace the placeholder values:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-long-anon-key-here
   ```

3. **Save the file**

### Step 3: Enable Google OAuth in Supabase

1. **Go to Authentication settings:**
   - In Supabase Dashboard → **Authentication** → **Providers**

2. **Enable Google provider:**
   - Toggle **Google** to ON
   - Click **Google** to configure

3. **Add OAuth credentials:**
   - You'll need a Google OAuth Client ID and Secret
   - See "Getting Google OAuth Credentials" section below

4. **Configure redirect URLs:**
   - Add these URLs to your authorized redirect URIs:
     - `http://localhost:3000/auth/callback` (for development)
     - Your production URL when ready (e.g., `https://yourapp.com/auth/callback`)

### Step 4: Restart Your Dev Server

```bash
# Stop the current server (Ctrl+C in the terminal)
# Then restart:
npm run dev
```

---

## 🔑 Getting Google OAuth Credentials

### Option 1: Use Supabase's Managed OAuth (Easier)
1. In Supabase Dashboard → Authentication → Providers → Google
2. Just toggle Google ON
3. Supabase will handle the OAuth flow for you
4. ✅ **This is the easiest option - try this first!**

### Option 2: Use Your Own Google OAuth App
If you want to use your own Google OAuth credentials:

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com

2. **Create a new project** (or select existing)

3. **Enable Google+ API**
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. **Create OAuth Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `https://your-project.supabase.co/auth/v1/callback`
     - `http://localhost:3000/auth/callback`

5. **Copy Client ID and Secret**
   - Paste them into Supabase Dashboard → Authentication → Providers → Google

---

## 🧪 Testing After Setup

1. **Restart your dev server:**
   ```bash
   npm run dev
   ```

2. **Open browser:**
   ```
   http://localhost:3000/signup
   ```

3. **Click "Continue with Google"**
   - Should now open Google sign-in dialog ✅
   - Complete authentication
   - Should redirect to dashboard

---

## 🐛 Troubleshooting

### Issue: Still nothing happens when clicking button

**Check browser console (F12):**
```javascript
// Run this in browser console:
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
```

If it shows `undefined`, your `.env.local` isn't loaded:
- Make sure you saved the `.env.local` file
- Restart the dev server (stop and run `npm run dev` again)
- Hard refresh the browser (Ctrl+Shift+R)

### Issue: Error about "Invalid login credentials"

Your environment variables are set but might be wrong:
- Double-check the values in `.env.local`
- Make sure there are no extra spaces or quotes
- The URL should start with `https://` and end with `.supabase.co`

### Issue: "OAuth error" or "redirect_uri mismatch"

1. **Check Supabase redirect URLs:**
   - Supabase Dashboard → Authentication → URL Configuration
   - Add `http://localhost:3000/auth/callback` to "Redirect URLs"

2. **Check Google OAuth settings:**
   - Google Cloud Console → OAuth 2.0 Client
   - Make sure `http://localhost:3000/auth/callback` is in authorized redirect URIs

### Issue: Button clicks but nothing happens (no dialog)

**Check browser console for errors:**
- Open DevTools (F12)
- Click "Continue with Google"
- Look for red errors in console
- Common errors:
  - `supabase is not defined` → Environment variables not loaded
  - `Failed to fetch` → Wrong Supabase URL or network issue
  - `Invalid API key` → Wrong anon key

---

## ✅ Checklist

Before testing, ensure:

- [ ] `.env.local` file exists in project root
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set (starts with https://)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set (long string)
- [ ] Supabase project exists and is active
- [ ] Google OAuth is enabled in Supabase
- [ ] Redirect URLs are configured
- [ ] Dev server was restarted after adding `.env.local`
- [ ] Browser was hard-refreshed (Ctrl+Shift+R)

---

## 📞 Need Help?

### Check if Supabase is working:

Open browser console (F12) and run:

```javascript
// Test Supabase connection
const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(
  'your-url-here',
  'your-anon-key-here'
)
supabase.auth.getSession().then(console.log)
```

If this works, Supabase is configured correctly!

---

## 🎯 Quick Summary

**Problem:** Nothing happens when clicking "Continue with Google"

**Root Cause:** Missing Supabase environment variables in `.env.local`

**Solution:**
1. Create `.env.local` with your Supabase credentials
2. Enable Google OAuth in Supabase Dashboard
3. Restart dev server
4. Test again

**Status:** ✅ `.env.local` template created - just add your credentials!

---

**Next:** Fill in your Supabase credentials in `.env.local` and restart the server! 🚀


