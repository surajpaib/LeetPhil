import { describe, expect, it, vi } from "vitest";
import { DEFAULT_OPENROUTER_MODEL, OpenRouterJudgeProvider } from "@/lib/judge/openrouter";
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

  it("retries without strict schema when OpenRouter cannot route required parameters", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: {
              message: "No endpoints found that can handle the requested parameters."
            }
          }),
          { status: 404 }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: `\`\`\`json\n${validEvaluationContent()}\n\`\`\``
                }
              }
            ]
          }),
          { status: 200 }
        )
      );

    const provider = new OpenRouterJudgeProvider({
      apiKey: "test-key",
      fetcher
    });

    const evaluation = await provider.evaluate({
      challenge: seedChallenges[0],
      answer: Array.from({ length: 180 }, (_, index) => `claim${index}`).join(" ")
    });

    const [, strictInit] = fetcher.mock.calls[0] as [string, RequestInit];
    const [, fallbackInit] = fetcher.mock.calls[1] as [string, RequestInit];
    const strictBody = JSON.parse(String(strictInit.body));
    const fallbackBody = JSON.parse(String(fallbackInit.body));

    expect(strictBody.response_format.type).toBe("json_schema");
    expect(fallbackBody.response_format).toBeUndefined();
    expect(fallbackBody.provider).toBeUndefined();
    expect(evaluation.overallScore).toBe(7.8);
  });

  it("defaults to the recommended free structured-output model", async () => {
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
      fetcher
    });

    await provider.evaluate({
      challenge: seedChallenges[0],
      answer: Array.from({ length: 180 }, (_, index) => `claim${index}`).join(" ")
    });

    const [, init] = fetcher.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body));

    expect(body.model).toBe(DEFAULT_OPENROUTER_MODEL);
  });
});
