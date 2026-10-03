"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { useEffect, useRef, useState } from "react";

type SeatInfo = {
  taken: number;
  left: number;
  loading: boolean;
};

type PaidPlan = {
  id: "hobbyist" | "founder_circle";
  name: string;
  label: string;
  price: string;
  cadence: string;
  description: string;
  button: string;
  productId: string;
  founder?: boolean;
  features: readonly string[];
};

const TOTAL_SEATS = 30;
const CURRENT_FOUNDER_PRICE = 59;
const NEXT_FOUNDER_PRICE = 69;
const NEXT_PRICE_AT_SEATS = 10;

const plans: readonly PaidPlan[] = [
  {
    id: "hobbyist",
    name: "Hobbyist",
    label: "Monthly studio",
    price: "$11.99",
    cadence: "per month",
    description: "For a writer working steadily on one active manuscript.",
    button: "Choose Hobbyist",
    productId: process.env.NEXT_PUBLIC_DODO_LINK_HOBBYIST!,
    features: [
      "300 AI credits each month",
      "One active manuscript",
      "Alex and cursor-aware writing",
      "Story Bible, World Board, and Story Pulse",
      "Continuity tools and Word export",
    ],
  },
  {
    id: "founder_circle",
    name: "Founder's Circle",
    label: "Limited lifetime access",
    price: "$59",
    cadence: "one-time payment",
    description: "For a writer who wants the full studio and help mapping a complete manuscript.",
    button: "Claim lifetime access",
    productId: process.env.NEXT_PUBLIC_DODO_LINK_LIFETIME!,
    founder: true,
    features: [
      "1,000 AI credits each month",
      "500 welcome credits that never expire",
      "Unlimited active manuscripts",
      "Personal full-manuscript setup and diagnostic",
      "Direct help from the founder when blocked",
      "A voice in what Xvault builds next",
    ],
  },
] as const;

