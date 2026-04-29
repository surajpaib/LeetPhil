import Link from "next/link";
import { Activity, BarChart3, CalendarDays, CheckCircle2, Sigma } from "lucide-react";
import type { DashboardMetrics } from "@/lib/dashboard";

function formatScore(score: number | null) {
  return score === null ? "—" : score.toFixed(1);
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric"
  });
}

export function DashboardAnalytics({ metrics }: { metrics: DashboardMetrics }) {
  const maxTrackCount = Math.max(...metrics.trackCounts.map((track) => track.count), 1);

  return (
    <div className="dashboard-stack">
      <section className="metric-grid" aria-label="Dashboard summary">
        <article className="metric-card">
          <span className="metric-icon">
            <Activity size={18} aria-hidden="true" />
          </span>
          <span className="metric-label">Submissions</span>
          <strong>{metrics.totalSubmissions}</strong>
        </article>
        <article className="metric-card">
          <span className="metric-icon">
            <CheckCircle2 size={18} aria-hidden="true" />
          </span>
          <span className="metric-label">Evaluated</span>
          <strong>{metrics.evaluatedSubmissions}</strong>
        </article>
        <article className="metric-card">
          <span className="metric-icon">
            <Sigma size={18} aria-hidden="true" />
          </span>
          <span className="metric-label">Average score</span>
          <strong>{formatScore(metrics.averageScore)}</strong>
        </article>
        <article className="metric-card">
          <span className="metric-icon">
            <CalendarDays size={18} aria-hidden="true" />
          </span>
          <span className="metric-label">Active days</span>
          <strong>{metrics.activeDays}</strong>
        </article>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Submissions</p>
            <h2>Activity</h2>
          </div>
          <span>Last 12 weeks</span>
        </div>
        <div className="activity-scroll" aria-label="Submission activity over the last 12 weeks">
          <div className="activity-grid">
            {metrics.activityDays.map((day) => (
              <span
                aria-label={`${formatDate(day.date)}: ${day.count} submission${
                  day.count === 1 ? "" : "s"
                }`}
                className={`activity-cell level-${day.level}`}
                key={day.date}
                title={`${formatDate(day.date)}: ${day.count} submission${day.count === 1 ? "" : "s"}`}
              />
            ))}
          </div>
        </div>
        <div className="activity-legend" aria-hidden="true">
          <span>Less</span>
          <span className="activity-cell level-0" />
          <span className="activity-cell level-1" />
          <span className="activity-cell level-2" />
          <span className="activity-cell level-3" />
          <span className="activity-cell level-4" />
          <span>More</span>
        </div>
      </section>

      <div className="dashboard-panels">
        <section className="dashboard-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Scores</p>
              <h2>Distribution</h2>
            </div>
            <BarChart3 size={19} aria-hidden="true" />
          </div>
          <div className="breakdown-list">
            {metrics.scoreDistribution.map((bucket) => (
              <div className="breakdown-row" key={bucket.verdict}>
                <div className="breakdown-label">
                  <span>{bucket.label}</span>
                  <strong>{bucket.count}</strong>
                </div>
                <div className="breakdown-bar" aria-hidden="true">
                  <span style={{ width: `${bucket.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="dashboard-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Problem types</p>
              <h2>Solved</h2>
            </div>
            <Link className="mini-link" href="/">
              Practice
            </Link>
          </div>
          <div className="track-breakdown">
            {metrics.trackCounts.map((track) => (
              <div className="track-row" key={track.track}>
                <div className="track-count">
                  <strong>{track.count}</strong>
                  <span>{track.label}</span>
                </div>
                <div className="track-meter" aria-hidden="true">
                  <span style={{ width: `${(track.count / maxTrackCount) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
