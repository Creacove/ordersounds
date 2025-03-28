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
      beats: {
        Row: {
          audio_file: string | null
          audio_preview: string | null
          basic_license_price_diaspora: number | null
          basic_license_price_local: number | null
          bpm: number | null
          cover_image: string | null
          custom_license_price_diaspora: number | null
          custom_license_price_local: number | null
          description: string | null
          exclusive_license_price_diaspora: number | null
          exclusive_license_price_local: number | null
          favorites_count: number | null
          genre: string | null
          id: string
          key: string | null
          license_terms: string | null
          license_type: string | null
          plays: number | null
          premium_license_price_diaspora: number | null
          premium_license_price_local: number | null
          producer_id: string
          purchase_count: number | null
          status: string | null
          tags: string[] | null
          title: string
          track_type: string | null
          upload_date: string | null
        }
        Insert: {
          audio_file?: string | null
          audio_preview?: string | null
          basic_license_price_diaspora?: number | null
          basic_license_price_local?: number | null
          bpm?: number | null
          cover_image?: string | null
          custom_license_price_diaspora?: number | null
          custom_license_price_local?: number | null
          description?: string | null
          exclusive_license_price_diaspora?: number | null
          exclusive_license_price_local?: number | null
          favorites_count?: number | null
          genre?: string | null
          id?: string
          key?: string | null
          license_terms?: string | null
          license_type?: string | null
          plays?: number | null
          premium_license_price_diaspora?: number | null
          premium_license_price_local?: number | null
          producer_id: string
          purchase_count?: number | null
          status?: string | null
          tags?: string[] | null
          title: string
          track_type?: string | null
          upload_date?: string | null
        }
        Update: {
          audio_file?: string | null
          audio_preview?: string | null
          basic_license_price_diaspora?: number | null
          basic_license_price_local?: number | null
          bpm?: number | null
          cover_image?: string | null
          custom_license_price_diaspora?: number | null
          custom_license_price_local?: number | null
          description?: string | null
          exclusive_license_price_diaspora?: number | null
          exclusive_license_price_local?: number | null
          favorites_count?: number | null
          genre?: string | null
          id?: string
          key?: string | null
          license_terms?: string | null
          license_type?: string | null
          plays?: number | null
          premium_license_price_diaspora?: number | null
          premium_license_price_local?: number | null
          producer_id?: string
          purchase_count?: number | null
          status?: string | null
          tags?: string[] | null
          title?: string
          track_type?: string | null
          upload_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "beats_producer_id_fkey"
            columns: ["producer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      line_items: {
        Row: {
          beat_id: string
          currency_code: string
          id: string
          order_id: string
          price_charged: number
          quantity: number | null
        }
        Insert: {
          beat_id: string
          currency_code: string
          id?: string
          order_id: string
          price_charged: number
          quantity?: number | null
        }
        Update: {
          beat_id?: string
          currency_code?: string
          id?: string
          order_id?: string
          price_charged?: number
          quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "line_items_beat_id_fkey"
            columns: ["beat_id"]
            isOneToOne: false
            referencedRelation: "beats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "line_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_date: string | null
          id: string
          is_read: boolean | null
          recipient_id: string
          title: string
        }
        Insert: {
          body: string
          created_date?: string | null
          id?: string
          is_read?: boolean | null
          recipient_id: string
          title: string
        }
        Update: {
          body?: string
          created_date?: string | null
          id?: string
          is_read?: boolean | null
          recipient_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer_id: string
          consent_timestamp: string | null
          currency_used: string
          id: string
          order_date: string | null
          payment_method: string
          status: string | null
          total_price: number
        }
        Insert: {
          buyer_id: string
          consent_timestamp?: string | null
          currency_used: string
          id?: string
          order_date?: string | null
          payment_method: string
          status?: string | null
          total_price: number
        }
        Update: {
          buyer_id?: string
          consent_timestamp?: string | null
          currency_used?: string
          id?: string
          order_date?: string | null
          payment_method?: string
          status?: string | null
          total_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          beats: string[] | null
          cover_image: string | null
          created_date: string | null
          id: string
          is_public: boolean | null
          name: string
          owner_id: string
        }
        Insert: {
          beats?: string[] | null
          cover_image?: string | null
          created_date?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          owner_id: string
        }
        Update: {
          beats?: string[] | null
          cover_image?: string | null
          created_date?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlists_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      royalty_splits: {
        Row: {
          beat_id: string
          created_date: string | null
          id: string
          party_email: string | null
          party_id: string | null
          party_name: string | null
          party_role: string | null
          percentage: number
        }
        Insert: {
          beat_id: string
          created_date?: string | null
          id?: string
          party_email?: string | null
          party_id?: string | null
          party_name?: string | null
          party_role?: string | null
          percentage: number
        }
        Update: {
          beat_id?: string
          created_date?: string | null
          id?: string
          party_email?: string | null
          party_id?: string | null
          party_name?: string | null
          party_role?: string | null
          percentage?: number
        }
        Relationships: [
          {
            foreignKeyName: "royalty_splits_beat_id_fkey"
            columns: ["beat_id"]
            isOneToOne: false
            referencedRelation: "beats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "royalty_splits_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_purchased_beats: {
        Row: {
          beat_id: string
          currency_code: string
          id: string
          license_type: string | null
          order_id: string
          purchase_date: string | null
          user_id: string
        }
        Insert: {
          beat_id: string
          currency_code: string
          id?: string
          license_type?: string | null
          order_id: string
          purchase_date?: string | null
          user_id: string
        }
        Update: {
          beat_id?: string
          currency_code?: string
          id?: string
          license_type?: string | null
          order_id?: string
          purchase_date?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_purchased_beats_beat_id_fkey"
            columns: ["beat_id"]
            isOneToOne: false
            referencedRelation: "beats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_purchased_beats_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_purchased_beats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          bio: string | null
          country: string | null
          created_date: string | null
          email: string
          favorites: Json | null
          featured_beats: Json | null
          full_name: string
          id: string
          notifications_opt_in: boolean | null
          password_hash: string
          paystack_id: string | null
          profile_picture: string | null
          role: string
          settings: Json | null
          stage_name: string | null
          storefront_url: string | null
          stripe_id: string | null
        }
        Insert: {
          bio?: string | null
          country?: string | null
          created_date?: string | null
          email: string
          favorites?: Json | null
          featured_beats?: Json | null
          full_name: string
          id?: string
          notifications_opt_in?: boolean | null
          password_hash: string
          paystack_id?: string | null
          profile_picture?: string | null
          role: string
          settings?: Json | null
          stage_name?: string | null
          storefront_url?: string | null
          stripe_id?: string | null
        }
        Update: {
          bio?: string | null
          country?: string | null
          created_date?: string | null
          email?: string
          favorites?: Json | null
          featured_beats?: Json | null
          full_name?: string
          id?: string
          notifications_opt_in?: boolean | null
          password_hash?: string
          paystack_id?: string | null
          profile_picture?: string | null
          role?: string
          settings?: Json | null
          stage_name?: string | null
          storefront_url?: string | null
          stripe_id?: string | null
        }
        Relationships: []
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
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
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
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
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
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
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
