import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceClient } from "@/lib/auth";
import { getCreditPack } from "@/lib/credit-packs";
import { createDodoClient, getCheckoutBaseUrl, getDodoEnvironment, getDodoProductId } from "@/lib/dodo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null) as { packId?: string } | null;
  const pack = body?.packId ? getCreditPack(body.packId) : undefined;
  if (!body?.packId || !pack) {
    return NextResponse.json({ error: "Invalid credit pack" }, { status: 400 });
  }

  const packId = pack.id;
  let environment: "test_mode" | "live_mode";
  let productId: string;
  let dodo: ReturnType<typeof createDodoClient>;
  let appUrl: string;
  try {
    environment = getDodoEnvironment();
    productId = getDodoProductId(pack.productEnv, environment);
    dodo = createDodoClient(environment);
    appUrl = getCheckoutBaseUrl(request.url, environment);
  } catch (configurationError) {
    console.error("credits:configuration_error", { packId, configurationError });
    return NextResponse.json({ error: "This credit pack is not available yet" }, { status: 503 });
  }

  try {
    const product = await dodo.products.retrieve(productId);
    const price = product.price;
    if (
      price.type !== "one_time_price" ||
      !("price" in price) ||
      price.currency !== "USD" ||
      price.price !== pack.amountCents
    ) {
      throw new Error("Dodo product does not match the configured credit pack");
    }
  } catch (productError) {
    console.error("credits:product_verification_failed", { packId, productId, productError });
    return NextResponse.json({ error: "This credit pack is not available yet" }, { status: 503 });
  }

  const service = createServiceClient();
  const { data: order, error: orderError } = await service.from("credit_orders").insert({
    user_id: user.id,
    pack_key: packId,
    credits: pack.credits,
    amount_cents: pack.amountCents,
    currency: "USD",
    product_id: productId,
  }).select("id").single();

  if (orderError || !order) {
    console.error("credits:create_order_failed", { userId: user.id, error: orderError?.message });
    return NextResponse.json({ error: "Could not create credit order" }, { status: 500 });
  }

  try {
    const session = await dodo.checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: { email: user.email, name: user.email.split("@")[0] },
      return_url: `${appUrl}/credits/success?orderId=${order.id}`,
      metadata: {
        purchaseKind: "credit_pack",
        creditOrderId: order.id,
        userId: user.id,
        packId,
      },
    });

    const { error: updateError } = await service.from("credit_orders").update({
      checkout_url: session.checkout_url,
      dodo_checkout_session_id: session.session_id,
      dodo_payment_id: session.payment_id ?? null,
      updated_at: new Date().toISOString(),
    }).eq("id", order.id);
    if (updateError) throw updateError;

    return NextResponse.json({ checkoutUrl: session.checkout_url });
  } catch (error) {
    console.error("credits:checkout_failed", { orderId: order.id, error });
    await service.from("credit_orders").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", order.id);
    return NextResponse.json({ error: "Could not start credit checkout" }, { status: 500 });
  }
}
