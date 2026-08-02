import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/auth";

export const runtime = "nodejs";
export const revalidate = 60; // cache for 60 seconds

const TOTAL_SEATS = 30;

export async function GET() {
  const supabase = createServiceClient();

  const { count, error } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("is_lifetime", true);

  if (error) {
    console.error("founder-seats: query failed", error);
    // Fail open — don't block the pricing page
    return NextResponse.json(
      { seatsTaken: 0, seatsLeft: TOTAL_SEATS, total: TOTAL_SEATS, soldOut: false },
      { status: 200 }
    );
  }

  const seatsTaken = count ?? 0;
  const seatsLeft = Math.max(0, TOTAL_SEATS - seatsTaken);

  return NextResponse.json({
    seatsTaken,
    seatsLeft,
    total: TOTAL_SEATS,
    soldOut: seatsLeft === 0,
  });
}
