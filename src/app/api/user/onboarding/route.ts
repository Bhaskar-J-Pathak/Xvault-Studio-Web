/**
 * PATCH /api/user/onboarding
 * Advances or completes the tutorial.
 * Body: { step?: number, done?: boolean }
 */

import { NextRequest } from "next/server";
import { createServerSupabaseClient, createServiceClient } from "@/lib/auth";

export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: { step?: number; done?: boolean };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.step === "number") update.onboarding_step = body.step;
  if (typeof body.done === "boolean") update.onboarding_done = body.done;

  if (Object.keys(update).length === 1) {
    return Response.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", user.id);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // When the user completes the tutorial, complete any pending referral.
  // This is the "first real action" gate — prevents fake-signup abuse.
  if (body.done === true) {
    try {
      const service = createServiceClient();
      await service.rpc("complete_referral", { p_referred_id: user.id });
    } catch (e) {
      // Non-fatal — log but don't fail the request
      console.error("[onboarding] complete_referral failed:", e);
    }
  }

  return Response.json({ ok: true });
}
