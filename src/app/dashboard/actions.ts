"use server";

import { getDashboardData } from "@/lib/dashboard";
import type { DashboardMetrics, AttemptHistoryItem } from "@/lib/dashboard-types";

export async function fetchDashboardData(): Promise<{
  items: AttemptHistoryItem[];
  metrics: DashboardMetrics;
  isConfigured: boolean;
  isAuthenticated: boolean;
}> {
  return getDashboardData();
}
