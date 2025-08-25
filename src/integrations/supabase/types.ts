export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
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
      client_reviews: {
        Row: {
          comments: string | null
          completed_at: string
          created_at: string
          id: string
          rating: number
          review_request_id: string
          reviewer_name: string | null
        }
        Insert: {
          comments?: string | null
          completed_at?: string
          created_at?: string
          id?: string
          rating: number
          review_request_id: string
          reviewer_name?: string | null
        }
        Update: {
          comments?: string | null
          completed_at?: string
          created_at?: string
          id?: string
          rating?: number
          review_request_id?: string
          reviewer_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_reviews_review_request_id_fkey"
            columns: ["review_request_id"]
            isOneToOne: false
            referencedRelation: "review_requests"
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
      cognitive_puzzle_activities: {
        Row: {
          category: string
          created_at: string
          display_order: number | null
          icon: string
          id: string
          level_id: string
          name: string
        }
        Insert: {
          category: string
          created_at?: string
          display_order?: number | null
          icon: string
          id?: string
          level_id: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string
          display_order?: number | null
          icon?: string
          id?: string
          level_id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "cognitive_puzzle_activities_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "cognitive_puzzle_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      cognitive_puzzle_adaptation_choices: {
        Row: {
          created_at: string
          description: string
          effect: Json
          id: string
          twist_event_id: string
        }
        Insert: {
          created_at?: string
          description: string
          effect?: Json
          id?: string
          twist_event_id: string
        }
        Update: {
          created_at?: string
          description?: string
          effect?: Json
          id?: string
          twist_event_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cognitive_puzzle_adaptation_choices_twist_event_id_fkey"
            columns: ["twist_event_id"]
            isOneToOne: false
            referencedRelation: "cognitive_puzzle_twist_events"
            referencedColumns: ["id"]
          },
        ]
      }
      cognitive_puzzle_dialogues: {
        Row: {
          category: string
          created_at: string
          description: string | null
          dialogue_key: string
          id: string
          text_content: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          dialogue_key: string
          id?: string
          text_content: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          dialogue_key?: string
          id?: string
          text_content?: string
          updated_at?: string
        }
        Relationships: []
      }
      cognitive_puzzle_levels: {
        Row: {
          created_at: string
          description: string
          enable_timeline: boolean
          id: string
          level_number: number
          name: string
          scenario_id: string
          spatial_icon: string | null
          spatial_required: number
          spatial_title: string | null
          temporal_icon: string | null
          temporal_required: number
          temporal_title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          enable_timeline?: boolean
          id?: string
          level_number: number
          name: string
          scenario_id: string
          spatial_icon?: string | null
          spatial_required?: number
          spatial_title?: string | null
          temporal_icon?: string | null
          temporal_required?: number
          temporal_title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          enable_timeline?: boolean
          id?: string
          level_number?: number
          name?: string
          scenario_id?: string
          spatial_icon?: string | null
          spatial_required?: number
          spatial_title?: string | null
          temporal_icon?: string | null
          temporal_required?: number
          temporal_title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cognitive_puzzle_levels_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "cognitive_puzzle_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      cognitive_puzzle_scenarios: {
        Row: {
          created_at: string
          created_by: string
          description: string
          game_type: string
          id: string
          name: string
          thumbnail: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          description: string
          game_type?: string
          id?: string
          name: string
          thumbnail: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          game_type?: string
          id?: string
          name?: string
          thumbnail?: string
          updated_at?: string
        }
        Relationships: []
      }
      cognitive_puzzle_spatial_slots: {
        Row: {
          created_at: string
          display_order: number | null
          icon: string
          id: string
          label: string
          level_id: string
          x_position: number
          y_position: number
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          icon: string
          id?: string
          label: string
          level_id: string
          x_position: number
          y_position: number
        }
        Update: {
          created_at?: string
          display_order?: number | null
          icon?: string
          id?: string
          label?: string
          level_id?: string
          x_position?: number
          y_position?: number
        }
        Relationships: [
          {
            foreignKeyName: "cognitive_puzzle_spatial_slots_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "cognitive_puzzle_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      cognitive_puzzle_time_slots: {
        Row: {
          created_at: string
          display_order: number | null
          icon: string
          id: string
          label: string
          level_id: string
          period: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          icon: string
          id?: string
          label: string
          level_id: string
          period: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          icon?: string
          id?: string
          label?: string
          level_id?: string
          period?: string
        }
        Relationships: [
          {
            foreignKeyName: "cognitive_puzzle_time_slots_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "cognitive_puzzle_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      cognitive_puzzle_twist_events: {
        Row: {
          created_at: string
          description: string
          effect: Json
          event_type: string
          id: string
          level_id: string
        }
        Insert: {
          created_at?: string
          description: string
          effect?: Json
          event_type: string
          id?: string
          level_id: string
        }
        Update: {
          created_at?: string
          description?: string
          effect?: Json
          event_type?: string
          id?: string
          level_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cognitive_puzzle_twist_events_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "cognitive_puzzle_levels"
            referencedColumns: ["id"]
          },
        ]
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
      game_settings: {
        Row: {
          created_at: string
          default_accessibility_mode: boolean
          default_voice_enabled: boolean
          error_threshold: number
          id: string
          object_reduction: number
          updated_at: string
          visual_memory_display_duration: number | null
        }
        Insert: {
          created_at?: string
          default_accessibility_mode?: boolean
          default_voice_enabled?: boolean
          error_threshold?: number
          id?: string
          object_reduction?: number
          updated_at?: string
          visual_memory_display_duration?: number | null
        }
        Update: {
          created_at?: string
          default_accessibility_mode?: boolean
          default_voice_enabled?: boolean
          error_threshold?: number
          id?: string
          object_reduction?: number
          updated_at?: string
          visual_memory_display_duration?: number | null
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
      homepage_slides: {
        Row: {
          button_link: string | null
          button_text: string | null
          created_at: string
          created_by: string
          display_duration_seconds: number
          display_order: number
          id: string
          is_active: boolean
          media_type: string | null
          media_url: string
          title: string
          title_color: string | null
          updated_at: string
        }
        Insert: {
          button_link?: string | null
          button_text?: string | null
          created_at?: string
          created_by: string
          display_duration_seconds?: number
          display_order?: number
          id?: string
          is_active?: boolean
          media_type?: string | null
          media_url: string
          title: string
          title_color?: string | null
          updated_at?: string
        }
        Update: {
          button_link?: string | null
          button_text?: string | null
          created_at?: string
          created_by?: string
          display_duration_seconds?: number
          display_order?: number
          id?: string
          is_active?: boolean
          media_type?: string | null
          media_url?: string
          title?: string
          title_color?: string | null
          updated_at?: string
        }
        Relationships: []
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
          client_city: string | null
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
          client_city?: string | null
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
          client_city?: string | null
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
      mini_site_media: {
        Row: {
          caption: string | null
          created_at: string
          display_order: number | null
          duration: number | null
          id: string
          link_url: string | null
          media_type: string | null
          media_url: string
          mini_site_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          display_order?: number | null
          duration?: number | null
          id?: string
          link_url?: string | null
          media_type?: string | null
          media_url: string
          mini_site_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          display_order?: number | null
          duration?: number | null
          id?: string
          link_url?: string | null
          media_type?: string | null
          media_url?: string
          mini_site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mini_site_media_mini_site_id_fkey"
            columns: ["mini_site_id"]
            isOneToOne: false
            referencedRelation: "mini_sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mini_site_media_mini_site_id_fkey"
            columns: ["mini_site_id"]
            isOneToOne: false
            referencedRelation: "mini_sites_public"
            referencedColumns: ["id"]
          },
        ]
      }
      mini_site_social_links: {
        Row: {
          created_at: string
          id: string
          mini_site_id: string
          platform: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          mini_site_id: string
          platform: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          mini_site_id?: string
          platform?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "mini_site_social_links_mini_site_id_fkey"
            columns: ["mini_site_id"]
            isOneToOne: false
            referencedRelation: "mini_sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mini_site_social_links_mini_site_id_fkey"
            columns: ["mini_site_id"]
            isOneToOne: false
            referencedRelation: "mini_sites_public"
            referencedColumns: ["id"]
          },
        ]
      }
      mini_sites: {
        Row: {
          about_me: string | null
          activity_start_date: string | null
          availability_schedule: string | null
          background_color: string | null
          city: string | null
          color_palette: string | null
          created_at: string
          design_style: string | null
          email: string
          first_name: string
          header_gradient_from: string | null
          header_gradient_to: string | null
          id: string
          intervention_radius: string | null
          is_published: boolean | null
          last_name: string
          logo_size: number | null
          logo_url: string | null
          phone: string | null
          postal_code: string | null
          profession: string | null
          professional_networks: string | null
          section_text_color: string | null
          section_title_about_me: string | null
          section_title_availability: string | null
          section_title_color: string | null
          section_title_contact: string | null
          section_title_divider_from: string | null
          section_title_divider_to: string | null
          section_title_follow_me: string | null
          section_title_professional_networks: string | null
          section_title_services: string | null
          section_title_skills_and_qualities: string | null
          section_title_why_this_profession: string | null
          services_description: string | null
          site_name: string
          site_subtitle: string | null
          skills_and_qualities: string | null
          slug: string | null
          subtitle_color: string | null
          title_color: string | null
          updated_at: string
          user_id: string
          why_this_profession: string | null
        }
        Insert: {
          about_me?: string | null
          activity_start_date?: string | null
          availability_schedule?: string | null
          background_color?: string | null
          city?: string | null
          color_palette?: string | null
          created_at?: string
          design_style?: string | null
          email: string
          first_name: string
          header_gradient_from?: string | null
          header_gradient_to?: string | null
          id?: string
          intervention_radius?: string | null
          is_published?: boolean | null
          last_name: string
          logo_size?: number | null
          logo_url?: string | null
          phone?: string | null
          postal_code?: string | null
          profession?: string | null
          professional_networks?: string | null
          section_text_color?: string | null
          section_title_about_me?: string | null
          section_title_availability?: string | null
          section_title_color?: string | null
          section_title_contact?: string | null
          section_title_divider_from?: string | null
          section_title_divider_to?: string | null
          section_title_follow_me?: string | null
          section_title_professional_networks?: string | null
          section_title_services?: string | null
          section_title_skills_and_qualities?: string | null
          section_title_why_this_profession?: string | null
          services_description?: string | null
          site_name: string
          site_subtitle?: string | null
          skills_and_qualities?: string | null
          slug?: string | null
          subtitle_color?: string | null
          title_color?: string | null
          updated_at?: string
          user_id: string
          why_this_profession?: string | null
        }
        Update: {
          about_me?: string | null
          activity_start_date?: string | null
          availability_schedule?: string | null
          background_color?: string | null
          city?: string | null
          color_palette?: string | null
          created_at?: string
          design_style?: string | null
          email?: string
          first_name?: string
          header_gradient_from?: string | null
          header_gradient_to?: string | null
          id?: string
          intervention_radius?: string | null
          is_published?: boolean | null
          last_name?: string
          logo_size?: number | null
          logo_url?: string | null
          phone?: string | null
          postal_code?: string | null
          profession?: string | null
          professional_networks?: string | null
          section_text_color?: string | null
          section_title_about_me?: string | null
          section_title_availability?: string | null
          section_title_color?: string | null
          section_title_contact?: string | null
          section_title_divider_from?: string | null
          section_title_divider_to?: string | null
          section_title_follow_me?: string | null
          section_title_professional_networks?: string | null
          section_title_services?: string | null
          section_title_skills_and_qualities?: string | null
          section_title_why_this_profession?: string | null
          services_description?: string | null
          site_name?: string
          site_subtitle?: string | null
          skills_and_qualities?: string | null
          slug?: string | null
          subtitle_color?: string | null
          title_color?: string | null
          updated_at?: string
          user_id?: string
          why_this_profession?: string | null
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
      object_assembly_game_assets: {
        Row: {
          alt_text: string | null
          asset_name: string
          asset_type: string
          asset_url: string
          created_at: string
          id: string
          is_active: boolean
          metadata: Json | null
          updated_at: string
        }
        Insert: {
          alt_text?: string | null
          asset_name: string
          asset_type: string
          asset_url: string
          created_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          updated_at?: string
        }
        Update: {
          alt_text?: string | null
          asset_name?: string
          asset_type?: string
          asset_url?: string
          created_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      object_assembly_game_sessions: {
        Row: {
          adaptations_triggered: Json | null
          completion_status: string
          completion_time: number | null
          created_at: string
          current_errors: number
          hints_used: number
          id: string
          level_id: string
          scenario_id: string
          score: number
          session_data: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          adaptations_triggered?: Json | null
          completion_status?: string
          completion_time?: number | null
          created_at?: string
          current_errors?: number
          hints_used?: number
          id?: string
          level_id: string
          scenario_id: string
          score?: number
          session_data?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          adaptations_triggered?: Json | null
          completion_status?: string
          completion_time?: number | null
          created_at?: string
          current_errors?: number
          hints_used?: number
          id?: string
          level_id?: string
          scenario_id?: string
          score?: number
          session_data?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "object_assembly_game_sessions_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "cognitive_puzzle_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "object_assembly_game_sessions_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "cognitive_puzzle_scenarios"
            referencedColumns: ["id"]
          },
        ]
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
          permanent_access: boolean | null
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
          permanent_access?: boolean | null
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
          permanent_access?: boolean | null
          receive_contacts?: boolean
        }
        Relationships: []
      }
      review_requests: {
        Row: {
          caregiver_id: string | null
          city: string | null
          client_comment: string | null
          client_id: string | null
          created_at: string
          email_sent_at: string | null
          expires_at: string
          id: string
          professional_id: string
          review_date: string
          satisfaction_rating: number | null
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          caregiver_id?: string | null
          city?: string | null
          client_comment?: string | null
          client_id?: string | null
          created_at?: string
          email_sent_at?: string | null
          expires_at?: string
          id?: string
          professional_id: string
          review_date: string
          satisfaction_rating?: number | null
          status?: string
          token: string
          updated_at?: string
        }
        Update: {
          caregiver_id?: string | null
          city?: string | null
          client_comment?: string | null
          client_id?: string | null
          created_at?: string
          email_sent_at?: string | null
          expires_at?: string
          id?: string
          professional_id?: string
          review_date?: string
          satisfaction_rating?: number | null
          status?: string
          token?: string
          updated_at?: string
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
      user_login_sessions: {
        Row: {
          created_at: string
          id: string
          ip_address: string | null
          login_timestamp: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string | null
          login_timestamp?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string | null
          login_timestamp?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_login_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      visual_memory_game_sessions: {
        Row: {
          bonus_points: number
          completion_time: number | null
          created_at: string
          difficulty_level: string
          id: string
          phase_4_attempts: number
          phase_4_completed: boolean
          questions_answered: number
          questions_correct: number
          score: number
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          bonus_points?: number
          completion_time?: number | null
          created_at?: string
          difficulty_level: string
          id?: string
          phase_4_attempts?: number
          phase_4_completed?: boolean
          questions_answered?: number
          questions_correct?: number
          score?: number
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          bonus_points?: number
          completion_time?: number | null
          created_at?: string
          difficulty_level?: string
          id?: string
          phase_4_attempts?: number
          phase_4_completed?: boolean
          questions_answered?: number
          questions_correct?: number
          score?: number
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      visual_memory_leaderboards: {
        Row: {
          best_score: number
          best_total_points: number
          created_at: string
          difficulty_level: string
          games_played: number
          id: string
          month_year: string
          updated_at: string
          user_id: string
        }
        Insert: {
          best_score?: number
          best_total_points?: number
          created_at?: string
          difficulty_level: string
          games_played?: number
          id?: string
          month_year: string
          updated_at?: string
          user_id: string
        }
        Update: {
          best_score?: number
          best_total_points?: number
          created_at?: string
          difficulty_level?: string
          games_played?: number
          id?: string
          month_year?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      mini_sites_public: {
        Row: {
          about_me: string | null
          activity_start_date: string | null
          availability_schedule: string | null
          background_color: string | null
          city: string | null
          color_palette: string | null
          created_at: string | null
          design_style: string | null
          email: string | null
          first_name: string | null
          header_gradient_from: string | null
          header_gradient_to: string | null
          id: string | null
          intervention_radius: string | null
          last_name: string | null
          logo_size: number | null
          logo_url: string | null
          phone: string | null
          postal_code: string | null
          profession: string | null
          professional_networks: string | null
          section_text_color: string | null
          section_title_about_me: string | null
          section_title_availability: string | null
          section_title_color: string | null
          section_title_contact: string | null
          section_title_divider_from: string | null
          section_title_divider_to: string | null
          section_title_follow_me: string | null
          section_title_professional_networks: string | null
          section_title_services: string | null
          section_title_skills_and_qualities: string | null
          section_title_why_this_profession: string | null
          services_description: string | null
          site_name: string | null
          site_subtitle: string | null
          skills_and_qualities: string | null
          slug: string | null
          subtitle_color: string | null
          title_color: string | null
          why_this_profession: string | null
        }
        Insert: {
          about_me?: string | null
          activity_start_date?: string | null
          availability_schedule?: string | null
          background_color?: string | null
          city?: string | null
          color_palette?: string | null
          created_at?: string | null
          design_style?: string | null
          email?: string | null
          first_name?: string | null
          header_gradient_from?: string | null
          header_gradient_to?: string | null
          id?: string | null
          intervention_radius?: string | null
          last_name?: string | null
          logo_size?: number | null
          logo_url?: string | null
          phone?: string | null
          postal_code?: string | null
          profession?: string | null
          professional_networks?: string | null
          section_text_color?: string | null
          section_title_about_me?: string | null
          section_title_availability?: string | null
          section_title_color?: string | null
          section_title_contact?: string | null
          section_title_divider_from?: string | null
          section_title_divider_to?: string | null
          section_title_follow_me?: string | null
          section_title_professional_networks?: string | null
          section_title_services?: string | null
          section_title_skills_and_qualities?: string | null
          section_title_why_this_profession?: string | null
          services_description?: string | null
          site_name?: string | null
          site_subtitle?: string | null
          skills_and_qualities?: string | null
          slug?: string | null
          subtitle_color?: string | null
          title_color?: string | null
          why_this_profession?: string | null
        }
        Update: {
          about_me?: string | null
          activity_start_date?: string | null
          availability_schedule?: string | null
          background_color?: string | null
          city?: string | null
          color_palette?: string | null
          created_at?: string | null
          design_style?: string | null
          email?: string | null
          first_name?: string | null
          header_gradient_from?: string | null
          header_gradient_to?: string | null
          id?: string | null
          intervention_radius?: string | null
          last_name?: string | null
          logo_size?: number | null
          logo_url?: string | null
          phone?: string | null
          postal_code?: string | null
          profession?: string | null
          professional_networks?: string | null
          section_text_color?: string | null
          section_title_about_me?: string | null
          section_title_availability?: string | null
          section_title_color?: string | null
          section_title_contact?: string | null
          section_title_divider_from?: string | null
          section_title_divider_to?: string | null
          section_title_follow_me?: string | null
          section_title_professional_networks?: string | null
          section_title_services?: string | null
          section_title_skills_and_qualities?: string | null
          section_title_why_this_profession?: string | null
          services_description?: string | null
          site_name?: string | null
          site_subtitle?: string | null
          skills_and_qualities?: string | null
          slug?: string | null
          subtitle_color?: string | null
          title_color?: string | null
          why_this_profession?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_access_healthcare_data: {
        Args: { target_appointment_id?: string; target_professional_id: string }
        Returns: boolean
      }
      can_access_invitation_groups: {
        Args: { group_id_param?: string; user_id_param: string }
        Returns: boolean
      }
      can_create_activities: {
        Args: { user_id_param: string }
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
      can_user_view_appointment: {
        Args: { appointment_id_param: string }
        Returns: boolean
      }
      can_user_view_caregiver: {
        Args: { caregiver_id_param: string }
        Returns: boolean
      }
      can_user_view_client: {
        Args: { client_id_param: string }
        Returns: boolean
      }
      can_view_group: {
        Args: { group_id: string; user_id: string }
        Returns: boolean
      }
      count_unique_users: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      count_unique_users_with_sessions: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      current_user_is_admin: {
        Args: Record<PropertyKey, never>
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
      debug_user_access: {
        Args: { target_user_id?: string }
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
      generate_mini_site_slug: {
        Args: {
          p_first_name: string
          p_last_name: string
          p_postal_code: string
        }
        Returns: string
      }
      generate_review_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_admin_users_with_auth_data: {
        Args: Record<PropertyKey, never>
        Returns: {
          access_status: string
          appointments_count: number
          blog_posts_count: number
          clients_count: number
          created_at: string
          diary_entries_count: number
          display_name: string
          email: string
          id: string
          intervention_reports_count: number
          last_sign_in_at: string
          permanent_access: boolean
          role: Database["public"]["Enums"]["app_role"]
          wish_posts_count: number
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
          display_name: string
          email: string
          id: string
        }[]
      }
      get_public_mini_site_reviews: {
        Args: { p_slug: string }
        Returns: {
          auxiliary_name: string
          client_city: string
          client_comments: string
          client_rating: number
          created_at: string
          patient_name: string
        }[]
      }
      get_review_request_by_token: {
        Args: { token_param: string }
        Returns: {
          caregiver_id: string
          caregiver_name: string
          city: string
          client_id: string
          client_name: string
          expires_at: string
          id: string
          professional_id: string
          professional_name: string
          review_date: string
          satisfaction_rating: number
          status: string
        }[]
      }
      get_user_access_status: {
        Args: { user_id_param: string }
        Returns: string
      }
      get_user_role: {
        Args: { user_id_param: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_subscription_plan: {
        Args: { user_id_param: string }
        Returns: string
      }
      get_visual_memory_leaderboard: {
        Args: { p_difficulty_level: string }
        Returns: {
          best_score: number
          best_total_points: number
          games_played: number
          rank_position: number
          user_id: string
          user_name: string
        }[]
      }
      has_active_subscription: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          required_role: Database["public"]["Enums"]["app_role"]
          user_id: string
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
      is_client_created_by_auth_user: {
        Args: { client_id_param: string }
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