function FeatureList({ features }: { features: readonly string[] }) {
  return (
    <ul className="mt-8 border-t border-[#191714]/15">
      {features.map((feature) => (
        <li key={feature} className="grid grid-cols-[18px_1fr] gap-3 border-b border-[#191714]/15 py-3.5 text-sm leading-6 text-[#191714]/70">
          <span aria-hidden="true" className="font-mono text-[10px] font-semibold text-[#A6402D]">✓</span>
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  );
}

function FounderAvailability({ seats }: { seats: SeatInfo }) {
  if (seats.loading) {
    return (
      <div className="mt-6 animate-pulse" aria-label="Loading Founder seat availability">
        <div className="h-1.5 w-full bg-[#191714]/10" />
        <div className="mt-3 h-3 w-44 bg-[#191714]/10" />
      </div>
    );
  }

  if (seats.left === 0) {
    return <p className="mt-6 border-y border-[#191714]/15 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#191714]/64">All 30 Founder seats have been claimed</p>;
  }

  if (seats.taken === 0) {
    return <p className="mt-6 border-y border-[#191714]/15 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#A6402D]">Limited to the first 30 founding writers</p>;
  }

  const percentage = Math.min(100, (seats.taken / TOTAL_SEATS) * 100);
  const currentPriceSeats = Math.max(0, NEXT_PRICE_AT_SEATS - seats.taken);

  return (
    <div className="mt-6 border-y border-[#191714]/15 py-4">
      <div className="h-1.5 w-full bg-[#191714]/10">
        <div className="h-full bg-[#A6402D] transition-[width] duration-700" style={{ width: `${percentage}%` }} />
      </div>
      <p className="mt-3 text-xs font-semibold text-[#191714]/70">{seats.left} of {TOTAL_SEATS} memberships remain</p>
      <p className="mt-2 text-[11px] leading-5 text-[#191714]/64">
        {currentPriceSeats > 0
          ? `${currentPriceSeats} ${currentPriceSeats === 1 ? "seat" : "seats"} remain at $${CURRENT_FOUNDER_PRICE}. The price becomes $${NEXT_FOUNDER_PRICE} after ${NEXT_PRICE_AT_SEATS} seats are claimed.`
          : `The next Founder price is $${NEXT_FOUNDER_PRICE}.`}
      </p>
    </div>
  );
}

function TrialCard({ signedIn, onTrialClick }: { signedIn: boolean; onTrialClick: () => void }) {
  return (
    <article className="flex h-full flex-col border border-[#191714]/18 p-6 sm:p-8">
      <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[#191714]/64">Free start</p>
      <h3 className="mt-6 font-display text-[2.35rem] leading-none tracking-[-0.045em]">First Story Scan</h3>
      <div className="mt-8 flex items-end gap-3 border-b border-[#191714]/15 pb-6">
        <span className="font-display text-[4.3rem] leading-none tracking-[-0.06em]">$0</span>
        <span className="pb-1 text-xs uppercase tracking-[0.12em] text-[#191714]/58">to begin</span>
      </div>
      <p className="mt-6 min-h-[72px] text-sm leading-7 text-[#191714]/70">See what Xvault finds in the opening of your manuscript before choosing a paid plan.</p>
      <FeatureList features={["14 days of studio access", "100 AI credits", "Map up to three eligible chapters", "No credit card required"]} />
      <Link
        href={signedIn ? "/dashboard" : "/auth?mode=signup&next=%2Fdashboard%3Fscan%3D1"}
        onClick={onTrialClick}
        className="mt-auto inline-flex min-h-12 items-center justify-center border border-[#191714] px-5 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors hover:bg-[#191714] hover:text-[#F4F0E8]"
      >
        {signedIn ? "Open dashboard" : "Start free"}
      </Link>
    </article>
  );
}

function PaidPlanCard({
  plan,
  seats,
  onCheckout,
}: {
  plan: PaidPlan;
  seats: SeatInfo;
  onCheckout: (plan: PaidPlan) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const soldOut = Boolean(plan.founder && !seats.loading && seats.left === 0);

  const handleCheckout = async () => {
    if (soldOut) return;
    setLoading(true);
    await onCheckout(plan);
    setLoading(false);
  };

  return (
    <article className={`relative flex h-full flex-col border p-6 sm:p-8 ${plan.founder ? "border-[#A6402D] bg-[#F8F3E8]" : "border-[#191714]/18"}`}>
      {plan.founder && (
        <p className="absolute right-0 top-0 bg-[#A6402D] px-4 py-2 font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-white">
          30 seats only
        </p>
      )}
      <p className={`font-mono text-[9px] font-semibold uppercase tracking-[0.16em] ${plan.founder ? "text-[#A6402D]" : "text-[#191714]/64"}`}>{plan.label}</p>
      <h3 className="mt-6 font-display text-[2.35rem] leading-none tracking-[-0.045em]">{plan.name}</h3>
      <div className="mt-8 flex items-end gap-3 border-b border-[#191714]/15 pb-6">
        <span className="font-display text-[4.3rem] leading-none tracking-[-0.06em]">{plan.price}</span>
        <span className="max-w-[110px] pb-1 text-xs uppercase tracking-[0.12em] text-[#191714]/58">{plan.cadence}</span>
      </div>
      {plan.founder && <FounderAvailability seats={seats} />}
      <p className="mt-6 min-h-[72px] text-sm leading-7 text-[#191714]/70">{plan.description}</p>
      <FeatureList features={plan.features} />
      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading || soldOut}
        className={`mt-auto inline-flex min-h-12 items-center justify-center gap-2 px-5 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          plan.founder ? "bg-[#A6402D] text-white hover:bg-[#7F2F22]" : "bg-[#191714] text-[#F4F0E8] hover:bg-[#A6402D]"
        }`}
      >
        {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        {soldOut ? "Sold out" : loading ? "Opening checkout" : plan.button}
      </button>
    </article>
  );
}

export default function Pricing({ signedIn = false }: { signedIn?: boolean }) {
  const searchParams = useSearchParams();
  const posthog = usePostHog();
  const [checkoutError, setCheckoutError] = useState("");
  const autoCheckoutStarted = useRef(false);
  const [seats, setSeats] = useState<SeatInfo>({ taken: 0, left: TOTAL_SEATS, loading: true });

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/founder-seats", { signal: controller.signal })
      .then((response) => response.json())
      .then((data) => setSeats({ taken: data.seatsTaken, left: data.seatsLeft, loading: false }))
      .catch((error) => {
        if (error?.name !== "AbortError") setSeats((current) => ({ ...current, loading: false }));
      });
    return () => controller.abort(new DOMException("unmounted", "AbortError"));
  }, []);

  const startCheckout = async (plan: PaidPlan) => {
    setCheckoutError("");
    posthog?.capture("pricing_cta_clicked", { plan: plan.id, price: plan.founder ? CURRENT_FOUNDER_PRICE : 11.99 });

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: plan.productId, planPurchased: plan.id }),
      });
      const data = await response.json();

      if (response.status === 401) {
        posthog?.capture("pricing_auth_required", { plan: plan.id });
        window.location.href = `/auth?mode=signup&next=${encodeURIComponent(`/pricing?checkout=${plan.id}`)}`;
        return;
      }

      if (data.checkoutUrl) {
        posthog?.capture("checkout_opened", { plan: plan.id });
        window.location.href = data.checkoutUrl;
        return;
      }

      setCheckoutError(data.error || "We couldn't start checkout. Please try again.");
    } catch (error) {
      console.error(error);
      setCheckoutError("We couldn't start checkout. Please try again.");
    }
  };

  useEffect(() => {
    const checkoutPlan = searchParams.get("checkout");
    const plan = plans.find((candidate) => candidate.id === checkoutPlan);
    if (!plan || autoCheckoutStarted.current) return;

    autoCheckoutStarted.current = true;
    const timeout = window.setTimeout(() => startCheckout(plan), 0);
    return () => window.clearTimeout(timeout);
    // This runs only when the destination query changes after authentication.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <section id="pricing" className="scroll-mt-[72px] bg-[#F4F0E8] px-6 py-24 text-[#191714] lg:px-10 lg:py-32">
      <div className="mx-auto max-w-[1280px] border-t border-[#191714]/15 pt-8 lg:pt-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-end lg:gap-20">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#A6402D]">10 / Pricing</p>
            <h2 className="mt-7 max-w-[720px] font-display text-[clamp(3.5rem,6vw,6.5rem)] leading-[0.92] tracking-[-0.055em]">
              Start free. Stay monthly. Or keep it.
            </h2>
          </div>
          <div className="lg:pb-2">
            <p className="max-w-[570px] text-base leading-8 text-[#191714]/70">
              Begin with the opening chapters. Upgrade when Xvault has earned a place beside the rest of the manuscript.
            </p>
            <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#191714]/64">
              No credit card to start · Export whenever you want
            </p>
            {signedIn && <p className="mt-4 text-sm font-semibold text-[#A6402D]">Your purchase will be applied to the account you are signed into.</p>}
          </div>
        </div>

        <div className="mt-16 grid gap-5 lg:mt-20 lg:grid-cols-3">
          <TrialCard
            signedIn={signedIn}
            onTrialClick={() => posthog?.capture("pricing_free_trial_clicked")}
          />
          {plans.map((plan) => (
            <PaidPlanCard key={plan.id} plan={plan} seats={seats} onCheckout={startCheckout} />
          ))}
        </div>

        {checkoutError && (
          <p role="alert" className="mt-6 border border-[#A6402D]/35 bg-[#F8F3E8] px-5 py-4 text-center text-sm text-[#7F2F22]">
            {checkoutError}
          </p>
        )}

        <div className="mt-12 grid gap-7 border-y border-[#191714]/15 py-9 lg:grid-cols-[220px_1fr] lg:gap-14">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[#A6402D]">Founder setup</p>
          <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr] lg:gap-14">
            <p className="font-display text-[clamp(2rem,3.2vw,3.4rem)] leading-[1] tracking-[-0.04em]">The lifetime option begins with your complete manuscript.</p>
            <p className="text-sm leading-7 text-[#191714]/70">We help import the draft, build its Story Bible and World Board, review continuity and Story Pulse findings, and identify where to focus next. You keep access to the full studio after the setup.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
