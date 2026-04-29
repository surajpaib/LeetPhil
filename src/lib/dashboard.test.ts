import { describe, expect, it } from "vitest";
import type { AttemptHistoryItem } from "@/lib/dashboard";
import { buildDashboardMetrics } from "@/lib/dashboard";
import type { EvaluationResult } from "@/lib/judge/schema";

const baseEvaluation: EvaluationResult = {
  clarity: 7,
  argumentQuality: 7,
  counterargument: 7,
  conceptualDepth: 7,
  promptFit: 7,
  overallScore: 7,
  verdict: "solid",
  summary: "Clear enough.",
  strengths: "The argument has a thesis.",
  weaknesses: "The objection is thin.",
  revisionAdvice: "Sharpen the counterargument."
};

function item(overrides: Partial<AttemptHistoryItem>): AttemptHistoryItem {
  return {
    id: "attempt",
    answer: "answer",
    status: "evaluated",
    wordCount: 180,
    evaluationError: null,
    createdAt: "2026-04-28T12:00:00.000Z",
    challenge: {
      slug: "the-mirror-room",
      title: "The Mirror Room",
      track: "identity"
    },
    evaluation: baseEvaluation,
    ...overrides
  };
}

describe("buildDashboardMetrics", () => {
  it("counts all submissions in the activity grid", () => {
    const metrics = buildDashboardMetrics(
      [
        item({ id: "evaluated", createdAt: "2026-04-28T12:00:00.000Z" }),
        item({
          id: "failed",
          status: "failed",
          createdAt: "2026-04-28T13:00:00.000Z",
          evaluation: null,
          evaluationError: "provider failed"
        }),
        item({
          id: "draft",
          status: "draft",
          createdAt: "2026-04-27T13:00:00.000Z",
          evaluation: null
        })
      ],
      new Date("2026-04-28T18:00:00")
    );

    expect(metrics.totalSubmissions).toBe(3);
    expect(metrics.activityDays.find((day) => day.date === "2026-04-28")?.count).toBe(2);
    expect(metrics.activityDays.find((day) => day.date === "2026-04-27")?.count).toBe(1);
    expect(metrics.activeDays).toBe(2);
  });

  it("calculates average score from evaluated attempts only", () => {
    const metrics = buildDashboardMetrics([
      item({ id: "first", evaluation: { ...baseEvaluation, overallScore: 8 } }),
      item({ id: "second", evaluation: { ...baseEvaluation, overallScore: 6 } }),
      item({ id: "failed", status: "failed", evaluation: null })
    ]);

    expect(metrics.evaluatedSubmissions).toBe(2);
    expect(metrics.averageScore).toBe(7);
  });

  it("uses only evaluated attempts for verdict distribution", () => {
    const metrics = buildDashboardMetrics([
      item({ id: "needs-work", evaluation: { ...baseEvaluation, verdict: "needs_work" } }),
      item({ id: "solid", evaluation: { ...baseEvaluation, verdict: "solid" } }),
      item({ id: "excellent", evaluation: { ...baseEvaluation, verdict: "excellent" } }),
      item({ id: "failed", status: "failed", evaluation: null })
    ]);

    expect(metrics.scoreDistribution.map((bucket) => [bucket.verdict, bucket.count])).toEqual([
      ["needs_work", 1],
      ["solid", 1],
      ["excellent", 1]
    ]);
  });

  it("counts evaluated attempts by problem track", () => {
    const metrics = buildDashboardMetrics([
      item({ id: "identity", challenge: { slug: "a", title: "A", track: "identity" } }),
      item({ id: "ethics", challenge: { slug: "b", title: "B", track: "ethics" } }),
      item({ id: "knowledge", challenge: { slug: "c", title: "C", track: "knowledge" } }),
      item({
        id: "failed-ethics",
        status: "failed",
        evaluation: null,
        challenge: { slug: "d", title: "D", track: "ethics" }
      })
    ]);

    expect(metrics.trackCounts.map((bucket) => [bucket.track, bucket.count])).toEqual([
      ["identity", 1],
      ["ethics", 1],
      ["knowledge", 1]
    ]);
  });
});
