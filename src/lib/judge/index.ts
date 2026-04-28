import type { JudgeProvider } from "@/lib/judge/provider";
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

  throw new Error(`Unsupported JUDGE_PROVIDER: ${provider}`);
}
