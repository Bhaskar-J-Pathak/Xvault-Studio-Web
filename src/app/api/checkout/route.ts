// src/app/api/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createDodoClient, getCheckoutBaseUrl, getDodoEnvironment } from "@/lib/dodo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let environment: "test_mode" | "live_mode";
  let dodo: ReturnType<typeof createDodoClient>;
  let appUrl: string;
  try {
    environment = getDodoEnvironment();
    dodo = createDodoClient(environment);
    appUrl = getCheckoutBaseUrl(req.url, environment);
  } catch (configurationError) {
    console.error("checkout:configuration_error", { configurationError });
    return NextResponse.json({ error: "Checkout is temporarily unavailable" }, { status: 503 });
  }

  const body = (await req.json().catch(() => null)) as
    | { productId?: string; planPurchased?: string }
    | null;

  const productId = body?.productId;
  const requestedPlan = body?.planPurchased;

  if (!productId || !requestedPlan) {
    return NextResponse.json(
      { error: "Missing required fields: productId, planPurchased" },
      { status: 400 }
    );
  }

  // Never trust a browser-supplied plan name. The purchased product is the
  // source of truth, otherwise a caller could pair a cheaper product with the
  // Founder plan in a handcrafted request.
  const productPlans = new Map<string, "hobbyist" | "founder_circle">();
  if (process.env.NEXT_PUBLIC_DODO_LINK_HOBBYIST) {
    productPlans.set(process.env.NEXT_PUBLIC_DODO_LINK_HOBBYIST, "hobbyist");
  }
  if (process.env.NEXT_PUBLIC_DODO_LINK_LIFETIME) {
    productPlans.set(process.env.NEXT_PUBLIC_DODO_LINK_LIFETIME, "founder_circle");
  }
  const planPurchased = productPlans.get(productId);
  if (!planPurchased || requestedPlan !== planPurchased) {
    return NextResponse.json({ error: "Invalid product or plan" }, { status: 400 });
  }
  // Read the server-owned Dodo product price so future Founder price changes
  // automatically produce the correct 40% commission. Never trust the browser.
  let amountCents: number;
  try {
    const product = await dodo.products.retrieve(productId);
    const price = product.price;
    const expectedType = planPurchased === "founder_circle" ? "one_time_price" : "recurring_price";
    if (price.type !== expectedType || !("price" in price) || price.currency !== "USD" || !Number.isInteger(price.price) || price.price <= 0) {
      throw new Error("Dodo product price does not match the expected Xvault plan");
    }
    amountCents = price.price;
  } catch (priceError) {
    console.error("checkout:product_price_failed", { productId, planPurchased, priceError });
    return NextResponse.json({ error: "Could not verify the current plan price" }, { status: 502 });
  }

  // Auth: ensure user is logged in
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        // Optional: add set & delete if needed for other routes
        set: () => {},    
        remove: () => {},
      },
    }
  );

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Create a pending order
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      product_id: productId, // Ensure this is a real Dodo product_id (e.g., "prod_123")
      plan_purchased: planPurchased,
      amount_cents: amountCents,
      currency: "USD",
      status: "pending",
    })
    .select()
    .single();

  if (orderErr || !order) {
    console.error("checkout:create_order_failed", { userId: user.id, error: orderErr });
    return NextResponse.json({ error: "Could not create order" }, { status: 500 });
  }

  // Build return URL
  const returnUrl = `${appUrl}/checkout/success?orderId=${order.id}`;

  // Create Dodo checkout session
  try {
    const session = await dodo.checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: {
        email: user.email!,
        name: user.email!.split("@")[0],
      },
      return_url: returnUrl,
      metadata: { orderId: order.id, userId: user.id, planPurchased },
    });

    const { error: orderUpdateError } = await supabase
      .from("orders")
      .update({
        checkout_url: session.checkout_url,
        dodo_checkout_session_id: session.session_id,
        dodo_payment_id: session.payment_id ?? null,
      })
      .eq("id", order.id);
    if (orderUpdateError) {
      throw new Error(`Could not link checkout session to order: ${orderUpdateError.message}`);
    }

    return NextResponse.json({ checkoutUrl: session.checkout_url });
  } catch (err) {
    console.error("checkout:session_create_failed", { orderId: order.id, error: err });
    const { error: failedUpdateError } = await supabase.from("orders").update({ status: "failed" }).eq("id", order.id);
    if (failedUpdateError) console.error("checkout:mark_failed_error", { orderId: order.id, error: failedUpdateError });
    return NextResponse.json({ error: "Could not start checkout" }, { status: 500 });
  }
}
