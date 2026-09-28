import { NextRequest } from "next/server";
import { createServerSupabaseClient, createServiceClient } from "@/lib/auth";
import { getCreditPack } from "@/lib/credit-packs";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null) as { packId?: string } | null;
  const pack = body?.packId ? getCreditPack(body.packId) : undefined;
  if (!pack) return Response.json({ error: "Invalid credit pack" }, { status: 400 });

  const service = createServiceClient();
  const { data, error } = await service.rpc("convert_affiliate_commission_to_credits", {
    p_user_id: user.id,
    p_pack_key: pack.id,
  });

  if (error) {
    console.error("affiliate:credit_conversion_failed", { userId: user.id, packId: pack.id, error: error.message });
    return Response.json({ error: "Could not convert earnings" }, { status: 500 });
  }
  if (!data?.ok) {
    const messages: Record<string, string> = {
      insufficient_balance: "You do not have enough cleared commission for this pack.",
      invalid_pack: "That credit pack is not available.",
    };
    return Response.json({ error: messages[data?.reason] ?? "Conversion is not available" }, { status: 409 });
  }

  return Response.json({
    ok: true,
    amountCents: data.amount_cents,
    credits: data.credits,
    creditsAdded: data.credits_added,
    debtPaid: data.debt_paid,
  });
}
