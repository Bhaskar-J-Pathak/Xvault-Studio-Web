import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "standardwebhooks";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PlanValue = "hobbyist" | "founder_circle";
type OrderRecord = { id: string; user_id: string; product_id: string; plan_purchased: PlanValue; status: string };
type DodoEventData = {
  subscription_id?: string | null;
  payment_id?: string | null;
  checkout_session_id?: string | null;
  product_id?: string | null;
  product_cart?: Array<{ product_id?: string }>;
  created_at?: string | null;
  metadata?: Record<string, unknown>;
  customer?: { email?: string | null };
};
type DodoEvent = { id?: string; type: string; timestamp?: string; data?: DodoEventData };

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function eventProductId(data: DodoEventData): string | undefined {
  return stringValue(data.product_id) ?? stringValue(data.product_cart?.[0]?.product_id);
}

async function findOrder(data: DodoEventData): Promise<OrderRecord | null> {
  const metadata = data.metadata ?? {};
  const orderId = stringValue(metadata.orderId) ?? stringValue(metadata.order_id);
  const paymentId = stringValue(data.payment_id);
  const metadataUserId = stringValue(metadata.userId) ?? stringValue(metadata.user_id);
  const productId = eventProductId(data);

  if (orderId) {
    const { data: order, error } = await supabaseAdmin.from("orders")
      .select("id,user_id,product_id,plan_purchased,status").eq("id", orderId).maybeSingle();
    if (error) throw new Error(`Could not load webhook order: ${error.message}`);
    if (order) return order as OrderRecord;
  }

  if (paymentId) {
    const { data: order, error } = await supabaseAdmin.from("orders")
      .select("id,user_id,product_id,plan_purchased,status").eq("dodo_payment_id", paymentId).maybeSingle();
    if (error) throw new Error(`Could not match payment to order: ${error.message}`);
    if (order) return order as OrderRecord;
  }

  const checkoutSessionId = stringValue(data.checkout_session_id);
  if (checkoutSessionId) {
    const { data: order, error } = await supabaseAdmin.from("orders")
      .select("id,user_id,product_id,plan_purchased,status")
      .eq("dodo_checkout_session_id", checkoutSessionId).maybeSingle();
    if (error) throw new Error(`Could not match checkout session to order: ${error.message}`);
    if (order) return order as OrderRecord;
  }

  let userId = metadataUserId;
  if (!userId && data.customer?.email) {
    const { data: profile, error } = await supabaseAdmin.from("profiles")
      .select("id").eq("email", data.customer.email.toLowerCase()).maybeSingle();
    if (error) throw new Error(`Could not match customer to profile: ${error.message}`);
    userId = profile?.id;
  }
  if (!userId) return null;

  let query = supabaseAdmin.from("orders")
    .select("id,user_id,product_id,plan_purchased,status")
    .eq("user_id", userId).in("status", ["pending", "paid"])
    .order("created_at", { ascending: false }).limit(1);
  if (productId) query = query.eq("product_id", productId);
  const { data: orders, error } = await query;
  if (error) throw new Error(`Could not find customer order: ${error.message}`);
  return (orders?.[0] as OrderRecord | undefined) ?? null;
}

async function recordEventStart(eventId: string, eventType: string): Promise<boolean> {
  const { data: existing, error: readError } = await supabaseAdmin.from("webhook_events")
    .select("status").eq("event_id", eventId).maybeSingle();
  if (readError) throw new Error(`Could not read webhook state: ${readError.message}`);
  if (existing?.status === "processed") return false;

  const { error } = await supabaseAdmin.from("webhook_events").upsert({
    event_id: eventId,
    type: eventType,
    status: "processing",
    processed_at: null,
    last_error: null,
  }, { onConflict: "event_id" });
  if (error) throw new Error(`Could not claim webhook event: ${error.message}`);
  return true;
}

async function finishEvent(eventId: string, error?: unknown) {
  const message = error instanceof Error ? error.message : error ? String(error) : null;
  const { error: updateError } = await supabaseAdmin.from("webhook_events").update({
    status: message ? "failed" : "processed",
    processed_at: message ? null : new Date().toISOString(),
    last_error: message?.slice(0, 1000) ?? null,
  }).eq("event_id", eventId);
  if (updateError) console.error("webhook:state_update_failed", { eventId, error: updateError.message });
}

