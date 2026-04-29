import type { Track } from "@/lib/domain";
import { TRACK_LABELS } from "@/lib/domain";
import type { EvaluationResult } from "@/lib/judge/schema";
import { getCurrentUser } from "@/lib/supabase/server";
import type { AttemptHistoryItem, ActivityDay, DashboardMetrics } from "@/lib/dashboard-types";

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

  const { data: attemptsData, error: attemptsError } = await supabase
    .from("attempts")
    .select("id, answer, status, word_count, evaluation_error, created_at, challenge_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (attemptsError || !attemptsData) {
    return {
      items: [],
      metrics: buildDashboardMetrics([]),
      isConfigured: true,
      isAuthenticated: true
    };
  }

  const attemptIds = attemptsData.map((a) => a.id);
  const { data: evaluationsData } = await supabase
    .from("evaluations")
    .select("attempt_id, clarity, argument_quality, counterargument, conceptual_depth, prompt_fit, overall_score, verdict, summary, strengths, weaknesses, revision_advice")
    .in("attempt_id", attemptIds);

  const evaluationsByAttempt = new Map<string, {
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
  }>();

  if (evaluationsData) {
    for (const ev of evaluationsData) {
      evaluationsByAttempt.set(ev.attempt_id, ev);
    }
  }

  const { data: challengesData } = await supabase
    .from("challenges")
    .select("id, slug, title, track")
    .in(
      "id",
      attemptsData.map((a) => a.challenge_id)
    );

  const challengesById = new Map<string, { slug: string; title: string; track: string }>();
  if (challengesData) {
    for (const c of challengesData) {
      challengesById.set(c.id, c);
    }
  }

  const items = attemptsData.map((row) => {
    const evaluation = evaluationsByAttempt.get(row.id) ?? null;
    const challenge = challengesById.get(row.challenge_id) ?? null;

    return {
      id: row.id,
      answer: row.answer,
      status: row.status,
      wordCount: row.word_count,
      evaluationError: row.evaluation_error,
      createdAt: row.created_at,
      challenge: challenge
        ? { slug: challenge.slug, title: challenge.title, track: challenge.track }
        : null,
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
