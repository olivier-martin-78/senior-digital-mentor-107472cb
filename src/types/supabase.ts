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
      albums: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string | null
          updated_at: string | null
        }
        Insert: {
          created_by?: string | null
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_by?: string | null
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "albums_created_by_fkey"
            columns: ["created_by"]
            isOne: true
            isOther: false
            relation: "profiles"
            schema: "public"
          }
        ]
      }
      blog_posts: {
        Row: {
          album_id: string | null
          content: string | null
          created_at: string
          created_by: string | null
          id: string
          is_published: boolean | null
          metadata: Json | null
          slug: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          album_id?: string | null
          content?: string | null
          created_by?: string | null
          id?: string
          is_published?: boolean | null
          metadata?: Json | null
          slug?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          album_id?: string | null
          content?: string | null
          created_by?: string | null
          id?: string
          is_published?: boolean | null
          metadata?: Json | null
          slug?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_album_id_fkey"
            columns: ["album_id"]
            isOne: true
            isOther: false
            relation: "albums"
            schema: "public"
          },
          {
            foreignKeyName: "blog_posts_created_by_fkey"
            columns: ["created_by"]
            isOne: true
            isOther: false
            relation: "profiles"
            schema: "public"
          }
        ]
      }
      diary_entries: {
        Row: {
          album_id: string | null
          content: string | null
          created_at: string
          created_by: string | null
          date: string | null
          id: string
          is_published: boolean | null
          metadata: Json | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          album_id?: string | null
          content?: string | null
          created_by?: string | null
          date?: string | null
          id?: string
          is_published?: boolean | null
          metadata?: Json | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          album_id?: string | null
          content?: string | null
          created_by?: string | null
          date?: string | null
          id?: string
          is_published?: boolean | null
          metadata?: Json | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diary_entries_album_id_fkey"
            columns: ["album_id"]
            isOne: true
            isOther: false
            relation: "albums"
            schema: "public"
          },
          {
            foreignKeyName: "diary_entries_created_by_fkey"
            columns: ["created_by"]
            isOne: true
            isOther: false
            relation: "profiles"
            schema: "public"
          }
        ]
      }
      invitation_groups: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string | null
        }
        Insert: {
          created_by?: string | null
          id?: string
          name?: string | null
        }
        Update: {
          created_by?: string | null
          id?: string
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitation_groups_created_by_fkey"
            columns: ["created_by"]
            isOne: true
            isOther: false
            relation: "profiles"
            schema: "public"
          }
        ]
      }
      invitations: {
        Row: {
          created_at: string
          email: string | null
          group_id: string | null
          id: string
          invited_by: string | null
          status: Database["public"]["Enums"]["invitation_status"] | null
        }
        Insert: {
          email?: string | null
          group_id?: string | null
          id?: string
          invited_by?: string | null
          status?: Database["public"]["Enums"]["invitation_status"] | null
        }
        Update: {
          email?: string | null
          group_id?: string | null
          id?: string
          invited_by?: string | null
          status?: Database["public"]["Enums"]["invitation_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "invitations_group_id_fkey"
            columns: ["group_id"]
            isOne: true
            isOther: false
            relation: "invitation_groups"
            schema: "public"
          },
          {
            foreignKeyName: "invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOne: true
            isOther: false
            relation: "profiles"
            schema: "public"
          }
        ]
      }
      life_story_chapters: {
        Row: {
          content: string | null
          created_at: string
          id: string
          life_story_id: string | null
          order: number | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          id?: string
          life_story_id?: string | null
          order?: number | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          id?: string
          life_story_id?: string | null
          order?: number | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "life_story_chapters_life_story_id_fkey"
            columns: ["life_story_id"]
            isOne: true
            isOther: false
            relation: "life_stories"
            schema: "public"
          }
        ]
      }
      life_stories: {
        Row: {
          album_id: string | null
          created_at: string
          created_by: string | null
          id: string
          is_published: boolean | null
          metadata: Json | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          album_id?: string | null
          created_by?: string | null
          id?: string
          is_published?: boolean | null
          metadata?: Json | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          album_id?: string | null
          created_by?: string | null
          id?: string
          is_published?: boolean | null
          metadata?: Json | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "life_stories_album_id_fkey"
            columns: ["album_id"]
            isOne: true
            isOther: false
            relation: "albums"
            schema: "public"
          },
          {
            foreignKeyName: "life_stories_created_by_fkey"
            columns: ["created_by"]
            isOne: true
            isOther: false
            relation: "profiles"
            schema: "public"
          }
        ]
      }
      media: {
        Row: {
          created_at: string
          created_by: string | null
          file_name: string | null
          file_size: number | null
          file_type: string | null
          id: string
          intervention_report_id: string | null
          url: string | null
        }
        Insert: {
          created_by?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          intervention_report_id?: string | null
          url?: string | null
        }
        Update: {
          created_by?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          intervention_report_id?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_created_by_fkey"
            columns: ["created_by"]
            isOne: true
            isOther: false
            relation: "profiles"
            schema: "public"
          },
          {
            foreignKeyName: "media_intervention_report_id_fkey"
            columns: ["intervention_report_id"]
            isOne: true
            isOther: false
            relation: "intervention_reports"
            schema: "public"
          }
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          email: string
          id: string
          updated_at: string
          user_id: string
          receive_contacts: boolean
          free_trial_start: string | null
          free_trial_end: string | null
          account_status: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          id?: string
          updated_at?: string
          user_id: string
          receive_contacts?: boolean
          free_trial_start?: string | null
          free_trial_end?: string | null
          account_status?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          updated_at?: string
          user_id?: string
          receive_contacts?: boolean
          free_trial_start?: string | null
          free_trial_end?: string | null
          account_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOne: true
            isOther: false
            relation: "users"
            schema: "auth"
          }
        ]
      }
      user_roles: {
        Row: {
          role: Database["public"]["Enums"]["app_role"] | null
          user_id: string
        }
        Insert: {
          role?: Database["public"]["Enums"]["app_role"] | null
          user_id: string
        }
        Update: {
          role?: Database["public"]["Enums"]["app_role"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOne: true
            isOther: false
            relation: "users"
            schema: "auth"
          }
        ]
      }
      wish_albums: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string | null
          updated_at: string | null
        }
        Insert: {
          created_by?: string | null
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_by?: string | null
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wish_albums_created_by_fkey"
            columns: ["created_by"]
            isOne: true
            isOther: false
            relation: "profiles"
            schema: "public"
          }
        ]
      }
      wish_posts: {
        Row: {
          album_id: string | null
          content: string | null
          created_at: string
          created_by: string | null
          id: string
          is_published: boolean | null
          metadata: Json | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          album_id?: string | null
          content?: string | null
          created_by?: string | null
          id?: string
          is_published?: boolean | null
          metadata?: Json | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          album_id?: string | null
          content?: string | null
          created_by?: string | null
          id?: string
          is_published?: boolean | null
          metadata?: Json | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wish_posts_album_id_fkey"
            columns: ["album_id"]
            isOne: true
            isOther: false
            relation: "wish_albums"
            schema: "public"
          },
          {
            foreignKeyName: "wish_posts_created_by_fkey"
            columns: ["created_by"]
            isOne: true
            isOther: false
            relation: "profiles"
            schema: "public"
          }
        ]
      }
      intervention_reports: {
        Row: {
          id: string
          created_at: string
          created_by: string | null
          patient_name: string | null
          intervention_date: string | null
          observations: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          created_by?: string | null
          patient_name?: string | null
          intervention_date?: string | null
          observations?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          created_by?: string | null
          patient_name?: string | null
          intervention_date?: string | null
          observations?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "intervention_reports_created_by_fkey"
            columns: ["created_by"]
            isOne: true
            isOther: false
            relation: "profiles"
            schema: "public"
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_user_in_group: {
        Args: {
          user_id: string
          group_id: string
        }
        Returns: boolean
      }
      user_has_app_access: {
        Args: {
          user_id_param: string
        }
        Returns: boolean
      }
      init_free_trial: {
        Args: {
          user_id_param: string
        }
        Returns: void
      }
      update_account_statuses: {
        Args: {}
        Returns: void
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "reader" | "professionnel" | "editor"
      invitation_status: "pending" | "accepted" | "declined"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never

// Types personnalisés pour l'application
export type AppRole = 'admin' | 'moderator' | 'user' | 'reader' | 'professionnel' | 'editor' | 'createur_activite';

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  receive_contacts: boolean;
  free_trial_start?: string | null;
  free_trial_end?: string | null;
  account_status?: string;
}

// Types pour les blogs
export interface BlogAlbum {
  id: string;
  name: string;
  description: string | null;
  author_id: string;
  created_at: string;
  thumbnail_url: string | null;
}

export interface AlbumWithAuthor extends BlogAlbum {
  profiles: Profile;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  author_id: string;
  album_id: string | null;
  cover_image: string | null;
  published: boolean | null;
  shared_globally?: boolean;
  created_at: string;
  updated_at: string;
  email_notification_sent: boolean | null;
  email_notification_requested: boolean | null;
}

export interface BlogCategory {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

export interface BlogMedia {
  id: string;
  post_id: string;
  media_type: string;
  media_url: string;
  thumbnail_url: string | null;
  created_at: string;
}

export interface PostWithAuthor extends BlogPost {
  profiles: Profile;
  blog_albums?: BlogAlbum;
}

export interface CommentWithAuthor {
  id: string;
  content: string;
  author_id: string;
  post_id: string;
  created_at: string;
  profiles: Profile;
}

// Types pour les souhaits
export interface WishAlbum {
  id: string;
  name: string;
  description: string | null;
  author_id: string;
  created_at: string;
  thumbnail_url: string | null;
}

export interface WishPost {
  id: string;
  title: string;
  content: string;
  author_id: string;
  album_id: string | null;
  cover_image: string | null;
  published: boolean | null;
  shared_globally?: boolean;
  created_at: string;
  updated_at: string;
  email_notification_sent: boolean | null;
  email_notification_requested: boolean | null;
  first_name: string | null;
  email: string | null;
  age: string | null;
  location: string | null;
  request_type: string | null;
  custom_request_type: string | null;
  importance: string | null;
  needs: string | null;
  offering: string | null;
  date: string | null;
  attachment_url: string | null;
  user_id: string | null;
  status: 'pending' | 'fulfilled' | 'cancelled';
  status_changed_by: string | null;
  status_changed_at: string | null;
  profiles?: Profile;
  album?: WishAlbum;
}

// Types pour les invitations de groupe
export interface GroupInvitation {
  id: string;
  inviter_id: string;
  email: string;
  group_id: string;
  status: 'pending' | 'confirmed';
  invitation_date: string;
  confirmation_date: string | null;
  invited_user_id: string | null;
}
