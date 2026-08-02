"use client";

import { useState } from "react";
import { Gift, Copy, Check, Users, Link2 } from "lucide-react";

interface Props {
  referralCode: string;
  referralCount: number;
  bonusCredits: number;
}

export default function ReferralCard({ referralCode, referralCount, bonusCredits }: Props) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const referralUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth?ref=${referralCode}`
      : `https://xvault.studio/auth?ref=${referralCode}`;

  const copyToClipboard = async (text: string, setter: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const spotsLeft = 3 - referralCount;

  return (
    <div className="bg-white dark:bg-[#161329] rounded-2xl ring-1 ring-black/[0.06] dark:ring-white/[0.07] p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center">
            <Gift size={14} className="text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0F0F0F] dark:text-[#EDEBF0] tracking-tight">
              Invite friends
            </p>
            <p className="text-[11px] text-[#A1A1AA] dark:text-white/30">
              Give 15 credits · Get 30 credits
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[#A1A1AA] dark:text-white/30">
          <Users size={12} />
          <span>{referralCount}/3 referred</span>
        </div>
      </div>

      {/* Slot dots */}
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`flex-1 h-1.5 rounded-full transition-colors ${
              i < referralCount
                ? "bg-violet-500 dark:bg-violet-400"
                : "bg-black/[0.07] dark:bg-white/[0.08]"
            }`}
          />
        ))}
      </div>

      {/* Share options */}
      {spotsLeft > 0 ? (
        <div className="space-y-2">
          {/* Referral code pill */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#F4F4F5] dark:bg-white/[0.04] border border-[#E4E4E7] dark:border-white/[0.07]">
            <div>
              <p className="text-[10px] text-[#A1A1AA] dark:text-white/30 uppercase tracking-widest mb-0.5">Your code</p>
              <p className="text-sm font-mono font-semibold text-[#0F0F0F] dark:text-[#EDEBF0] tracking-widest">
                {referralCode}
              </p>
            </div>
            <button
              onClick={() => copyToClipboard(referralCode, setCopiedCode)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-[#71717A] dark:text-white/40 hover:text-[#0F0F0F] dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.07] transition-colors"
            >
              {copiedCode ? <><Check size={11} />Copied</> : <><Copy size={11} />Copy code</>}
            </button>
          </div>

          {/* Referral link */}
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F4F4F5] dark:bg-white/[0.04] border border-[#E4E4E7] dark:border-white/[0.07] min-w-0">
              <Link2 size={11} className="text-[#A1A1AA] dark:text-white/30 shrink-0" />
              <span className="text-xs text-[#71717A] dark:text-white/40 font-mono truncate">
                xvault.studio/auth?ref={referralCode}
              </span>
            </div>
            <button
              onClick={() => copyToClipboard(referralUrl, setCopiedLink)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0F0F0F] dark:bg-white text-white dark:text-[#0E0C1B] text-xs font-semibold hover:bg-[#2A2A2A] dark:hover:bg-white/90 transition-colors shrink-0"
            >
              {copiedLink ? <><Check size={12} />Copied</> : <><Copy size={12} />Copy link</>}
            </button>
          </div>
        </div>
      ) : (
        <div className="px-3 py-2 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-700/30 text-xs text-violet-700 dark:text-violet-300 font-medium text-center">
          All 3 referral slots used · +{bonusCredits} credits earned
        </div>
      )}

      {bonusCredits > 0 && spotsLeft > 0 && (
        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium text-center">
          +{bonusCredits} bonus credits earned so far
        </p>
      )}
    </div>
  );
}
