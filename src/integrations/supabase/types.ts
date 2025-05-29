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
      album_permissions: {
        Row: {
          album_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          album_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          album_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "album_permissions_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "blog_albums"
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
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
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
          id: string
          published: boolean | null
          title: string
          updated_at: string
        }
        Insert: {
          album_id?: string | null
          author_id: string
          content: string
          cover_image?: string | null
          created_at?: string
          id?: string
          published?: boolean | null
          title: string
          updated_at?: string
        }
        Update: {
          album_id?: string | null
          author_id?: string
          content?: string
          cover_image?: string | null
          created_at?: string
          id?: string
          published?: boolean | null
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
      diary_entries: {
        Row: {
          activities: string | null
          contacted_people: string[] | null
          created_at: string | null
          desire_of_day: string | null
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
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activities?: string | null
          contacted_people?: string[] | null
          created_at?: string | null
          desire_of_day?: string | null
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
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activities?: string | null
          contacted_people?: string[] | null
          created_at?: string | null
          desire_of_day?: string | null
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
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      diary_permissions: {
        Row: {
          created_at: string
          diary_owner_id: string
          granted_by: string
          id: string
          permission_level: string
          permitted_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          diary_owner_id: string
          granted_by: string
          id?: string
          permission_level: string
          permitted_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          diary_owner_id?: string
          granted_by?: string
          id?: string
          permission_level?: string
          permitted_user_id?: string
          updated_at?: string
        }
        Relationships: []
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
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      life_story_permissions: {
        Row: {
          created_at: string
          granted_by: string
          id: string
          permission_level: string
          permitted_user_id: string
          story_owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          granted_by: string
          id?: string
          permission_level: string
          permitted_user_id: string
          story_owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          granted_by?: string
          id?: string
          permission_level?: string
          permitted_user_id?: string
          story_owner_id?: string
          updated_at?: string
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
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string
          id: string
          receive_contacts: boolean
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          receive_contacts?: boolean
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          receive_contacts?: boolean
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
      user_section_permissions: {
        Row: {
          can_read: boolean | null
          created_at: string
          granted_by: string | null
          id: string
          section: string
          user_id: string
        }
        Insert: {
          can_read?: boolean | null
          created_at?: string
          granted_by?: string | null
          id?: string
          section: string
          user_id: string
        }
        Update: {
          can_read?: boolean | null
          created_at?: string
          granted_by?: string | null
          id?: string
          section?: string
          user_id?: string
        }
        Relationships: []
      }
      wish_album_permissions: {
        Row: {
          album_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          album_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          album_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wish_album_permissions_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "wish_albums"
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
          first_name: string | null
          id: string
          importance: string | null
          location: string | null
          needs: string | null
          offering: string | null
          published: boolean | null
          request_type: string | null
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
          first_name?: string | null
          id?: string
          importance?: string | null
          location?: string | null
          needs?: string | null
          offering?: string | null
          published?: boolean | null
          request_type?: string | null
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
          first_name?: string | null
          id?: string
          importance?: string | null
          location?: string | null
          needs?: string | null
          offering?: string | null
          published?: boolean | null
          request_type?: string | null
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
      can_view_group: {
        Args: { group_id: string; user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          user_id: string
          required_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_group_creator: {
        Args: { group_id: string; user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "editor" | "reader"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "editor", "reader"],
    },
  },
} as const
