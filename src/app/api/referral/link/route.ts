/**
 * POST /api/referral/link
 *
 * Called client-side after signup when a ?ref=CODE was present in the URL.
 * Links the referral code to the current user's profile and creates a
 * pending referral row.
 *
 * Body:    { code: string }
 * Returns: { ok: true } | { error: string }
 *
 * Idempotent — calling twice for the same user is a no-op.
 */

import { NextRequest } from "next/server";
import { createServerSupabaseClient, createServiceClient } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: { code?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const code = body.code?.trim().toUpperCase();
  if (!code || code.length !== 8) {
    return Response.json({ error: "Invalid referral code" }, { status: 400 });
  }

  const service = createServiceClient();

  // Check current user's profile — bail if already referred
  const { data: myProfile } = await service
    .from("profiles")
    .select("id, referred_by, referral_code")
    .eq("id", user.id)
    .single();

  if (!myProfile) return Response.json({ error: "Profile not found" }, { status: 404 });
  if (myProfile.referred_by) return Response.json({ ok: true }); // already linked, no-op

  // Prevent self-referral
  if (myProfile.referral_code === code) {
    return Response.json({ error: "Cannot refer yourself" }, { status: 400 });
  }

  // Find the referrer
  const { data: referrer } = await service
    .from("profiles")
    .select("id, referral_count")
    .eq("referral_code", code)
    .single();

  if (!referrer) {
    return Response.json({ error: "Referral code not found" }, { status: 404 });
  }

  // Referrer must have < 3 completed referrals
  if (referrer.referral_count >= 3) {
    return Response.json({ error: "Referral limit reached" }, { status: 409 });
  }

  // Link referred_by on the current user's profile
  const { error: linkErr } = await service
    .from("profiles")
    .update({ referred_by: referrer.id })
    .eq("id", user.id);

  if (linkErr) return Response.json({ error: linkErr.message }, { status: 500 });

  // Create the pending referral row
  const { error: refErr } = await service
    .from("referrals")
    .insert({ referrer_id: referrer.id, referred_id: user.id, status: "pending" });

  if (refErr && refErr.code !== "23505") {
    // 23505 = unique violation (referred_id already exists) — treat as no-op
    return Response.json({ error: refErr.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
