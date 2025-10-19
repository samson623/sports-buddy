-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

-- Teams table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sport TEXT DEFAULT 'nfl',
    abbreviation TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    city TEXT,
    conference TEXT,
    division TEXT,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles table
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    favorite_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'plus', 'pro')),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    qna_quota_used INT DEFAULT 0,
    qna_quota_reset_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Players table
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    position TEXT,
    jersey_number INT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'injured', 'suspended', 'retired')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Games table
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    season INT NOT NULL,
    week INT NOT NULL,
    home_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    away_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    kickoff_utc TIMESTAMPTZ,
    venue TEXT,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'postponed', 'cancelled')),
    home_score INT,
    away_score INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Injuries table
CREATE TABLE injuries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    game_id UUID REFERENCES games(id) ON DELETE SET NULL,
    injury_status TEXT CHECK (injury_status IN ('out', 'doubtful', 'questionable', 'probable')),
    body_part TEXT,
    description TEXT,
    reported_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Depth chart table
CREATE TABLE depth_chart (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    position TEXT NOT NULL,
    rank INT NOT NULL,
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_to TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Odds table
CREATE TABLE odds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    bookmaker TEXT NOT NULL,
    spread DECIMAL(5,2),
    moneyline_home INT,
    moneyline_away INT,
    total DECIMAL(5,2),
    retrieved_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- QA logs table
CREATE TABLE qa_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT,
    input_tokens INT,
    output_tokens INT,
    routed_to_db BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI analyses table
CREATE TABLE ai_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    token_count INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_games_season_week ON games(season, week);
CREATE INDEX idx_players_team_id ON players(team_id);
CREATE INDEX idx_injuries_player_id ON injuries(player_id);
CREATE INDEX idx_depth_chart_team_position_rank ON depth_chart(team_id, position, rank);
CREATE INDEX idx_qa_logs_user_created ON qa_logs(user_id, created_at DESC);
CREATE INDEX idx_games_kickoff ON games(kickoff_utc);
CREATE INDEX idx_odds_game_id ON odds(game_id);
CREATE INDEX idx_ai_analyses_game_id ON ai_analyses(game_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE injuries ENABLE ROW LEVEL SECURITY;
ALTER TABLE depth_chart ENABLE ROW LEVEL SECURITY;
ALTER TABLE odds ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view their own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON user_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Teams policies (public read)
CREATE POLICY "Teams are publicly readable"
    ON teams FOR SELECT
    USING (true);

-- Players policies (public read)
CREATE POLICY "Players are publicly readable"
    ON players FOR SELECT
    USING (true);

-- Games policies (public read)
CREATE POLICY "Games are publicly readable"
    ON games FOR SELECT
    USING (true);

-- Injuries policies (public read)
CREATE POLICY "Injuries are publicly readable"
    ON injuries FOR SELECT
    USING (true);

-- Depth chart policies (public read)
CREATE POLICY "Depth chart is publicly readable"
    ON depth_chart FOR SELECT
    USING (true);

-- Odds policies (public read)
CREATE POLICY "Odds are publicly readable"
    ON odds FOR SELECT
    USING (true);

-- QA logs policies (users can only view their own)
CREATE POLICY "Users can view their own QA logs"
    ON qa_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own QA logs"
    ON qa_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- AI analyses policies (only Plus/Pro users can read)
CREATE POLICY "Plus and Pro users can view AI analyses"
    ON ai_analyses FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.tier IN ('plus', 'pro')
        )
    );

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at
    BEFORE UPDATE ON players
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_games_updated_at
    BEFORE UPDATE ON games
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_injuries_updated_at
    BEFORE UPDATE ON injuries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_depth_chart_updated_at
    BEFORE UPDATE ON depth_chart
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_odds_updated_at
    BEFORE UPDATE ON odds
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, display_name, tier)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name', 'free');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE user_profiles IS 'User profile information including subscription tier and quotas';
COMMENT ON TABLE teams IS 'Sports teams information';
COMMENT ON TABLE players IS 'Player roster information';
COMMENT ON TABLE games IS 'Game schedule and results';
COMMENT ON TABLE injuries IS 'Player injury reports';
COMMENT ON TABLE depth_chart IS 'Team depth chart positions';
COMMENT ON TABLE odds IS 'Betting odds from various bookmakers';
COMMENT ON TABLE qa_logs IS 'User question and answer logs for AI interactions';
COMMENT ON TABLE ai_analyses IS 'AI-generated game analyses for premium users';

