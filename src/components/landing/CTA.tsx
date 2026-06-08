"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

const HEADLINE_LINES = ["Your story", "deserves a", "smarter OS."];

export default function CTA() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="px-6 pb-24 pt-4 lg:px-10 lg:pb-32">
      <div
        ref={ref}
        className="relative mx-auto max-w-[1380px] overflow-hidden rounded-[2.4rem] bg-stone-950 px-10 py-20 lg:px-20 lg:py-28 xl:px-28 xl:py-36"
      >
        {/* Very subtle grain texture overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")",
          }}
        />

        <div className="relative z-10 grid gap-16 lg:grid-cols-[1fr_auto] lg:items-end">

          {/* Left — editorial headline */}
          <div>
            {/* Label */}
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.55 }}
              className="mb-10 flex items-center gap-3"
            >
              <div className="h-px w-8 bg-white/20" />
              <span className="text-[0.63rem] font-semibold uppercase tracking-[0.28em] text-violet-400">
                Start for free
              </span>
            </motion.div>

            {/* Headline — line by line mask reveal */}
            <div>
              {HEADLINE_LINES.map((line, i) => (
                <div key={i} className="overflow-hidden">
                  <motion.div
                    initial={{ y: "105%" }}
                    animate={inView ? { y: "0%" } : {}}
                    transition={{ delay: 0.1 + i * 0.1, duration: 0.88, ease }}
                  >
                    <span
                      className={`block font-display font-bold italic leading-[0.97] tracking-[-0.045em] ${
                        i === HEADLINE_LINES.length - 1 ? "text-white/40" : "text-white"
                      }`}
                      style={{ fontSize: "clamp(3.2rem,7vw,6.8rem)" }}
                    >
                      {line}
                    </span>
                  </motion.div>
                </div>
              ))}
            </div>

            {/* Divider */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={inView ? { scaleX: 1 } : {}}
              transition={{ delay: 0.5, duration: 0.8, ease }}
              style={{ originX: "left" as const }}
              className="mt-10 h-px w-24 bg-white/[0.12]"
            />

            {/* Body */}
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.55, duration: 0.72, ease }}
              className="mt-8 max-w-sm text-[0.9375rem] leading-[1.82] text-white/40"
            >
              Sign up in 10 seconds. 100 AI credits and 14 days of full access &mdash; no
              card needed. Upgrade when your manuscript demands it.
            </motion.p>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.68, duration: 0.72, ease }}
              className="mt-10 flex flex-wrap items-center gap-5"
            >
              <Link
                href="/auth?mode=signup"
                className="inline-flex items-center gap-2.5 rounded-full bg-white px-7 py-3.5 text-[0.875rem] font-bold tracking-tight text-stone-950 transition-transform duration-300 hover:-translate-y-0.5"
              >
                Start writing — it&apos;s free
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link
                href="/pricing"
                className="text-[0.875rem] font-medium text-white/30 underline-offset-2 transition-colors hover:text-white/60 hover:underline"
              >
                View pricing &rarr;
              </Link>
            </motion.div>
          </div>

          {/* Right — trust list */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.72, duration: 0.72, ease }}
            className="flex flex-row flex-wrap gap-3 lg:flex-col lg:items-end lg:gap-2"
          >
            {[
              "Free to start",
              "100 AI credits included",
              "No credit card",
              "Cancel anytime",
            ].map((t) => (
              <span
                key={t}
                className="flex items-center gap-1.5 text-[0.72rem] text-white/25"
              >
                <span className="h-[3px] w-[3px] rounded-full bg-white/20" />
                {t}
              </span>
            ))}
          </motion.div>

        </div>
      </div>
    </section>
  );
}
