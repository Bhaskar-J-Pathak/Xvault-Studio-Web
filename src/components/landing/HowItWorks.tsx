"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

const STEPS = [
  {
    num: "01",
    textColor:   "text-violet-600",
    bgColor:     "bg-violet-50",
    borderColor: "border-violet-200/70",
    label:       "Sign Up",
    title:       "Free in 10 seconds",
    body:        "No credit card. No download. Open your browser, sign up, pick your genre — your project is ready before you've finished your coffee.",
    detail:      "Free · 14-day trial · 100 AI credits",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <path d="M11 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM4 18c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    num: "02",
    textColor:   "text-rose-600",
    bgColor:     "bg-rose-50",
    borderColor: "border-rose-200/70",
    label:       "Explore",
    title:       "A sample story loads instantly",
    body:        "\"The Glass Meridian\" — a thriller with 3 chapters, pre-seeded characters, and Alex already reading. The tutorial walks you through every feature in about 2 minutes.",
    detail:      "No setup · Just open and go",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <path d="M4 6h14M4 11h10M4 16h7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M17 13l3 2-3 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    num: "03",
    textColor:   "text-amber-600",
    bgColor:     "bg-amber-50",
    borderColor: "border-amber-200/70",
    label:       "Write",
    title:       "Canvas on the left. Alex on the right.",
    body:        "The studio is a clean writing canvas — no distractions. Alex lives in a panel alongside it, loaded with your entire manuscript. Press Ctrl+K anywhere in your text for an inline suggestion. No switching tabs, no copy-pasting context. Everything in one place.",
    detail:      "Ctrl+K anywhere · Alex always in context",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <path d="M4 17L8 6l4 8 3-5 3 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    num: "04",
    textColor:   "text-emerald-600",
    bgColor:     "bg-emerald-50",
    borderColor: "border-emerald-200/70",
    label:       "Finish",
    title:       "Finish the draft",
    body:        "Stay in the flow. Press Ctrl+K when you're stuck. Ask Alex anything. When you're done, your manuscript is saved and organised — ready for the next session.",
    detail:      "Cloud-saved · Always accessible",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <path d="M4 12l5 5L18 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

function Step({ step, index, inView }: { step: typeof STEPS[number]; index: number; inView: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: 0.08 + index * 0.18, duration: 0.75, ease }}
      className="relative grid grid-cols-[1fr_auto] items-start gap-8 border-t border-violet-200/50 py-14 lg:py-20"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-8 select-none font-display font-bold leading-none tracking-tight text-violet-200/35"
        style={{ fontSize: "clamp(5rem, 14vw, 11rem)" }}
      >
        {step.num}
      </span>

      <div className="relative z-10 max-w-lg">
        <div className={`mb-4 font-mono text-[0.6rem] font-bold uppercase tracking-[0.24em] ${step.textColor}`}>
          {step.num}&nbsp;&nbsp;&middot;&nbsp;&nbsp;{step.label}
        </div>
        <h3
          className="mb-4 font-display font-bold leading-[1.08] tracking-[-0.035em] text-[#1A0A3C]"
          style={{ fontSize: "clamp(1.6rem,3vw,2.6rem)" }}
        >
          {step.title}
        </h3>
        <p className="text-[0.9375rem] leading-[1.85] text-violet-900/50">{step.body}</p>
        <div className="mt-6 text-[0.7rem] font-medium text-violet-900/40">{step.detail}</div>
      </div>

      <div className={`relative z-10 mt-2 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border ${step.borderColor} ${step.bgColor} ${step.textColor}`}>
        {step.icon}
      </div>
    </motion.div>
  );
}

export default function HowItWorks() {
  const hRef     = useRef<HTMLDivElement>(null);
  const hInView   = useInView(hRef,    { once: true, margin: "-60px" });
  const bodyRef   = useRef<HTMLDivElement>(null);
  const bodyInView = useInView(bodyRef, { once: true, margin: "-80px" });

  return (
    <section id="how-it-works" className="relative bg-[#EDE8FF] px-6 py-24 lg:px-10 lg:py-32">

      <div className="mx-auto max-w-[1380px]">

        {/* Header */}
        <div ref={hRef} className="mb-4 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={hInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.55 }}
            className="mb-6 flex items-center gap-3"
          >
            <div className="h-px w-8 bg-violet-300/60" />
            <span className="text-[0.63rem] font-semibold uppercase tracking-[0.28em] text-violet-600/50">
              Getting Started
            </span>
          </motion.div>

          <div className="overflow-hidden">
            <motion.h2
              initial={{ y: "100%" }}
              animate={hInView ? { y: "0%" } : {}}
              transition={{ delay: 0.06, duration: 0.85, ease }}
              className="font-display font-bold leading-[1.03] tracking-[-0.04em] text-[#1A0A3C]"
              style={{ fontSize: "clamp(2.4rem,4.8vw,4.2rem)" }}
            >
              From blank page
            </motion.h2>
          </div>
          <div className="overflow-hidden">
            <motion.h2
              initial={{ y: "100%" }}
              animate={hInView ? { y: "0%" } : {}}
              transition={{ delay: 0.13, duration: 0.85, ease }}
              className="font-display font-bold leading-[1.03] tracking-[-0.04em] text-violet-900/35"
              style={{ fontSize: "clamp(2.4rem,4.8vw,4.2rem)" }}
            >
              to finished draft.
            </motion.h2>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={hInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.75, ease }}
            className="mt-5 text-[0.9375rem] leading-[1.82] text-violet-900/50"
          >
            No download. No configuration. Sign up, open the studio, and write.
          </motion.p>
        </div>

        {/* Steps */}
        <div ref={bodyRef}>
          {STEPS.map((step, i) => (
            <Step key={step.num} step={step} index={i} inView={bodyInView} />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={bodyInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1.0, duration: 0.65, ease }}
          className="mt-4 flex justify-start"
        >
          <Link
            href="/auth?mode=signup"
            className="btn-shimmer inline-flex items-center gap-2.5 rounded-full bg-violet-700 px-7 py-3.5 text-[0.875rem] font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5"
          >
            Start for free
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </motion.div>

      </div>
    </section>
  );
}
