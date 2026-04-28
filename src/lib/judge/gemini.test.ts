import { describe, expect, it, vi } from "vitest";
import { DEFAULT_GEMINI_MODEL, GeminiJudgeProvider } from "@/lib/judge/gemini";
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

describe("GeminiJudgeProvider", () => {
  it("requests structured JSON output from the Gemini API", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [{ text: validEvaluationContent() }]
              }
            }
          ]
        }),
        { status: 200 }
      )
    );

    const provider = new GeminiJudgeProvider({
      apiKey: "test-key",
      fetcher
    });

    const evaluation = await provider.evaluate({
      challenge: seedChallenges[0],
      answer: Array.from({ length: 180 }, (_, index) => `claim${index}`).join(" ")
    });

    const [url, init] = fetcher.mock.calls[0] as [URL, RequestInit];
    const body = JSON.parse(String(init.body));

    expect(url.toString()).toContain(`/models/${DEFAULT_GEMINI_MODEL}:generateContent`);
    expect(body.generationConfig.responseMimeType).toBe("application/json");
    expect(body.generationConfig.responseSchema.type).toBe("OBJECT");
    expect(body.generationConfig.responseSchema.required).toContain("argumentQuality");
    expect(evaluation.overallScore).toBe(7.8);
  });

  it("surfaces Gemini API errors", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { message: "quota exceeded" } }), {
        status: 429
      })
    );

    const provider = new GeminiJudgeProvider({
      apiKey: "test-key",
      fetcher
    });

    await expect(
      provider.evaluate({
        challenge: seedChallenges[0],
        answer: Array.from({ length: 180 }, (_, index) => `claim${index}`).join(" ")
      })
    ).rejects.toThrow("quota exceeded");
  });
});
