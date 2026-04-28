import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { HistoryList } from "@/components/HistoryList";
import { getAttemptHistory } from "@/lib/history";

export default async function HistoryPage() {
  const { items, isConfigured, isAuthenticated } = await getAttemptHistory();

  return (
    <div className="page-shell">
      <section className="page-heading compact-heading">
        <div>
          <p className="eyebrow">Private review</p>
          <h1>Attempt history</h1>
        </div>
        <Link className="text-button" href="/">
          Practice
          <ChevronRight size={18} aria-hidden="true" />
        </Link>
      </section>
      {!isConfigured ? (
        <div className="notice-panel">Add Supabase values to enable saved attempts.</div>
      ) : !isAuthenticated ? (
        <div className="notice-panel">
          <Link href="/auth">Sign in</Link> to review your private attempt history.
        </div>
      ) : (
        <HistoryList items={items} />
      )}
    </div>
  );
}
