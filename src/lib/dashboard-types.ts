import type { Track } from "@/lib/domain";
import { TRACK_LABELS } from "@/lib/domain";
import type { EvaluationResult } from "@/lib/judge/schema";

export function formatTrackLabel(track: string | null | undefined) {
  if (track && track in TRACK_LABELS) {
    return TRACK_LABELS[track as Track];
  }

  return track ?? "Challenge";
}

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

export type ActivityDay = {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
};

export type DashboardMetrics = {
  totalSubmissions: number;
  evaluatedSubmissions: number;
  averageScore: number | null;
  activeDays: number;
  activityDays: ActivityDay[];
  scoreDistribution: Array<{
    verdict: EvaluationResult["verdict"];
    label: string;
    count: number;
    percent: number;
  }>;
  trackCounts: Array<{
    track: Track;
    label: string;
    count: number;
    percent: number;
  }>;
};
