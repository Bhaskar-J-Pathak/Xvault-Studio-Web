/**
 * POST /api/feedback
 *
 * Collects structured user feedback.
 * Works for both authenticated and unauthenticated users.
 *
 * Body: {
 *   mood: "good" | "meh" | "bad"
 *   loved?:    string   — what they loved
 *   broke?:    string   — what broke / frustrated them
 *   bugs?:     string   — specific bugs
 *   wishlist?: string   — feature ideas
 *   page?:     string
 * }
 */

import { NextRequest } from "next/server";
import { createServerSupabaseClient, createServiceClient } from "@/lib/auth";
import { sendFeedbackNotification } from "@/lib/email";

const MAX_FIELD = 2000;

function truncate(s: string | undefined): string | undefined {
  if (!s) return undefined;
  return s.trim().slice(0, MAX_FIELD) || undefined;
}

export async function POST(request: NextRequest) {
  let body: {
    mood:      string;
    loved?:    string;
    broke?:    string;
    bugs?:     string;
    wishlist?: string;
    page?:     string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { mood, page } = body;

  if (!mood || !["good", "meh", "bad"].includes(mood)) {
    return Response.json({ error: "Invalid mood" }, { status: 400 });
  }
  if (page && page.length > 500) {
    return Response.json({ error: "Invalid page" }, { status: 400 });
  }

  const loved    = truncate(body.loved);
  const broke    = truncate(body.broke);
  const bugs     = truncate(body.bugs);
  const wishlist = truncate(body.wishlist);

  if (!loved || !broke || !bugs || !wishlist) {
    return Response.json({ error: "All four feedback fields are required" }, { status: 400 });
  }

  // Serialize structured fields into the text column for storage
  const parts = [
    loved    && `[What I loved]\n${loved}`,
    broke    && `[What broke]\n${broke}`,
    bugs     && `[Bugs]\n${bugs}`,
    wishlist && `[Wishlist]\n${wishlist}`,
  ].filter(Boolean);
  const text = parts.length > 0 ? parts.join("\n\n") : null;

  // Try to get the authenticated user
  let userId: string | null = null;
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    // Anonymous feedback is fine
  }

  const serviceClient = createServiceClient();

  // Rate limit: 5 submissions per hour per authenticated user
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
    user_id: userId,
    mood,
    text:    text ?? null,
    page:    page || null,
  });

  if (error) {
    console.error("[feedback] Insert failed:", error.message);
    return Response.json({ error: "Failed to save feedback" }, { status: 500 });
  }

  // Email notification only when there's at least one answered question
  if (loved || broke || bugs || wishlist) {
    let userEmail: string | null = null;
    if (userId) {
      const { data: profile } = await serviceClient
        .from("profiles")
        .select("email")
        .eq("id", userId)
        .single();
      userEmail = profile?.email ?? null;
    }

    sendFeedbackNotification({
      mood,
      loved,
      broke,
      bugs,
      wishlist,
      page:      page ?? null,
      userEmail,
    }).catch((e) => console.error("[feedback] Email notification failed:", e));
  }

  return Response.json({ ok: true });
}
