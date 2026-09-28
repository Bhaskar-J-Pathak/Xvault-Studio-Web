"use client";

import { useState } from "react";
import { Check, Coins, Loader2 } from "lucide-react";
import { CREDIT_PACKS } from "@/lib/credit-packs";

export default function CreditStore({ balance }: { balance: number }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function buy(packId: string) {
    setLoading(packId);
    setError("");
    try {
      const response = await fetch("/api/credits/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });
      const data = await response.json();
      if (!response.ok || !data.checkoutUrl) throw new Error(data.error || "Could not start checkout");
      window.location.assign(data.checkoutUrl);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not start checkout");
      setLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-violet-200/70 bg-violet-50/70 p-5 dark:border-violet-500/20 dark:bg-violet-500/[0.08]">
        <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300">
          <Coins size={17} />
          <p className="text-sm font-semibold">Top-up balance</p>
        </div>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-violet-950 dark:text-violet-100">
          {balance.toLocaleString()} credits
        </p>
        <p className="mt-1 text-xs text-violet-900/55 dark:text-violet-200/55">
          Top-up credits do not expire. Your included monthly or trial credits are used first.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {CREDIT_PACKS.map((pack) => (
          <div
            key={pack.id}
            className={`relative rounded-2xl border p-5 ${pack.featured
              ? "border-violet-400 bg-violet-50/50 shadow-sm dark:border-violet-500/50 dark:bg-violet-500/[0.08]"
              : "border-black/[0.07] bg-white dark:border-white/[0.07] dark:bg-[#161329]"}`}
          >
            {pack.featured && (
              <span className="absolute -top-2.5 left-4 rounded-full bg-violet-600 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white">
                Best value
              </span>
            )}
            <p className="text-xs font-medium text-[#71717A] dark:text-white/45">{pack.label}</p>
            <p className="mt-2 text-2xl font-semibold text-[#1A1A1A] dark:text-white/90">{pack.credits.toLocaleString()}</p>
            <p className="text-xs text-[#A1A1AA] dark:text-white/30">one-time credits</p>
            <p className="mt-4 text-lg font-semibold text-[#1A1A1A] dark:text-white/90">${pack.amountCents / 100}</p>
            <button
              type="button"
              onClick={() => buy(pack.id)}
              disabled={loading !== null}
              className={`mt-4 inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition-colors disabled:opacity-50 ${pack.featured
                ? "bg-violet-600 text-white hover:bg-violet-700"
                : "bg-[#0F0F0F] text-white hover:bg-[#2A2A2A] dark:bg-white dark:text-[#0E0C1B]"}`}
            >
              {loading === pack.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              Buy {pack.credits.toLocaleString()} credits
            </button>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-black/[0.06] bg-white px-4 py-3 text-xs leading-relaxed text-[#71717A] dark:border-white/[0.07] dark:bg-[#161329] dark:text-white/45">
        Credit packs add usage credits only. They do not unlock subscription features, change your plan, or renew automatically.
      </div>
      {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
