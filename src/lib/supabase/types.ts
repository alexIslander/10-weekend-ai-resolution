export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      reveals: {
        Row: {
          id: string;
          purchaser_email: string;
          purchaser_user_id: string | null;
          name: string | null;
          status: string;
          respondent_name: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          purchaser_email: string;
          purchaser_user_id?: string | null;
          name?: string | null;
          status?: string;
          respondent_name?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["reveals"]["Row"]>;
      };
      questions: {
        Row: {
          id: string;
          prompt: string;
          sort_order: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          prompt: string;
          sort_order: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["questions"]["Row"]>;
      };
      answers: {
        Row: {
          id: string;
          reveal_id: string;
          question_id: string;
          response: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          reveal_id: string;
          question_id: string;
          response: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["answers"]["Row"]>;
      };
      coupons: {
        Row: {
          id: string;
          code: string;
          percent_off: number;
          active: boolean;
          expires_at: string | null;
          max_redemptions: number | null;
          redemptions: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          percent_off: number;
          active?: boolean;
          expires_at?: string | null;
          max_redemptions?: number | null;
          redemptions?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["coupons"]["Row"]>;
      };
      coupon_attempts: {
        Row: {
          id: string;
          attempt_key: string;
          attempts: number;
          cooldown_until: string | null;
          banned_until: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          attempt_key: string;
          attempts?: number;
          cooldown_until?: string | null;
          banned_until?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["coupon_attempts"]["Row"]>;
      };
      feature_flags: {
        Row: {
          id: string;
          key: string;
          enabled: boolean;
          config: Json;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          enabled?: boolean;
          config?: Json;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["feature_flags"]["Row"]>;
      };
      admin_audit_logs: {
        Row: {
          id: string;
          admin_user_id: string | null;
          action: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_user_id?: string | null;
          action: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["admin_audit_logs"]["Row"]>;
      };
    };
  };
};
