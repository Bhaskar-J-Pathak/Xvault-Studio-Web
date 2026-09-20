import { NextRequest, NextResponse } from "next/server";
import DodoPayments from "dodopayments";
import { createServerSupabaseClient, createServiceClient } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null) as { orderId?: string; paymentId?: string } | null;
  if (!body?.orderId) return NextResponse.json({ error: "Missing order ID" }, { status: 400 });

  const service = createServiceClient();
  const { data: order, error: orderError } = await service.from("orders")
    .select("id,user_id,product_id,plan_purchased,status,dodo_payment_id,dodo_checkout_session_id")
    .eq("id", body.orderId).eq("user_id", user.id).maybeSingle();
  if (orderError) return NextResponse.json({ error: "Could not check order" }, { status: 500 });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.status === "paid") return NextResponse.json({ status: "paid" });

  const environment =
    (process.env.DODO_PAYMENTS_ENVIRONMENT as "test_mode" | "live_mode") ||
    (process.env.NODE_ENV === "production" ? "live_mode" : "test_mode");
  const dodo = new DodoPayments({
    bearerToken: environment === "live_mode" ? process.env.DODO_API_KEY_LIVE! : process.env.DODO_API_KEY_TEST!,
    environment,
  });

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
    const purchasedProduct = payment.product_cart?.[0]?.product_id;
    if (!purchasedProduct || purchasedProduct !== order.product_id) {
      return NextResponse.json({ error: "Payment product does not match order" }, { status: 409 });
    }

    const { error } = await service.rpc("activate_paid_order", {
      p_order_id: order.id,
      p_user_id: user.id,
      p_payment_id: payment.payment_id,
      p_subscription_id: payment.subscription_id ?? null,
      p_purchased_at: payment.created_at,
    });
    if (error) throw error;
    return NextResponse.json({ status: "paid", reconciled: true });
  } catch (error) {
    console.error("checkout:status_reconciliation_failed", { orderId: order.id, error });
    return NextResponse.json({ status: "pending" }, { status: 202 });
  }
}
