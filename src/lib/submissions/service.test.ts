import { describe, expect, it, vi } from "vitest";
import type { JudgeProvider } from "@/lib/judge/provider";
import { normalizeEvaluation } from "@/lib/judge/schema";
import { seedChallenges } from "@/lib/seed-challenges";
import { SubmissionError } from "@/lib/submissions/errors";
import type { SubmissionRepository } from "@/lib/submissions/service";
import { evaluateSubmission } from "@/lib/submissions/service";

function longAnswer(words = 180) {
  return Array.from({ length: words }, (_, index) => `claim${index}`).join(" ");
}

function makeRepository(overrides: Partial<SubmissionRepository> = {}) {
  const calls: string[] = [];
  const repository: SubmissionRepository = {
    async getUser() {
      calls.push("getUser");
      return { id: "user-1", email: "user@example.com" };
    },
    async getChallengeBySlug() {
      calls.push("getChallengeBySlug");
      return seedChallenges[0];
    },
    async createDraftAttempt(input) {
      calls.push(`createDraftAttempt:${input.userId}:${input.challengeId}:${input.wordCount}`);
      return { id: "attempt-1" };
    },
    async markAttemptFailed(input) {
      calls.push(`markAttemptFailed:${input.attemptId}`);
    },
    async markAttemptEvaluated(input) {
      calls.push(`markAttemptEvaluated:${input.attemptId}`);
    },
    async saveEvaluation(input) {
      calls.push(`saveEvaluation:${input.userId}:${input.challengeId}:${input.attemptId}`);
    },
    ...overrides
  };

  return { repository, calls };
}

const evaluation = normalizeEvaluation({
  clarity: 7,
  argumentQuality: 7,
  counterargument: 7,
  conceptualDepth: 7,
  promptFit: 7,
  summary: "A clear answer.",
  strengths: "It argues directly.",
  weaknesses: "It could deepen the objection.",
  revisionAdvice: "Make the counterargument sharper."
});

describe("evaluateSubmission", () => {
  it("rejects short answers before writing an attempt", async () => {
    const { repository, calls } = makeRepository();
    const judge: JudgeProvider = { evaluate: vi.fn() };

    await expect(
      evaluateSubmission({
        challengeSlug: seedChallenges[0].slug,
        answer: "too short",
        repository,
        judge
      })
    ).rejects.toBeInstanceOf(SubmissionError);

    expect(calls).toEqual([]);
  });

  it("associates attempts and evaluations with the authenticated user", async () => {
    const { repository, calls } = makeRepository();
    const judge: JudgeProvider = { evaluate: vi.fn().mockResolvedValue(evaluation) };

    const result = await evaluateSubmission({
      challengeSlug: seedChallenges[0].slug,
      answer: longAnswer(),
      repository,
      judge
    });

    expect(result.attemptId).toBe("attempt-1");
    expect(calls).toContain(`createDraftAttempt:user-1:${seedChallenges[0].id}:180`);
    expect(calls).toContain(`saveEvaluation:user-1:${seedChallenges[0].id}:attempt-1`);
    expect(calls).toContain("markAttemptEvaluated:attempt-1");
  });

  it("saves a failed status when the judge fails after draft creation", async () => {
    const { repository, calls } = makeRepository();
    const judge: JudgeProvider = { evaluate: vi.fn().mockRejectedValue(new Error("provider down")) };

    await expect(
      evaluateSubmission({
        challengeSlug: seedChallenges[0].slug,
        answer: longAnswer(),
        repository,
        judge
      })
    ).rejects.toMatchObject({ code: "EVALUATION_FAILED" });

    expect(calls).toContain("markAttemptFailed:attempt-1");
  });
});