async function activateOrder(order: OrderRecord, data: DodoEventData, timestamp?: string) {
  const productId = eventProductId(data);
  if (productId && productId !== order.product_id) throw new Error("Webhook product does not match the checkout order");
  if (order.plan_purchased !== "hobbyist" && order.plan_purchased !== "founder_circle") {
    throw new Error("Checkout order contains an unsupported plan");
  }

  const { error } = await supabaseAdmin.rpc("activate_paid_order", {
    p_order_id: order.id,
    p_user_id: order.user_id,
    p_payment_id: data.payment_id ?? null,
    p_subscription_id: data.subscription_id ?? null,
    p_purchased_at: data.created_at ?? timestamp ?? new Date().toISOString(),
  });
  if (error) throw new Error(`Could not activate paid order: ${error.message}`);
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const headers = {
    "webhook-id": req.headers.get("webhook-id") || "",
    "webhook-signature": req.headers.get("webhook-signature") || "",
    "webhook-timestamp": req.headers.get("webhook-timestamp") || "",
  };

  try {
    const verifier = new Webhook(process.env.DODO_PAYMENTS_WEBHOOK_SECRET!);
    await verifier.verify(raw, headers);
  } catch (error) {
    console.error("webhook:invalid_signature", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: DodoEvent;
  try {
    event = JSON.parse(raw) as DodoEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventId = event.id || headers["webhook-id"];
  if (!eventId || !event.type) return NextResponse.json({ error: "Missing event identity" }, { status: 400 });

  try {
    const shouldProcess = await recordEventStart(eventId, event.type);
    if (!shouldProcess) return NextResponse.json({ received: true, duplicate: true });

    const data = event.data ?? {};
    const order = await findOrder(data);

    switch (event.type) {
      case "payment.succeeded":
        if (!order) throw new Error("Successful payment could not be matched to an Xvault order");
        await activateOrder(order, data, event.timestamp);
        break;

      case "payment.failed":
        if (order && order.status !== "paid") {
          const { error } = await supabaseAdmin.from("orders").update({
            status: "failed",
            dodo_payment_id: data.payment_id ?? null,
            updated_at: new Date().toISOString(),
          }).eq("id", order.id);
          if (error) throw new Error(`Could not mark failed order: ${error.message}`);
        }
        break;

      case "subscription.active":
      case "subscription.plan_changed":
        if (!order) throw new Error("Active subscription could not be matched to an Xvault order");
        if (order.status === "pending") {
          await activateOrder(order, data, event.timestamp);
        } else {
          const { error } = await supabaseAdmin.from("profiles").update({
            subscription_status: "active",
            dodo_subscription_id: data.subscription_id ?? null,
            updated_at: new Date().toISOString(),
          }).eq("id", order.user_id);
          if (error) throw new Error(`Could not update subscription: ${error.message}`);
        }
        break;

      case "subscription.renewed":
      case "subscription.updated":
        if (order) {
          const { error } = await supabaseAdmin.from("profiles").update({
            subscription_status: "active",
            dodo_subscription_id: data.subscription_id ?? null,
            updated_at: new Date().toISOString(),
          }).eq("id", order.user_id);
          if (error) throw new Error(`Could not record subscription renewal: ${error.message}`);
        }
        break;

      case "subscription.cancelled":
      case "subscription.canceled":
      case "subscription.expired":
        if (order) {
          const { data: profile, error: readError } = await supabaseAdmin.from("profiles")
            .select("is_lifetime").eq("id", order.user_id).single();
          if (readError) throw new Error(`Could not check cancellation account: ${readError.message}`);
          if (!profile?.is_lifetime) {
            const { error } = await supabaseAdmin.from("profiles").update({
              plan: "free",
              subscription_status: "cancelled",
              dodo_subscription_id: null,
              updated_at: new Date().toISOString(),
            }).eq("id", order.user_id);
            if (error) throw new Error(`Could not apply cancellation: ${error.message}`);
          }
        }
        break;

      default:
        break;
    }

    await finishEvent(eventId);
    return NextResponse.json({ received: true });
  } catch (error) {
    await finishEvent(eventId, error);
    console.error("webhook:processing_error", { eventType: event.type, eventId, error });
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
