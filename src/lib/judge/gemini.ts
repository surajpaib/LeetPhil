import type { JudgeInput, JudgeProvider } from "@/lib/judge/provider";
import { buildEvaluationPrompt, evaluatorSystemPrompt } from "@/lib/judge/prompts";
import { normalizeEvaluation } from "@/lib/judge/schema";

export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

type GeminiOptions = {
  apiKey?: string;
  model?: string;
  fetcher?: typeof fetch;
  maxRetries?: number;
  retryDelayMs?: number;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
    finishReason?: string;
  }>;
  error?: {
    message?: string;
    status?: string;
  };
};

type GeminiRequestResult =
  | { ok: true; content: string }
  | { ok: false; errorMessage: string; canRetryWithoutSchema: boolean };

const TRANSIENT_STATUS_CODES = new Set([408, 500, 502, 503, 504]);
const TRANSIENT_ERROR_PATTERNS = [
  "try again",
  "temporarily unavailable",
  "overloaded",
  "internal error",
  "provider returned error",
  "unavailable"
];

const geminiEvaluationSchema = {
  type: "OBJECT",
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
  propertyOrdering: [
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
      type: "NUMBER",
      description: "0 to 10 score for thesis clarity and readable structure."
    },
    argumentQuality: {
      type: "NUMBER",
      description: "0 to 10 score for the quality of reasons supporting the thesis."
    },
    counterargument: {
      type: "NUMBER",
      description: "0 to 10 score for charitable objection handling."
    },
    conceptualDepth: {
      type: "NUMBER",
      description: "0 to 10 score for distinctions, implications, and philosophical depth."
    },
    promptFit: {
      type: "NUMBER",
      description: "0 to 10 score for direct engagement with the assigned prompt."
    },
    summary: {
      type: "STRING",
      description: "Two concise sentences summarizing the evaluation."
    },
    strengths: {
      type: "STRING",
      description: "One or two concrete strengths in the answer."
    },
    weaknesses: {
      type: "STRING",
      description: "One or two concrete weaknesses in the answer."
    },
    revisionAdvice: {
      type: "STRING",
      description: "Specific advice for the next revision."
    }
  }
} as const;

function parseGeminiContent(content: string) {
  const trimmed = content.trim();
  const objectStart = trimmed.indexOf("{");
  const objectEnd = trimmed.lastIndexOf("}");

  if (objectStart >= 0 && objectEnd > objectStart) {
    return JSON.parse(trimmed.slice(objectStart, objectEnd + 1));
  }

  return JSON.parse(trimmed);
}

function buildFallbackPrompt(challenge: JudgeInput["challenge"], answer: string) {
  return [
    buildEvaluationPrompt(challenge, answer),
    "",
    "Return only a JSON object with these exact keys:",
    "clarity, argumentQuality, counterargument, conceptualDepth, promptFit, summary, strengths, weaknesses, revisionAdvice.",
    "Each score must be a number from 0 to 10. Do not include markdown, prose outside JSON, or extra keys."
  ].join("\n");
}

function isTransientGeminiError(input: { status: number; message: string }) {
  const message = input.message.toLowerCase();

  return (
    TRANSIENT_STATUS_CODES.has(input.status) ||
    TRANSIENT_ERROR_PATTERNS.some((pattern) => message.includes(pattern))
  );
}

function sleep(ms: number) {
  if (ms <= 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class GeminiJudgeProvider implements JudgeProvider {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly fetcher: typeof fetch;
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;

  constructor(options?: GeminiOptions) {
    const apiKey =
      options?.apiKey ?? process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is required when JUDGE_PROVIDER is gemini.");
    }

    this.apiKey = apiKey;
    this.model = options?.model ?? process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL;
    this.fetcher = options?.fetcher ?? fetch;
    this.maxRetries = options?.maxRetries ?? 1;
    this.retryDelayMs = options?.retryDelayMs ?? 350;
  }

  async evaluate({ challenge, answer }: JudgeInput) {
    const strictResult = await this.requestEvaluation({
      challenge,
      answer,
      strictSchema: true
    });

    if (strictResult.ok) {
      return normalizeEvaluation(parseGeminiContent(strictResult.content));
    }

    if (!strictResult.canRetryWithoutSchema) {
      throw new Error(strictResult.errorMessage);
    }

    const fallbackResult = await this.requestEvaluation({
      challenge,
      answer,
      strictSchema: false
    });

    if (!fallbackResult.ok) {
      throw new Error(fallbackResult.errorMessage);
    }

    return normalizeEvaluation(parseGeminiContent(fallbackResult.content));
  }

  private async requestEvaluation(input: {
    challenge: JudgeInput["challenge"];
    answer: string;
    strictSchema: boolean;
  }): Promise<GeminiRequestResult> {
    const url = new URL(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`
    );
    url.searchParams.set("key", this.apiKey);

    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      const response = await this.fetcher(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: evaluatorSystemPrompt }]
          },
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: input.strictSchema
                    ? buildEvaluationPrompt(input.challenge, input.answer)
                    : buildFallbackPrompt(input.challenge, input.answer)
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json",
            ...(input.strictSchema ? { responseSchema: geminiEvaluationSchema } : {})
          }
        })
      });

      const payload = (await response.json()) as GeminiResponse;

      if (!response.ok) {
        const errorMessage = payload.error?.message ?? `Gemini returned ${response.status}.`;
        const isTransient = isTransientGeminiError({
          status: response.status,
          message: errorMessage
        });

        if (isTransient && attempt < this.maxRetries) {
          await sleep(this.retryDelayMs);
          continue;
        }

        return {
          ok: false,
          errorMessage,
          canRetryWithoutSchema: input.strictSchema && isTransient
        };
      }

      const content = payload.candidates?.[0]?.content?.parts?.[0]?.text;

      if (content) {
        return { ok: true, content };
      }

      const finishReason = payload.candidates?.[0]?.finishReason;
      const errorMessage = finishReason
        ? `Gemini returned an empty evaluation (${finishReason}).`
        : "Gemini returned an empty evaluation.";

      if (attempt < this.maxRetries) {
        await sleep(this.retryDelayMs);
        continue;
      }

      return {
        ok: false,
        errorMessage,
        canRetryWithoutSchema: input.strictSchema
      };
    }

    return {
      ok: false,
      errorMessage: "Gemini returned an empty evaluation.",
      canRetryWithoutSchema: input.strictSchema
    };
  }
}
