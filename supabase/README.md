# Database Schema Documentation

## Overview

This directory contains the Supabase database schema and migrations for the Sports Buddy application.

## Schema Structure

### Tables

#### `user_profiles`
User profile information including subscription tier and quotas.

**Columns:**
- `id` (UUID, PK) - References auth.users
- `display_name` (TEXT) - User's display name
- `favorite_team_id` (UUID) - References teams table
- `tier` (TEXT) - Subscription tier: 'free', 'plus', or 'pro'
- `stripe_customer_id` (TEXT) - Stripe customer ID
- `stripe_subscription_id` (TEXT) - Stripe subscription ID
- `qna_quota_used` (INT) - Number of Q&A queries used
- `qna_quota_reset_at` (TIMESTAMPTZ) - When quota resets
- `created_at`, `updated_at` (TIMESTAMPTZ)

**RLS Policies:**
- Users can only read/update their own profile (auth.uid() = id)

#### `teams`
Sports teams information.

**Columns:**
- `id` (UUID, PK)
- `sport` (TEXT) - Default: 'nfl'
- `abbreviation` (TEXT, UNIQUE) - Team abbreviation
- `full_name` (TEXT) - Full team name
- `city` (TEXT) - Team city
- `conference` (TEXT) - Conference (AFC/NFC)
- `division` (TEXT) - Division
- `logo_url` (TEXT) - Team logo URL
- `created_at`, `updated_at` (TIMESTAMPTZ)

**RLS Policies:**
- Public read access

#### `players`
Player roster information.

**Columns:**
- `id` (UUID, PK)
- `team_id` (UUID) - References teams
- `first_name` (TEXT)
- `last_name` (TEXT)
- `position` (TEXT) - Player position
- `jersey_number` (INT)
- `status` (TEXT) - 'active', 'inactive', 'injured', 'suspended', 'retired'
- `created_at`, `updated_at` (TIMESTAMPTZ)

**RLS Policies:**
- Public read access

**Indexes:**
- `idx_players_team_id` on team_id

#### `games`
Game schedule and results.

**Columns:**
- `id` (UUID, PK)
- `season` (INT) - Season year
- `week` (INT) - Week number
- `home_team_id` (UUID) - References teams
- `away_team_id` (UUID) - References teams
- `kickoff_utc` (TIMESTAMPTZ) - Game start time
- `venue` (TEXT) - Stadium/venue name
- `status` (TEXT) - 'scheduled', 'in_progress', 'completed', 'postponed', 'cancelled'
- `home_score`, `away_score` (INT) - Final scores
- `created_at`, `updated_at` (TIMESTAMPTZ)

**RLS Policies:**
- Public read access

**Indexes:**
- `idx_games_season_week` on (season, week)
- `idx_games_kickoff` on kickoff_utc

#### `injuries`
Player injury reports.

**Columns:**
- `id` (UUID, PK)
- `player_id` (UUID) - References players
- `game_id` (UUID) - References games
- `injury_status` (TEXT) - 'out', 'doubtful', 'questionable', 'probable'
- `body_part` (TEXT) - Injured body part
- `description` (TEXT) - Injury description
- `reported_at` (TIMESTAMPTZ) - When injury was reported
- `created_at`, `updated_at` (TIMESTAMPTZ)

**RLS Policies:**
- Public read access

**Indexes:**
- `idx_injuries_player_id` on player_id

#### `depth_chart`
Team depth chart positions.

**Columns:**
- `id` (UUID, PK)
- `team_id` (UUID) - References teams
- `player_id` (UUID) - References players
- `position` (TEXT) - Position on depth chart
- `rank` (INT) - Ranking within position (1 = starter)
- `valid_from` (TIMESTAMPTZ) - When this depth chart entry became valid
- `valid_to` (TIMESTAMPTZ) - When this depth chart entry expired
- `created_at`, `updated_at` (TIMESTAMPTZ)

**RLS Policies:**
- Public read access

**Indexes:**
- `idx_depth_chart_team_position_rank` on (team_id, position, rank)

#### `odds`
Betting odds from various bookmakers.

**Columns:**
- `id` (UUID, PK)
- `game_id` (UUID) - References games
- `bookmaker` (TEXT) - Bookmaker name
- `spread` (DECIMAL) - Point spread
- `moneyline_home` (INT) - Home team moneyline
- `moneyline_away` (INT) - Away team moneyline
- `total` (DECIMAL) - Over/under total
- `retrieved_at` (TIMESTAMPTZ) - When odds were retrieved
- `created_at`, `updated_at` (TIMESTAMPTZ)

**RLS Policies:**
- Public read access

**Indexes:**
- `idx_odds_game_id` on game_id

#### `qa_logs`
User question and answer logs for AI interactions.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID) - References auth.users
- `question` (TEXT) - User's question
- `answer` (TEXT) - AI's answer
- `input_tokens` (INT) - Number of input tokens
- `output_tokens` (INT) - Number of output tokens
- `routed_to_db` (BOOLEAN) - Whether query was routed to database
- `created_at` (TIMESTAMPTZ)

**RLS Policies:**
- Users can only view their own logs (auth.uid() = user_id)

**Indexes:**
- `idx_qa_logs_user_created` on (user_id, created_at DESC)

#### `ai_analyses`
AI-generated game analyses for premium users.

**Columns:**
- `id` (UUID, PK)
- `game_id` (UUID) - References games
- `content` (TEXT) - AI-generated analysis content
- `generated_at` (TIMESTAMPTZ) - When analysis was generated
- `token_count` (INT) - Number of tokens used
- `created_at` (TIMESTAMPTZ)

**RLS Policies:**
- Only Plus/Pro users can read (checks user_profiles.tier IN ('plus', 'pro'))

**Indexes:**
- `idx_ai_analyses_game_id` on game_id

## Triggers

### `update_updated_at_column`
Automatically updates the `updated_at` timestamp on UPDATE operations for:
- user_profiles
- teams
- players
- games
- injuries
- depth_chart
- odds

### `handle_new_user`
Automatically creates a user profile in `user_profiles` when a new user signs up via Supabase Auth.

## Running Migrations

### Using Supabase CLI

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Link to your Supabase project:
```bash
supabase link --project-ref your-project-ref
```

3. Push migrations:
```bash
supabase db push
```

### Manual Application

You can also apply the migration manually by:
1. Opening the Supabase Dashboard
2. Going to SQL Editor
3. Copying and pasting the contents of `migrations/20251019_initial_schema.sql`
4. Running the query

## TypeScript Types

TypeScript types are automatically generated in `/types/database.ts` and include:

- Full `Database` type with all tables, views, functions, and enums
- Helper types for each table (e.g., `UserProfile`, `Team`, `Player`)
- Insert and Update types for each table
- Enum types for constrained fields

## Usage Examples

### Server Component
```typescript
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()
  const { data: teams } = await supabase.from('teams').select('*')
  return <div>{/* render teams */}</div>
}
```

### Client Component
```typescript
'use client'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function Component() {
  const [teams, setTeams] = useState([])
  const supabase = createClient()
  
  useEffect(() => {
    supabase.from('teams').select('*').then(({ data }) => setTeams(data))
  }, [])
  
  return <div>{/* render teams */}</div>
}
```

## Security Notes

- All tables have Row Level Security (RLS) enabled
- Public tables (teams, players, games, etc.) are readable by anyone
- User-specific data (user_profiles, qa_logs) can only be accessed by the owning user
- Premium content (ai_analyses) requires Plus or Pro tier subscription
- Always use the provided Supabase client helpers to ensure RLS policies are enforced

