/**
 * POST /api/feedback
 *
 * Collects user feedback (mood + optional text).
 * Works for both authenticated and unauthenticated users.
 *
 * Body: { mood: "good" | "meh" | "bad", text?: string, page?: string }
 */

import { NextRequest } from "next/server";
import { createServerSupabaseClient, createServiceClient } from "@/lib/auth";
import { sendFeedbackNotification } from "@/lib/email";

export async function POST(request: NextRequest) {
  let body: { mood: string; text?: string; page?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { mood, text, page } = body;
  if (!mood || !["good", "meh", "bad"].includes(mood)) {
    return Response.json({ error: "Invalid mood" }, { status: 400 });
  }

  // Validate text length
  if (text && text.trim().length > 2000) {
    return Response.json({ error: "Feedback text too long (max 2000 chars)" }, { status: 400 });
  }

  // Validate page length
  if (page && page.length > 500) {
    return Response.json({ error: "Invalid page" }, { status: 400 });
  }

  // Try to get the authenticated user (optional — feedback works anonymously too)
  let userId: string | null = null;
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    // No auth — anonymous feedback is fine
  }

  const serviceClient = createServiceClient();

  // Rate limit: authenticated users max 5 feedback submissions per hour
  if (userId) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await serviceClient
      .from("feedback")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gt("created_at", oneHourAgo);
    if ((count ?? 0) >= 5) {
      return Response.json({ error: "Too many feedback submissions" }, { status: 429 });
    }
  }

  const { error } = await serviceClient.from("feedback").insert({
    user_id:    userId,
    mood,
    text:       text?.trim() || null,
    page:       page || null,
  });

  if (error) {
    console.error("[feedback] Insert failed:", error.message);
    return Response.json({ error: "Failed to save feedback" }, { status: 500 });
  }

  // Email notification only when there's written text — skip bare mood clicks.
  if (text?.trim()) {
    let userEmail: string | null = null;
    if (userId) {
      const { data: profile } = await serviceClient
        .from("profiles")
        .select("email")
        .eq("id", userId)
        .single();
      userEmail = profile?.email ?? null;
    }

    sendFeedbackNotification({ mood, text: text.trim(), page: page ?? null, userEmail }).catch(
      (e) => console.error("[feedback] Email notification failed:", e),
    );
  }

  return Response.json({ ok: true });
}
