"use server";

import { revalidatePath } from "next/cache";
import type { EvaluationResult } from "@/lib/judge/schema";
import { createJudgeProvider } from "@/lib/judge";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SupabaseSubmissionRepository } from "@/lib/submissions/supabase-repository";
import { getSubmissionErrorMessage } from "@/lib/submissions/errors";
import { evaluateSubmission } from "@/lib/submissions/service";

export type SubmissionActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  attemptId?: string;
  evaluation?: EvaluationResult;
};

export async function submitAnswer(
  challengeSlug: string,
  _previousState: SubmissionActionState,
  formData: FormData
): Promise<SubmissionActionState> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      status: "error",
      message: "Supabase is not configured yet. Add env values and apply the migration before submitting."
    };
  }

  try {
    const repository = new SupabaseSubmissionRepository(supabase);
    const judge = createJudgeProvider();
    const answer = String(formData.get("answer") ?? "");

    const result = await evaluateSubmission({
      challengeSlug,
      answer,
      repository,
      judge
    });

    revalidatePath("/dashboard");
    revalidatePath(`/challenge/${challengeSlug}`);

    return {
      status: "success",
      attemptId: result.attemptId,
      evaluation: result.evaluation,
      message: "Evaluation complete."
    };
  } catch (error) {
    return {
      status: "error",
      message: getSubmissionErrorMessage(error)
    };
  }
}
