import type { EvaluationResult } from "@/lib/judge/schema";
import { getCurrentUser } from "@/lib/supabase/server";

export type AttemptHistoryItem = {
  id: string;
  answer: string;
  status: "draft" | "evaluated" | "failed";
  wordCount: number;
  evaluationError: string | null;
  createdAt: string;
  challenge: {
    slug: string;
    title: string;
    track: string;
  } | null;
  evaluation: EvaluationResult | null;
};

type HistoryRow = {
  id: string;
  answer: string;
  status: "draft" | "evaluated" | "failed";
  word_count: number;
  evaluation_error: string | null;
  created_at: string;
  challenges: {
    slug: string;
    title: string;
    track: string;
  } | null;
  evaluations:
    | Array<{
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
      }>
    | null;
};

export async function getAttemptHistory(): Promise<{
  items: AttemptHistoryItem[];
  isConfigured: boolean;
  isAuthenticated: boolean;
}> {
  const { supabase, user } = await getCurrentUser();

  if (!supabase) {
    return { items: [], isConfigured: false, isAuthenticated: false };
  }

  if (!user) {
    return { items: [], isConfigured: true, isAuthenticated: false };
  }

  const { data, error } = await supabase
    .from("attempts")
    .select(
      "id, answer, status, word_count, evaluation_error, created_at, challenges(slug, title, track), evaluations(clarity, argument_quality, counterargument, conceptual_depth, prompt_fit, overall_score, verdict, summary, strengths, weaknesses, revision_advice)"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return { items: [], isConfigured: true, isAuthenticated: true };
  }

  const items = (data as unknown as HistoryRow[]).map((row) => {
    const evaluation = row.evaluations?.[0] ?? null;

    return {
      id: row.id,
      answer: row.answer,
      status: row.status,
      wordCount: row.word_count,
      evaluationError: row.evaluation_error,
      createdAt: row.created_at,
      challenge: row.challenges,
      evaluation: evaluation
        ? {
            clarity: evaluation.clarity,
            argumentQuality: evaluation.argument_quality,
            counterargument: evaluation.counterargument,
            conceptualDepth: evaluation.conceptual_depth,
            promptFit: evaluation.prompt_fit,
            overallScore: evaluation.overall_score,
            verdict: evaluation.verdict,
            summary: evaluation.summary,
            strengths: evaluation.strengths,
            weaknesses: evaluation.weaknesses,
            revisionAdvice: evaluation.revision_advice
          }
        : null
    };
  });

  return { items, isConfigured: true, isAuthenticated: true };
}
