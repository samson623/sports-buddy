export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          display_name: string | null
          favorite_team_id: string | null
          tier: 'free' | 'plus' | 'pro'
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          qna_quota_used: number
          qna_quota_reset_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          favorite_team_id?: string | null
          tier?: 'free' | 'plus' | 'pro'
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          qna_quota_used?: number
          qna_quota_reset_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          favorite_team_id?: string | null
          tier?: 'free' | 'plus' | 'pro'
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          qna_quota_used?: number
          qna_quota_reset_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_favorite_team_id_fkey"
            columns: ["favorite_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          }
        ]
      }
      teams: {
        Row: {
          id: string
          sport: string
          abbreviation: string
          full_name: string
          city: string | null
          conference: string | null
          division: string | null
          logo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sport?: string
          abbreviation: string
          full_name: string
          city?: string | null
          conference?: string | null
          division?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sport?: string
          abbreviation?: string
          full_name?: string
          city?: string | null
          conference?: string | null
          division?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      players: {
        Row: {
          id: string
          team_id: string | null
          first_name: string
          last_name: string
          position: string | null
          jersey_number: number | null
          status: 'active' | 'inactive' | 'injured' | 'suspended' | 'retired'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id?: string | null
          first_name: string
          last_name: string
          position?: string | null
          jersey_number?: number | null
          status?: 'active' | 'inactive' | 'injured' | 'suspended' | 'retired'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          team_id?: string | null
          first_name?: string
          last_name?: string
          position?: string | null
          jersey_number?: number | null
          status?: 'active' | 'inactive' | 'injured' | 'suspended' | 'retired'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          }
        ]
      }
      games: {
        Row: {
          id: string
          season: number
          week: number
          home_team_id: string | null
          away_team_id: string | null
          kickoff_utc: string | null
          venue: string | null
          status: 'scheduled' | 'in_progress' | 'completed' | 'postponed' | 'cancelled'
          home_score: number | null
          away_score: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          season: number
          week: number
          home_team_id?: string | null
          away_team_id?: string | null
          kickoff_utc?: string | null
          venue?: string | null
          status?: 'scheduled' | 'in_progress' | 'completed' | 'postponed' | 'cancelled'
          home_score?: number | null
          away_score?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          season?: number
          week?: number
          home_team_id?: string | null
          away_team_id?: string | null
          kickoff_utc?: string | null
          venue?: string | null
          status?: 'scheduled' | 'in_progress' | 'completed' | 'postponed' | 'cancelled'
          home_score?: number | null
          away_score?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "games_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          }
        ]
      }
      injuries: {
        Row: {
          id: string
          player_id: string | null
          game_id: string | null
          injury_status: 'out' | 'doubtful' | 'questionable' | 'probable' | null
          body_part: string | null
          description: string | null
          reported_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          player_id?: string | null
          game_id?: string | null
          injury_status?: 'out' | 'doubtful' | 'questionable' | 'probable' | null
          body_part?: string | null
          description?: string | null
          reported_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          player_id?: string | null
          game_id?: string | null
          injury_status?: 'out' | 'doubtful' | 'questionable' | 'probable' | null
          body_part?: string | null
          description?: string | null
          reported_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "injuries_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "injuries_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          }
        ]
      }
      depth_chart: {
        Row: {
          id: string
          team_id: string | null
          player_id: string | null
          position: string
          rank: number
          valid_from: string
          valid_to: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id?: string | null
          player_id?: string | null
          position: string
          rank: number
          valid_from?: string
          valid_to?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          team_id?: string | null
          player_id?: string | null
          position?: string
          rank?: number
          valid_from?: string
          valid_to?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "depth_chart_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "depth_chart_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          }
        ]
      }
      odds: {
        Row: {
          id: string
          game_id: string | null
          bookmaker: string
          spread: number | null
          moneyline_home: number | null
          moneyline_away: number | null
          total: number | null
          retrieved_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          game_id?: string | null
          bookmaker: string
          spread?: number | null
          moneyline_home?: number | null
          moneyline_away?: number | null
          total?: number | null
          retrieved_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          game_id?: string | null
          bookmaker?: string
          spread?: number | null
          moneyline_home?: number | null
          moneyline_away?: number | null
          total?: number | null
          retrieved_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "odds_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          }
        ]
      }
      qa_logs: {
        Row: {
          id: string
          user_id: string | null
          question: string
          answer: string | null
          input_tokens: number | null
          output_tokens: number | null
          routed_to_db: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          question: string
          answer?: string | null
          input_tokens?: number | null
          output_tokens?: number | null
          routed_to_db?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          question?: string
          answer?: string | null
          input_tokens?: number | null
          output_tokens?: number | null
          routed_to_db?: boolean
          created_at?: string
        }
        Relationships: []
      }
      ai_analyses: {
        Row: {
          id: string
          game_id: string | null
          content: string
          generated_at: string
          token_count: number | null
          created_at: string
        }
        Insert: {
          id?: string
          game_id?: string | null
          content: string
          generated_at?: string
          token_count?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          game_id?: string | null
          content?: string
          generated_at?: string
          token_count?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_analyses_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier usage
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert']
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update']

export type Team = Database['public']['Tables']['teams']['Row']
export type TeamInsert = Database['public']['Tables']['teams']['Insert']
export type TeamUpdate = Database['public']['Tables']['teams']['Update']

export type Player = Database['public']['Tables']['players']['Row']
export type PlayerInsert = Database['public']['Tables']['players']['Insert']
export type PlayerUpdate = Database['public']['Tables']['players']['Update']

export type Game = Database['public']['Tables']['games']['Row']
export type GameInsert = Database['public']['Tables']['games']['Insert']
export type GameUpdate = Database['public']['Tables']['games']['Update']

export type Injury = Database['public']['Tables']['injuries']['Row']
export type InjuryInsert = Database['public']['Tables']['injuries']['Insert']
export type InjuryUpdate = Database['public']['Tables']['injuries']['Update']

export type DepthChart = Database['public']['Tables']['depth_chart']['Row']
export type DepthChartInsert = Database['public']['Tables']['depth_chart']['Insert']
export type DepthChartUpdate = Database['public']['Tables']['depth_chart']['Update']

export type Odds = Database['public']['Tables']['odds']['Row']
export type OddsInsert = Database['public']['Tables']['odds']['Insert']
export type OddsUpdate = Database['public']['Tables']['odds']['Update']

export type QALog = Database['public']['Tables']['qa_logs']['Row']
export type QALogInsert = Database['public']['Tables']['qa_logs']['Insert']
export type QALogUpdate = Database['public']['Tables']['qa_logs']['Update']

export type AIAnalysis = Database['public']['Tables']['ai_analyses']['Row']
export type AIAnalysisInsert = Database['public']['Tables']['ai_analyses']['Insert']
export type AIAnalysisUpdate = Database['public']['Tables']['ai_analyses']['Update']

// Enum types
export type UserTier = 'free' | 'plus' | 'pro'
export type PlayerStatus = 'active' | 'inactive' | 'injured' | 'suspended' | 'retired'
export type GameStatus = 'scheduled' | 'in_progress' | 'completed' | 'postponed' | 'cancelled'
export type InjuryStatus = 'out' | 'doubtful' | 'questionable' | 'probable'

