"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import Link from "next/link";
import { LavenderAurora } from "./LavenderAurora";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.75, ease } },
};

const features = [
  "Proactive Co-author",
  "Automatic Worldbuilder",
  "Global Editor",
  "Voice Matching",
];

export default function Hero() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const auroraX = useSpring(mx, { stiffness: 40, damping: 20 });
  const auroraY = useSpring(my, { stiffness: 40, damping: 20 });

  // Watermark moves counter to cursor at a slower lag — sits "behind" content
  const wmx = useMotionValue(0);
  const wmy = useMotionValue(0);
  const watermarkX = useSpring(wmx, { stiffness: 28, damping: 22 });
  const watermarkY = useSpring(wmy, { stiffness: 28, damping: 22 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      mx.set(nx * 22);
      my.set(ny * 14);
      wmx.set(nx * -48);
      wmy.set(ny * -30);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [mx, my, wmx, wmy]);

  return (
    <section className="relative flex min-h-screen flex-col overflow-hidden bg-[#EDE8FF]">

      {/* ── Aurora background with mouse parallax ─────────── */}
      <motion.div
        className="absolute inset-[-4%]"
        style={{ x: auroraX, y: auroraY }}
      >
        <LavenderAurora className="absolute inset-0" />
      </motion.div>

      {/* Watermark — large editorial background word */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden select-none"
      >
        <motion.div style={{ x: watermarkX, y: watermarkY }}>
          <span
            className="font-display text-[22vw] font-light italic leading-none text-violet-900/[0.035]"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 0, "WONK" 0' }}
          >
            Story
          </span>
        </motion.div>
      </div>

      {/* Subtle dot grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(124,58,237,0.12) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage:
            "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)",
        }}
      />

      {/* Noise grain */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.022]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "256px 256px",
        }}
      />

      {/* ── Content ───────────────────────────────────────── */}
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 pb-24 pt-32 text-center">

        <motion.div
          className="flex flex-col items-center gap-7"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >

          {/* Badge */}
          <motion.div variants={fadeUp}>
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-300/50 bg-white/60 px-4 py-1.5 shadow-sm backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-500 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-600" />
              </span>
              <span className="text-[0.72rem] font-semibold tracking-wide text-violet-700">
                Now in public beta
              </span>
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            className="font-display text-display text-[#1A0A3C]"
          >
            Built for Novelists,
            <br />
            <em
              className="not-italic"
              style={{
                background: "linear-gradient(135deg, #7C3AED 0%, #5B21B6 55%, #3B0764 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Who take their craft seriously
            </em>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            variants={fadeUp}
            className="max-w-[44ch] text-[1.0625rem] leading-[1.85] text-violet-900/50"
          >
            Xvault remembers your characters, world, and tone. So every
            suggestion actually fits your story.
          </motion.p>

          {/* CTA */}
          <motion.div variants={fadeUp} className="flex flex-col items-center gap-3 mt-1">
            <Link
              href="/auth?mode=signup"
              className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-2xl bg-violet-700 px-8 py-4 text-[0.9375rem] font-medium text-white shadow-[0_8px_24px_rgba(109,40,217,0.4),0_2px_8px_rgba(109,40,217,0.2)] transition-all duration-300 hover:bg-violet-600 hover:shadow-[0_12px_32px_rgba(109,40,217,0.55)] hover:-translate-y-0.5 active:translate-y-0"
            >
              {/* Shimmer sweep */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full"
              />
              Start writing for free
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path
                  d="M2 7h10M7 2l5 5-5 5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <p className="text-[0.74rem] text-violet-500/60">
              No credit card required
            </p>
          </motion.div>

          {/* Feature chips */}
          <motion.div
            variants={fadeUp}
            className="mt-6 flex flex-wrap items-center justify-center gap-2.5"
          >
            {features.map((f) => (
              <span
                key={f}
                className="rounded-full border border-violet-300/40 bg-white/50 px-3.5 py-1.5 text-[0.72rem] font-medium text-violet-700/80 shadow-sm backdrop-blur-sm"
              >
                {f}
              </span>
            ))}
          </motion.div>

        </motion.div>
      </div>

      {/* Gradient bleed — fades hero into features section color */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-40"
        style={{
          background: "linear-gradient(to bottom, transparent, #DDD6FE)",
        }}
      />

    </section>
  );
}
