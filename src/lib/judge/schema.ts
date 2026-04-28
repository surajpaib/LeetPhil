import { z } from "zod";
import { aggregateScores, verdictFromScore } from "@/lib/judge/rubric";

const scoreSchema = z.number().min(0).max(10);

export const JudgeModelOutputSchema = z.object({
  clarity: scoreSchema,
  argumentQuality: scoreSchema,
  counterargument: scoreSchema,
  conceptualDepth: scoreSchema,
  promptFit: scoreSchema,
  summary: z.string().min(1).max(900),
  strengths: z.string().min(1).max(900),
  weaknesses: z.string().min(1).max(900),
  revisionAdvice: z.string().min(1).max(900)
});

export const EvaluationResultSchema = JudgeModelOutputSchema.extend({
  overallScore: scoreSchema,
  verdict: z.enum(["needs_work", "solid", "excellent"])
});

export type JudgeModelOutput = z.infer<typeof JudgeModelOutputSchema>;
export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;

export const judgeModelOutputJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "clarity",
    "argumentQuality",
    "counterargument",
    "conceptualDepth",
    "promptFit",
    "summary",
    "strengths",
    "weaknesses",
    "revisionAdvice"
  ],
  properties: {
    clarity: {
      type: "number",
      description: "0 to 10 score for thesis clarity and readable structure."
    },
    argumentQuality: {
      type: "number",
      description: "0 to 10 score for the quality of reasons supporting the thesis."
    },
    counterargument: {
      type: "number",
      description: "0 to 10 score for charitable objection handling."
    },
    conceptualDepth: {
      type: "number",
      description: "0 to 10 score for distinctions, implications, and philosophical depth."
    },
    promptFit: {
      type: "number",
      description: "0 to 10 score for direct engagement with the assigned prompt."
    },
    summary: {
      type: "string",
      description: "Two concise sentences summarizing the evaluation."
    },
    strengths: {
      type: "string",
      description: "One or two concrete strengths in the answer."
    },
    weaknesses: {
      type: "string",
      description: "One or two concrete weaknesses in the answer."
    },
    revisionAdvice: {
      type: "string",
      description: "Specific advice for the next revision."
    }
  }
} as const;

export function normalizeEvaluation(output: unknown): EvaluationResult {
  const parsed = JudgeModelOutputSchema.parse(output);
  const overallScore = aggregateScores(parsed);
  return EvaluationResultSchema.parse({
    ...parsed,
    overallScore,
    verdict: verdictFromScore(overallScore)
  });
}
