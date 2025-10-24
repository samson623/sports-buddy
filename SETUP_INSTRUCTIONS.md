# Environment Setup Instructions

## Quick Start

To get the Sports Buddy application running locally, you need to configure your environment variables.

### 1. Create Environment File

Copy the example environment file:

```bash
cp .env.example .env.local
```

### 2. Configure Supabase

You'll need to add your Supabase credentials to `.env.local`. These are **required** for authentication (including Google OAuth) to work.

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### How to Get Your Supabase Credentials

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Settings** → **API**
4. Copy the following values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Install Dependencies

```bash
npm install
```

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Google OAuth Setup

Google OAuth is configured through Supabase. Make sure you have:

1. Enabled Google as an authentication provider in your Supabase project
2. Configured the OAuth redirect URLs in both:
   - Supabase Dashboard (Authentication → Providers → Google)
   - Google Cloud Console (OAuth consent screen)

### Required Redirect URLs

For local development:
```
http://localhost:3000/auth/callback
```

For production:
```
https://your-domain.com/auth/callback
```

## Troubleshooting

### "Continue with Google" button doesn't work

This usually means the Supabase environment variables are not set correctly:

1. Verify `.env.local` exists and contains valid credentials
2. Restart the development server after creating/modifying `.env.local`
3. Check the browser console for any error messages

### Environment variables not loading

- Make sure the file is named `.env.local` (not `.env`)
- Restart the Next.js development server
- Verify the variables start with `NEXT_PUBLIC_` for client-side access

## Additional Configuration (Optional)

For full functionality, you may also want to configure:

- **OpenAI API** (for AI features)
- **Stripe** (for payment processing)
- **Admin Emails** (for admin access)

See `.env.example` for all available configuration options.

