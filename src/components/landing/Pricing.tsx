"use client";

import { cn } from "@/lib/utils";
import NumberFlow from "@number-flow/react";
import { CheckIcon, Crown, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { usePostHog } from "posthog-js/react";

type BillingPlan = "monthly" | "annually";

type SeatInfo = {
  taken: number;
  left: number;
  loading: boolean;
};

type Plan = {
  id: string;
  title: string;
  tagline: string;
  desc: string;
  monthlyPrice?: number;
  annuallyPrice?: number;
  lifetimePrice?: number;
  originalMonthly?: number;
  originalAnnually?: number;
  credits: number;
  buttonText: string;
  productId: string;
  badge?: string;
  highlighted?: boolean;
  isLifetime?: boolean;
  features: Array<{ text: string; muted?: boolean }>;
};

const TOTAL_SEATS = 30;

const PLANS: Plan[] = [
  // Hobbyist
  {
    id: "hobbyist",
    title: "HOBBYIST",
    tagline: "For hobby writers",
    desc: "Everything you need to write with an AI that actually knows your story.",
    monthlyPrice: 11.99,
    annuallyPrice: 119,
    originalMonthly: 19.99,
    originalAnnually: 239,
    credits: 300,
    buttonText: "Choose Hobbyist",
    productId: process.env.NEXT_PUBLIC_DODO_LINK_HOBBYIST!,
    highlighted: false,
    features: [
      { text: "300 AI credits / month" },
      { text: "1 active manuscript" },
      { text: "Alex (story chat + suggestions)" },
      { text: "Inline suggestions (Ctrl+K)" },
      { text: "Story Bible & World Board" },
      { text: "Basic continuity checking" },
      { text: "Community support", muted: true },
    ],
  },
  // Founder's Circle
  {
    id: "founder_circle",
    title: "FOUNDER'S CIRCLE",
    tagline: "Limited Lifetime Access",
    desc: "For writers who want to shape Xvault directly while they build their novel.",
    lifetimePrice: 49,
    credits: 500,
    buttonText: "Become a founding member",
    productId: process.env.NEXT_PUBLIC_DODO_LINK_LIFETIME!,
    badge: "ONLY 30 SEATS",
    isLifetime: true,
    features: [
      { text: "500 AI credits / month (resets)" },
      { text: "Unlimited active manuscripts" },
      { text: "Direct access to founder (lifetime)" },
      { text: "Priority feature requests" },
      { text: "Early access to new tools" },
      { text: "Personal onboarding call" },
    ],
  },
];

// ── Seats progress bar ──────────────────────────────────────────────────────

function SeatsBar({ seats }: { seats: SeatInfo }) {
  const { taken, left, loading } = seats;
  const soldOut = left === 0;
  const pct = Math.min(100, (taken / TOTAL_SEATS) * 100);

  // Color thresholds
  const barColor =
    soldOut
      ? "bg-red-500"
      : left <= 5
      ? "bg-gradient-to-r from-red-500 to-orange-500"
      : left <= 10
      ? "bg-gradient-to-r from-amber-500 to-yellow-400"
      : "bg-gradient-to-r from-orange-500 to-amber-400";

  const textColor =
    soldOut ? "text-red-600" : left <= 5 ? "text-red-600" : "text-orange-700";

  if (loading) {
    return (
      <div className="mt-4 mb-2 space-y-2">
        <div className="h-2 rounded-full bg-orange-100 overflow-hidden">
          <div className="h-full w-1/3 rounded-full bg-orange-200 animate-pulse" />
        </div>
        <div className="h-3 w-40 rounded bg-orange-100 animate-pulse" />
      </div>
    );
  }

  // Showing “0 claimed” is truthful but acts as negative social proof on a new offer.
  // Until the first seat is claimed, state the availability rather than inventing urgency.
  if (taken === 0) {
    return (
      <p className="mt-4 mb-2 text-xs font-medium text-orange-700">
        30 founding seats are available
      </p>
    );
  }

  return (
    <div className="mt-4 mb-2 space-y-1.5">
      {/* Bar */}
      <div className="h-2 rounded-full bg-orange-100 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {/* Label */}
      <p className={cn("text-xs font-medium", textColor)}>
        {soldOut
          ? "All 30 seats have been claimed"
          : `${taken}/${TOTAL_SEATS} seats claimed · ${left} remaining`}
      </p>
    </div>
  );
}

// ── Plan card ───────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  billing,
  seats,
  onCheckout,
}: {
  plan: Plan;
  billing: BillingPlan;
  seats?: SeatInfo;
  onCheckout: (plan: Plan) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const isLifetime = plan.isLifetime ?? false;
  const soldOut = isLifetime && seats ? seats.left === 0 && !seats.loading : false;
  const left = seats?.left ?? TOTAL_SEATS;

  const price = isLifetime
    ? plan.lifetimePrice!
    : billing === "monthly"
    ? plan.monthlyPrice!
    : plan.annuallyPrice! / 12;

  const original = isLifetime
    ? null
    : billing === "monthly"
    ? plan.originalMonthly
    : plan.originalAnnually! / 12;

  // Dynamic badge text
  const badgeText = isLifetime && seats && !seats.loading
    ? soldOut
      ? "SOLD OUT"
      : `${left} OF ${TOTAL_SEATS} SEATS LEFT`
    : plan.badge;

  // Badge urgency color
  const badgeClass = isLifetime
    ? soldOut
      ? "bg-gray-400 text-white"
      : left <= 5
      ? "bg-gradient-to-r from-red-500 to-orange-500 text-white"
      : left <= 10
      ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-white"
      : "bg-gradient-to-r from-orange-500 to-amber-500 text-white"
    : "bg-violet-100 text-violet-700";

  const handleCheckout = async () => {
    if (soldOut) return;
    setLoading(true);
    await onCheckout(plan);
    setLoading(false);
  };

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-3xl border overflow-visible transition-all h-full",
        plan.highlighted
          ? "border-violet-600 bg-[#2E0F6E] shadow-2xl"
          : "border-violet-200 bg-white",
        soldOut && "opacity-70"
      )}
    >
      {/* Badge */}
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-5 py-1 text-xs font-bold tracking-widest rounded-full whitespace-nowrap",
              badgeClass
            )}
          >
            {isLifetime && !soldOut && <Crown className="size-3.5" />}
            {badgeText}
          </span>
        </div>
      )}

      <div className="p-8 pt-12 flex-1 flex flex-col">
        <div>
          <p
            className={cn(
              "font-mono text-sm tracking-[2px] font-semibold",
              plan.highlighted ? "text-violet-300" : "text-violet-500"
            )}
          >
            {plan.title}
          </p>
          <p className="text-sm text-violet-400 mt-1">{plan.tagline}</p>
        </div>

        {/* Price */}
        <div className="mt-6 mb-2">
          <div className="flex items-baseline gap-1">
            <span
              className={cn(
                "text-5xl font-light tracking-tighter",
                plan.highlighted ? "text-white" : "text-gray-900"
              )}
            >
              <NumberFlow
                value={price}
                format={{ style: "currency", currency: "USD" }}
              />
            </span>
            {!isLifetime && (
              <span className="text-sm text-violet-400">/mo</span>
            )}
          </div>

          {original && (
            <p className="text-sm line-through text-violet-400/80 mt-1">
              ${original.toFixed(2)}
            </p>
          )}
        </div>

        {/* Seats progress bar — Founder's Circle only */}
        {isLifetime && seats && <SeatsBar seats={seats} />}

        <p
          className={cn(
            "text-sm mt-1 mb-6 min-h-[1.5rem]",
            plan.highlighted ? "text-violet-300/80" : "text-gray-500"
          )}
        >
          {isLifetime
            ? "One-time payment"
            : billing === "monthly"
            ? "Billed monthly"
            : "Billed annually"}
        </p>

        <p
          className={cn(
            "text-[15px] leading-relaxed mb-8",
            plan.highlighted ? "text-violet-200" : "text-gray-600"
          )}
        >
          {plan.desc}
        </p>

        {/* CTA Button */}
        <div className="mt-auto">
          <button
            onClick={handleCheckout}
            disabled={loading || soldOut}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-medium transition-all",
              soldOut
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : isLifetime
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:brightness-110"
                : "border border-violet-300 hover:bg-violet-50 text-violet-700",
              (loading) && "opacity-70 cursor-not-allowed"
            )}
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Processing...
              </>
            ) : soldOut ? (
              "Sold Out"
            ) : (
              plan.buttonText
            )}
          </button>
        </div>

        {/* Features */}
        <div className="mt-8 space-y-3 text-sm">
          {plan.features.map((f, i) => (
            <div key={i} className="flex gap-3">
              <CheckIcon
                className={cn(
                  "size-5 mt-0.5 flex-shrink-0",
                  plan.highlighted ? "text-violet-300" : "text-violet-600"
                )}
              />
              <span
                className={
                  plan.highlighted
                    ? "text-violet-200"
                    : f.muted
                    ? "text-gray-400"
                    : "text-gray-700"
                }
              >
                {f.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main export ─────────────────────────────────────────────────────────────

export default function Pricing() {
  const searchParams = useSearchParams();
  const posthog = usePostHog();
  const billing: BillingPlan = "monthly";
  const [checkoutError, setCheckoutError] = useState("");
  const autoCheckoutStarted = useRef(false);
  const [seats, setSeats] = useState<SeatInfo>({
    taken: 0,
    left: TOTAL_SEATS,
    loading: true,
  });

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/founder-seats", { signal: controller.signal })
      .then((r) => r.json())
      .then((d) =>
        setSeats({ taken: d.seatsTaken, left: d.seatsLeft, loading: false })
      )
      .catch((err) => {
        if (err?.name !== "AbortError") {
          setSeats((s) => ({ ...s, loading: false }));
        }
      });
    return () => controller.abort(new DOMException("unmounted", "AbortError"));
  }, []);

  const startCheckout = async (plan: Plan) => {
    setCheckoutError("");
    posthog?.capture("pricing_cta_clicked", { plan: plan.id, price: plan.lifetimePrice ?? plan.monthlyPrice });

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: plan.productId, planPurchased: plan.id }),
      });
      const data = await res.json();

      if (res.status === 401) {
        posthog?.capture("pricing_auth_required", { plan: plan.id });
        window.location.href = `/auth?mode=signup&next=${encodeURIComponent(`/pricing?checkout=${plan.id}`)}`;
        return;
      }

      if (data.checkoutUrl) {
        posthog?.capture("checkout_opened", { plan: plan.id });
        window.location.href = data.checkoutUrl;
        return;
      }

      setCheckoutError(data.error || "We couldn’t start checkout. Please try again.");
    } catch (err) {
      console.error(err);
      setCheckoutError("We couldn’t start checkout. Please try again.");
    }
  };

  useEffect(() => {
    const checkoutPlan = searchParams.get("checkout");
    const plan = PLANS.find((candidate) => candidate.id === checkoutPlan);
    if (!plan || autoCheckoutStarted.current) return;

    autoCheckoutStarted.current = true;
    const timeout = window.setTimeout(() => startCheckout(plan), 0);
    return () => window.clearTimeout(timeout);
    // This runs only when the destination query changes after authentication.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <section className="relative bg-[#F8F5FF] py-20 lg:py-28">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-light tracking-tight text-[#1A0A3C]">
            Start writing free. Upgrade when you need more.
          </h2>
          <p className="mt-4 text-lg text-violet-700/70">
            Get 14 days and 100 AI credits free — no credit card required.
          </p>
          <Link
            href="/auth?mode=signup&next=/start"
            onClick={() => posthog?.capture("pricing_free_trial_clicked")}
            className="inline-flex mt-7 items-center justify-center rounded-2xl bg-violet-600 px-6 py-3.5 font-medium text-white transition hover:bg-violet-700"
          >
            Start free — no card required
          </Link>
          <p className="mt-3 text-sm text-violet-700/60">
            Your manuscript stays yours. Export it whenever you want.
          </p>
        </div>

        <p className="text-center text-sm text-violet-700/60 -mt-8 mb-14">
          Paid plans are monthly or one-time; you’ll create a free account before checkout.
        </p>

        {/* Cards - 2 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              billing={billing}
              seats={plan.isLifetime ? seats : undefined}
              onCheckout={startCheckout}
            />
          ))}
        </div>
        {checkoutError && (
          <p role="alert" className="mx-auto mt-6 max-w-md rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
            {checkoutError}
          </p>
        )}
        <p className="mx-auto mt-10 max-w-2xl text-center text-sm leading-relaxed text-violet-900/60">
          Not sure yet? Start free and explore Alex, your Story Bible, and the World Board before choosing a plan.
        </p>
      </div>
    </section>
  );
}
