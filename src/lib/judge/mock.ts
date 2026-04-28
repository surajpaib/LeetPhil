import type { JudgeProvider, JudgeInput } from "@/lib/judge/provider";
import { countWords } from "@/lib/judge/rubric";
import { normalizeEvaluation } from "@/lib/judge/schema";

export class MockJudgeProvider implements JudgeProvider {
  async evaluate({ answer }: JudgeInput) {
    const words = countWords(answer);
    const base = Math.min(8.4, Math.max(5.8, 5.6 + words / 350));

    return normalizeEvaluation({
      clarity: Math.min(10, base + 0.2),
      argumentQuality: base,
      counterargument: Math.max(0, base - 0.5),
      conceptualDepth: Math.min(10, base + 0.1),
      promptFit: Math.min(10, base + 0.3),
      summary:
        "This mock evaluation confirms the submission pipeline works. Replace it with OpenAI judging for real rubric feedback.",
      strengths:
        "The answer is long enough to support an argument and appears to engage the assigned prompt.",
      weaknesses:
        "Mock judging cannot verify conceptual precision or the quality of the counterargument.",
      revisionAdvice:
        "Run with OPENAI_API_KEY and JUDGE_PROVIDER=openai to receive substantive feedback."
    });
  }
}
