/**
 * PATCH /api/user/onboarding
 * Advances or completes the tutorial.
 * Body: { step?: number, done?: boolean }
 */

import { NextRequest } from "next/server";
import { createServerSupabaseClient, createServiceClient } from "@/lib/auth";
import { sendReferredWelcomeEmail, sendReferralCompleteEmail } from "@/lib/email";

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
  // Welcome email is sent earlier (at seed-sample), so here we only handle
  // referral credit notifications.
  if (body.done === true) {
    try {
      const service = createServiceClient();
      const { data: rpcResult } = await service.rpc("complete_referral", {
        p_referred_id: user.id,
      });

      if (rpcResult?.ok === true) {
        // Referral completed — notify referred user of their bonus credits.
        sendReferredWelcomeEmail(user.email!).catch((e) =>
          console.error("[email] referred welcome failed:", e),
        );

        // Fetch referrer profile and send their +30 credits notification.
        const { data: referrer } = await service
          .from("profiles")
          .select("email, referral_count, bonus_credits")
          .eq("id", rpcResult.referrer_id)
          .single();

        if (referrer) {
          sendReferralCompleteEmail(
            referrer.email,
            referrer.referral_count,
            referrer.bonus_credits,
          ).catch((e) => console.error("[email] referral complete failed:", e));
        }
      }
    } catch (e) {
      // Non-fatal — log but don't fail the request.
      console.error("[onboarding] complete_referral failed:", e);
    }
  }

  return Response.json({ ok: true });
}
