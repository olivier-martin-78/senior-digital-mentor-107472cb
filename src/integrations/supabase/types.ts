export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          activity_date: string | null
          activity_type: string
          audio_url: string | null
          created_at: string
          created_by: string
          id: string
          iframe_code: string | null
          link: string
          shared_globally: boolean | null
          sub_activity_tag_id: string | null
          thumbnail_url: string | null
          title: string
        }
        Insert: {
          activity_date?: string | null
          activity_type: string
          audio_url?: string | null
          created_at?: string
          created_by: string
          id?: string
          iframe_code?: string | null
          link: string
          shared_globally?: boolean | null
          sub_activity_tag_id?: string | null
          thumbnail_url?: string | null
          title: string
        }
        Update: {
          activity_date?: string | null
          activity_type?: string
          audio_url?: string | null
          created_at?: string
          created_by?: string
          id?: string
          iframe_code?: string | null
          link?: string
          shared_globally?: boolean | null
          sub_activity_tag_id?: string | null
          thumbnail_url?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_sub_activity_tag_id_fkey"
            columns: ["sub_activity_tag_id"]
            isOneToOne: false
            referencedRelation: "activity_sub_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_sub_tags: {
        Row: {
          activity_type: string
          created_at: string
          created_by: string
          id: string
          name: string
        }
        Insert: {
          activity_type?: string
          created_at?: string
          created_by: string
          id?: string
          name: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          created_by?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          client_id: string
          created_at: string
          email_sent: boolean | null
          end_time: string
          id: string
          intervenant_id: string | null
          intervention_report_id: string | null
          is_recurring: boolean | null
          notes: string | null
          parent_appointment_id: string | null
          professional_id: string
          recurrence_end_date: string | null
          recurrence_type: string | null
          start_time: string
          status: string | null
          updated_at: string
          updated_by_professional_id: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          email_sent?: boolean | null
          end_time: string
          id?: string
          intervenant_id?: string | null
          intervention_report_id?: string | null
          is_recurring?: boolean | null
          notes?: string | null
          parent_appointment_id?: string | null
          professional_id: string
          recurrence_end_date?: string | null
          recurrence_type?: string | null
          start_time: string
          status?: string | null
          updated_at?: string
          updated_by_professional_id?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          email_sent?: boolean | null
          end_time?: string
          id?: string
          intervenant_id?: string | null
          intervention_report_id?: string | null
          is_recurring?: boolean | null
          notes?: string | null
          parent_appointment_id?: string | null
          professional_id?: string
          recurrence_end_date?: string | null
          recurrence_type?: string | null
          start_time?: string
          status?: string | null
          updated_at?: string
          updated_by_professional_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_intervenant_id_fkey"
            columns: ["intervenant_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_intervention_report_id_fkey"
            columns: ["intervention_report_id"]
            isOneToOne: false
            referencedRelation: "intervention_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_parent_appointment_id_fkey"
            columns: ["parent_appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_albums: {
        Row: {
          author_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          thumbnail_url: string | null
        }
        Insert: {
          author_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          thumbnail_url?: string | null
        }
        Update: {
          author_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          thumbnail_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_albums_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_categories: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      blog_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_media: {
        Row: {
          created_at: string
          id: string
          media_type: string
          media_url: string
          post_id: string
          thumbnail_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          media_type: string
          media_url: string
          post_id: string
          thumbnail_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          media_type?: string
          media_url?: string
          post_id?: string
          thumbnail_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_media_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          album_id: string | null
          author_id: string
          content: string
          cover_image: string | null
          created_at: string
          email_notification_requested: boolean | null
          email_notification_sent: boolean | null
          id: string
          published: boolean | null
          shared_globally: boolean | null
          title: string
          updated_at: string
        }
        Insert: {
          album_id?: string | null
          author_id: string
          content: string
          cover_image?: string | null
          created_at?: string
          email_notification_requested?: boolean | null
          email_notification_sent?: boolean | null
          id?: string
          published?: boolean | null
          shared_globally?: boolean | null
          title: string
          updated_at?: string
        }
        Update: {
          album_id?: string | null
          author_id?: string
          content?: string
          cover_image?: string | null
          created_at?: string
          email_notification_requested?: boolean | null
          email_notification_sent?: boolean | null
          id?: string
          published?: boolean | null
          shared_globally?: boolean | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "blog_albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      caregiver_messages: {
        Row: {
          author_id: string
          client_id: string
          created_at: string | null
          id: string
          message: string
          notification_sent: boolean | null
          notification_sent_at: string | null
          updated_at: string | null
        }
        Insert: {
          author_id: string
          client_id: string
          created_at?: string | null
          id?: string
          message: string
          notification_sent?: boolean | null
          notification_sent_at?: string | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          client_id?: string
          created_at?: string | null
          id?: string
          message?: string
          notification_sent?: boolean | null
          notification_sent_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "caregiver_messages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      caregivers: {
        Row: {
          address: string | null
          client_id: string
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_name: string
          phone: string | null
          relationship_type: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          client_id: string
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          phone?: string | null
          relationship_type: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          client_id?: string
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          relationship_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "caregivers_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string
          city: string | null
          color: string | null
          comment: string | null
          created_at: string
          created_by: string
          email: string | null
          first_name: string
          hourly_rate: number | null
          id: string
          inactive: boolean
          last_name: string
          phone: string | null
          postal_code: string | null
          updated_at: string
        }
        Insert: {
          address: string
          city?: string | null
          color?: string | null
          comment?: string | null
          created_at?: string
          created_by: string
          email?: string | null
          first_name: string
          hourly_rate?: number | null
          id?: string
          inactive?: boolean
          last_name: string
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          city?: string | null
          color?: string | null
          comment?: string | null
          created_at?: string
          created_by?: string
          email?: string | null
          first_name?: string
          hourly_rate?: number | null
          id?: string
          inactive?: boolean
          last_name?: string
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      diary_entries: {
        Row: {
          activities: string | null
          contacted_people: string[] | null
          created_at: string | null
          desire_of_day: string | null
          email_notification_requested: boolean | null
          email_notification_sent: boolean | null
          entry_date: string
          id: string
          is_private_notes_locked: boolean | null
          media_type: string | null
          media_url: string | null
          mental_state: string | null
          mood_rating: number | null
          negative_things: string | null
          objectives: string | null
          physical_state: string | null
          positive_things: string | null
          private_notes: string | null
          reflections: string | null
          shared_globally: boolean | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
          what_learned_today: string | null
        }
        Insert: {
          activities?: string | null
          contacted_people?: string[] | null
          created_at?: string | null
          desire_of_day?: string | null
          email_notification_requested?: boolean | null
          email_notification_sent?: boolean | null
          entry_date?: string
          id?: string
          is_private_notes_locked?: boolean | null
          media_type?: string | null
          media_url?: string | null
          mental_state?: string | null
          mood_rating?: number | null
          negative_things?: string | null
          objectives?: string | null
          physical_state?: string | null
          positive_things?: string | null
          private_notes?: string | null
          reflections?: string | null
          shared_globally?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
          what_learned_today?: string | null
        }
        Update: {
          activities?: string | null
          contacted_people?: string[] | null
          created_at?: string | null
          desire_of_day?: string | null
          email_notification_requested?: boolean | null
          email_notification_sent?: boolean | null
          entry_date?: string
          id?: string
          is_private_notes_locked?: boolean | null
          media_type?: string | null
          media_url?: string | null
          mental_state?: string | null
          mood_rating?: number | null
          negative_things?: string | null
          objectives?: string | null
          physical_state?: string | null
          positive_things?: string | null
          private_notes?: string | null
          reflections?: string | null
          shared_globally?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
          what_learned_today?: string | null
        }
        Relationships: []
      }
      game_franglais: {
        Row: {
          Anglais: string
          Francais: string
          id: string
        }
        Insert: {
          Anglais: string
          Francais: string
          id?: string
        }
        Update: {
          Anglais?: string
          Francais?: string
          id?: string
        }
        Relationships: []
      }
      group_invitation: {
        Row: {
          confirmation_date: string | null
          created_at: string
          email: string
          group_id: string
          id: string
          invitation_date: string
          invited_user_id: string | null
          inviter_id: string
          status: string
          updated_at: string
        }
        Insert: {
          confirmation_date?: string | null
          created_at?: string
          email: string
          group_id: string
          id?: string
          invitation_date?: string
          invited_user_id?: string | null
          inviter_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          confirmation_date?: string | null
          created_at?: string
          email?: string
          group_id?: string
          id?: string
          invitation_date?: string
          invited_user_id?: string | null
          inviter_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_invitation_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "invitation_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          added_at: string
          group_id: string
          id: string
          role: string | null
          user_id: string
        }
        Insert: {
          added_at?: string
          group_id: string
          id?: string
          role?: string | null
          user_id: string
        }
        Update: {
          added_at?: string
          group_id?: string
          id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "invitation_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      intervenants: {
        Row: {
          active: boolean
          created_at: string
          created_by: string
          email: string | null
          first_name: string
          id: string
          last_name: string
          phone: string | null
          speciality: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by: string
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          phone?: string | null
          speciality?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          speciality?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      intervention_reports: {
        Row: {
          activities: string[] | null
          activities_other: string | null
          appetite: string | null
          appetite_comments: string | null
          appointment_id: string | null
          audio_url: string | null
          auxiliary_name: string
          client_comments: string | null
          client_rating: number | null
          created_at: string
          date: string
          email_notification_sent: boolean | null
          end_time: string
          follow_up: string[] | null
          follow_up_other: string | null
          hourly_rate: number | null
          hydration: string | null
          hygiene: string[] | null
          hygiene_comments: string | null
          id: string
          media_files: Json | null
          mental_state: string[] | null
          mental_state_change: string | null
          observations: string | null
          pain_location: string | null
          patient_name: string
          physical_state: string[] | null
          physical_state_other: string | null
          professional_id: string
          start_time: string
          updated_at: string
        }
        Insert: {
          activities?: string[] | null
          activities_other?: string | null
          appetite?: string | null
          appetite_comments?: string | null
          appointment_id?: string | null
          audio_url?: string | null
          auxiliary_name: string
          client_comments?: string | null
          client_rating?: number | null
          created_at?: string
          date: string
          email_notification_sent?: boolean | null
          end_time: string
          follow_up?: string[] | null
          follow_up_other?: string | null
          hourly_rate?: number | null
          hydration?: string | null
          hygiene?: string[] | null
          hygiene_comments?: string | null
          id?: string
          media_files?: Json | null
          mental_state?: string[] | null
          mental_state_change?: string | null
          observations?: string | null
          pain_location?: string | null
          patient_name: string
          physical_state?: string[] | null
          physical_state_other?: string | null
          professional_id: string
          start_time: string
          updated_at?: string
        }
        Update: {
          activities?: string[] | null
          activities_other?: string | null
          appetite?: string | null
          appetite_comments?: string | null
          appointment_id?: string | null
          audio_url?: string | null
          auxiliary_name?: string
          client_comments?: string | null
          client_rating?: number | null
          created_at?: string
          date?: string
          email_notification_sent?: boolean | null
          end_time?: string
          follow_up?: string[] | null
          follow_up_other?: string | null
          hourly_rate?: number | null
          hydration?: string | null
          hygiene?: string[] | null
          hygiene_comments?: string | null
          id?: string
          media_files?: Json | null
          mental_state?: string[] | null
          mental_state_change?: string | null
          observations?: string | null
          pain_location?: string | null
          patient_name?: string
          physical_state?: string[] | null
          physical_state_other?: string | null
          professional_id?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "intervention_reports_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      invitation_groups: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      invitations: {
        Row: {
          blog_access: boolean | null
          created_at: string
          diary_access: boolean | null
          email: string
          expires_at: string
          first_name: string
          group_id: string | null
          id: string
          invited_by: string
          last_name: string
          life_story_access: boolean | null
          token: string
          used_at: string | null
          wishes_access: boolean | null
        }
        Insert: {
          blog_access?: boolean | null
          created_at?: string
          diary_access?: boolean | null
          email: string
          expires_at?: string
          first_name: string
          group_id?: string | null
          id?: string
          invited_by: string
          last_name: string
          life_story_access?: boolean | null
          token: string
          used_at?: string | null
          wishes_access?: boolean | null
        }
        Update: {
          blog_access?: boolean | null
          created_at?: string
          diary_access?: boolean | null
          email?: string
          expires_at?: string
          first_name?: string
          group_id?: string | null
          id?: string
          invited_by?: string
          last_name?: string
          life_story_access?: boolean | null
          token?: string
          used_at?: string | null
          wishes_access?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "invitations_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "invitation_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      life_stories: {
        Row: {
          chapters: Json
          created_at: string
          id: string
          last_edited_chapter: string | null
          last_edited_question: string | null
          shared_globally: boolean | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          chapters: Json
          created_at?: string
          id?: string
          last_edited_chapter?: string | null
          last_edited_question?: string | null
          shared_globally?: boolean | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          chapters?: Json
          created_at?: string
          id?: string
          last_edited_chapter?: string | null
          last_edited_question?: string | null
          shared_globally?: boolean | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      media: {
        Row: {
          blob_url: string | null
          created_at: string | null
          id: string
          permanent_url: string
        }
        Insert: {
          blob_url?: string | null
          created_at?: string | null
          id?: string
          permanent_url: string
        }
        Update: {
          blob_url?: string | null
          created_at?: string | null
          id?: string
          permanent_url?: string
        }
        Relationships: []
      }
      notification_subscriptions: {
        Row: {
          author_id: string
          blog_notifications: boolean | null
          created_at: string | null
          diary_notifications: boolean | null
          id: string
          life_story_notifications: boolean | null
          subscriber_id: string
          updated_at: string | null
          wish_notifications: boolean | null
        }
        Insert: {
          author_id: string
          blog_notifications?: boolean | null
          created_at?: string | null
          diary_notifications?: boolean | null
          id?: string
          life_story_notifications?: boolean | null
          subscriber_id: string
          updated_at?: string | null
          wish_notifications?: boolean | null
        }
        Update: {
          author_id?: string
          blog_notifications?: boolean | null
          created_at?: string | null
          diary_notifications?: boolean | null
          id?: string
          life_story_notifications?: boolean | null
          subscriber_id?: string
          updated_at?: string | null
          wish_notifications?: boolean | null
        }
        Relationships: []
      }
      post_categories: {
        Row: {
          category_id: string
          post_id: string
        }
        Insert: {
          category_id: string
          post_id: string
        }
        Update: {
          category_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_categories_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: string | null
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string
          free_trial_end: string | null
          free_trial_start: string | null
          id: string
          receive_contacts: boolean
        }
        Insert: {
          account_status?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          free_trial_end?: string | null
          free_trial_start?: string | null
          id: string
          receive_contacts?: boolean
        }
        Update: {
          account_status?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          free_trial_end?: string | null
          free_trial_start?: string | null
          id?: string
          receive_contacts?: boolean
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          billing_interval: string
          created_at: string | null
          currency: string
          features: Json | null
          id: string
          is_active: boolean | null
          name: string
          price_amount: number
          stripe_price_id: string | null
          trial_period_days: number | null
          updated_at: string | null
        }
        Insert: {
          billing_interval?: string
          created_at?: string | null
          currency?: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          price_amount: number
          stripe_price_id?: string | null
          trial_period_days?: number | null
          updated_at?: string | null
        }
        Update: {
          billing_interval?: string
          created_at?: string | null
          currency?: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          price_amount?: number
          stripe_price_id?: string | null
          trial_period_days?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      translation_game_sessions: {
        Row: {
          created_at: string
          game_mode: string
          id: string
          score: number
          total_questions: number
          user_id: string
          words_used: Json | null
        }
        Insert: {
          created_at?: string
          game_mode: string
          id?: string
          score: number
          total_questions: number
          user_id: string
          words_used?: Json | null
        }
        Update: {
          created_at?: string
          game_mode?: string
          id?: string
          score?: number
          total_questions?: number
          user_id?: string
          words_used?: Json | null
        }
        Relationships: []
      }
      user_actions: {
        Row: {
          action_type: string
          content_id: string
          content_title: string
          content_type: string
          created_at: string
          id: string
          metadata: Json | null
          timestamp: string
          user_id: string
        }
        Insert: {
          action_type: string
          content_id: string
          content_title: string
          content_type: string
          created_at?: string
          id?: string
          metadata?: Json | null
          timestamp?: string
          user_id: string
        }
        Update: {
          action_type?: string
          content_id?: string
          content_title?: string
          content_type?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          timestamp?: string
          user_id?: string
        }
        Relationships: []
      }
      user_client_permissions: {
        Row: {
          client_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_client_permissions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_content_read_status: {
        Row: {
          content_id: string
          content_type: string
          id: string
          read_at: string
          user_id: string
        }
        Insert: {
          content_id: string
          content_type: string
          id?: string
          read_at?: string
          user_id: string
        }
        Update: {
          content_id?: string
          content_type?: string
          id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_intervenant_permissions: {
        Row: {
          created_at: string
          id: string
          intervenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          intervenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          intervenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_intervenant_permissions_intervenant_id_fkey"
            columns: ["intervenant_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_messages_read_status: {
        Row: {
          id: string
          message_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_messages_read_status_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "caregiver_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notifications_read: {
        Row: {
          content_id: string
          content_type: string
          id: string
          read_at: string
          user_id: string
        }
        Insert: {
          content_id: string
          content_type: string
          id?: string
          read_at?: string
          user_id: string
        }
        Update: {
          content_id?: string
          content_type?: string
          id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          canceled_at: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_plan_id: string | null
          trial_end: string | null
          trial_start: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_plan_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_plan_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_subscription_plan_id_fkey"
            columns: ["subscription_plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      wish_albums: {
        Row: {
          author_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          thumbnail_url: string | null
        }
        Insert: {
          author_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          thumbnail_url?: string | null
        }
        Update: {
          author_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          thumbnail_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wish_albums_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wish_posts: {
        Row: {
          age: string | null
          album_id: string | null
          attachment_url: string | null
          author_id: string
          content: string
          cover_image: string | null
          created_at: string
          custom_request_type: string | null
          date: string | null
          email: string | null
          email_notification_requested: boolean | null
          email_notification_sent: boolean | null
          first_name: string | null
          id: string
          importance: string | null
          location: string | null
          needs: string | null
          offering: string | null
          published: boolean | null
          request_type: string | null
          shared_globally: boolean | null
          status: Database["public"]["Enums"]["wish_status"]
          status_changed_at: string | null
          status_changed_by: string | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          age?: string | null
          album_id?: string | null
          attachment_url?: string | null
          author_id: string
          content: string
          cover_image?: string | null
          created_at?: string
          custom_request_type?: string | null
          date?: string | null
          email?: string | null
          email_notification_requested?: boolean | null
          email_notification_sent?: boolean | null
          first_name?: string | null
          id?: string
          importance?: string | null
          location?: string | null
          needs?: string | null
          offering?: string | null
          published?: boolean | null
          request_type?: string | null
          shared_globally?: boolean | null
          status?: Database["public"]["Enums"]["wish_status"]
          status_changed_at?: string | null
          status_changed_by?: string | null
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          age?: string | null
          album_id?: string | null
          attachment_url?: string | null
          author_id?: string
          content?: string
          cover_image?: string | null
          created_at?: string
          custom_request_type?: string | null
          date?: string | null
          email?: string | null
          email_notification_requested?: boolean | null
          email_notification_sent?: boolean | null
          first_name?: string | null
          id?: string
          importance?: string | null
          location?: string | null
          needs?: string | null
          offering?: string | null
          published?: boolean | null
          request_type?: string | null
          shared_globally?: boolean | null
          status?: Database["public"]["Enums"]["wish_status"]
          status_changed_at?: string | null
          status_changed_by?: string | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wish_posts_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "wish_albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wish_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_invitation_groups: {
        Args: { user_id_param: string; group_id_param?: string }
        Returns: boolean
      }
      can_delete_client: {
        Args: { client_id_param: string }
        Returns: boolean
      }
      can_delete_intervenant: {
        Args: { intervenant_id_param: string }
        Returns: boolean
      }
      can_view_group: {
        Args: { group_id: string; user_id: string }
        Returns: boolean
      }
      debug_intervention_report_access: {
        Args: { report_id_param: string }
        Returns: Json
      }
      debug_life_story_access: {
        Args: { target_user_id: string }
        Returns: Json
      }
      delete_user_completely: {
        Args: { user_id_to_delete: string }
        Returns: undefined
      }
      fix_existing_invitation_permissions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_admin_users_with_auth_data: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
          created_at: string
          last_sign_in_at: string
          display_name: string
          role: Database["public"]["Enums"]["app_role"]
          blog_posts_count: number
          diary_entries_count: number
          wish_posts_count: number
          clients_count: number
          appointments_count: number
          intervention_reports_count: number
        }[]
      }
      get_current_user_email: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_professional_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          display_name: string
          email: string
        }[]
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_subscription_plan: {
        Args: { user_id_param: string }
        Returns: string
      }
      has_active_subscription: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          user_id: string
          required_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      init_free_trial: {
        Args: { user_id_param: string }
        Returns: undefined
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_email_confirmed: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_group_creator: {
        Args: { group_id: string; user_id: string }
        Returns: boolean
      }
      send_appointment_reminder_emails: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      sync_invitation_permissions: {
        Args: { invitation_id_param: string }
        Returns: undefined
      }
      update_account_statuses: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      user_can_access_album: {
        Args: { album_id_param: string; user_id_param: string }
        Returns: boolean
      }
      user_has_app_access: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      users_in_same_group: {
        Args: { user1_id: string; user2_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "editor"
        | "reader"
        | "professionnel"
        | "createur_activite"
      wish_status: "pending" | "fulfilled" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "editor",
        "reader",
        "professionnel",
        "createur_activite",
      ],
      wish_status: ["pending", "fulfilled", "cancelled"],
    },
  },
} as const
