import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { DashboardContent } from "@/components/DashboardContent";
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
      <DashboardContent
        initialItems={items}
        initialMetrics={metrics}
        isConfigured={isConfigured}
        isAuthenticated={isAuthenticated}
      />
    </div>
  );
}
