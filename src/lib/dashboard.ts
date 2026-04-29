import type { Track } from "@/lib/domain";
import { TRACK_LABELS } from "@/lib/domain";
import type { EvaluationResult } from "@/lib/judge/schema";
import { getCurrentUser } from "@/lib/supabase/server";
import type { AttemptHistoryItem, ActivityDay, DashboardMetrics } from "@/lib/dashboard-types";

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

const TRACKS: Track[] = ["identity", "ethics", "knowledge"];
const VERDICTS: Array<EvaluationResult["verdict"]> = ["needs_work", "solid", "excellent"];
const VERDICT_LABELS: Record<EvaluationResult["verdict"], string> = {
  needs_work: "Needs work",
  solid: "Solid",
  excellent: "Excellent"
};

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function activityLevel(count: number): ActivityDay["level"] {
  if (count <= 0) {
    return 0;
  }

  if (count === 1) {
    return 1;
  }

  if (count === 2) {
    return 2;
  }

  if (count <= 4) {
    return 3;
  }

  return 4;
}

function percent(count: number, total: number) {
  if (!total) {
    return 0;
  }

  return Math.round((count / total) * 100);
}

export function formatTrackLabel(track: string | null | undefined) {
  if (track && track in TRACK_LABELS) {
    return TRACK_LABELS[track as Track];
  }

  return track ?? "Challenge";
}

export function buildDashboardMetrics(
  items: AttemptHistoryItem[],
  now = new Date()
): DashboardMetrics {
  const evaluatedItems = items.filter((item) => item.evaluation);
  const evaluatedSubmissions = evaluatedItems.length;
  const totalScore = evaluatedItems.reduce(
    (sum, item) => sum + (item.evaluation?.overallScore ?? 0),
    0
  );
  const averageScore = evaluatedSubmissions
    ? Math.round((totalScore / evaluatedSubmissions) * 10) / 10
    : null;

  const startDate = startOfLocalDay(now);
  startDate.setDate(startDate.getDate() - 83);

  const countsByDate = new Map<string, number>();
  items.forEach((item) => {
    const key = dateKey(new Date(item.createdAt));
    countsByDate.set(key, (countsByDate.get(key) ?? 0) + 1);
  });

  const activityDays = Array.from({ length: 84 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    const key = dateKey(date);
    const count = countsByDate.get(key) ?? 0;

    return {
      date: key,
      count,
      level: activityLevel(count)
    };
  });

  const scoreDistribution = VERDICTS.map((verdict) => {
    const count = evaluatedItems.filter((item) => item.evaluation?.verdict === verdict).length;

    return {
      verdict,
      label: VERDICT_LABELS[verdict],
      count,
      percent: percent(count, evaluatedSubmissions)
    };
  });

  const trackCounts = TRACKS.map((track) => {
    const count = evaluatedItems.filter((item) => item.challenge?.track === track).length;

    return {
      track,
      label: TRACK_LABELS[track],
      count,
      percent: percent(count, evaluatedSubmissions)
    };
  });

  return {
    totalSubmissions: items.length,
    evaluatedSubmissions,
    averageScore,
    activeDays: activityDays.filter((day) => day.count > 0).length,
    activityDays,
    scoreDistribution,
    trackCounts
  };
}

export async function getDashboardData(): Promise<{
  items: AttemptHistoryItem[];
  metrics: DashboardMetrics;
  isConfigured: boolean;
  isAuthenticated: boolean;
}> {
  const { supabase, user } = await getCurrentUser();

  if (!supabase) {
    return {
      items: [],
      metrics: buildDashboardMetrics([]),
      isConfigured: false,
      isAuthenticated: false
    };
  }

  if (!user) {
    return {
      items: [],
      metrics: buildDashboardMetrics([]),
      isConfigured: true,
      isAuthenticated: false
    };
  }

  const { data, error } = await supabase
    .from("attempts")
    .select(
      "id, answer, status, word_count, evaluation_error, created_at, challenges(slug, title, track), evaluations(clarity, argument_quality, counterargument, conceptual_depth, prompt_fit, overall_score, verdict, summary, strengths, weaknesses, revision_advice)"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return {
      items: [],
      metrics: buildDashboardMetrics([]),
      isConfigured: true,
      isAuthenticated: true
    };
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

  return {
    items,
    metrics: buildDashboardMetrics(items),
    isConfigured: true,
    isAuthenticated: true
  };
}
