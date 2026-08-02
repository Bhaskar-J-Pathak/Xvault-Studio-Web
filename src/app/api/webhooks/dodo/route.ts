import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "standardwebhooks";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PlanValue = "hobbyist" | "scribe" | "pro" | "founder_circle";

type DodoEvent = {
  id?: string;
  type: string;
  data?: {
    subscription_id?: string;
    payment_id?: string;
    metadata?: Record<string, unknown>;
  };
};

export async function POST(req: NextRequest) {
  const raw = await req.text();

  const headers = {
    "webhook-id": req.headers.get("webhook-id") || "",
    "webhook-signature": req.headers.get("webhook-signature") || "",
    "webhook-timestamp": req.headers.get("webhook-timestamp") || "",
  };

  // 1) Verify signature
  try {
    const verifier = new Webhook(process.env.DODO_PAYMENTS_WEBHOOK_SECRET!);
    await verifier.verify(raw, headers);
  } catch (e) {
    console.error("Dodo webhook verification failed:", e);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // 2) Parse event
  const event = JSON.parse(raw) as DodoEvent;
  const eventId = event?.id || headers["webhook-id"];
  if (!eventId) {
    return NextResponse.json({ error: "Missing event id" }, { status: 400 });
  }

  // 3) Idempotency guard (ignore duplicate deliveries)
  const { error: insertErr } = await supabaseAdmin
    .from("webhook_events")
    .insert({ event_id: eventId, type: event.type });

  if (insertErr) {
    const duplicate =
      (insertErr as any)?.code === "23505" ||
      /duplicate key/i.test(insertErr.message);
    if (duplicate) {
      return NextResponse.json({ received: true }); // already processed
    }
    console.error("webhook:idempotency_insert_error", insertErr);
    return NextResponse.json({ error: "Idempotency insert failed" }, { status: 500 });
  }

  // 4) Route by event.type
  const md = event?.data?.metadata ?? {};
  const orderId = md.orderId as string | undefined;
  const userId = md.userId as string | undefined;
  const planPurchased = md.planPurchased as PlanValue | undefined;
  const subscriptionId = (event?.data?.subscription_id || event?.data?.payment_id) as string | undefined;

  try {
    switch (event.type) {
      case "payment.succeeded": {
        if (orderId) {
          await supabaseAdmin
            .from("orders")
            .update({ status: "paid" })
            .eq("id", orderId);
        }
        if (userId && planPurchased) {
          const profileUpdate: Record<string, unknown> = {
            plan: planPurchased,
            subscription_status: "active",
          };
          // Lifetime plan: mark is_lifetime and store subscription_id if present
          if (planPurchased === "founder_circle") {
            profileUpdate.is_lifetime = true;
          }
          if (subscriptionId) {
            profileUpdate.dodo_subscription_id = subscriptionId;
          }
          await supabaseAdmin
            .from("profiles")
            .update(profileUpdate)
            .eq("id", userId);
        }
        break;
      }

      case "payment.failed": {
        if (orderId) {
          await supabaseAdmin
            .from("orders")
            .update({ status: "failed" })
            .eq("id", orderId);
        }
        break;
      }

      case "subscription.active":
      case "subscription.plan_changed":
      case "subscription.renewed": {
        if (userId && planPurchased) {
          const profileUpdate: Record<string, unknown> = {
            plan: planPurchased,
            subscription_status: "active",
          };
          if (planPurchased === "founder_circle") {
            profileUpdate.is_lifetime = true;
          }
          if (subscriptionId) {
            profileUpdate.dodo_subscription_id = subscriptionId;
          }
          await supabaseAdmin
            .from("profiles")
            .update(profileUpdate)
            .eq("id", userId);
        }
        break;
      }

      case "subscription.cancelled":
      case "subscription.canceled": {
        if (userId) {
          await supabaseAdmin
            .from("profiles")
            .update({ plan: "free", subscription_status: "cancelled" })
            .eq("id", userId);
        }
        break;
      }

      default: {
        // No-op for unhandled events; still recorded by webhook_events
        break;
      }
    }
  } catch (e) {
    console.error("webhook:processing_error", { eventType: event.type, eventId, error: e });
    // Return 500 so Dodo retries; idempotency guard prevents double-processing
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
