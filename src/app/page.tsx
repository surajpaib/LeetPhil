import { ChallengeList } from "@/components/ChallengeList";
import { listChallenges } from "@/lib/challenge-data";

export default async function HomePage() {
  const challenges = await listChallenges();

  return (
    <div className="page-shell">
      <section className="page-heading compact-heading">
        <div>
          <p className="eyebrow">Practice set</p>
          <h1>Thought problems</h1>
        </div>
        <p>
          Enter a scenario, take a position, and argue it carefully. The evaluator scores
          clarity, argument, counterargument, conceptual depth, and prompt fit.
        </p>
      </section>
      <ChallengeList challenges={challenges} />
    </div>
  );
}
