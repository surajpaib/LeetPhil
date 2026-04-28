import { describe, expect, it } from "vitest";
import { normalizeEvaluation } from "@/lib/judge/schema";

const validModelOutput = {
  clarity: 8,
  argumentQuality: 7,
  counterargument: 6,
  conceptualDepth: 8,
  promptFit: 9,
  summary: "The answer has a clear thesis and mostly stays with the prompt.",
  strengths: "It distinguishes local urgency from long-run responsibility.",
  weaknesses: "The counterargument could be more charitable.",
  revisionAdvice: "Name the strongest objection and answer it directly."
};

describe("evaluation schema", () => {
  it("computes overall score and verdict from dimensions", () => {
    const evaluation = normalizeEvaluation(validModelOutput);

    expect(evaluation.overallScore).toBe(7.6);
    expect(evaluation.verdict).toBe("solid");
  });

  it("rejects scores outside the rubric range", () => {
    expect(() =>
      normalizeEvaluation({
        ...validModelOutput,
        clarity: 11
      })
    ).toThrow();
  });
});
