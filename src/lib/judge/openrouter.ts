import type { JudgeProvider, JudgeInput } from "@/lib/judge/provider";
import { buildEvaluationPrompt, evaluatorSystemPrompt } from "@/lib/judge/prompts";
import { judgeModelOutputJsonSchema, normalizeEvaluation } from "@/lib/judge/schema";

export const DEFAULT_OPENROUTER_MODEL = "inclusionai/ling-2.6-flash:free";

const OPENROUTER_CHAT_COMPLETIONS_URL = "https://openrouter.ai/api/v1/chat/completions";
const ROUTING_PARAMETER_ERROR = "No endpoints found";

type OpenRouterOptions = {
  apiKey?: string;
  model?: string;
  siteUrl?: string;
  appName?: string;
  fetcher?: typeof fetch;
};

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: string | unknown;
    };
  }>;
  error?: {
    message?: string;
  };
};

function getVercelSiteUrl() {
  if (!process.env.VERCEL_URL) {
    return undefined;
  }

  return `https://${process.env.VERCEL_URL}`;
}

function parseOpenRouterContent(content: string | unknown) {
  if (typeof content !== "string") {
    return content;
  }

  const trimmed = content.trim();

  if (trimmed.startsWith("```")) {
    const withoutFence = trimmed
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
    return JSON.parse(withoutFence);
  }

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

export class OpenRouterJudgeProvider implements JudgeProvider {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly siteUrl?: string;
  private readonly appName: string;
  private readonly fetcher: typeof fetch;

  constructor(options?: OpenRouterOptions) {
    const apiKey = options?.apiKey ?? process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is required when JUDGE_PROVIDER is openrouter.");
    }

    this.apiKey = apiKey;
    this.model = options?.model ?? process.env.OPENROUTER_MODEL ?? DEFAULT_OPENROUTER_MODEL;
    this.siteUrl = options?.siteUrl ?? process.env.OPENROUTER_SITE_URL ?? getVercelSiteUrl();
    this.appName = options?.appName ?? process.env.OPENROUTER_APP_NAME ?? "LeetPhil";
    this.fetcher = options?.fetcher ?? fetch;
  }

  async evaluate({ challenge, answer }: JudgeInput) {
    const strictResult = await this.requestEvaluation({
      challenge,
      answer,
      strictSchema: true
    });

    if (strictResult.ok) {
      return normalizeEvaluation(parseOpenRouterContent(strictResult.content));
    }

    if (!strictResult.canRetryWithoutStrictSchema) {
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

    return normalizeEvaluation(parseOpenRouterContent(fallbackResult.content));
  }

  private async requestEvaluation(input: {
    challenge: JudgeInput["challenge"];
    answer: string;
    strictSchema: boolean;
  }): Promise<
    | { ok: true; content: string | unknown }
    | { ok: false; errorMessage: string; canRetryWithoutStrictSchema: boolean }
  > {
    const response = await this.fetcher(OPENROUTER_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...(this.siteUrl ? { "HTTP-Referer": this.siteUrl } : {}),
        "X-Title": this.appName
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: "system",
            content: input.strictSchema
              ? evaluatorSystemPrompt
              : `${evaluatorSystemPrompt} Return valid JSON only.`
          },
          {
            role: "user",
            content: input.strictSchema
              ? buildEvaluationPrompt(input.challenge, input.answer)
              : buildFallbackPrompt(input.challenge, input.answer)
          }
        ],
        ...(input.strictSchema
          ? {
              response_format: {
                type: "json_schema",
                json_schema: {
                  name: "leetphil_evaluation",
                  strict: true,
                  schema: judgeModelOutputJsonSchema
                }
              },
              provider: {
                require_parameters: true
              }
            }
          : {}),
        stream: false
      })
    });

    const payload = (await response.json()) as OpenRouterResponse;

    if (!response.ok) {
      const errorMessage = payload.error?.message ?? `OpenRouter returned ${response.status}.`;

      return {
        ok: false,
        errorMessage,
        canRetryWithoutStrictSchema:
          input.strictSchema && errorMessage.includes(ROUTING_PARAMETER_ERROR)
      };
    }

    const content = payload.choices?.[0]?.message?.content;

    if (!content) {
      return {
        ok: false,
        errorMessage: "OpenRouter returned an empty evaluation.",
        canRetryWithoutStrictSchema: false
      };
    }

    return { ok: true, content };
  }
}
