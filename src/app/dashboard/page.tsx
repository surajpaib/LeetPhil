import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { DashboardAnalytics } from "@/components/DashboardAnalytics";
import { HistoryList } from "@/components/HistoryList";
import { getDashboardData } from "@/lib/dashboard";

export default async function DashboardPage() {
  const { items, metrics, isConfigured, isAuthenticated } = await getDashboardData();

  return (
    <div className="page-shell">
      <section className="page-heading compact-heading">
        <div>
          <p className="eyebrow">Private practice</p>
          <h1>Dashboard</h1>
        </div>
        <Link className="text-button" href="/">
          Practice
          <ChevronRight size={18} aria-hidden="true" />
        </Link>
      </section>
      {!isConfigured ? (
        <div className="notice-panel">Add Supabase values to enable your dashboard.</div>
      ) : !isAuthenticated ? (
        <div className="notice-panel">
          <Link href="/auth">Sign in</Link> to review your private dashboard.
        </div>
      ) : (
        <>
          <DashboardAnalytics metrics={metrics} />
          <section className="dashboard-section history-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Review</p>
                <h2>History</h2>
              </div>
              <span>{items.length} total</span>
            </div>
            <HistoryList items={items} />
          </section>
        </>
      )}
    </div>
  );
}
