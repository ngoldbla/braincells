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
      cells: {
        Row: {
          column_id: string
          created_at: string | null
          error: string | null
          generating: boolean | null
          id: string
          row_index: number
          sources: Json | null
          updated_at: string | null
          validated: boolean | null
          value: string | null
        }
        Insert: {
          column_id: string
          created_at?: string | null
          error?: string | null
          generating?: boolean | null
          id?: string
          row_index: number
          sources?: Json | null
          updated_at?: string | null
          validated?: boolean | null
          value?: string | null
        }
        Update: {
          column_id?: string
          created_at?: string | null
          error?: string | null
          generating?: boolean | null
          id?: string
          row_index?: number
          sources?: Json | null
          updated_at?: string | null
          validated?: boolean | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cells_column_id_fkey"
            columns: ["column_id"]
            isOneToOne: false
            referencedRelation: "columns"
            referencedColumns: ["id"]
          },
        ]
      }
      columns: {
        Row: {
          created_at: string | null
          dataset_id: string
          id: string
          kind: string
          name: string
          position: number
          type: string
          updated_at: string | null
          visible: boolean | null
        }
        Insert: {
          created_at?: string | null
          dataset_id: string
          id?: string
          kind?: string
          name: string
          position?: number
          type?: string
          updated_at?: string | null
          visible?: boolean | null
        }
        Update: {
          created_at?: string | null
          dataset_id?: string
          id?: string
          kind?: string
          name?: string
          position?: number
          type?: string
          updated_at?: string | null
          visible?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "columns_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
        ]
      }
      datasets: {
        Row: {
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      process_columns: {
        Row: {
          column_id: string
          id: string
          process_id: string
        }
        Insert: {
          column_id: string
          id?: string
          process_id: string
        }
        Update: {
          column_id?: string
          id?: string
          process_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_columns_column_id_fkey"
            columns: ["column_id"]
            isOneToOne: false
            referencedRelation: "columns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_columns_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      processes: {
        Row: {
          column_id: string
          created_at: string | null
          id: string
          model_name: string
          model_provider: string
          prompt: string
          search_enabled: boolean | null
          updated_at: string | null
          use_custom_endpoint: boolean | null
        }
        Insert: {
          column_id: string
          created_at?: string | null
          id?: string
          model_name: string
          model_provider?: string
          prompt: string
          search_enabled?: boolean | null
          updated_at?: string | null
          use_custom_endpoint?: boolean | null
        }
        Update: {
          column_id?: string
          created_at?: string | null
          id?: string
          model_name?: string
          model_provider?: string
          prompt?: string
          search_enabled?: boolean | null
          updated_at?: string | null
          use_custom_endpoint?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "processes_column_id_fkey"
            columns: ["column_id"]
            isOneToOne: false
            referencedRelation: "columns"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_column_cell_count: { Args: { col_id: string }; Returns: number }
    }
    Enums: {
      [_ in never]: never
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
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
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
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
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
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
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
