import { NextRequest } from "next/server";
import { createServerSupabaseClient, createServiceClient } from "@/lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({})) as { payoutEmail?: string };
  const payoutEmail = (body.payoutEmail ?? user.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(payoutEmail)) {
    return Response.json({ error: "Enter a valid payout email" }, { status: 400 });
  }

  const service = createServiceClient();
  const { data, error } = await service.rpc("request_affiliate_withdrawal", {
    p_user_id: user.id,
    p_payout_email: payoutEmail,
  });

  if (error) {
    console.error("affiliate:withdrawal_request_failed", { userId: user.id, error: error.message });
    return Response.json({ error: "Could not request payout" }, { status: 500 });
  }

  if (!data?.ok) {
    const messages: Record<string, string> = {
      minimum_not_reached: "At least $50 in cleared commission is required.",
      payout_already_pending: "You already have a payout being processed.",
      invalid_payout_email: "Enter a valid payout email.",
    };
    return Response.json(
      { error: messages[data?.reason] ?? "Payout is not available yet" },
      { status: 409 },
    );
  }

  return Response.json({ ok: true, amountCents: data.amount_cents });
}
