import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/auth";
import { AFFILIATE_PROGRAM_ENABLED } from "@/lib/affiliate-config";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  if (!AFFILIATE_PROGRAM_ENABLED) return NextResponse.redirect(new URL("/", request.url));

  const { code: rawCode } = await params;
  const code = rawCode.trim().toUpperCase();
  const requestedNext = request.nextUrl.searchParams.get("next") ?? "/";
  const destination = requestedNext.startsWith("/") && !requestedNext.startsWith("//")
    ? requestedNext
    : "/";

  if (!/^[A-Z0-9]{8}$/.test(code)) {
    return NextResponse.redirect(new URL(destination, request.url));
  }

  const service = createServiceClient();
  const { data: referrer } = await service
    .from("profiles")
    .select("id")
    .eq("referral_code", code)
    .maybeSingle();

  const response = NextResponse.redirect(new URL(destination, request.url));
  if (referrer) {
    response.cookies.set("xv_affiliate", code, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 90,
    });
  }
  return response;
}
