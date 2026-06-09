"use client";

import { useState } from "react";
import { Gift, Copy, Check, Users } from "lucide-react";

interface Props {
  referralCode: string;
  referralCount: number;   // completed referrals (0–3)
  bonusCredits: number;
}

export default function ReferralCard({ referralCode, referralCount, bonusCredits }: Props) {
  const [copied, setCopied] = useState(false);

  const referralUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth?ref=${referralCode}`
      : `https://xvault.studio/auth?ref=${referralCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement("textarea");
      el.value = referralUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const spotsLeft = 3 - referralCount;

  return (
    <div className="bg-white rounded-2xl border border-black/[0.07] p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
            <Gift size={14} className="text-violet-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1A1A1A] tracking-tight">
              Invite friends
            </p>
            <p className="text-[11px] text-[#1A1A1A]/40">
              Give 15 credits · Get 30 credits
            </p>
          </div>
        </div>

        {/* Slots indicator */}
        <div className="flex items-center gap-1.5 text-xs text-[#1A1A1A]/40">
          <Users size={12} />
          <span>
            {referralCount}/3 referred
          </span>
        </div>
      </div>

      {/* Slot dots */}
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`flex-1 h-1.5 rounded-full transition-colors ${
              i < referralCount ? "bg-violet-500" : "bg-black/[0.07]"
            }`}
          />
        ))}
      </div>

      {/* Referral link */}
      {spotsLeft > 0 ? (
        <div className="flex items-center gap-2">
          <div className="flex-1 px-3 py-2 rounded-xl bg-black/[0.03] border border-black/[0.06] text-xs text-[#1A1A1A]/50 font-mono truncate">
            xvault.studio/auth?ref={referralCode}
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1A1A1A] text-white text-xs font-semibold hover:bg-[#2A2A2A] transition-colors shrink-0"
          >
            {copied ? (
              <>
                <Check size={12} />
                Copied
              </>
            ) : (
              <>
                <Copy size={12} />
                Copy link
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="px-3 py-2 rounded-xl bg-violet-50 border border-violet-100 text-xs text-violet-700 font-medium text-center">
          All 3 referral slots used
        </div>
      )}

      {/* Bonus earned */}
      {bonusCredits > 0 && (
        <p className="text-[11px] text-[#1A1A1A]/40 text-center">
          +{bonusCredits} bonus credits earned from referrals
        </p>
      )}
    </div>
  );
}
