import type { EvaluationResult, JudgeModelOutput } from "@/lib/judge/schema";

export const MIN_ANSWER_WORDS = 150;
export const MAX_ANSWER_WORDS = 1500;

const dimensionKeys = [
  "clarity",
  "argumentQuality",
  "counterargument",
  "conceptualDepth",
  "promptFit"
] as const;

export type RubricDimension = (typeof dimensionKeys)[number];

export const rubricDimensions: Array<{
  key: RubricDimension;
  label: string;
  description: string;
}> = [
  {
    key: "clarity",
    label: "Clarity",
    description: "The answer states a comprehensible thesis and defines important terms."
  },
  {
    key: "argumentQuality",
    label: "Argument",
    description: "Reasons support the thesis instead of merely restating it."
  },
  {
    key: "counterargument",
    label: "Counterargument",
    description: "A serious objection is represented charitably and answered directly."
  },
  {
    key: "conceptualDepth",
    label: "Depth",
    description: "The answer notices distinctions, implications, and limits."
  },
  {
    key: "promptFit",
    label: "Prompt Fit",
    description: "The answer responds to the assigned dilemma rather than drifting."
  }
];

export function countWords(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function aggregateScores(scores: Pick<EvaluationResult, RubricDimension> | Pick<JudgeModelOutput, RubricDimension>) {
  const total = dimensionKeys.reduce((sum, key) => sum + scores[key], 0);
  return Math.round((total / dimensionKeys.length) * 10) / 10;
}

export function verdictFromScore(score: number): EvaluationResult["verdict"] {
  if (score >= 8.2) {
    return "excellent";
  }

  if (score >= 6.2) {
    return "solid";
  }

  return "needs_work";
}
