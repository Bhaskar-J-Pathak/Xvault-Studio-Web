import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceClient } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({})) as { code?: string };
  const code = (body.code ?? request.cookies.get("xv_affiliate")?.value)?.trim().toUpperCase();
  if (!code || !/^[A-Z0-9]{8}$/.test(code)) {
    return NextResponse.json({ error: "Invalid referral code" }, { status: 400 });
  }

  const service = createServiceClient();
  const { data, error } = await service.rpc("claim_affiliate_referral", {
    p_referred_id: user.id,
    p_code: code,
    p_source: body.code ? "signup_code" : "affiliate_cookie",
  });

  if (error) {
    console.error("affiliate:claim_failed", { userId: user.id, error: error.message });
    return NextResponse.json({ error: "Could not link referral" }, { status: 500 });
  }
  if (!data?.ok) {
    const messages: Record<string, string> = {
      code_not_found: "Referral code not found",
      self_referral: "You cannot refer yourself",
      profile_not_found: "Profile not found",
    };
    const status = data?.reason === "code_not_found" ? 404 : 400;
    return NextResponse.json({ error: messages[data?.reason] ?? "Invalid referral" }, { status });
  }

  const response = NextResponse.json({ ok: true, linked: Boolean(data.linked) });
  response.cookies.delete("xv_affiliate");
  return response;
}
