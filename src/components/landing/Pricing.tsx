"use client";

import { cn } from "@/lib/utils";
import NumberFlow from "@number-flow/react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckIcon } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

type BillingPlan = "monthly" | "annually";

type Plan = {
  id: string;
  title: string;
  tagline: string;
  desc: string;
  monthlyPrice: number;
  annuallyPrice: number;
  originalMonthly: number;
  originalAnnually: number;
  credits: number;
  buttonText: string;
  buttonHref: string;
  badge?: string;
  highlighted: boolean;
  features: Array<{ text: string; muted?: boolean }>;
};

const PLANS: Plan[] = [
  {
    id: "hobbyist",
    title: "Hobbyist",
    tagline: "For hobby writers and shorter projects",
    desc: "Everything you need to write with an AI that actually knows your story.",
    monthlyPrice: 11.99,
    annuallyPrice: 119,
    originalMonthly: 19.99,
    originalAnnually: 239,
    credits: 300,
    buttonText: "Join free beta",
    buttonHref: "/auth?mode=signup",
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
  {
    id: "pro",
    title: "Pro",
    tagline: "For serious writers finishing full novels",
    desc: "Unlimited manuscripts, deeper memory, and every tool Alex has to offer.",
    monthlyPrice: 24.99,
    annuallyPrice: 249,
    originalMonthly: 39.99,
    originalAnnually: 479,
    credits: 600,
    buttonText: "Join free beta",
    buttonHref: "/auth?mode=signup",
    badge: "Most popular",
    highlighted: true,
    features: [
      { text: "600 AI credits / month" },
      { text: "Unlimited active manuscripts" },
      { text: "Alex co-author (chat + suggestions)" },
      { text: "Ghost Writing (Ctrl+K)" },
      { text: "Story Bible & World Board" },
      { text: "Proactive continuity alerts" },
      { text: "Writer's block detection" },
      { text: "Full long-context memory (100k+ words)" },
      { text: "Priority support" },
    ],
  },
];

function PlanCard({ plan, billing }: { plan: Plan; billing: BillingPlan }) {
  const price         = billing === "monthly" ? plan.monthlyPrice : plan.annuallyPrice / 12;
  const originalPrice = billing === "monthly" ? plan.originalMonthly : plan.originalAnnually / 12;

  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden rounded-3xl border transition-all",
        plan.highlighted
          ? "border-violet-500/40 bg-[#2E0F6E]"
          : "border-violet-300/60 bg-white"
      )}
      style={
        plan.highlighted
          ? { boxShadow: "0 24px 64px rgba(109,40,217,0.38), 0 4px 16px rgba(109,40,217,0.2)" }
          : { boxShadow: "0 2px 12px rgba(109,40,217,0.06)" }
      }
    >
      {/* Aurora glow inside Pro card */}
      {plan.highlighted && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 55% at 65% -5%, rgba(196,181,253,0.20) 0%, transparent 60%)",
          }}
        />
      )}

      {/* Top section */}
      <div className="relative p-7 pb-5">
        {plan.badge && (
          <span
            className={cn(
              "mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.16em]",
              plan.highlighted
                ? "border border-violet-400/30 bg-violet-400/10 text-violet-300"
                : "border border-violet-200 bg-violet-50 text-violet-500"
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", plan.highlighted ? "bg-violet-400" : "bg-violet-500")} />
            {plan.badge}
          </span>
        )}

        <p className={cn("text-[0.7rem] font-bold uppercase tracking-[0.18em]", plan.highlighted ? "text-violet-300" : "text-violet-400")}>
          {plan.title}
        </p>

        {/* Projected label */}
        <p className={cn("mt-2 text-[0.62rem] font-semibold uppercase tracking-widest", plan.highlighted ? "text-violet-400/50" : "text-violet-400/60")}>
          Projected
        </p>

        {/* Price with slashed original */}
        <div className="mt-1 flex items-end gap-2">
          <span className={cn("font-display text-[2.6rem] font-light leading-none tracking-tight", plan.highlighted ? "text-white" : "text-[#1A0A3C]")}>
            <NumberFlow
              value={price}
              format={{ style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2, currencyDisplay: "narrowSymbol" }}
            />
          </span>
          <span className={cn("mb-1.5 text-[0.78rem]", plan.highlighted ? "text-violet-300/60" : "text-violet-900/35")}>/mo</span>
          {/* Slashed original price */}
          <span className={cn("mb-1.5 text-[0.72rem] line-through", plan.highlighted ? "text-violet-400/50" : "text-violet-400/50")}>
            ${originalPrice.toFixed(2)}
          </span>
        </div>

        {/* Billing label */}
        <div className="h-6 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={billing}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className={cn("mt-1 text-[0.72rem]", plan.highlighted ? "text-violet-400/60" : "text-violet-500/60")}
            >
              {billing === "monthly"
                ? "Billed monthly"
                : `$${plan.annuallyPrice} billed annually · was $${plan.originalAnnually}`}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Credit pill */}
        <div className="mt-3">
          <span className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.68rem] font-semibold",
            plan.highlighted
              ? "bg-violet-400/15 text-violet-200"
              : "bg-violet-100 text-violet-700"
          )}>
            <svg width="9" height="9" viewBox="0 0 9 9" fill="currentColor" aria-hidden="true">
              <circle cx="4.5" cy="4.5" r="4.5" opacity="0.3" />
              <circle cx="4.5" cy="4.5" r="2.5" />
            </svg>
            {plan.credits.toLocaleString()} AI credits / month
          </span>
        </div>

        <p className={cn("mt-3 text-[0.84rem] leading-relaxed", plan.highlighted ? "text-violet-300/70" : "text-violet-900/45")}>
          {plan.desc}
        </p>
      </div>

      {/* CTA */}
      <div className="px-7 pb-5">
        <Link
          href={plan.buttonHref}
          className={cn(
            "inline-flex w-full items-center justify-center rounded-xl px-6 py-3 text-[0.875rem] font-medium transition-all hover:-translate-y-0.5",
            plan.highlighted
              ? "bg-white text-violet-800 shadow-md hover:bg-violet-50"
              : "border border-violet-300 bg-white text-violet-700 hover:border-violet-400 hover:bg-violet-50"
          )}
        >
          {plan.buttonText}
        </Link>
      </div>

      {/* Divider */}
      <div className={cn("mx-7 mb-5 h-px", plan.highlighted ? "bg-violet-500/20" : "bg-violet-100")} />

      {/* Features */}
      <div className="flex flex-col gap-3 px-7 pb-8">
        {plan.features.map((feature, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <span className={cn(
              "mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full",
              plan.highlighted
                ? feature.muted ? "bg-violet-500/15 text-violet-400/50" : "bg-violet-500/20 text-violet-300"
                : feature.muted ? "bg-violet-50 text-violet-300"         : "bg-violet-100 text-violet-600"
            )}>
              <CheckIcon className="size-2.5" strokeWidth={2.5} />
            </span>
            <span className={cn(
              "text-[0.82rem] leading-snug",
              plan.highlighted
                ? feature.muted ? "text-violet-300/40" : "text-violet-200/80"
                : feature.muted ? "text-violet-900/28" : "text-violet-900/60"
            )}>
              {feature.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Pricing() {
  const [billing, setBilling] = useState<BillingPlan>("monthly");

  const annualSavings = Math.round(
    100 - (PLANS[1].annuallyPrice / (PLANS[1].monthlyPrice * 12)) * 100
  );

  return (
    <section id="pricing" className="relative bg-[#EDE8FF] px-6 py-24 lg:px-10 lg:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(196,181,253,0.35) 30%, rgba(196,181,253,0.35) 70%, transparent)" }}
      />

      <div className="mx-auto max-w-[1160px]">

        {/* Header */}
        <div className="mb-10 text-center">
          {/* Launch offer banner */}
          <div className="mb-5 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-300/50 bg-white px-4 py-1.5 text-[0.68rem] font-semibold text-violet-700 shadow-sm">
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="h-1.5 w-1.5 rounded-full bg-violet-500"
              />
              Public Beta · Free for all users right now
            </span>
          </div>

          <h2
            className="font-display text-[#1A0A3C]"
            style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", lineHeight: 1.1, letterSpacing: "-0.025em", fontWeight: 300 }}
          >
            Where pricing is headed.
          </h2>
          <p className="mt-4 text-[0.9375rem] text-violet-900/45">
            Everything is free while we&apos;re in beta. These are projected prices for when we launch.
          </p>
          <p className="mt-2 text-[0.78rem] text-violet-600/60">
            1 AI credit = 1 chat message or writing suggestion · resets monthly
          </p>
        </div>

        {/* Toggle */}
        <div className="mb-10 flex items-center justify-center gap-3">
          <span className={cn("text-[0.82rem] font-medium transition-colors", billing === "monthly" ? "text-violet-800" : "text-violet-400")}>
            Monthly
          </span>

          <button
            onClick={() => setBilling((p) => (p === "monthly" ? "annually" : "monthly"))}
            aria-label="Toggle billing period"
            className={cn(
              "relative h-6 w-12 rounded-full transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500",
              billing === "annually" ? "bg-violet-600" : "bg-violet-300/60"
            )}
          >
            <div className={cn(
              "absolute top-1 left-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-300 ease-in-out",
              billing === "annually" ? "translate-x-6" : "translate-x-0"
            )} />
          </button>

          <span className={cn("flex items-center gap-1.5 text-[0.82rem] font-medium transition-colors", billing === "annually" ? "text-violet-800" : "text-violet-400")}>
            Annual
            <AnimatePresence>
              {billing === "annually" && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.18 }}
                  className="rounded-full bg-violet-600 px-2 py-0.5 text-[0.62rem] font-bold text-white"
                >
                  Save {annualSavings}%
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:max-w-[780px] lg:mx-auto">
          {PLANS.map((plan) => (
            <PlanCard key={plan.id} plan={plan} billing={billing} />
          ))}
        </div>

        {/* Trial note */}
        <div className="mt-8 flex flex-col items-center gap-1.5 text-center">
          <p className="text-[0.78rem] font-medium text-violet-700/70">
            Free during public beta · No credit card required · We&apos;ll announce before anything changes
          </p>
          <p className="text-[0.68rem] text-violet-900/28">
            Pricing above is projected. Early beta users will receive a discount when paid plans launch.
          </p>
        </div>
      </div>
    </section>
  );
}
