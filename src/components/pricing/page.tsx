"use client";

import { cn } from "@/lib/utils";
import NumberFlow from "@number-flow/react";
import { CheckIcon, Crown, Loader2 } from "lucide-react";
import { useState } from "react";

type BillingPlan = "monthly" | "annually";

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
  productId: string; // Dodo product ID
  badge?: string;
  highlighted?: boolean;
  isLifetime?: boolean;
  features: Array<{ text: string; muted?: boolean }>;
};

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
    desc: "Everything you need to build your novel + direct 1:1 access to the founder for life.",
    lifetimePrice: 49,
    credits: 600,
    buttonText: "Claim Lifetime Seat",
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

function PlanCard({
  plan,
  billing,
}: {
  plan: Plan;
  billing: BillingPlan;
}) {
  const [loading, setLoading] = useState(false);
  const isLifetime = plan.isLifetime ?? false;

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

  const handleCheckout = async () => {
    setLoading(true);

    try {
      const planPurchased = isLifetime
        ? "founder_circle"
        : billing === "monthly"
        ? "hobbyist"
        : "hobbyist"; // You can later add annual logic if needed

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: plan.productId,
          planPurchased,
        }),
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
          : "border-violet-200 bg-white"
      )}
    >
      {/* Badge */}
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-5 py-1 text-xs font-bold tracking-widest rounded-full whitespace-nowrap",
              isLifetime
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white"
                : "bg-violet-100 text-violet-700"
            )}
          >
            {isLifetime && <Crown className="size-3.5" />}
            {plan.badge}
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
            disabled={loading}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-medium transition-all",
              isLifetime
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:brightness-110"
                : "border border-violet-300 hover:bg-violet-50 text-violet-700",
              loading && "opacity-70 cursor-not-allowed"
            )}
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Processing...
              </>
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

export default function Pricing() {
  const [billing, setBilling] = useState<BillingPlan>("monthly");

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
            <PlanCard key={plan.id} plan={plan} billing={billing} />
          ))}
        </div>
      </div>
    </section>
  );
}