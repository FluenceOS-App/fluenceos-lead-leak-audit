export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      lead_leak_audit_responses: {
        Row: {
          id: string;
          created_at: string;
          completed_at: string;
          audit_session_id: string;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          utm_content: string | null;
          utm_term: string | null;
          referrer: string | null;
          device_type: "mobile" | "tablet" | "desktop" | "unknown";
          answers_json: Json;
          primary_leak_category: string | null;
          primary_type: "current_leak" | "no_significant_leak";
          secondary_leak_category: string | null;
          secondary_type: "confirmed_leak" | "possible_underlying" | "watch_area" | null;
          confidence_state: "normal" | "reduced" | "reinforced";
          mixed_pattern: boolean;
          result_variant: string;
          score_breakdown_json: Json;
          result_meta_json: Json;
          reason_codes_json: Json;
          completion_seconds: number | null;
          cta_clicked: boolean;
          cta_clicked_at: string | null;
          cta_target: string | null;
          cta_variant: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          completed_at?: string;
          audit_session_id: string;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          utm_content?: string | null;
          utm_term?: string | null;
          referrer?: string | null;
          device_type?: "mobile" | "tablet" | "desktop" | "unknown";
          answers_json: Json;
          primary_leak_category?: string | null;
          primary_type: "current_leak" | "no_significant_leak";
          secondary_leak_category?: string | null;
          secondary_type?: "confirmed_leak" | "possible_underlying" | "watch_area" | null;
          confidence_state: "normal" | "reduced" | "reinforced";
          mixed_pattern?: boolean;
          result_variant: string;
          score_breakdown_json: Json;
          result_meta_json?: Json;
          reason_codes_json?: Json;
          completion_seconds?: number | null;
          cta_clicked?: boolean;
          cta_clicked_at?: string | null;
          cta_target?: string | null;
          cta_variant?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["lead_leak_audit_responses"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
