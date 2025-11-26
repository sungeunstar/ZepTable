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
        }
        Insert: {
          id?: string
          title: string
          total_members: number
          created_at?: string
          voting_active?: boolean
        }
        Update: {
          id?: string
          title?: string
          total_members?: number
          created_at?: string
          voting_active?: boolean
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
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          name: string
          image_url?: string | null
          category: string
          description?: string | null
          keywords: string[]
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          name?: string
          image_url?: string | null
          category?: string
          description?: string | null
          keywords?: string[]
          created_at?: string
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
    }
  }
}
