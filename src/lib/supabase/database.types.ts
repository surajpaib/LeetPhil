export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          created_at?: string;
        };
        Update: {
          display_name?: string | null;
        };
        Relationships: [];
      };
      challenges: {
        Row: {
          id: string;
          slug: string;
          title: string;
          track: string;
          difficulty: string;
          estimated_minutes: number;
          prompt: string;
          context: string;
          rubric_notes: string[];
          tags: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          track: string;
          difficulty: string;
          estimated_minutes: number;
          prompt: string;
          context: string;
          rubric_notes?: string[];
          tags?: string[];
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["challenges"]["Insert"]>;
        Relationships: [];
      };
      attempts: {
        Row: {
          id: string;
          user_id: string;
          challenge_id: string;
          answer: string;
          status: "draft" | "evaluated" | "failed";
          word_count: number;
          evaluation_error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          challenge_id: string;
          answer: string;
          status?: "draft" | "evaluated" | "failed";
          word_count: number;
          evaluation_error?: string | null;
          created_at?: string;
        };
        Update: {
          status?: "draft" | "evaluated" | "failed";
          evaluation_error?: string | null;
        };
        Relationships: [];
      };
      evaluations: {
        Row: {
          id: string;
          attempt_id: string;
          user_id: string;
          challenge_id: string;
          clarity: number;
          argument_quality: number;
          counterargument: number;
          conceptual_depth: number;
          prompt_fit: number;
          overall_score: number;
          verdict: "needs_work" | "solid" | "excellent";
          summary: string;
          strengths: string;
          weaknesses: string;
          revision_advice: string;
          raw: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          attempt_id: string;
          user_id: string;
          challenge_id: string;
          clarity: number;
          argument_quality: number;
          counterargument: number;
          conceptual_depth: number;
          prompt_fit: number;
          overall_score: number;
          verdict: "needs_work" | "solid" | "excellent";
          summary: string;
          strengths: string;
          weaknesses: string;
          revision_advice: string;
          raw: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["evaluations"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
