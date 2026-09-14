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
  const title = (typeof body.title === "string" && body.title.trim()) ? body.title.trim() : "Untitled";
  const genre = typeof body.genre === "string" && body.genre ? body.genre : null;
  const synopsis = typeof body.synopsis === "string" && body.synopsis.trim()
    ? body.synopsis.trim().slice(0, 500)
    : null;
  const allowedStatuses = new Set(["drafting", "paused", "completed"]);
  const writingStatus = typeof body.writing_status === "string" && allowedStatuses.has(body.writing_status)
    ? body.writing_status
    : "drafting";

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
    .insert({
      user_id: user.id,
      title,
      genre,
      synopsis,
      writing_status: writingStatus,
    })
    .select("id")
    .single();

  if (error || !data) {
    return Response.json({ error: error?.message ?? "Could not create project." }, { status: 500 });
  }

  // Create Chapter 1 before entering the studio. Previously the studio page
  // created it during a redirect, which raced the layout's chapter query and
  // left the sidebar empty until a full revisit.
  const { error: chapterError } = await supabase.from("chapters").insert({
    project_id: data.id,
    title: "Chapter 1",
    position: 0,
  });

  if (chapterError) {
    // This project was created by this request and is not useful without its
    // initial chapter, so clean it up rather than leaving a broken card behind.
    await supabase.from("projects").delete().eq("id", data.id).eq("user_id", user.id);
    return Response.json({ error: chapterError.message || "Could not create Chapter 1." }, { status: 500 });
  }

  return Response.json({ id: data.id });
}
