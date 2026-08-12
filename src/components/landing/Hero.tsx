"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import Link from "next/link";
import { LavenderAurora } from "./LavenderAurora";
import { MagneticButton } from "./MagneticButton";
import { gsap, useGSAP } from "@/lib/gsap";

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

  // ── Cinematic entrance timeline ────────────────────────────
  const heroRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // Aurora bloom in
      tl.from(".hero-aurora", { opacity: 0, scale: 1.08, duration: 1.6, ease: "power2.out" }, 0);

      // Badge drops in
      tl.from(".hero-badge", { opacity: 0, y: -14, duration: 0.6 }, 0.4);

      // Headline: first line slides from left, second from right
      tl.from(".hero-line-1", { opacity: 0, x: -50, duration: 0.9 }, 0.6);
      tl.from(".hero-line-2", { opacity: 0, x: 50, duration: 0.9 }, 0.75);

      // Subtext fades up
      tl.from(".hero-sub", { opacity: 0, y: 20, duration: 0.8 }, 0.95);

      // CTA scales in with spring feel
      tl.from(".hero-cta", { opacity: 0, y: 18, scale: 0.95, duration: 0.75, ease: "back.out(1.4)" }, 1.1);

      // Chips stagger in
      tl.from(".hero-chip", {
        opacity: 0,
        y: 12,
        duration: 0.55,
        stagger: 0.08,
      }, 1.3);
    },
    { scope: heroRef }
  );

  return (
    <section
      ref={heroRef}
      className="relative flex min-h-screen flex-col overflow-hidden bg-[#EDE8FF]"
    >

      {/* ── Aurora background with mouse parallax ─────────── */}
      <motion.div
        className="hero-aurora absolute inset-[-4%]"
        style={{ x: auroraX, y: auroraY }}
      >
        <LavenderAurora className="absolute inset-0" />
      </motion.div>

      {/* Watermark */}
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

      {/* Dot grid */}
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

        <div className="flex flex-col items-center gap-7">

          {/* Badge */}
          <div className="hero-badge">
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-300/50 bg-white/60 px-4 py-1.5 shadow-sm backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-500 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-600" />
              </span>
              <span className="text-[0.72rem] font-semibold tracking-wide text-violet-700">
                Built for novelists who take their craft seriously
              </span>
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-display text-[#1A0A3C]">
            <span className="hero-line-1 block">The AI co-author that</span>
            <em
              className="hero-line-2 not-italic block"
              style={{
                background: "linear-gradient(135deg, #7C3AED 0%, #5B21B6 55%, #3B0764 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              knows your whole story
            </em>
          </h1>

          {/* Subtext */}
          <p className="hero-sub max-w-[44ch] text-[1.0625rem] leading-[1.85] text-violet-900/50">
            Xvault reads your entire manuscript before it says a word — so every
            suggestion fits your characters, world, and voice.
          </p>

          {/* CTA */}
          <div className="hero-cta flex flex-col items-center gap-3 mt-1">
            <MagneticButton strength={0.3}>
              <Link
                href="/auth?mode=signup"
                className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-2xl bg-violet-700 px-8 py-4 text-[0.9375rem] font-medium text-white shadow-[0_8px_24px_rgba(109,40,217,0.4),0_2px_8px_rgba(109,40,217,0.2)] transition-all duration-300 hover:bg-violet-600 hover:shadow-[0_12px_32px_rgba(109,40,217,0.55)] hover:-translate-y-0.5 active:translate-y-0"
              >
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
            </MagneticButton>
            <p className="text-[0.74rem] text-violet-500/60">
              14-day free trial · 100 AI credits · no credit card
            </p>
          </div>

          {/* Feature chips */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
            {features.map((f) => (
              <span
                key={f}
                className="hero-chip rounded-full border border-violet-300/40 bg-white/50 px-3.5 py-1.5 text-[0.72rem] font-medium text-violet-700/80 shadow-sm backdrop-blur-sm"
              >
                {f}
              </span>
            ))}
          </div>

        </div>
      </div>

      {/* Gradient bleed */}
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
