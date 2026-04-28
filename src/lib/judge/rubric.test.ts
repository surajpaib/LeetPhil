import { describe, expect, it } from "vitest";
import { aggregateScores, countWords, verdictFromScore } from "@/lib/judge/rubric";

describe("rubric helpers", () => {
  it("counts trimmed words", () => {
    expect(countWords("  one two\nthree  ")).toBe(3);
    expect(countWords("")).toBe(0);
  });

  it("aggregates five rubric scores to one decimal place", () => {
    expect(
      aggregateScores({
        clarity: 8,
        argumentQuality: 7,
        counterargument: 6,
        conceptualDepth: 7.5,
        promptFit: 8.2
      })
    ).toBe(7.3);
  });

  it("maps scores to verdicts", () => {
    expect(verdictFromScore(5.9)).toBe("needs_work");
    expect(verdictFromScore(6.2)).toBe("solid");
    expect(verdictFromScore(8.2)).toBe("excellent");
  });
});
