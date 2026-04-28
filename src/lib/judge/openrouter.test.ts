import { describe, expect, it, vi } from "vitest";
import { OpenRouterJudgeProvider } from "@/lib/judge/openrouter";
import { seedChallenges } from "@/lib/seed-challenges";

function validEvaluationContent() {
  return JSON.stringify({
    clarity: 8,
    argumentQuality: 7,
    counterargument: 7,
    conceptualDepth: 8,
    promptFit: 9,
    summary: "The answer is clear and stays close to the prompt.",
    strengths: "It compares multiple sources of self-knowledge.",
    weaknesses: "It could make the objection more specific.",
    revisionAdvice: "Explain how observed behavior corrects first-person error."
  });
}

describe("OpenRouterJudgeProvider", () => {
  it("requests structured rubric output from OpenRouter", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: validEvaluationContent()
              }
            }
          ]
        }),
        { status: 200 }
      )
    );

    const provider = new OpenRouterJudgeProvider({
      apiKey: "test-key",
      model: "openrouter/free",
      fetcher
    });

    const evaluation = await provider.evaluate({
      challenge: seedChallenges[0],
      answer: Array.from({ length: 180 }, (_, index) => `claim${index}`).join(" ")
    });

    const [, init] = fetcher.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body));

    expect(body.model).toBe("openrouter/free");
    expect(body.response_format.type).toBe("json_schema");
    expect(body.response_format.json_schema.strict).toBe(true);
    expect(body.provider.require_parameters).toBe(true);
    expect(evaluation.overallScore).toBe(7.8);
  });

  it("surfaces OpenRouter API errors", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { message: "rate limited" } }), {
        status: 429
      })
    );

    const provider = new OpenRouterJudgeProvider({
      apiKey: "test-key",
      fetcher
    });

    await expect(
      provider.evaluate({
        challenge: seedChallenges[0],
        answer: Array.from({ length: 180 }, (_, index) => `claim${index}`).join(" ")
      })
    ).rejects.toThrow("rate limited");
  });
});
