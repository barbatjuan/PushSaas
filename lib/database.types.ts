export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          // Current auth linkage (Supabase Auth user id)
          supabase_user_id: string
          email: string
          name: string | null
          role: 'user' | 'admin'
          plan: 'free' | 'paid'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          // Required: Supabase Auth user id
          supabase_user_id: string
          email: string
          name?: string | null
          role?: 'user' | 'admin'
          plan?: 'free' | 'paid'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          // Current auth linkage (Supabase Auth user id)
          supabase_user_id?: string
          email?: string
          name?: string | null
          role?: 'user' | 'admin'
          plan?: 'free' | 'paid'
          created_at?: string
          updated_at?: string
        }
      }
      sites: {
        Row: {
          id: string
          user_id: string
          name: string
          url: string
          site_id: string
          onesignal_app_id: string | null
          logo_url: string | null
          status: 'active' | 'suspended'
          expires_at: string | null
          subscriber_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          url: string
          site_id: string
          onesignal_app_id?: string | null
          logo_url?: string | null
          status?: 'active' | 'suspended'
          expires_at?: string | null
          subscriber_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          url?: string
          site_id?: string
          onesignal_app_id?: string | null
          logo_url?: string | null
          status?: 'active' | 'suspended'
          expires_at?: string | null
          subscriber_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      subscribers: {
        Row: {
          id: string
          site_id: string
          token: string
          user_agent: string | null
          ip_address: string | null
          subscribed_at: string
          last_seen: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          site_id: string
          token: string
          user_agent?: string | null
          ip_address?: string | null
          subscribed_at?: string
          last_seen?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          site_id?: string
          token?: string
          user_agent?: string | null
          ip_address?: string | null
          subscribed_at?: string
          last_seen?: string | null
          is_active?: boolean
        }
      }
      notifications: {
        Row: {
          id: string
          site_id: string
          title: string
          message: string
          url: string | null
          sent_count: number
          delivered_count: number
          clicked_count: number
          onesignal_notification_id: string | null
          status: 'pending' | 'sent' | 'failed'
          sent_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          site_id: string
          title: string
          message: string
          url?: string | null
          sent_count?: number
          delivered_count?: number
          clicked_count?: number
          onesignal_notification_id?: string | null
          status?: 'pending' | 'sent' | 'failed'
          sent_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          site_id?: string
          title?: string
          message?: string
          url?: string | null
          sent_count?: number
          delivered_count?: number
          clicked_count?: number
          onesignal_notification_id?: string | null
          status?: 'pending' | 'sent' | 'failed'
          sent_at?: string | null
          created_at?: string
        }
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
