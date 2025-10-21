# Google OAuth Setup Guide

## Prerequisites
Before Google sign-in can work, you need to:

1. Have a Supabase project set up
2. Have a Google Cloud Console project
3. Configure OAuth in both Google and Supabase

## Step 1: Set up Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and create a project if you haven't already
2. Once created, go to your project dashboard
3. Navigate to **Settings** → **API**
4. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **Anon/Public Key** (starts with `eyJ...`)
   - **Service Role Key** (also starts with `eyJ...`)

## Step 2: Configure Environment Variables

1. Open `.env.local` file in this project
2. Replace the placeholder values with your actual Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

## Step 3: Set up Google OAuth in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the **Google+ API** or **Google Identity API**
4. Go to **APIs & Services** → **Credentials**
5. Click **Create Credentials** → **OAuth client ID**
6. If prompted, configure the OAuth consent screen first:
   - Choose "External" for user type
   - Fill in required fields (app name, support email, etc.)
   - Add your domain to authorized domains
   - Add test users if in development
7. For Application type, select **Web application**
8. Add Authorized redirect URIs:
   - `https://your-project.supabase.co/auth/v1/callback`
   - For local development: `http://localhost:3000/auth/callback` (optional)
9. Click **Create** and save your:
   - **Client ID**
   - **Client Secret**

## Step 4: Configure Google OAuth in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **Google** in the list and enable it
4. Enter your Google OAuth credentials:
   - **Client ID** (from Google Cloud Console)
   - **Client Secret** (from Google Cloud Console)
5. The redirect URL should be automatically set to:
   `https://your-project.supabase.co/auth/v1/callback`
6. Click **Save**

## Step 5: Additional Supabase Configuration

1. In Supabase dashboard, go to **Authentication** → **URL Configuration**
2. Add your site URL (for production) and localhost (for development):
   - Site URL: `https://your-domain.com` (or `http://localhost:3000` for development)
   - Redirect URLs: Add `http://localhost:3000/*` and your production domain

## Step 6: Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```
2. Navigate to http://localhost:3000/login
3. Click "Continue with Google"
4. You should be redirected to Google's OAuth consent screen
5. After authorization, you should be redirected back to your dashboard

## Troubleshooting

### Common Issues:

1. **"Redirect URI mismatch" error**
   - Make sure the redirect URI in Google Cloud Console exactly matches your Supabase callback URL
   - Check that you've added all necessary redirect URIs

2. **"Invalid client" error**
   - Double-check your Client ID and Client Secret in Supabase
   - Ensure the OAuth client is not deleted or disabled in Google Cloud Console

3. **User not redirected after sign-in**
   - Check the `redirectTo` URL in the code
   - Verify Site URL configuration in Supabase

4. **"This app isn't verified" warning**
   - This is normal for development
   - For production, you'll need to verify your app with Google

5. **Environment variables not loading**
   - Restart your Next.js development server after changing `.env.local`
   - Make sure `.env.local` is in the root directory

## Security Notes

- Never commit `.env.local` to version control
- Keep your Service Role Key secret
- Use environment variables for all sensitive data
- Enable Row Level Security (RLS) in Supabase for your tables

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)