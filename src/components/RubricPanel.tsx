import { CheckCircle2 } from "lucide-react";
import { rubricDimensions } from "@/lib/judge/rubric";

export function RubricPanel({ notes }: { notes: string[] }) {
  return (
    <div className="rubric-panel">
      <h2>Rubric</h2>
      <div className="rubric-list">
        {rubricDimensions.map((dimension) => (
          <div className="rubric-row" key={dimension.key}>
            <strong>{dimension.label}</strong>
            <span>{dimension.description}</span>
          </div>
        ))}
      </div>
      <div className="rubric-notes">
        <h3>Prompt notes</h3>
        <ul>
          {notes.map((note) => (
            <li key={note}>
              <CheckCircle2 size={16} aria-hidden="true" />
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
