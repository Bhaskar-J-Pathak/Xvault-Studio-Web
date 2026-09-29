import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/auth";

export const runtime = "nodejs";
// This endpoint depends on Supabase. Never execute it while Next.js is
// collecting static routes during a production build.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const TOTAL_SEATS = 30;
const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
};

function fallbackResponse() {
  return NextResponse.json(
    { seatsTaken: 0, seatsLeft: TOTAL_SEATS, total: TOTAL_SEATS, soldOut: false },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}

export async function GET() {
  try {
    const supabase = createServiceClient();

    const { count, error } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_lifetime", true);

    if (error) {
      console.error("founder-seats: query failed", error);
      // Fail open — don't block the pricing page or checkout.
      return fallbackResponse();
    }

    const seatsTaken = count ?? 0;
    const seatsLeft = Math.max(0, TOTAL_SEATS - seatsTaken);

    return NextResponse.json(
      {
        seatsTaken,
        seatsLeft,
        total: TOTAL_SEATS,
        soldOut: seatsLeft === 0,
      },
      { headers: CACHE_HEADERS }
    );
  } catch (error) {
    console.error("founder-seats: unexpected failure", error);
    return fallbackResponse();
  }
}
