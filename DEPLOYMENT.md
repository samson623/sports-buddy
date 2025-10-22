# AI Pre-Game Analysis: Deployment Guide

Complete step-by-step guide for deploying the AI Pre-Game Analysis system to production.

## 📋 Prerequisites

- [x] Supabase project created (znildkucbbehfydowzvr)
- [x] Database schema initialized
- [x] Seeded NFL data (32 teams, 24 games, players, injuries, odds)
- [x] OpenAI API key configured
- [x] Next.js app running locally

## 🚀 Deployment Steps

### Phase 1: Local Verification (5 minutes)

```bash
# 1. Verify setup
npm run setup:ai-analysis

# Expected output:
# ✅ Database: Connected (24 games found)
# ✅ Tables: ai_analyses, user_profiles
# ✅ Seeded Data: Ready
# ✅ OpenAI Key: Configured
# ⏳ Edge Function: Pending deployment
```

### Phase 2: Deploy Edge Function (10 minutes)

#### Option A: Dashboard Deployment (Recommended)

1. **Open Supabase Dashboard**
   ```
   https://supabase.com/dashboard/project/znildkucbbehfydowzvr/functions
   ```

2. **Create New Function**
   - Click: "Create a new function"
   - Name: `generate-analyses`
   - Click: "Create function"

3. **Copy Function Code**
   ```bash
   # Open this file in your editor
   cat supabase/functions/generate-analyses/index.ts
   
   # Copy entire contents to dashboard
   ```

4. **Configure Environment Variables**
   - Go to: Edge Functions → generate-analyses → Configuration
   - Add environment variable:
     ```
     Name: OPENAI_API_KEY
     Value: sk-proj-4lxdCmGQor9cxNEZR7vs...
     ```
   - Click: "Save"

5. **Deploy**
   - Click: "Deploy" button
   - Wait for: "Function deployed successfully"

#### Option B: CLI Deployment (Advanced)

```bash
# Install Supabase CLI
# https://github.com/supabase/cli#install-the-cli

# Login
supabase login

# Link project
supabase link --project-ref znildkucbbehfydowzvr

# Deploy function
supabase functions deploy generate-analyses

# Set environment variable
supabase secrets set OPENAI_API_KEY=sk-proj-4lxdCmGQor9cxNEZR7vs...

# Verify deployment
supabase functions list
```

### Phase 3: Setup Cron Job (5 minutes)

1. **Open Supabase Dashboard**
   ```
   https://supabase.com/dashboard/project/znildkucbbehfydowzvr/database/cron
   ```

2. **Create Cron Job**
   - Click: "Create a new cron job"
   - Fill in:
     ```
     Name: generate_analyses_weekly
     Enabled: ON (toggle)
     Function: generate-analyses
     Schedule: 0 14 * * 3
     Timezone: UTC
     ```
   - Click: "Save"

   **Schedule Explanation:**
   ```
   0 14 * * 3
   ├─ 0    = Minute 0
   ├─ 14   = Hour 14 (UTC) = 9 AM ET / 6 AM PT
   ├─ *    = Any day of month
   ├─ *    = Any month
   └─ 3    = Wednesday (0=Sun, 1=Mon, ..., 3=Wed)
   ```

### Phase 4: Test Deployment (5 minutes)

#### Test via Dashboard UI

```bash
# Start development server
npm run dev

# Open in browser
http://localhost:3000

# Sign in with your account
# (Free tier for first test)

# Navigate to game detail
http://localhost:3000/games/dd361ba3-78e9-4ebd-a1f5-0af45af9f5ad

# You should see:
# ✓ Game title: KC @ BUF
# ✓ Team logos and scores
# ✓ Betting lines
# ✓ AI Analysis section (tier-gated)
```

#### Test via API (Curl)

```bash
# Get auth token from browser
# DevTools → Application → localStorage
# Find: sb-znildkucbbehfydowzvr-auth-token

# Test as Plus tier user
curl -X POST http://localhost:3000/api/generate-analysis \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "gameId": "dd361ba3-78e9-4ebd-a1f5-0af45af9f5ad"
  }'

# Expected response (200):
{
  "analysis": "## KC @ BUF Analysis\n\n**Key Matchup:** This matchup features two...",
  "cached": false,
  "tokenCount": 342
}

# Second request should return cached:
{
  "analysis": "...",
  "cached": true,
  "tokenCount": 342
}
```

#### Test Tier Gating

```bash
# As Free tier user:
# Response (403):
{
  "error": "Upgrade to Plus or Pro for AI analysis"
}

# As Plus tier user (max 1/week):
# First request: analysis generated
# Second request (same week): { "error": "Weekly limit reached" } (429)

# As Pro tier user:
# Unlimited analysis generation
```

### Phase 5: Verify in Database

```bash
# Check Edge Function logs
# Supabase Dashboard → Edge Functions → generate-analyses → Logs

# Check ai_analyses table
# Supabase Dashboard → Database → ai_analyses
# Should show analyses with timestamps and token counts

# Check user_profiles updates
# Fields: weekly_analysis_used, weekly_analysis_reset_at
```

## ✅ Verification Checklist

After deployment, verify:

- [ ] **Edge Function Deployed**
  ```bash
  supabase functions list
  # Should show: generate-analyses (Deployed)
  ```

