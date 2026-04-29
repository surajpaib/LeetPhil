import Link from "next/link";
import { AlertCircle, CheckCircle2, RotateCcw } from "lucide-react";
import { formatTrackLabel, type AttemptHistoryItem } from "@/lib/dashboard-types";
import { EvaluationResult } from "@/components/EvaluationResult";

function statusIcon(status: AttemptHistoryItem["status"]) {
  if (status === "evaluated") {
    return <CheckCircle2 size={17} aria-hidden="true" />;
  }

  if (status === "failed") {
    return <AlertCircle size={17} aria-hidden="true" />;
  }

  return <RotateCcw size={17} aria-hidden="true" />;
}

export function HistoryList({ items }: { items: AttemptHistoryItem[] }) {
  if (!items.length) {
    return (
      <div className="empty-state">
        <h2>No attempts yet</h2>
        <p>Choose a challenge and submit a plain-text answer to start building your dashboard.</p>
        <Link className="primary-button inline-button" href="/">
          Practice
        </Link>
      </div>
    );
  }

  return (
    <div className="history-stack">
      {items.map((item) => (
        <article className="history-item" key={item.id}>
          <header className="history-header">
            <div>
              <p className="eyebrow">{formatTrackLabel(item.challenge?.track)}</p>
              <h2>{item.challenge?.title ?? "Deleted challenge"}</h2>
              <span>{new Date(item.createdAt).toLocaleString()}</span>
            </div>
            <span className={`status-pill ${item.status}`}>
              {statusIcon(item.status)}
              {item.status}
            </span>
          </header>
          <p className="answer-preview">{item.answer}</p>
          {item.evaluation ? <EvaluationResult evaluation={item.evaluation} /> : null}
          {item.evaluationError ? (
            <div className="error-panel">
              {item.evaluationError}
              {item.challenge ? (
                <>
                  {" "}
                  <Link href={`/challenge/${item.challenge.slug}`}>Try again</Link>.
                </>
              ) : null}
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}
