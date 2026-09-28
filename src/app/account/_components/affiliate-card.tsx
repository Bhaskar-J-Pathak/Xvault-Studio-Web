"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Coins, Copy, DollarSign, Link2, Loader2, Users } from "lucide-react";
import { CREDIT_PACKS } from "@/lib/credit-packs";

type ActivityItem = {
  id: string;
  kind: "commission" | "payout" | "credits";
  amountCents: number;
  credits?: number;
  status: string;
  date: string;
  availableAt?: string;
};

interface Props {
  referralCode: string;
  referralCount: number;
  pendingCents: number;
  heldCents: number;
  availableCents: number;
  lifetimeEarnedCents: number;
  payoutPendingCents: number;
  convertedCredits: number;
  accountEmail: string;
  activity: ActivityItem[];
}

const dollars = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

export default function AffiliateCard({
  referralCode,
  referralCount,
  pendingCents,
  heldCents,
  availableCents,
  lifetimeEarnedCents,
  payoutPendingCents,
  convertedCredits,
  accountEmail,
  activity,
}: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [converting, setConverting] = useState<string | null>(null);
  const [payoutEmail, setPayoutEmail] = useState(accountEmail);
  const [message, setMessage] = useState("");
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://xvault.studio").replace(/\/$/, "");
  const referralUrl = `${appUrl}/r/${referralCode}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(referralUrl);
    } catch {
      const input = document.createElement("textarea");
      input.value = referralUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function requestPayout() {
    setRequesting(true);
    setMessage("");
    try {
      const response = await fetch("/api/affiliates/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutEmail }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not request payout");
      setMessage(`Cash payout requested for ${dollars(data.amountCents)}.`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not request payout");
    } finally {
      setRequesting(false);
    }
  }

  async function convertToCredits(packId: string) {
    setConverting(packId);
    setMessage("");
    try {
      const response = await fetch("/api/affiliates/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not convert earnings");
      const debtNote = data.debtPaid > 0 ? ` ${data.debtPaid} credits repaid an existing refund balance.` : "";
      setMessage(`${data.creditsAdded.toLocaleString()} credits added.${debtNote}`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not convert earnings");
    } finally {
      setConverting(null);
    }
  }

  const canWithdraw = availableCents >= 5000 && payoutPendingCents === 0;

  return (
    <section className="rounded-2xl border border-black/[0.07] bg-white p-5 dark:border-white/[0.07] dark:bg-[#161329] sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">Affiliate earnings</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-[#0F0F0F] dark:text-white/90">Earn 40% when a referred writer buys Founder lifetime</h2>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-[#71717A] dark:text-white/45">
            Attribution lasts 90 days. Commission clears after 30 days, then you can take cash or exchange it for any credit pack.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#71717A] dark:text-white/45">
          <Users size={13} /> {referralCount} paid referral{referralCount === 1 ? "" : "s"}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Available" value={dollars(availableCents)} emphasis />
        <Stat label="Clearing" value={dollars(pendingCents)} />
        <Stat label="On hold" value={dollars(heldCents)} />
        <Stat label="Lifetime earned" value={dollars(lifetimeEarnedCents)} />
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-black/[0.07] bg-[#F7F7F6] px-3 py-2.5 dark:border-white/[0.07] dark:bg-white/[0.04]">
          <Link2 size={13} className="shrink-0 text-[#A1A1AA]" />
          <span className="truncate font-mono text-xs text-[#52525B] dark:text-white/50">{referralUrl}</span>
        </div>
        <button type="button" onClick={copyLink} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-[#0F0F0F] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#2A2A2A] dark:bg-white dark:text-[#0E0C1B]">
          {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy link</>}
        </button>
      </div>

      <div className="mt-5 border-t border-black/[0.06] pt-5 dark:border-white/[0.07]">
        <div className="flex items-center gap-2">
          <Coins size={14} className="text-violet-600 dark:text-violet-400" />
          <p className="text-xs font-semibold text-[#1A1A1A] dark:text-white/85">Exchange cleared earnings for credits</p>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CREDIT_PACKS.map((pack) => {
            const affordable = availableCents >= pack.amountCents;
            return (
              <button
                key={pack.id}
                type="button"
                disabled={!affordable || converting !== null || requesting}
                onClick={() => convertToCredits(pack.id)}
                className="rounded-xl border border-black/[0.07] bg-[#FAFAF9] px-3 py-3 text-left transition-colors hover:border-violet-300 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/[0.07] dark:bg-white/[0.025] dark:hover:border-violet-500/40 dark:hover:bg-violet-500/[0.08]"
              >
                <span className="flex items-center justify-between text-xs font-semibold text-[#1A1A1A] dark:text-white/85">
                  {pack.credits.toLocaleString()} credits
                  {converting === pack.id && <Loader2 size={12} className="animate-spin" />}
                </span>
                <span className="mt-1 block text-[10px] text-[#71717A] dark:text-white/40">Use {dollars(pack.amountCents)}</span>
              </button>
            );
          })}
        </div>
        {convertedCredits > 0 && <p className="mt-2 text-[10px] text-[#A1A1AA]">{convertedCredits.toLocaleString()} credits converted to date.</p>}
      </div>

      <div className="mt-5 border-t border-black/[0.06] pt-5 dark:border-white/[0.07]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="min-w-0 flex-1 text-[11px] font-medium text-[#71717A] dark:text-white/45">
            Cash payout email
            <input
              type="email"
              value={payoutEmail}
              onChange={(event) => setPayoutEmail(event.target.value)}
              disabled={requesting || payoutPendingCents > 0}
              className="mt-1.5 min-h-10 w-full rounded-xl border border-black/[0.08] bg-[#FAFAF9] px-3 text-xs text-[#1A1A1A] outline-none focus:border-violet-400 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/85"
            />
          </label>
          <button
            type="button"
            disabled={!canWithdraw || requesting || !payoutEmail.trim()}
            onClick={requestPayout}
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {requesting ? <Loader2 size={13} className="animate-spin" /> : <DollarSign size={13} />}
            Request {availableCents > 0 ? dollars(availableCents) : "cash"}
          </button>
        </div>
        <p className="mt-2 text-[10px] text-[#A1A1AA] dark:text-white/30">
          {payoutPendingCents > 0
            ? `${dollars(payoutPendingCents)} is being processed.`
            : canWithdraw
              ? "Your full cleared cash balance will be reserved for this request."
              : `${dollars(Math.max(0, 5000 - availableCents))} more cleared commission is needed for cash withdrawal.`}
        </p>
      </div>

      {activity.length > 0 && (
        <div className="mt-5 border-t border-black/[0.06] pt-5 dark:border-white/[0.07]">
          <p className="text-xs font-semibold text-[#1A1A1A] dark:text-white/85">Recent activity</p>
          <div className="mt-2 divide-y divide-black/[0.05] dark:divide-white/[0.06]">
            {activity.map((item) => (
              <div key={`${item.kind}-${item.id}`} className="flex items-center justify-between gap-3 py-2.5 text-xs">
                <div>
                  <p className="font-medium text-[#52525B] dark:text-white/65">
                    {item.kind === "commission" ? "Referral commission" : item.kind === "payout" ? "Cash payout" : `${item.credits?.toLocaleString()} credit conversion`}
                  </p>
                  <p className="mt-0.5 text-[10px] capitalize text-[#A1A1AA] dark:text-white/30">{item.status.replaceAll("_", " ")} · {new Date(item.date).toLocaleDateString()}</p>
                </div>
                <span className={item.kind === "commission" ? "font-semibold text-emerald-700 dark:text-emerald-300" : "font-semibold text-[#52525B] dark:text-white/60"}>
                  {item.kind === "commission" ? "+" : "−"}{dollars(item.amountCents)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {message && <p className="mt-4 text-xs text-violet-700 dark:text-violet-300">{message}</p>}
      <p className="mt-4 text-[10px] leading-relaxed text-[#A1A1AA] dark:text-white/30">
        Disclose your affiliate relationship wherever you share the link. Refunded, disputed, fraudulent, and self-referred purchases do not qualify. Late reversals offset future earnings.
      </p>
    </section>
  );
}

function Stat({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className={`rounded-xl border px-3 py-3 ${emphasis ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-500/20 dark:bg-emerald-500/[0.08]" : "border-black/[0.06] bg-[#FAFAF9] dark:border-white/[0.06] dark:bg-white/[0.025]"}`}>
      <p className="text-[10px] uppercase tracking-wide text-[#A1A1AA] dark:text-white/30">{label}</p>
      <p className={`mt-1 text-base font-semibold ${emphasis ? "text-emerald-700 dark:text-emerald-300" : "text-[#1A1A1A] dark:text-white/85"}`}>{value}</p>
    </div>
  );
}
