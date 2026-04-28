import type { SupabaseClient } from "@supabase/supabase-js";
import type { Challenge, Difficulty, Track } from "@/lib/domain";
import type { EvaluationResult } from "@/lib/judge/schema";
import type { Database } from "@/lib/supabase/database.types";
import type { SubmissionRepository } from "@/lib/submissions/service";

type ChallengeRow = Database["public"]["Tables"]["challenges"]["Row"];

function mapChallenge(row: ChallengeRow): Challenge {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    track: row.track as Track,
    difficulty: row.difficulty as Difficulty,
    estimatedMinutes: row.estimated_minutes,
    prompt: row.prompt,
    context: row.context,
    rubricNotes: row.rubric_notes ?? [],
    tags: row.tags ?? []
  };
}

export class SupabaseSubmissionRepository implements SubmissionRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async getUser() {
    const {
      data: { user },
      error
    } = await this.supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email
    };
  }

  async getChallengeBySlug(slug: string) {
    const { data, error } = await this.supabase
      .from("challenges")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return mapChallenge(data);
  }

  async createDraftAttempt(input: { userId: string; challengeId: string; answer: string; wordCount: number }) {
    const { data, error } = await this.supabase
      .from("attempts")
      .insert({
        user_id: input.userId,
        challenge_id: input.challengeId,
        answer: input.answer,
        word_count: input.wordCount,
        status: "draft"
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to save draft attempt.");
    }

    return { id: data.id };
  }

  async markAttemptFailed(input: { attemptId: string; errorMessage: string }) {
    const { error } = await this.supabase
      .from("attempts")
      .update({
        status: "failed",
        evaluation_error: input.errorMessage
      })
      .eq("id", input.attemptId);

    if (error) {
      throw new Error(error.message);
    }
  }

  async markAttemptEvaluated(input: { attemptId: string }) {
    const { error } = await this.supabase
      .from("attempts")
      .update({
        status: "evaluated",
        evaluation_error: null
      })
      .eq("id", input.attemptId);

    if (error) {
      throw new Error(error.message);
    }
  }

  async saveEvaluation(input: {
    attemptId: string;
    userId: string;
    challengeId: string;
    evaluation: EvaluationResult;
  }) {
    const { evaluation } = input;
    const { error } = await this.supabase.from("evaluations").insert({
      attempt_id: input.attemptId,
      user_id: input.userId,
      challenge_id: input.challengeId,
      clarity: evaluation.clarity,
      argument_quality: evaluation.argumentQuality,
      counterargument: evaluation.counterargument,
      conceptual_depth: evaluation.conceptualDepth,
      prompt_fit: evaluation.promptFit,
      overall_score: evaluation.overallScore,
      verdict: evaluation.verdict,
      summary: evaluation.summary,
      strengths: evaluation.strengths,
      weaknesses: evaluation.weaknesses,
      revision_advice: evaluation.revisionAdvice,
      raw: evaluation
    });

    if (error) {
      throw new Error(error.message);
    }
  }
}
