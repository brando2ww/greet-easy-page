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
      admin_payment_config: {
        Row: {
          account_email: string | null
          account_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          provider: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_email?: string | null
          account_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          provider: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_email?: string | null
          account_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          provider?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      billing_info: {
        Row: {
          city: string | null
          complement: string | null
          cpf: string | null
          created_at: string | null
          full_name: string | null
          id: string
          neighborhood: string | null
          number: string | null
          state: string | null
          street_address: string | null
          updated_at: string | null
          user_id: string
          zip_code: string | null
        }
        Insert: {
          city?: string | null
          complement?: string | null
          cpf?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          neighborhood?: string | null
          number?: string | null
          state?: string | null
          street_address?: string | null
          updated_at?: string | null
          user_id: string
          zip_code?: string | null
        }
        Update: {
          city?: string | null
          complement?: string | null
          cpf?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          neighborhood?: string | null
          number?: string | null
          state?: string | null
          street_address?: string | null
          updated_at?: string | null
          user_id?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      chargers: {
        Row: {
          client_id: string | null
          connector_type: string
          created_at: string | null
          firmware_version: string | null
          id: string
          last_heartbeat: string | null
          latitude: number | null
          location: string
          longitude: number | null
          name: string
          ocpp_charge_point_id: string | null
          ocpp_error_code: string | null
          ocpp_model: string | null
          ocpp_protocol_status: string | null
          ocpp_vendor: string | null
          partner_client_id: string | null
          power: number
          price_per_kwh: number
          serial_number: string | null
          status: Database["public"]["Enums"]["charger_status"]
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          connector_type: string
          created_at?: string | null
          firmware_version?: string | null
          id?: string
          last_heartbeat?: string | null
          latitude?: number | null
          location: string
          longitude?: number | null
          name: string
          ocpp_charge_point_id?: string | null
          ocpp_error_code?: string | null
          ocpp_model?: string | null
          ocpp_protocol_status?: string | null
          ocpp_vendor?: string | null
          partner_client_id?: string | null
          power: number
          price_per_kwh?: number
          serial_number?: string | null
          status?: Database["public"]["Enums"]["charger_status"]
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          connector_type?: string
          created_at?: string | null
          firmware_version?: string | null
          id?: string
          last_heartbeat?: string | null
          latitude?: number | null
          location?: string
          longitude?: number | null
          name?: string
          ocpp_charge_point_id?: string | null
          ocpp_error_code?: string | null
          ocpp_model?: string | null
          ocpp_protocol_status?: string | null
          ocpp_vendor?: string | null
          partner_client_id?: string | null
          power?: number
          price_per_kwh?: number
          serial_number?: string | null
          status?: Database["public"]["Enums"]["charger_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chargers_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chargers_partner_client_id_fkey"
            columns: ["partner_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      charging_sessions: {
        Row: {
          charger_id: string
          cost: number | null
          created_at: string
          ended_at: string | null
          energy_consumed: number | null
          id: string
          id_tag: string | null
          meter_start: number | null
          meter_stop: number | null
          started_at: string
          status: string
          stop_reason: string | null
          transaction_id: number | null
          updated_at: string
          user_id: string
          vehicle_info: string | null
        }
        Insert: {
          charger_id: string
          cost?: number | null
          created_at?: string
          ended_at?: string | null
          energy_consumed?: number | null
          id?: string
          id_tag?: string | null
          meter_start?: number | null
          meter_stop?: number | null
          started_at?: string
          status?: string
          stop_reason?: string | null
          transaction_id?: number | null
          updated_at?: string
          user_id: string
          vehicle_info?: string | null
        }
        Update: {
          charger_id?: string
          cost?: number | null
          created_at?: string
          ended_at?: string | null
          energy_consumed?: number | null
          id?: string
          id_tag?: string | null
          meter_start?: number | null
          meter_stop?: number | null
          started_at?: string
          status?: string
          stop_reason?: string | null
          transaction_id?: number | null
          updated_at?: string
          user_id?: string
          vehicle_info?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "charging_sessions_charger_id_fkey"
            columns: ["charger_id"]
            isOneToOne: false
            referencedRelation: "chargers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "charging_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          city: string | null
          cnpj: string | null
          company_name: string
          created_at: string
          email: string
          id: string
          phone: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          cnpj?: string | null
          company_name: string
          created_at?: string
          email: string
          id?: string
          phone?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          cnpj?: string | null
          company_name?: string
          created_at?: string
          email?: string
          id?: string
          phone?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      meter_values: {
        Row: {
          connector_id: number | null
          context: string | null
          created_at: string
          id: string
          measurand: string
          phase: string | null
          session_id: string | null
          timestamp: string
          transaction_id: number | null
          unit: string
          value: number
        }
        Insert: {
          connector_id?: number | null
          context?: string | null
          created_at?: string
          id?: string
          measurand?: string
          phase?: string | null
          session_id?: string | null
          timestamp?: string
          transaction_id?: number | null
          unit?: string
          value: number
        }
        Update: {
          connector_id?: number | null
          context?: string | null
          created_at?: string
          id?: string
          measurand?: string
          phase?: string | null
          session_id?: string | null
          timestamp?: string
          transaction_id?: number | null
          unit?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "meter_values_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "charging_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          autonomy: number | null
          battery_capacity: number
          brand: string
          chassi: string | null
          color: string
          created_at: string | null
          id: string
          model: string
          plate: string | null
          plug_type: string
          type: Database["public"]["Enums"]["vehicle_type"]
          updated_at: string | null
          user_id: string
          year: number
        }
        Insert: {
          autonomy?: number | null
          battery_capacity: number
          brand: string
          chassi?: string | null
          color: string
          created_at?: string | null
          id?: string
          model: string
          plate?: string | null
          plug_type: string
          type: Database["public"]["Enums"]["vehicle_type"]
          updated_at?: string | null
          user_id: string
          year: number
        }
        Update: {
          autonomy?: number | null
          battery_capacity?: number
          brand?: string
          chassi?: string | null
          color?: string
          created_at?: string | null
          id?: string
          model?: string
          plate?: string | null
          plug_type?: string
          type?: Database["public"]["Enums"]["vehicle_type"]
          updated_at?: string | null
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      wallet_balances: {
        Row: {
          balance: number
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          status: Database["public"]["Enums"]["wallet_transaction_status"]
          stripe_session_id: string | null
          type: Database["public"]["Enums"]["wallet_transaction_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          status?: Database["public"]["Enums"]["wallet_transaction_status"]
          stripe_session_id?: string | null
          type: Database["public"]["Enums"]["wallet_transaction_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          status?: Database["public"]["Enums"]["wallet_transaction_status"]
          stripe_session_id?: string | null
          type?: Database["public"]["Enums"]["wallet_transaction_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "support" | "user"
      charger_status: "available" | "in_use" | "maintenance" | "offline"
      vehicle_type: "hybrid" | "electric"
      wallet_transaction_status:
        | "pending"
        | "completed"
        | "failed"
        | "cancelled"
      wallet_transaction_type: "deposit" | "withdrawal" | "charge"
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
      app_role: ["admin", "support", "user"],
      charger_status: ["available", "in_use", "maintenance", "offline"],
      vehicle_type: ["hybrid", "electric"],
      wallet_transaction_status: [
        "pending",
        "completed",
        "failed",
        "cancelled",
      ],
      wallet_transaction_type: ["deposit", "withdrawal", "charge"],
    },
  },
} as const
