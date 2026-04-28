export type Track = "identity" | "ethics" | "knowledge";

export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export type Challenge = {
  id: string;
  slug: string;
  title: string;
  track: Track;
  difficulty: Difficulty;
  estimatedMinutes: number;
  prompt: string;
  context: string;
  rubricNotes: string[];
  tags: string[];
};

export const TRACK_LABELS: Record<Track, string> = {
  identity: "Identity",
  ethics: "Ethics",
  knowledge: "Knowledge"
};

export const DIFFICULTY_ORDER: Record<Difficulty, number> = {
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3
};
