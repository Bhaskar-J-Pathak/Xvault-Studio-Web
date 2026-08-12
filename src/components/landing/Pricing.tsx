"use client";

import { cn } from "@/lib/utils";
import NumberFlow from "@number-flow/react";
import { CheckIcon, Crown, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

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
    buttonText: "Start now",
    productId: process.env.NEXT_PUBLIC_DODO_LINK_HOBBYIST!,
    highlighted: false,
    features: [
      { text: "300 AI credits / month" },
      { text: "1 active manuscript" },
      { text: "Alex co-author (chat + suggestions)" },
      { text: "Ghost Writing (Ctrl+K)" },
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
    desc: "Everything in Pro + direct 1:1 access to the founder for life.",
    lifetimePrice: 49,
    credits: 600,
    buttonText: "Claim Lifetime Seat",
    productId: process.env.NEXT_PUBLIC_DODO_LINK_LIFETIME!,
    badge: "ONLY 30 SEATS",
    isLifetime: true,
    features: [
      { text: "Everything in Pro plan" },
      { text: "600 AI credits / month (resets)" },
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
}: {
  plan: Plan;
  billing: BillingPlan;
  seats?: SeatInfo;
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

    try {
      const planPurchased = isLifetime
        ? "founder_circle"
        : billing === "monthly"
        ? "hobbyist"
        : "hobbyist";

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: plan.productId, planPurchased }),
      });

      const data = await res.json();

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert(data.error || "Something went wrong. Please try again.");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to start checkout");
      setLoading(false);
    }
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
  const [billing, setBilling] = useState<BillingPlan>("monthly");
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

  return (
    <section className="relative bg-[#F8F5FF] py-20 lg:py-28">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-light tracking-tight text-[#1A0A3C]">
            Simple pricing
          </h2>
          <p className="mt-4 text-lg text-violet-700/70">
            Free during public beta · Early supporters get lifetime access
          </p>
        </div>

        {/* Billing Toggle (only affects Hobbyist) */}
        <div className="flex justify-center mb-14">
          <div className="inline-flex bg-white rounded-full p-1 shadow-sm">
            <button
              onClick={() => setBilling("monthly")}
              className={cn(
                "px-8 py-2.5 rounded-full text-sm font-medium transition-all",
                billing === "monthly"
                  ? "bg-violet-600 text-white"
                  : "text-violet-600 hover:bg-violet-50"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("annually")}
              className={cn(
                "px-8 py-2.5 rounded-full text-sm font-medium transition-all",
                billing === "annually"
                  ? "bg-violet-600 text-white"
                  : "text-violet-600 hover:bg-violet-50"
              )}
            >
              Annual
            </button>
          </div>
        </div>

        {/* Cards - 2 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              billing={billing}
              seats={plan.isLifetime ? seats : undefined}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
