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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          amount: number
          created_at: string
          id: string
          provider_id: string
          service_id: string | null
          slot_id: string
          status: Database["public"]["Enums"]["booking_status"]
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          provider_id: string
          service_id?: string | null
          slot_id: string
          status?: Database["public"]["Enums"]["booking_status"]
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          provider_id?: string
          service_id?: string | null
          slot_id?: string
          status?: Database["public"]["Enums"]["booking_status"]
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          price: number
          provider_id: string
          sessions: number
          validity_days: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          price?: number
          provider_id: string
          sessions?: number
          validity_days?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          provider_id?: string
          sessions?: number
          validity_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "plans_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      providers: {
        Row: {
          address: string | null
          area: string
          category: Database["public"]["Enums"]["provider_category"]
          city: string
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          owner_id: string | null
          phone: string | null
          price_from: number
          rating: number
          rating_count: number
        }
        Insert: {
          address?: string | null
          area: string
          category: Database["public"]["Enums"]["provider_category"]
          city?: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          owner_id?: string | null
          phone?: string | null
          price_from?: number
          rating?: number
          rating_count?: number
        }
        Update: {
          address?: string | null
          area?: string
          category?: Database["public"]["Enums"]["provider_category"]
          city?: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          owner_id?: string | null
          phone?: string | null
          price_from?: number
          rating?: number
          rating_count?: number
        }
        Relationships: []
      }
      reviews: {
        Row: {
          author_name: string | null
          comment: string | null
          created_at: string
          id: string
          provider_id: string
          rating: number
          user_id: string
        }
        Insert: {
          author_name?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          provider_id: string
          rating: number
          user_id: string
        }
        Update: {
          author_name?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          provider_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          description: string | null
          duration_min: number
          id: string
          is_active: boolean
          name: string
          price: number
          provider_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_min?: number
          id?: string
          is_active?: boolean
          name: string
          price?: number
          provider_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_min?: number
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          provider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      slots: {
        Row: {
          booked_count: number
          capacity: number
          created_at: string
          ends_at: string
          id: string
          provider_id: string
          service_id: string | null
          starts_at: string
        }
        Insert: {
          booked_count?: number
          capacity?: number
          created_at?: string
          ends_at: string
          id?: string
          provider_id: string
          service_id?: string | null
          starts_at: string
        }
        Update: {
          booked_count?: number
          capacity?: number
          created_at?: string
          ends_at?: string
          id?: string
          provider_id?: string
          service_id?: string | null
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "slots_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slots_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount_paid: number
          created_at: string
          expires_at: string
          id: string
          plan_id: string
          provider_id: string
          sessions_remaining: number
          sessions_total: number
          status: string
          user_id: string
        }
        Insert: {
          amount_paid?: number
          created_at?: string
          expires_at: string
          id?: string
          plan_id: string
          provider_id: string
          sessions_remaining: number
          sessions_total: number
          status?: string
          user_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          expires_at?: string
          id?: string
          plan_id?: string
          provider_id?: string
          sessions_remaining?: number
          sessions_total?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      book_slot: {
        Args: { p_slot_id: string; p_subscription_id?: string }
        Returns: string
      }
      cancel_booking: { Args: { p_booking_id: string }; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "consumer" | "provider" | "admin"
      booking_status: "confirmed" | "cancelled" | "completed"
      provider_category: "gym" | "salon" | "tuition" | "sports" | "dance_yoga"
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
      app_role: ["consumer", "provider", "admin"],
      booking_status: ["confirmed", "cancelled", "completed"],
      provider_category: ["gym", "salon", "tuition", "sports", "dance_yoga"],
    },
  },
} as const
