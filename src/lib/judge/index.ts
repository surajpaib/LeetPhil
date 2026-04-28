import type { JudgeProvider } from "@/lib/judge/provider";
import { GeminiJudgeProvider } from "@/lib/judge/gemini";
import { MockJudgeProvider } from "@/lib/judge/mock";
import { OpenAIJudgeProvider } from "@/lib/judge/openai";
import { OpenRouterJudgeProvider } from "@/lib/judge/openrouter";

export function createJudgeProvider(): JudgeProvider {
  const provider = process.env.JUDGE_PROVIDER ?? "openai";

  if (provider === "mock") {
    return new MockJudgeProvider();
  }

  if (provider === "openai") {
    return new OpenAIJudgeProvider();
  }

  if (provider === "openrouter") {
    return new OpenRouterJudgeProvider();
  }

  if (provider === "gemini") {
    return new GeminiJudgeProvider();
  }

  throw new Error(`Unsupported JUDGE_PROVIDER: ${provider}`);
}
