import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Tags } from "lucide-react";
import { AnswerWorkspace } from "@/components/AnswerWorkspace";
import { RubricPanel } from "@/components/RubricPanel";
import { getChallengeBySlug } from "@/lib/challenge-data";
import { TRACK_LABELS } from "@/lib/domain";
import { getCurrentUser } from "@/lib/supabase/server";
import { submitAnswer, type SubmissionActionState } from "@/app/challenge/[slug]/actions";

type ChallengePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ChallengePage({ params }: ChallengePageProps) {
  const { slug } = await params;
  const challenge = await getChallengeBySlug(slug);
  const { supabase, user } = await getCurrentUser();

  if (!challenge) {
    notFound();
  }

  const action = submitAnswer.bind(null, challenge.slug);
  const initialSubmissionState: SubmissionActionState = { status: "idle" };

  return (
    <div className="page-shell">
      <Link className="back-link" href="/">
        <ArrowLeft size={18} aria-hidden="true" />
        <span>Challenges</span>
      </Link>
      <section className="challenge-layout">
        <div className="challenge-main">
          <div className="challenge-heading">
            <p className="eyebrow">{TRACK_LABELS[challenge.track]}</p>
            <h1>{challenge.title}</h1>
            <div className="meta-row">
              <span>{challenge.difficulty}</span>
              <span>
                <Clock size={15} aria-hidden="true" />
                {challenge.estimatedMinutes} min
              </span>
              <span>
                <Tags size={15} aria-hidden="true" />
                {challenge.tags.slice(0, 3).join(", ")}
              </span>
            </div>
          </div>
          <section className="prompt-block">
            <h2>Context</h2>
            <p>{challenge.context}</p>
          </section>
          <section className="prompt-block">
            <h2>Prompt</h2>
            <p>{challenge.prompt}</p>
          </section>
          {user ? (
            <AnswerWorkspace action={action} initialState={initialSubmissionState} />
          ) : (
            <div className="notice-panel">
              {supabase ? (
                <>
                  <Link href="/auth">Sign in</Link> to submit an answer and save feedback.
                </>
              ) : (
                <>Add Supabase credentials to enable sign-in and submissions.</>
              )}
            </div>
          )}
        </div>
        <aside className="challenge-side">
          <RubricPanel notes={challenge.rubricNotes} />
        </aside>
      </section>
    </div>
  );
}
