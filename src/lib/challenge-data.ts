import { cache } from "react";
import type { Challenge, Difficulty, Track } from "@/lib/domain";
import { DIFFICULTY_ORDER } from "@/lib/domain";
import { seedChallenges } from "@/lib/seed-challenges";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ChallengeRow = {
  id: string;
  slug: string;
  title: string;
  track: string;
  difficulty: string;
  estimated_minutes: number;
  prompt: string;
  context: string;
  rubric_notes: string[];
  tags: string[];
};

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

function sortChallenges(challenges: Challenge[]) {
  return [...challenges].sort((left, right) => {
    const difficulty = DIFFICULTY_ORDER[left.difficulty] - DIFFICULTY_ORDER[right.difficulty];
    return difficulty || left.title.localeCompare(right.title);
  });
}

export const listChallenges = cache(async (): Promise<Challenge[]> => {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return sortChallenges(seedChallenges);
  }

  const { data, error } = await supabase
    .from("challenges")
    .select("id, slug, title, track, difficulty, estimated_minutes, prompt, context, rubric_notes, tags")
    .order("created_at", { ascending: true });

  if (error || !data?.length) {
    return sortChallenges(seedChallenges);
  }

  return sortChallenges(data.map((row) => mapChallenge(row as ChallengeRow)));
});

export const getChallengeBySlug = cache(async (slug: string): Promise<Challenge | null> => {
  const challenges = await listChallenges();
  return challenges.find((challenge) => challenge.slug === slug) ?? null;
});

export async function getDatabaseChallengeBySlug(slug: string): Promise<Challenge | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("challenges")
    .select("id, slug, title, track, difficulty, estimated_minutes, prompt, context, rubric_notes, tags")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapChallenge(data as ChallengeRow);
}
