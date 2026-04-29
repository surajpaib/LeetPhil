"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardAnalytics } from "@/components/DashboardAnalytics";
import { HistoryList } from "@/components/HistoryList";
import { fetchDashboardData } from "@/app/dashboard/actions";
import type { DashboardMetrics, AttemptHistoryItem } from "@/lib/dashboard-types";

type DashboardContentProps = {
  initialItems: AttemptHistoryItem[];
  initialMetrics: DashboardMetrics;
  isConfigured: boolean;
  isAuthenticated: boolean;
};

export function DashboardContent({
  initialItems,
  initialMetrics,
  isConfigured,
  isAuthenticated
}: DashboardContentProps) {
  const [items, setItems] = useState(initialItems);
  const [metrics, setMetrics] = useState(initialMetrics);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await fetchDashboardData();
    setItems(data.items);
    setMetrics(data.metrics);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!isConfigured) {
    return <div className="notice-panel">Add Supabase values to enable your dashboard.</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="notice-panel">
        <a href="/auth">Sign in</a> to review your private dashboard.
      </div>
    );
  }

  return (
    <>
      {loading ? (
        <div className="notice-panel">Refreshing dashboard data...</div>
      ) : null}
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
  );
}
