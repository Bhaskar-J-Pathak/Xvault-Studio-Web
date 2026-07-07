"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

const TRUST = ["Free to start", "100 AI credits included", "No credit card", "Cancel anytime"];

export default function CTA() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="relative bg-[#EDE8FF] px-6 py-24 lg:px-10 lg:py-32">

      {/* Subtle radial glow behind the headline */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div
          className="h-[480px] w-[680px] rounded-full opacity-40"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(139,92,246,0.18) 0%, transparent 70%)",
          }}
        />
      </div>

      <div ref={ref} className="relative mx-auto max-w-[680px] text-center">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease }}
          className="mb-8 flex justify-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-4 py-1.5">
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2.2, repeat: Infinity }}
              className="h-1.5 w-1.5 rounded-full bg-violet-500"
            />
            <span className="text-[0.67rem] font-semibold tracking-wide text-violet-600">
              Start free today
            </span>
          </span>
        </motion.div>

        {/* Headline */}
        <div className="overflow-hidden">
          <motion.h2
            initial={{ y: "60%", opacity: 0 }}
            animate={inView ? { y: "0%", opacity: 1 } : {}}
            transition={{ delay: 0.08, duration: 0.85, ease }}
            className="font-display text-[#1A0A3C]"
            style={{
              fontSize: "clamp(2.8rem, 6vw, 5.2rem)",
              lineHeight: 1.04,
              letterSpacing: "-0.03em",
              fontWeight: 300,
            }}
          >
            Stop explaining your story.
            <br />
            <span className="text-violet-400/70">Alex already knows it.</span>
          </motion.h2>
        </div>

        {/* Body */}
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.38, duration: 0.65, ease }}
          className="mx-auto mt-7 max-w-[44ch] text-[0.9375rem] leading-[1.8] text-violet-900/50"
        >
          Sign up in 10 seconds. 100 AI credits and 14 days of full access —
          no card needed. Upgrade when your manuscript demands it.
        </motion.p>

        {/* CTA button */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 0.65, ease }}
          className="mt-10"
        >
          <Link
            href="/auth?mode=signup"
            className="inline-flex items-center gap-2.5 rounded-full bg-violet-600 px-8 py-3.5 text-[0.9rem] font-semibold text-white shadow-[0_0_28px_rgba(124,58,237,0.30)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-violet-700 hover:shadow-[0_0_36px_rgba(124,58,237,0.40)]"
          >
            Start writing — it&apos;s free
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </motion.div>

        {/* Trust items */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.65, duration: 0.6 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
        >
          {TRUST.map((t, i) => (
            <span key={t} className="flex items-center gap-1.5 text-[0.72rem] text-violet-900/35">
              {i !== 0 && <span className="h-[3px] w-[3px] rounded-full bg-violet-300" />}
              {t}
            </span>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
