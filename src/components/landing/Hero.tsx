"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";

const Antigravity = dynamic(() => import("./Antigravity"), {
  ssr: false,
  loading: () => null,
});

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-white">
      {/* Antigravity — full bleed background */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <Antigravity
          count={600}
          magnetRadius={13}
          ringRadius={10}
          waveSpeed={0.7}
          waveAmplitude={2.5}
          particleSize={0.7}
          lerpSpeed={0.08}
          color="#151414"
          autoAnimate
          particleVariance={1.7}
          rotationSpeed={0}
          depthFactor={0.3}
          pulseSpeed={3}
          particleShape="capsule"
          fieldStrength={14}
        />
      </div>

      {/* Left white fade — keeps headline readable */}
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(105deg, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.82) 38%, rgba(255,255,255,0.18) 62%, transparent 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 mx-auto grid min-h-screen max-w-[1380px] items-center gap-12 px-6 pb-16 pt-24 lg:grid-cols-2 lg:gap-24 lg:px-10">

        {/* Left — headline */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.75, ease }}
        >
          <h1 className="font-display text-display text-stone-900">
            An AI co-author that
            <br />
            <em className="gradient-text not-italic">reads your novel first.</em>
          </h1>
        </motion.div>

        {/* Right — value prop + CTA */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8, ease }}
          className="flex flex-col items-start gap-8 lg:items-start"
        >
          <p className="max-w-[34ch] text-[1.0625rem] leading-[1.8] text-stone-500">
            For fiction writers tired of re-explaining their story to the AI.
            Alex reads your entire manuscript before it says a word.
          </p>

          <div className="flex flex-col gap-4">
            <Link
              href="/auth?mode=signup"
              className="btn-shimmer inline-flex items-center gap-2.5 rounded-2xl bg-stone-950 px-8 py-4 text-[0.9375rem] font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5"
            >
              Start writing — it&apos;s free
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <p className="text-xs text-stone-400">
              No credit card&nbsp;&middot;&nbsp;14-day trial&nbsp;&middot;&nbsp;100 AI credits
            </p>
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-violet-200/70 bg-violet-50 px-3 py-1 text-[0.68rem] font-medium text-violet-700">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
              Public beta · Free to join
            </span>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
