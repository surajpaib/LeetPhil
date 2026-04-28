import type { Metadata } from "next";
import Link from "next/link";
import { BrainCircuit, History, LogIn, LogOut } from "lucide-react";
import "./globals.css";
import { signOut } from "@/app/auth/actions";
import { getCurrentUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "LeetPhil",
  description: "Practice philosophical arguments with rubric-based LLM feedback."
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user } = await getCurrentUser();

  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <Link className="brand" href="/" aria-label="LeetPhil home">
            <span className="brand-mark">
              <BrainCircuit size={22} aria-hidden="true" />
            </span>
            <span>LeetPhil</span>
          </Link>
          <nav className="nav-actions" aria-label="Primary">
            <Link className="nav-link" href="/history">
              <History size={18} aria-hidden="true" />
              <span>History</span>
            </Link>
            {user ? (
              <form action={signOut}>
                <button className="icon-button" type="submit" title="Sign out" aria-label="Sign out">
                  <LogOut size={18} aria-hidden="true" />
                </button>
              </form>
            ) : (
              <Link className="nav-link accent" href="/auth">
                <LogIn size={18} aria-hidden="true" />
                <span>Sign in</span>
              </Link>
            )}
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
