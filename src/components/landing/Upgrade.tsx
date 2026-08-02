"use client";

import Link from "next/link";
import { Zap, Crown } from "lucide-react";

interface UpgradeBannerProps {
  credits?: number;
  plan?: string;
}

export default function UpgradeBanner({ credits = 0, plan = "free" }: UpgradeBannerProps) {
  // Only show for free users or when credits are low
  if (plan !== "free" && credits > 20) return null;

  return (
    <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-2xl px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {credits <= 5 ? (
            <Zap className="size-5 fill-current" />
          ) : (
            <Crown className="size-5" />
          )}
        </div>
        <div>
          <p className="font-medium">
            {credits === 0
              ? "You're out of AI credits"
              : credits <= 20
              ? `Only ${credits} credits left`
              : "Ready to unlock more power?"}
          </p>
          <p className="text-sm text-violet-100 mt-0.5">
            Get the Hobbyist plan or claim a limited Founder’s Circle lifetime seat.
          </p>
        </div>
      </div>

      <Link
        href="/pricing"
        className="inline-flex items-center justify-center bg-white text-violet-700 font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-violet-50 transition whitespace-nowrap"
      >
        Upgrade now →
      </Link>
    </div>
  );
}