- [ ] **Environment Variables Set**
  - Supabase Dashboard → Edge Functions → generate-analyses → Configuration
  - OPENAI_API_KEY present

- [ ] **Cron Job Active**
  - Supabase Dashboard → Database → Cron Jobs
  - generate_analyses_weekly: Enabled

- [ ] **API Endpoint Works**
  - Free tier: Returns 403 with upgrade message
  - Plus tier: Returns analysis or cached result
  - Pro tier: Returns unlimited analyses

- [ ] **Database Updated**
  - ai_analyses table populated with analyses
  - user_profiles has weekly_analysis_used tracking
  - Timestamps are accurate

- [ ] **Game Detail Page**
  - Load http://localhost:3000/games/dd361ba3-78e9-4ebd-a1f5-0af45af9f5ad
  - See game info, injuries, odds
  - AI section shows appropriate tier content

## 🔍 Monitoring

### View Edge Function Logs

```
Supabase Dashboard
→ Edge Functions
→ generate-analyses
→ Logs
```

**Look for:**
- Successful function invocations
- API call latency
- Token usage per analysis
- Error messages (if any)

### Check Analysis Table

```sql
-- Count analyses generated
SELECT COUNT(*) FROM ai_analyses;

-- Recent analyses
SELECT game_id, token_count, generated_at 
FROM ai_analyses 
ORDER BY generated_at DESC 
LIMIT 10;

-- Analyses by week
SELECT 
  DATE_TRUNC('week', generated_at) as week,
  COUNT(*) as count
FROM ai_analyses
GROUP BY DATE_TRUNC('week', generated_at)
ORDER BY week DESC;
```

### Track Usage by Tier

```sql
-- Plus tier weekly resets
SELECT 
  id,
  tier,
  weekly_analysis_used,
  weekly_analysis_reset_at
FROM user_profiles
WHERE tier = 'plus'
ORDER BY weekly_analysis_reset_at DESC;
```

## 🐛 Troubleshooting

### Issue: Edge Function Not Found

**Solution:**
```bash
# Verify deployment
supabase functions list

# Redeploy
supabase functions deploy generate-analyses

# Check logs for errors
# Supabase Dashboard → Edge Functions → Logs
```

### Issue: OpenAI API Key Error

**Solution:**
1. Verify key in .env.local: `OPENAI_API_KEY=sk-proj-...`
2. Set in Supabase Dashboard → Edge Functions → Configuration
3. Restart Edge Function (redeploy)

### Issue: Cron Job Not Running

**Solution:**
1. Check Supabase Dashboard → Database → Cron Jobs
2. Verify status: "Enabled" (toggle ON)
3. Verify schedule: `0 14 * * 3`
4. Verify timezone: UTC
5. Check logs for execution

### Issue: Analysis Not Generating

**Solution:**
```bash
# Test manually via API
npm run test:api-endpoint

# Check Edge Function logs
# Supabase Dashboard → Edge Functions → generate-analyses → Logs

# Verify OpenAI key is valid
# Try generating a small test prompt

# Check database connection in Edge Function
```

### Issue: Cache Not Working

**Solution:**
- Verify `ai_analyses` table has game_id index
- Check that second request uses same gameId
- Verify browser cache is cleared (if testing UI)

## 📈 Performance Tips

1. **Rate Limiting:** Edge Function delays 1 second between API calls
2. **Batch Processing:** Cron job processes all games at once
3. **Caching:** Analyses stored in database, reused if exists
4. **Indexing:** game_id indexed on ai_analyses table

## 🔒 Security Checklist

- [ ] OpenAI API key never committed to git
- [ ] Key stored in Supabase Dashboard (not .env)
- [ ] API endpoint requires authentication
- [ ] Tier validation prevents unauthorized access
- [ ] Rate limiting prevents abuse
- [ ] Webhook idempotency (for future webhook integration)

## 📊 Production Deployment

### Pre-Production

1. ✅ Tested locally with seeded data
2. ✅ Edge Function deployed and verified
3. ✅ Cron job configured for weekly execution
4. ✅ Tier gating enforced
5. ✅ Rate limiting implemented
6. ✅ Error handling tested

### Post-Deployment

1. Monitor Edge Function logs for 24 hours
2. Check analysis quality from first run
3. Verify tier gating in production
4. Monitor API response times
5. Adjust prompts if needed

### Monitoring Script

```bash
# Check system health
npm run setup:ai-analysis

# Test API endpoint
npm run test:api-endpoint

# Monitor logs (run periodically)
supabase functions logs generate-analyses
```

## 📞 Support

**Issue:** Contact Supabase Support
- Dashboard: https://supabase.com/dashboard/support
- Docs: https://supabase.com/docs/guides/functions

**Issue:** OpenAI API errors
- Docs: https://platform.openai.com/docs/api-reference
- Status: https://status.openai.com

## 📖 Documentation

- **FEATURES.md** - Feature overview and architecture
- **DEPLOYMENT.md** - This file, deployment steps
- **AI Analysis Component** - `components/games/GameDetailView.tsx`
- **API Endpoint** - `app/api/generate-analysis/route.ts`
- **Edge Function** - `supabase/functions/generate-analyses/index.ts`

---

**Deployment Status:** ✅ Ready for Production

**Last Updated:** October 22, 2025
