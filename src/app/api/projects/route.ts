/**
 * POST /api/projects
 * Creates a new project for the authenticated user.
 * Uses the service client to ensure a profile row exists before inserting,
 * guarding against trigger failures that leave auth users with no profile.
 */

import { NextRequest } from "next/server";
import { createServerSupabaseClient, createServiceClient } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const genre = typeof body.genre === "string" && body.genre ? body.genre : null;

  if (!title) return Response.json({ error: "Title is required." }, { status: 400 });

  // Ensure profile row exists (guard against handle_new_user trigger failure)
  const service = createServiceClient();
  await service.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? "",
      plan: "free",
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      referral_code: Array.from({ length: 8 }, () =>
        Math.floor(Math.random() * 36).toString(36)
      ).join("").toUpperCase(),
    },
    { onConflict: "id", ignoreDuplicates: true }
  );

  // Create the project (user client respects RLS)
  const { data, error } = await supabase
    .from("projects")
    .insert({ user_id: user.id, title, genre })
    .select("id")
    .single();

  if (error || !data) {
    return Response.json({ error: error?.message ?? "Could not create project." }, { status: 500 });
  }

  return Response.json({ id: data.id });
}
