/**
 * POST /api/admin/gift-credits
 *
 * Gifts AI credits to a specific user by email and sends them a personal email.
 * Protected by Authorization: Bearer <ADMIN_BLAST_SECRET>
 *
 * Body: { email: string, credits: number, name?: string, personalMessage?: string }
 * Returns: { ok: true, creditsGranted, newRequestCount, emailSent }
 *
 * How credits work: ai_requests_this_month tracks usage consumed.
 * Gifting N credits = decrementing that counter by N (floored at 0),
 * so the user effectively gets N more requests within their plan window.
 */

import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/auth";
import { sendGiftCreditsEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────
  const secret = process.env.ADMIN_BLAST_SECRET;
  if (!secret) {
    return Response.json({ error: "ADMIN_BLAST_SECRET not configured" }, { status: 500 });
  }
  const auth = request.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Parse body ──────────────────────────────────────────────────────────
  let body: { email: string; credits: number; name?: string; personalMessage?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email, credits, name, personalMessage } = body;

  if (!email || typeof email !== "string") {
    return Response.json({ error: "email is required" }, { status: 400 });
  }
  if (!credits || typeof credits !== "number" || credits < 1 || credits > 10_000) {
    return Response.json({ error: "credits must be a number between 1 and 10000" }, { status: 400 });
  }

  // ── Look up user ────────────────────────────────────────────────────────
  const service = createServiceClient();

  const { data: profile, error: fetchError } = await service
    .from("profiles")
    .select("id, email, ai_requests_this_month")
    .eq("email", email)
    .single();

  if (fetchError || !profile) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  // ── Grant credits ───────────────────────────────────────────────────────
  const newCount = Math.max(0, (profile.ai_requests_this_month ?? 0) - credits);

  const { error: updateError } = await service
    .from("profiles")
    .update({ ai_requests_this_month: newCount })
    .eq("id", profile.id);

  if (updateError) {
    return Response.json({ error: updateError.message }, { status: 500 });
  }

  // ── Send email ──────────────────────────────────────────────────────────
  let emailSent = false;
  try {
    await sendGiftCreditsEmail(profile.email, { credits, name, personalMessage });
    emailSent = true;
  } catch (e) {
    console.error("[gift-credits] Email failed:", e);
    // Credits were already granted — don't roll back, just warn
  }

  return Response.json({
    ok:            true,
    creditsGranted: credits,
    newRequestCount: newCount,
    emailSent,
    ...(emailSent ? {} : { warning: "Credits granted but email failed to send — check RESEND_API_KEY" }),
  });
}
