import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          session_id: string
          name: string
          selected_keywords: string[]
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          name: string
          selected_keywords: string[]
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          name?: string
          selected_keywords?: string[]
          created_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          title: string
          total_members: number
          created_at: string
          voting_active: boolean
          voting_phase: string
          creator_name: string | null
          keyword_voting_active: boolean
          restaurant_voting_active: boolean
          description: string | null
        }
        Insert: {
          id?: string
          title: string
          total_members: number
          created_at?: string
          voting_active?: boolean
          voting_phase?: string
          creator_name?: string | null
          keyword_voting_active?: boolean
          restaurant_voting_active?: boolean
          description?: string | null
        }
        Update: {
          id?: string
          title?: string
          total_members?: number
          created_at?: string
          voting_active?: boolean
          voting_phase?: string
          creator_name?: string | null
          keyword_voting_active?: boolean
          restaurant_voting_active?: boolean
          description?: string | null
        }
      }
      participants: {
        Row: {
          id: string
          session_id: string
          name: string
          joined: boolean
          voted_keywords: boolean
          voted_restaurant: boolean
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          name: string
          joined?: boolean
          voted_keywords?: boolean
          voted_restaurant?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          name?: string
          joined?: boolean
          voted_keywords?: boolean
          voted_restaurant?: boolean
          created_at?: string
        }
      }
      session_keywords: {
        Row: {
          id: string
          session_id: string
          keyword: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          keyword: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          keyword?: string
          created_at?: string
        }
      }
      keywords: {
        Row: {
          id: string
          label: string
          category: string
        }
        Insert: {
          id?: string
          label: string
          category: string
        }
        Update: {
          id?: string
          label?: string
          category?: string
        }
      }
      places: {
        Row: {
          id: string
          session_id: string
          name: string
          image_url: string | null
          category: string
          description: string | null
          keywords: string[]
          tags: string[]
          created_at: string
          link: string | null
          price_range: string | null
          is_suggestion: boolean
          suggested_by: string | null
        }
        Insert: {
          id?: string
          session_id: string
          name: string
          image_url?: string | null
          category: string
          description?: string | null
          keywords?: string[]
          tags?: string[]
          created_at?: string
          link?: string | null
          price_range?: string | null
          is_suggestion?: boolean
          suggested_by?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          name?: string
          image_url?: string | null
          category?: string
          description?: string | null
          keywords?: string[]
          tags?: string[]
          created_at?: string
          link?: string | null
          price_range?: string | null
          is_suggestion?: boolean
          suggested_by?: string | null
        }
      }
      votes: {
        Row: {
          id: string
          user_id: string
          place_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          place_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          place_id?: string
          created_at?: string
        }
      }
      keyword_votes: {
        Row: {
          id: string
          session_id: string
          user_id: string
          keyword: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          keyword: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string
          keyword?: string
          created_at?: string
        }
      }
    }
    Views: {
      keyword_results: {
        Row: {
          session_id: string
          keyword: string
          vote_count: number
          voters: string[]
        }
      }
      restaurant_results: {
        Row: {
          place_id: string
          session_id: string
          restaurant_name: string
          category: string
          tags: string[]
          link: string | null
          price_range: string | null
          is_suggestion: boolean
          vote_count: number
          voters: string[]
        }
      }
    }
  }
}

// Helper types for common operations
export type Participant = Database['public']['Tables']['participants']['Row']
export type SessionKeyword = Database['public']['Tables']['session_keywords']['Row']
export type KeywordVote = Database['public']['Tables']['keyword_votes']['Row']
export type Place = Database['public']['Tables']['places']['Row']
export type Vote = Database['public']['Tables']['votes']['Row']
export type Session = Database['public']['Tables']['sessions']['Row']
