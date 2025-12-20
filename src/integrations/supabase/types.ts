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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      collaboration_invitations: {
        Row: {
          created_at: string
          id: string
          invitee_email: string
          invitee_id: string | null
          inviter_id: string
          room_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          invitee_email: string
          invitee_id?: string | null
          inviter_id: string
          room_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          invitee_email?: string
          invitee_id?: string | null
          inviter_id?: string
          room_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaboration_invitations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "collaboration_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      collaboration_members: {
        Row: {
          id: string
          joined_at: string
          room_id: string
          status: string
          user_id: string
          username: string
        }
        Insert: {
          id?: string
          joined_at?: string
          room_id: string
          status?: string
          user_id: string
          username: string
        }
        Update: {
          id?: string
          joined_at?: string
          room_id?: string
          status?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaboration_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "collaboration_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      collaboration_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_ai: boolean
          room_id: string
          user_id: string | null
          username: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_ai?: boolean
          room_id: string
          user_id?: string | null
          username: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_ai?: boolean
          room_id?: string
          user_id?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaboration_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "collaboration_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      collaboration_outputs: {
        Row: {
          code: string
          created_at: string
          id: string
          language: string
          output: string
          room_id: string
          user_id: string | null
          username: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          language: string
          output: string
          room_id: string
          user_id?: string | null
          username: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          language?: string
          output?: string
          room_id?: string
          user_id?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaboration_outputs_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "collaboration_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      collaboration_rooms: {
        Row: {
          created_at: string
          id: string
          max_users: number
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_users?: number
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          max_users?: number
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      generated_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          prompt: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          prompt: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          prompt?: string
          user_id?: string
        }
        Relationships: []
      }
      generated_videos: {
        Row: {
          created_at: string
          id: string
          prediction_id: string | null
          prompt: string
          status: string
          updated_at: string
          user_id: string
          video_url: string
        }
        Insert: {
          created_at?: string
          id?: string
          prediction_id?: string | null
          prompt: string
          status?: string
          updated_at?: string
          user_id: string
          video_url: string
        }
        Update: {
          created_at?: string
          id?: string
          prediction_id?: string | null
          prompt?: string
          status?: string
          updated_at?: string
          user_id?: string
          video_url?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_room_member: {
        Args: { _room_id: string; _user_id: string }
        Returns: boolean
      }
      is_room_owner: {
        Args: { _room_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
