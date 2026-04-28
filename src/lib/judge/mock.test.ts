import { describe, expect, it } from "vitest";
import { MockJudgeProvider } from "@/lib/judge/mock";
import { seedChallenges } from "@/lib/seed-challenges";

describe("mock judge", () => {
  it("returns a valid evaluation without external API calls", async () => {
    const judge = new MockJudgeProvider();
    const answer = Array.from({ length: 180 }, (_, index) => `reason${index}`).join(" ");

    const evaluation = await judge.evaluate({
      challenge: seedChallenges[0],
      answer
    });

    expect(evaluation.overallScore).toBeGreaterThan(0);
    expect(["needs_work", "solid", "excellent"]).toContain(evaluation.verdict);
  });
});
