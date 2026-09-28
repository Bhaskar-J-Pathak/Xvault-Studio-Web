import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceClient } from "@/lib/auth";
import { createDodoClient, getDodoEnvironment } from "@/lib/dodo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null) as { orderId?: string; paymentId?: string } | null;
  if (!body?.orderId) return NextResponse.json({ error: "Missing order ID" }, { status: 400 });

  const service = createServiceClient();
  const { data: order, error } = await service.from("credit_orders")
    .select("id,user_id,product_id,credits,status,dodo_payment_id,dodo_checkout_session_id")
    .eq("id", body.orderId).eq("user_id", user.id).maybeSingle();
  if (error) return NextResponse.json({ error: "Could not check order" }, { status: 500 });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.status === "paid") return NextResponse.json({ status: "paid", credits: order.credits });

  let dodo: ReturnType<typeof createDodoClient>;
  try {
    dodo = createDodoClient(getDodoEnvironment());
  } catch (configurationError) {
    console.error("credits:status_configuration_error", { orderId: order.id, configurationError });
    return NextResponse.json({ error: "Payment status is temporarily unavailable" }, { status: 503 });
  }

  try {
    let paymentId = body.paymentId ?? order.dodo_payment_id;
    if (!paymentId && order.dodo_checkout_session_id) {
      const checkout = await dodo.checkoutSessions.retrieve(order.dodo_checkout_session_id);
      if (checkout.payment_status !== "succeeded" || !checkout.payment_id) {
        return NextResponse.json({ status: checkout.payment_status ?? order.status });
      }
      paymentId = checkout.payment_id;
    }
    if (!paymentId) return NextResponse.json({ status: order.status });

    const payment = await dodo.payments.retrieve(paymentId);
    if (payment.status !== "succeeded") return NextResponse.json({ status: payment.status ?? "pending" });
    if (payment.product_cart?.[0]?.product_id !== order.product_id) {
      return NextResponse.json({ error: "Payment product does not match order" }, { status: 409 });
    }

    const { error: fulfillError } = await service.rpc("fulfill_credit_order", {
      p_order_id: order.id,
      p_user_id: user.id,
      p_payment_id: payment.payment_id,
      p_paid_at: payment.created_at,
    });
    if (fulfillError) throw fulfillError;
    return NextResponse.json({ status: "paid", credits: order.credits, reconciled: true });
  } catch (reconcileError) {
    console.error("credits:status_reconciliation_failed", { orderId: order.id, error: reconcileError });
    return NextResponse.json({ status: "pending" }, { status: 202 });
  }
}
