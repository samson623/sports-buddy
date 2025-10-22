# Sports Buddy Features

## Task 11: AI Pre-Game Analysis

### Overview
Sports Buddy generates expert AI-powered pre-game analysis for every NFL game using OpenAI GPT-4o mini. The analysis is tier-gated:
- **Free Tier**: Shows upgrade banner
- **Plus Tier**: 1 analysis per week, can generate on-demand
- **Pro Tier**: Unlimited analyses

### Architecture

#### 1. Weekly Automated Generation
**Edge Function**: `supabase/functions/generate-analyses/index.ts`

Runs on Supabase schedule (Wednesday 6 AM ET):
```bash
# Cron: 0 14 * * 3 (14:00 UTC = 9 AM ET, adjusted for daylight saving)
```

Process:
1. Fetches all games for current week
2. For each game, retrieves:
   - Team information
   - Injury report
   - Current odds/spreads
3. Constructs expert prompt
4. Calls OpenAI GPT-4o mini (500 token limit)
5. Stores in `ai_analyses` table
6. Includes rate limiting (1 second between API calls)

#### 2. On-Demand Generation
**API Endpoint**: `POST /api/generate-analysis`

Requires authentication and checks:
- **Free Tier**: Returns 403 "Upgrade to Plus or Pro"
- **Plus Tier**: 
  - Checks weekly usage (max 1 per week)
  - Auto-resets weekly on Monday
  - Returns 429 if limit exceeded
- **Pro Tier**: Unlimited generations

Response includes:
- `analysis`: Full markdown text
- `tokenCount`: Tokens used
- `cached`: Whether result was fetched from cache

#### 3. Game Detail Display
**Page**: `app/games/[id]/page.tsx`
**Component**: `components/games/GameDetailView.tsx`

Displays:
- Team matchup with logos
- Game info (week, season, venue, kickoff)
- Betting lines (spread, moneyline, total)
- Injuries report with severity badges
- AI analysis (tier-gated):
  - Plus/Pro: Shows markdown-rendered analysis with timestamp
  - Free: Shows blue upgrade banner linking to pricing
- Generate button for Plus/Pro users (if no analysis exists)

### Database Schema

#### ai_analyses Table
```sql
CREATE TABLE ai_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id),
  content TEXT NOT NULL,
  generated_at TIMESTAMP DEFAULT NOW(),
  token_count INT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX ai_analyses_game_id_idx ON ai_analyses(game_id);
```

#### user_profiles Updates
```sql
ALTER TABLE user_profiles ADD COLUMN (
  weekly_analysis_used INT DEFAULT 0,
  weekly_analysis_reset_at TIMESTAMP DEFAULT NOW()
);
```

### Setup Instructions

#### 1. Deploy Edge Function
```bash
# Login to Supabase CLI
supabase login

# Deploy function
supabase functions deploy generate-analyses
```

#### 2. Set OpenAI API Key
In Supabase dashboard:
```
Edge Functions > generate-analyses > Configuration
  OPENAI_API_KEY: your-key-here
```

#### 3. Setup Cron Job
In Supabase dashboard:
```
Database > Cron Jobs > New Job

Name: generate_analyses_weekly
Function: generate-analyses
Schedule: 0 14 * * 3  (Wednesday 2 PM UTC = 9 AM ET)
Timezone: UTC
```

#### 4. Verify Installation
```bash
# Test endpoint (requires auth token)
curl -X POST http://localhost:3000/api/generate-analysis \
  -H "Content-Type: application/json" \
  -d '{"gameId": "your-game-id"}'
```

### Prompt Engineering

**System Message**:
```
You are an expert NFL analyst with 20 years of experience.
Write compelling, accurate pre-game analysis.
```

**User Prompt Structure**:
1. Game identification (teams, week, season)
2. Injury context
3. Betting lines
4. Analysis focus areas:
   - Key Matchup: Critical battle determining outcome
   - Injury Impact: Effect on team strength
   - Favorite Rationale: Why favorite is favored
   - Prediction: Pick with reasoning

**Parameters**:
- Model: gpt-4o-mini
- Temperature: 0.7 (balanced, creative)
- Max Tokens: 500
- Response Format: Markdown

### Tier Pricing

| Feature | Free | Plus | Pro |
|---------|------|------|-----|
| View AI Analysis | ✗ | ✓ | ✓ |
| Weekly Limit | N/A | 1 | ∞ |
| Auto-Generated | ✗ | ✓ | ✓ |
| On-Demand | ✗ | ✓ | ✓ |
| Price | Free | $4.99/mo | $9.99/mo |

### Error Handling

| Scenario | Response |
|----------|----------|
| User not authenticated | 401 Unauthorized |
| Free tier user | 403 Upgrade to Plus or Pro |
| Plus limit exceeded | 429 Weekly limit reached |
| Game not found | 404 Game not found |
| OpenAI API error | 500 + error message |
| Missing credentials | 500 Missing OpenAI API key |

### Performance Optimization

1. **Caching**: Analysis stored in database, returned on subsequent requests
2. **Rate Limiting**: 1 second delay between OpenAI API calls (avoid rate limiting)
3. **Batch Processing**: Weekly edge function processes all games at once
4. **Indexed Queries**: `game_id` indexed on `ai_analyses` for fast lookups

### Future Enhancements

1. **Advanced Prompting**:
   - Include team stats and historical matchups
   - Factor in rest days and travel
   - Seasonal trends and momentum

2. **Model Options**:
   - Switch to GPT-4 for higher quality (with Pro tier)
   - Fine-tune model on NFL data

3. **Analysis Variations**:
   - Short summary (100 words)
   - Deep dive (1000 words)
   - Bullet-point quick take

4. **Distribution**:
   - Email summaries on game day
   - In-app notifications
   - Slack integration

5. **Betting Integration**:
   - AI prediction vs. line comparison
   - Value detection (sharp picks)
   - Bankroll management

### Monitoring

Check Supabase logs for:
```
Edge Functions > generate-analyses > Logs
- Successful analyses count
- Failed games
- API call latency
- Token usage
```

### Testing

```bash
# Test with seeded game
curl -X POST http://localhost:3000/api/generate-analysis \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{"gameId": "<game-from-seed>"}'

# Response should include analysis markdown
```
