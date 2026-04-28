import type { JudgeInput, JudgeProvider } from "@/lib/judge/provider";
import { buildEvaluationPrompt, evaluatorSystemPrompt } from "@/lib/judge/prompts";
import { normalizeEvaluation } from "@/lib/judge/schema";

export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

type GeminiOptions = {
  apiKey?: string;
  model?: string;
  fetcher?: typeof fetch;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

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

export class GeminiJudgeProvider implements JudgeProvider {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly fetcher: typeof fetch;

  constructor(options?: GeminiOptions) {
    const apiKey =
      options?.apiKey ?? process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is required when JUDGE_PROVIDER is gemini.");
    }

    this.apiKey = apiKey;
    this.model = options?.model ?? process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL;
    this.fetcher = options?.fetcher ?? fetch;
  }

  async evaluate({ challenge, answer }: JudgeInput) {
    const url = new URL(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`
    );
    url.searchParams.set("key", this.apiKey);

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
            parts: [{ text: buildEvaluationPrompt(challenge, answer) }]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: geminiEvaluationSchema
        }
      })
    });

    const payload = (await response.json()) as GeminiResponse;

    if (!response.ok) {
      throw new Error(payload.error?.message ?? `Gemini returned ${response.status}.`);
    }

    const content = payload.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error("Gemini returned an empty evaluation.");
    }

    return normalizeEvaluation(parseGeminiContent(content));
  }
}
