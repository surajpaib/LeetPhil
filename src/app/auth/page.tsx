import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { getCurrentUser } from "@/lib/supabase/server";

type AuthPageProps = {
  searchParams?: Promise<{
    message?: string;
  }>;
};

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const params = await searchParams;
  const { supabase, user } = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="page-shell narrow-shell">
      <section className="page-heading">
        <p className="eyebrow">Account</p>
        <h1>Sign in to save attempts</h1>
        <p>Your answers and evaluations stay private to your account in this MVP.</p>
      </section>
      {!supabase ? (
        <div className="notice-panel">
          Add Supabase values to <code>.env.local</code> to enable auth and your private dashboard.
        </div>
      ) : (
        <AuthForm message={params?.message} />
      )}
    </div>
  );
}
