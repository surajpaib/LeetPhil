"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Sparkles } from "lucide-react";
import type { SubmissionActionState } from "@/app/challenge/[slug]/actions";
import { MAX_ANSWER_WORDS, MIN_ANSWER_WORDS, countWords } from "@/lib/judge/rubric";
import { EvaluationResult } from "@/components/EvaluationResult";

type AnswerWorkspaceProps = {
  action: (state: SubmissionActionState, formData: FormData) => Promise<SubmissionActionState>;
  initialState: SubmissionActionState;
};

export function AnswerWorkspace({ action, initialState }: AnswerWorkspaceProps) {
  const router = useRouter();
  const [answer, setAnswer] = useState("");
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (!pending && state.status === "success") {
      router.refresh();
    }
  }, [pending, state.status, router]);
  const wordCount = useMemo(() => countWords(answer), [answer]);
  const inRange = wordCount >= MIN_ANSWER_WORDS && wordCount <= MAX_ANSWER_WORDS;

  return (
    <section className="answer-workspace">
      <div className="workspace-heading">
        <div>
          <p className="eyebrow">Your answer</p>
          <h2>Plain-text argument</h2>
        </div>
        <span className={inRange ? "word-count ready" : "word-count"}>
          {wordCount}/{MAX_ANSWER_WORDS} words
        </span>
      </div>
      <form action={formAction} className="answer-form">
        <textarea
          name="answer"
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          minLength={1}
          placeholder="Write a thesis, support it with reasons, answer a serious objection, and revise the view where needed."
          rows={14}
          required
        />
        <div className="form-footer">
          <span>
            Minimum {MIN_ANSWER_WORDS} words. Maximum {MAX_ANSWER_WORDS} words.
          </span>
          <button className="primary-button" type="submit" disabled={pending || !inRange}>
            {pending ? <Sparkles size={18} aria-hidden="true" /> : <Send size={18} aria-hidden="true" />}
            {pending ? "Evaluating" : "Submit"}
          </button>
        </div>
      </form>
      {pending ? <div className="notice-panel">Evaluating your argument. This can take a moment.</div> : null}
      {!pending && state.status === "error" ? <div className="error-panel">{state.message}</div> : null}
      {!pending && state.status === "success" && state.evaluation ? (
        <EvaluationResult evaluation={state.evaluation} />
      ) : null}
    </section>
  );
}
