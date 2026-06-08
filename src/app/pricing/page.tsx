import Link from "next/link";
import { Check, Zap } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Beta banner */}
      <div className="bg-violet-600 text-white text-center py-2.5 px-4 text-sm font-medium">
        Payments coming soon — beta is completely free. Enjoy the full experience.
      </div>

      <div className="max-w-3xl mx-auto px-6 py-16 space-y-12">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-semibold text-[#1A1A1A] tracking-tight">
            Simple, honest pricing
          </h1>
          <p className="text-[#1A1A1A]/50 text-base">
            Start free. Upgrade when you're ready to write more.
          </p>
        </div>

        {/* Cards */}
        <div className="grid sm:grid-cols-2 gap-5">
          {/* Scribe */}
          <PlanCard
            name="Scribe"
            price={9}
            yearlyPrice={72}
            credits={300}
            description="Perfect for regular writers"
            features={[
              "300 AI credits / month",
              "Unlimited projects",
              "Co-author (Alex)",
              "World Board",
              "Story Bible + semantic search",
              "Plot thread tracking",
            ]}
          />

          {/* Pro */}
          <PlanCard
            name="Pro"
            price={29}
            yearlyPrice={264}
            credits={1200}
            description="For serious daily writers"
            highlighted
            features={[
              "1,200 AI credits / month",
              "Everything in Scribe",
              "Priority AI responses",
              "Early access to new features",
            ]}
          />
        </div>

        {/* Free tier note */}
        <p className="text-center text-sm text-[#1A1A1A]/40">
          After your 14-day trial (100 credits), the free plan gives you 15 credits/month
          — enough to explore, not enough to write. Upgrade to keep the momentum going.
        </p>

        {/* Back link */}
        <div className="text-center">
          <Link
            href="/dashboard"
            className="text-sm text-violet-600 hover:text-violet-800 transition-colors"
          >
            ← Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function PlanCard({
  name,
  price,
  yearlyPrice,
  credits,
  description,
  features,
  highlighted = false,
}: {
  name: string;
  price: number;
  yearlyPrice: number;
  credits: number;
  description: string;
  features: string[];
  highlighted?: boolean;
}) {
  const savePct = Math.round((1 - yearlyPrice / (price * 12)) * 100);

  return (
    <div
      className={`rounded-2xl border p-6 flex flex-col gap-6 ${
        highlighted
          ? "bg-[#1A1A1A] border-[#1A1A1A] text-white"
          : "bg-white border-black/[0.08] text-[#1A1A1A]"
      }`}
    >
      {/* Top */}
      <div className="space-y-1">
        <p className={`text-xs font-semibold uppercase tracking-widest ${highlighted ? "text-white/50" : "text-[#1A1A1A]/40"}`}>
          {name}
        </p>
        <div className="flex items-end gap-1">
          <span className="text-3xl font-bold">${price}</span>
          <span className={`text-sm pb-0.5 ${highlighted ? "text-white/50" : "text-[#1A1A1A]/40"}`}>/month</span>
        </div>
        <p className={`text-sm ${highlighted ? "text-white/60" : "text-[#1A1A1A]/50"}`}>{description}</p>
      </div>

      {/* Credits badge */}
      <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl ${highlighted ? "bg-white/10" : "bg-violet-50 border border-violet-100"}`}>
        <Zap size={14} className={highlighted ? "text-white" : "text-violet-600"} fill="currentColor" />
        <span className={`text-sm font-semibold ${highlighted ? "text-white" : "text-violet-700"}`}>
          {credits.toLocaleString()} AI credits / month
        </span>
      </div>

      {/* Yearly */}
      <div className={`text-xs px-3 py-2 rounded-lg ${highlighted ? "bg-white/5 text-white/60" : "bg-[#1A1A1A]/[0.03] text-[#1A1A1A]/50"}`}>
        <span className={`font-semibold ${highlighted ? "text-white/80" : "text-[#1A1A1A]/70"}`}>${yearlyPrice}/year</span>
        {" "}— save {savePct}% · billed upfront
      </div>

      {/* Features */}
      <ul className="space-y-2 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm">
            <Check
              size={14}
              className={`mt-0.5 shrink-0 ${highlighted ? "text-white/60" : "text-violet-500"}`}
            />
            <span className={highlighted ? "text-white/80" : "text-[#1A1A1A]/70"}>{f}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link
        href="/auth"
        className={`w-full flex items-center justify-center py-2.5 rounded-xl text-sm font-semibold transition-colors ${
          highlighted
            ? "bg-white text-[#1A1A1A] hover:bg-white/90"
            : "bg-[#1A1A1A] text-white hover:bg-[#2A2A2A]"
        }`}
      >
        Start free trial
      </Link>
    </div>
  );
}
