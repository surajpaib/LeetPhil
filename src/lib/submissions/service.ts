import type { Challenge } from "@/lib/domain";
import type { JudgeProvider } from "@/lib/judge/provider";
import type { EvaluationResult } from "@/lib/judge/schema";
import { countWords, MAX_ANSWER_WORDS, MIN_ANSWER_WORDS } from "@/lib/judge/rubric";
import { SubmissionError } from "@/lib/submissions/errors";

export type SubmissionUser = {
  id: string;
  email?: string | null;
};

export type DraftAttempt = {
  id: string;
};

export type SubmissionRepository = {
  getUser(): Promise<SubmissionUser | null>;
  getChallengeBySlug(slug: string): Promise<Challenge | null>;
  createDraftAttempt(input: {
    userId: string;
    challengeId: string;
    answer: string;
    wordCount: number;
  }): Promise<DraftAttempt>;
  markAttemptFailed(input: { attemptId: string; errorMessage: string }): Promise<void>;
  markAttemptEvaluated(input: { attemptId: string }): Promise<void>;
  saveEvaluation(input: {
    attemptId: string;
    userId: string;
    challengeId: string;
    evaluation: EvaluationResult;
  }): Promise<void>;
};

export type SubmissionResult = {
  attemptId: string;
  evaluation: EvaluationResult;
};

export async function evaluateSubmission(input: {
  challengeSlug: string;
  answer: string;
  repository: SubmissionRepository;
  judge: JudgeProvider;
}): Promise<SubmissionResult> {
  const answer = input.answer.trim();
  const wordCount = countWords(answer);

  if (wordCount < MIN_ANSWER_WORDS || wordCount > MAX_ANSWER_WORDS) {
    throw new SubmissionError(
      "WORD_COUNT",
      `Answers must be between ${MIN_ANSWER_WORDS} and ${MAX_ANSWER_WORDS} words. This answer has ${wordCount}.`
    );
  }

  const user = await input.repository.getUser();

  if (!user) {
    throw new SubmissionError("AUTH_REQUIRED", "Sign in before submitting an answer.");
  }

  const challenge = await input.repository.getChallengeBySlug(input.challengeSlug);

  if (!challenge) {
    throw new SubmissionError(
      "CHALLENGE_NOT_FOUND",
      "This challenge has not been seeded in Supabase yet. Apply the migration and try again."
    );
  }

  const attempt = await input.repository.createDraftAttempt({
    userId: user.id,
    challengeId: challenge.id,
    answer,
    wordCount
  });

  try {
    const evaluation = await input.judge.evaluate({ challenge, answer });

    await input.repository.saveEvaluation({
      attemptId: attempt.id,
      userId: user.id,
      challengeId: challenge.id,
      evaluation
    });

    await input.repository.markAttemptEvaluated({ attemptId: attempt.id });

    return {
      attemptId: attempt.id,
      evaluation
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "The LLM judge failed to evaluate this answer.";

    await input.repository.markAttemptFailed({
      attemptId: attempt.id,
      errorMessage
    });

    throw new SubmissionError(
      "EVALUATION_FAILED",
      "The draft was saved, but the LLM judge could not complete the evaluation. Try again from history."
    );
  }
}
