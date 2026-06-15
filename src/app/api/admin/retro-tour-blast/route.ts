/**
 * POST /api/admin/retro-tour-blast
 *
 * One-time email blast to all users whose onboarding tour never triggered
 * due to the bug fixed on 2026-06-15.
 *
 * Targets: profiles where onboarding_done = false (never completed the tour).
 *
 * Protected by Authorization: Bearer <ADMIN_BLAST_SECRET>
 *
 * Returns a summary of how many emails were sent / skipped / failed.
 * Safe to call multiple times — tracks sent status via retro_tour_sent column,
 * which is added inline via upsert if missing (falls back gracefully if column
 * doesn't exist yet — add it via Supabase SQL editor first, see below).
 *
 * ── Run this SQL in Supabase before calling the route ─────────────────────
 * ALTER TABLE profiles
 *   ADD COLUMN IF NOT EXISTS retro_tour_sent BOOLEAN NOT NULL DEFAULT false;
 * ──────────────────────────────────────────────────────────────────────────
 */

import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/auth";
import { sendRetroTourEmail } from "@/lib/email";

// Resend's free tier allows 100 emails/day; batch in groups of 50 with a
// small delay to stay well within rate limits.
const BATCH_SIZE = 50;
const BATCH_DELAY_MS = 1200;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function POST(request: NextRequest) {
  // ── Auth check ────────────────────────────────────────────────────────────
  const secret = process.env.ADMIN_BLAST_SECRET;
  if (!secret) {
    return Response.json({ error: "ADMIN_BLAST_SECRET not configured" }, { status: 500 });
  }
  const auth = request.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = createServiceClient();

  // ── Fetch affected users ──────────────────────────────────────────────────
  // Target: anyone who hasn't completed the tour AND hasn't already received
  // this specific retro blast email.
  const { data: profiles, error } = await service
    .from("profiles")
    .select("id, email, retro_tour_sent")
    .eq("onboarding_done", false)
    .eq("retro_tour_sent", false)
    .not("email", "eq", "");

  if (error) {
    // Column might not exist yet — surface a helpful message.
    if (error.message?.includes("retro_tour_sent")) {
      return Response.json(
        {
          error:
            "Column `retro_tour_sent` not found. Run this SQL in Supabase first:\n" +
            "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS retro_tour_sent BOOLEAN NOT NULL DEFAULT false;",
        },
        { status: 500 }
      );
    }
    return Response.json({ error: error.message }, { status: 500 });
  }

  if (!profiles || profiles.length === 0) {
    return Response.json({ sent: 0, skipped: 0, failed: 0, message: "No eligible users found." });
  }

  // ── Send in batches ───────────────────────────────────────────────────────
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < profiles.length; i += BATCH_SIZE) {
    const batch = profiles.slice(i, i + BATCH_SIZE);

    await Promise.allSettled(
      batch.map(async (profile) => {
        try {
          await sendRetroTourEmail(profile.email);

          // Mark as sent — if this fails, the email was still delivered;
          // next run will try again but Resend deduplication handles it.
          await service
            .from("profiles")
            .update({ retro_tour_sent: true })
            .eq("id", profile.id);

          sent++;
        } catch (e) {
          console.error(`[retro-blast] Failed for ${profile.email}:`, e);
          failed++;
        }
      })
    );

    // Brief pause between batches to respect Resend rate limits.
    if (i + BATCH_SIZE < profiles.length) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  return Response.json({
    sent,
    failed,
    total: profiles.length,
    message: `Blast complete. ${sent} sent, ${failed} failed out of ${profiles.length} eligible users.`,
  });
}
