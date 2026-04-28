"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function authRedirect(path: string, message: string): never {
  redirect(`${path}?message=${encodeURIComponent(message)}`);
}

export async function signIn(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    authRedirect("/auth", "Supabase is not configured yet.");
  }

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    authRedirect("/auth", error.message);
  }

  redirect("/history");
}

export async function signUp(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    authRedirect("/auth", "Supabase is not configured yet.");
  }

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("displayName") ?? "");
  const origin = (await headers()).get("origin") ?? "http://localhost:3000";

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName
      },
      emailRedirectTo: `${origin}/history`
    }
  });

  if (error) {
    authRedirect("/auth", error.message);
  }

  authRedirect("/auth", "Check your email to confirm the account, then sign in.");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect("/");
}
