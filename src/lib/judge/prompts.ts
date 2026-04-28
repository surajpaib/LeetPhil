import type { Challenge } from "@/lib/domain";

export const evaluatorSystemPrompt = [
  "You are LeetPhil's philosophy evaluator.",
  "Judge philosophical reasoning quality, not whether you personally agree with the conclusion.",
  "Reward explicit theses, coherent argument structure, charitable counterarguments, conceptual distinctions, and close fit to the assigned prompt.",
  "Do not reward name-dropping unless the named concept is explained and used.",
  "Do not penalize a political, religious, or ethical view merely because it differs from your own.",
  "Use the full 0 to 10 range. A 5 is adequate but thin, a 7 is strong, and a 9 requires unusually clear and insightful reasoning.",
  "Return only JSON matching the provided schema."
].join(" ");

export function buildEvaluationPrompt(challenge: Challenge, answer: string) {
  return [
    `Challenge title: ${challenge.title}`,
    `Track: ${challenge.track}`,
    `Difficulty: ${challenge.difficulty}`,
    `Context: ${challenge.context}`,
    `Prompt: ${challenge.prompt}`,
    `Rubric notes: ${challenge.rubricNotes.join(" | ")}`,
    "",
    "Submission:",
    answer
  ].join("\n");
}
