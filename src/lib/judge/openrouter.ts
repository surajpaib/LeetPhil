import type { JudgeProvider, JudgeInput } from "@/lib/judge/provider";
import { buildEvaluationPrompt, evaluatorSystemPrompt } from "@/lib/judge/prompts";
import { judgeModelOutputJsonSchema, normalizeEvaluation } from "@/lib/judge/schema";

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

  return JSON.parse(content);
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
    this.model = options?.model ?? process.env.OPENROUTER_MODEL ?? "openrouter/free";
    this.siteUrl = options?.siteUrl ?? process.env.OPENROUTER_SITE_URL ?? getVercelSiteUrl();
    this.appName = options?.appName ?? process.env.OPENROUTER_APP_NAME ?? "LeetPhil";
    this.fetcher = options?.fetcher ?? fetch;
  }

  async evaluate({ challenge, answer }: JudgeInput) {
    const response = await this.fetcher("https://openrouter.ai/api/v1/chat/completions", {
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
            content: evaluatorSystemPrompt
          },
          {
            role: "user",
            content: buildEvaluationPrompt(challenge, answer)
          }
        ],
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
        },
        stream: false
      })
    });

    const payload = (await response.json()) as OpenRouterResponse;

    if (!response.ok) {
      throw new Error(payload.error?.message ?? `OpenRouter returned ${response.status}.`);
    }

    const content = payload.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("OpenRouter returned an empty evaluation.");
    }

    return normalizeEvaluation(parseOpenRouterContent(content));
  }
}
