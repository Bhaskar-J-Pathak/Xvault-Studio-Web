"use client";

import Link from "next/link";
import { Zap, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

type Variant = "trial" | "trial-urgent" | "expired";

interface Props {
  variant: Variant;
  credits?: number;
  cap?: number;
  daysLeft?: number;
}

export default function UpgradeBanner({ variant, credits, cap, daysLeft }: Props) {
  const isUrgent  = variant === "trial-urgent";
  const isExpired = variant === "expired";
  const isTrial   = !isExpired;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className={`relative mb-10 flex items-center gap-2.5 sm:gap-4 rounded-2xl border px-4 py-3 sm:px-5 sm:py-3.5 overflow-hidden ${
        isExpired
          ? "bg-white dark:bg-white/[0.03] border-violet-200/60 dark:border-violet-700/25"
          : isUrgent
          ? "bg-[#FFFBF5] dark:bg-amber-900/10 border-amber-200/60 dark:border-amber-700/25"
          : "bg-white/70 dark:bg-white/[0.03] border-black/[0.07] dark:border-white/[0.07]"
      }`}
    >
      {/* Left accent bar */}
      <div className={`absolute left-0 inset-y-0 w-[3px] rounded-l-2xl ${
        isUrgent ? "bg-amber-400" : "bg-violet-500"
      }`} />

      {/* Icon */}
      <Zap
        size={13}
        fill="currentColor"
        className={`shrink-0 ml-1 ${
          isUrgent ? "text-amber-500" : "text-violet-500"
        }`}
      />

      {/* Text */}
      <p className="flex-1 min-w-0 text-[12.5px] text-[#71717A] dark:text-white/50 leading-snug">
        {isTrial ? (
          <>
            <span className={`font-semibold font-mono text-[13px] ${
              isUrgent
                ? "text-amber-600 dark:text-amber-400"
                : "text-[#0F0F0F] dark:text-white/85"
            }`}>
              {credits}
            </span>
            {" "}of{" "}
            <span className="font-mono">{cap}</span>
            {" "}trial credits remaining
            <span className="mx-1.5 text-[#D4D4D8] dark:text-white/20">·</span>
            <span className={`font-semibold font-mono ${
              isUrgent
                ? "text-amber-600 dark:text-amber-400"
                : "text-[#0F0F0F] dark:text-white/85"
            }`}>
              {daysLeft}
            </span>
            {" "}days left
          </>
        ) : (
          <>
            Your trial has ended.{" "}
            <span className="text-[#0F0F0F] dark:text-white/80 font-medium">
              Start a plan to keep writing with AI.
            </span>
          </>
        )}
      </p>

      {/* CTA */}
      <Link
        href="/pricing"
        className={`group shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[12px] font-semibold text-white
          transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
          active:-translate-y-px active:scale-[0.98] ${
          isUrgent
            ? "bg-amber-500 hover:bg-amber-600 shadow-[0_2px_10px_rgba(245,158,11,0.22)]"
            : "bg-violet-600 hover:bg-violet-700 shadow-[0_2px_10px_rgba(109,40,217,0.18)]"
        }`}
      >
        Upgrade
        <ArrowRight
          size={11}
          className="transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5"
        />
      </Link>
    </motion.div>
  );
}
