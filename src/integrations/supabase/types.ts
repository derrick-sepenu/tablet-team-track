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
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          new_values: Json | null
          old_values: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      field_workers: {
        Row: {
          assigned_project_id: string | null
          assigned_tablet_id: string | null
          assignment_date: string | null
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          staff_id: string
          updated_at: string
        }
        Insert: {
          assigned_project_id?: string | null
          assigned_tablet_id?: string | null
          assignment_date?: string | null
          created_at?: string
          full_name: string
          id?: string
          is_active?: boolean
          staff_id: string
          updated_at?: string
        }
        Update: {
          assigned_project_id?: string | null
          assigned_tablet_id?: string | null
          assignment_date?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          staff_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "field_workers_assigned_project_id_fkey"
            columns: ["assigned_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_workers_assigned_tablet_id_fkey"
            columns: ["assigned_tablet_id"]
            isOneToOne: false
            referencedRelation: "tablets"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          asset_tag: string | null
          assigned_to: string | null
          brand: string | null
          category: Database["public"]["Enums"]["inventory_category"]
          condition: Database["public"]["Enums"]["inventory_condition"]
          created_at: string
          id: string
          is_active: boolean
          item_name: string
          location: string | null
          model: string | null
          notes: string | null
          purchase_date: string | null
          purchase_price: number | null
          quantity: number
          serial_number: string | null
          updated_at: string
          warranty_expiry: string | null
        }
        Insert: {
          asset_tag?: string | null
          assigned_to?: string | null
          brand?: string | null
          category?: Database["public"]["Enums"]["inventory_category"]
          condition?: Database["public"]["Enums"]["inventory_condition"]
          created_at?: string
          id?: string
          is_active?: boolean
          item_name: string
          location?: string | null
          model?: string | null
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          quantity?: number
          serial_number?: string | null
          updated_at?: string
          warranty_expiry?: string | null
        }
        Update: {
          asset_tag?: string | null
          assigned_to?: string | null
          brand?: string | null
          category?: Database["public"]["Enums"]["inventory_category"]
          condition?: Database["public"]["Enums"]["inventory_condition"]
          created_at?: string
          id?: string
          is_active?: boolean
          item_name?: string
          location?: string | null
          model?: string | null
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          quantity?: number
          serial_number?: string | null
          updated_at?: string
          warranty_expiry?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          last_password_change: string | null
          must_change_password: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_active?: boolean
          last_password_change?: string | null
          must_change_password?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          last_password_change?: string | null
          must_change_password?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          data_manager_id: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_manager_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_manager_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_data_manager_id_fkey"
            columns: ["data_manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      repair_requests: {
        Row: {
          assigned_technician: string | null
          completed_at: string | null
          id: string
          priority: Database["public"]["Enums"]["priority_level"]
          problem_description: string
          requested_at: string
          requested_by_id: string
          status: Database["public"]["Enums"]["repair_status"]
          status_notes: string | null
          tablet_id: string
          updated_at: string
        }
        Insert: {
          assigned_technician?: string | null
          completed_at?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          problem_description: string
          requested_at?: string
          requested_by_id: string
          status?: Database["public"]["Enums"]["repair_status"]
          status_notes?: string | null
          tablet_id: string
          updated_at?: string
        }
        Update: {
          assigned_technician?: string | null
          completed_at?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          problem_description?: string
          requested_at?: string
          requested_by_id?: string
          status?: Database["public"]["Enums"]["repair_status"]
          status_notes?: string | null
          tablet_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "repair_requests_requested_by_id_fkey"
            columns: ["requested_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repair_requests_tablet_id_fkey"
            columns: ["tablet_id"]
            isOneToOne: false
            referencedRelation: "tablets"
            referencedColumns: ["id"]
          },
        ]
      }
      tablets: {
        Row: {
          assigned_project_id: string | null
          created_at: string
          date_assigned: string | null
          id: string
          model: string
          notes: string | null
          serial_number: string
          sim_number: string | null
          status: Database["public"]["Enums"]["tablet_status"]
          tablet_id: string
          updated_at: string
        }
        Insert: {
          assigned_project_id?: string | null
          created_at?: string
          date_assigned?: string | null
          id?: string
          model: string
          notes?: string | null
          serial_number: string
          sim_number?: string | null
          status?: Database["public"]["Enums"]["tablet_status"]
          tablet_id: string
          updated_at?: string
        }
        Update: {
          assigned_project_id?: string | null
          created_at?: string
          date_assigned?: string | null
          id?: string
          model?: string
          notes?: string | null
          serial_number?: string
          sim_number?: string | null
          status?: Database["public"]["Enums"]["tablet_status"]
          tablet_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tablets_assigned_project_id_fkey"
            columns: ["assigned_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_audit_log: {
        Args: {
          p_action: string
          p_entity_id: string
          p_entity_type: string
          p_new_values: Json
          p_old_values: Json
        }
        Returns: undefined
      }
      generate_tablet_id: { Args: never; Returns: string }
      get_current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_data_manager_of_project: {
        Args: { project_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "super_admin" | "data_manager"
      inventory_category:
        | "laptop"
        | "desktop"
        | "mouse"
        | "keyboard"
        | "monitor"
        | "printer"
        | "networking"
        | "storage"
        | "accessories"
        | "other"
      inventory_condition:
        | "new"
        | "good"
        | "fair"
        | "poor"
        | "damaged"
        | "decommissioned"
      priority_level: "low" | "medium" | "high"
      repair_status: "pending" | "in_progress" | "completed"
      tablet_status:
        | "available"
        | "assigned"
        | "in_repair"
        | "lost"
        | "returned"
      user_role: "super_admin" | "data_manager"
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
      app_role: ["super_admin", "data_manager"],
      inventory_category: [
        "laptop",
        "desktop",
        "mouse",
        "keyboard",
        "monitor",
        "printer",
        "networking",
        "storage",
        "accessories",
        "other",
      ],
      inventory_condition: [
        "new",
        "good",
        "fair",
        "poor",
        "damaged",
        "decommissioned",
      ],
      priority_level: ["low", "medium", "high"],
      repair_status: ["pending", "in_progress", "completed"],
      tablet_status: ["available", "assigned", "in_repair", "lost", "returned"],
      user_role: ["super_admin", "data_manager"],
    },
  },
} as const
