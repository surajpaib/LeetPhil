import type { EvaluationResult as EvaluationResultType } from "@/lib/judge/schema";
import { rubricDimensions } from "@/lib/judge/rubric";

function formatVerdict(verdict: EvaluationResultType["verdict"]) {
  if (verdict === "needs_work") {
    return "Needs work";
  }

  return verdict === "solid" ? "Solid" : "Excellent";
}

export function EvaluationResult({ evaluation }: { evaluation: EvaluationResultType }) {
  return (
    <section className="evaluation-panel" aria-live="polite">
      <div className="evaluation-summary">
        <div>
          <p className="eyebrow">Evaluation</p>
          <h2>{formatVerdict(evaluation.verdict)}</h2>
        </div>
        <strong>{evaluation.overallScore.toFixed(1)}</strong>
      </div>
      <div className="score-grid">
        {rubricDimensions.map((dimension) => (
          <div className="score-row" key={dimension.key}>
            <span>{dimension.label}</span>
            <strong>{evaluation[dimension.key].toFixed(1)}</strong>
          </div>
        ))}
      </div>
      <div className="feedback-grid">
        <article>
          <h3>Summary</h3>
          <p>{evaluation.summary}</p>
        </article>
        <article>
          <h3>Strengths</h3>
          <p>{evaluation.strengths}</p>
        </article>
        <article>
          <h3>Weaknesses</h3>
          <p>{evaluation.weaknesses}</p>
        </article>
        <article>
          <h3>Revision</h3>
          <p>{evaluation.revisionAdvice}</p>
        </article>
      </div>
    </section>
  );
}
