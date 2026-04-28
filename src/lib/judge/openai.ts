import OpenAI from "openai";
import type { JudgeProvider, JudgeInput } from "@/lib/judge/provider";
import { buildEvaluationPrompt, evaluatorSystemPrompt } from "@/lib/judge/prompts";
import { judgeModelOutputJsonSchema, normalizeEvaluation } from "@/lib/judge/schema";

export class OpenAIJudgeProvider implements JudgeProvider {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(options?: { client?: OpenAI; model?: string; apiKey?: string }) {
    const apiKey = options?.apiKey ?? process.env.OPENAI_API_KEY;

    if (!options?.client && !apiKey) {
      throw new Error("OPENAI_API_KEY is required when JUDGE_PROVIDER is openai.");
    }

    this.client = options?.client ?? new OpenAI({ apiKey });
    this.model = options?.model ?? process.env.OPENAI_MODEL ?? "gpt-5.4-mini";
  }

  async evaluate({ challenge, answer }: JudgeInput) {
    const response = await this.client.responses.create({
      model: this.model,
      input: [
        {
          role: "system",
          content: evaluatorSystemPrompt
        },
        {
          role: "user",
          content: buildEvaluationPrompt(challenge, answer)
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "leetphil_evaluation",
          strict: true,
          schema: judgeModelOutputJsonSchema
        }
      }
    });

    if (!response.output_text) {
      throw new Error("OpenAI returned an empty evaluation.");
    }

    return normalizeEvaluation(JSON.parse(response.output_text));
  }
}
