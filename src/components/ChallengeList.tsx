"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Eye, Scale, Timer, UserRound } from "lucide-react";
import type { Challenge, Track } from "@/lib/domain";
import { TRACK_LABELS } from "@/lib/domain";

const trackIcons = {
  identity: UserRound,
  ethics: Scale,
  knowledge: Eye
};

const trackOptions: Array<Track | "all"> = ["all", "identity", "ethics", "knowledge"];

export function ChallengeList({ challenges }: { challenges: Challenge[] }) {
  const [selectedTrack, setSelectedTrack] = useState<Track | "all">("all");

  const visibleChallenges = useMemo(() => {
    if (selectedTrack === "all") {
      return challenges;
    }

    return challenges.filter((challenge) => challenge.track === selectedTrack);
  }, [challenges, selectedTrack]);

  return (
    <section className="practice-grid">
      <div className="track-tabs" role="tablist" aria-label="Challenge tracks">
        {trackOptions.map((track) => {
          const active = selectedTrack === track;
          const label = track === "all" ? "All" : TRACK_LABELS[track];

          return (
            <button
              key={track}
              className={active ? "track-tab active" : "track-tab"}
              type="button"
              aria-pressed={active}
              onClick={() => setSelectedTrack(track)}
            >
              {label}
            </button>
          );
        })}
      </div>
      <div className="challenge-grid">
        {visibleChallenges.map((challenge) => {
          const Icon = trackIcons[challenge.track];

          return (
            <Link className="challenge-card" href={`/challenge/${challenge.slug}`} key={challenge.slug}>
              <span className="challenge-icon">
                <Icon size={20} aria-hidden="true" />
              </span>
              <span className="challenge-card-body">
                <span className="challenge-card-meta">
                  {TRACK_LABELS[challenge.track]} · {challenge.difficulty}
                </span>
                <span className="challenge-card-title">{challenge.title}</span>
                <span className="challenge-card-context">{challenge.context}</span>
                <span className="tag-row">
                  <span>
                    <Timer size={14} aria-hidden="true" />
                    {challenge.estimatedMinutes} min
                  </span>
                  {challenge.tags.slice(0, 2).map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
