import type { Challenge } from "@/lib/domain";
import type { EvaluationResult } from "@/lib/judge/schema";

export type JudgeInput = {
  challenge: Challenge;
  answer: string;
};

export interface JudgeProvider {
  evaluate(input: JudgeInput): Promise<EvaluationResult>;
}
