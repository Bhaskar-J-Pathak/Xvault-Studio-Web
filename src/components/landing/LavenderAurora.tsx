"use client";

import { motion } from "framer-motion";

interface LavenderAuroraProps {
  className?: string;
}

export function LavenderAurora({ className }: LavenderAuroraProps) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none overflow-hidden ${className ?? ""}`}
      style={{
        // Base stays well within lavender — never drops below violet-200
        background: `
          radial-gradient(ellipse 130% 105% at 60% -8%,
            #ffffff               0%,
            rgba(255,255,255,0.92) 15%,
            rgba(242,239,255,0.70) 40%,
            rgba(237,232,255,0.20) 65%,
            transparent           80%),
          linear-gradient(168deg, #F8F6FF 0%, #EDE8FF 35%, #E2DAFF 65%, #DDD6FE 100%)
        `,
      }}
    >
      {/* White bloom — top center, breathes strongly (light bg needs white to feel alive) */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 85% 65% at 55% -5%, rgba(255,255,255,0.90) 0%, transparent 55%)",
        }}
        animate={{ opacity: [0.1, 1, 0.1], scale: [0.82, 1.22, 0.82] }}
        transition={{ duration: 5, ease: "easeInOut", repeat: Infinity }}
      />

      {/* Violet-200 depth — bottom center, wide and slow */}
      <motion.div
        className="absolute bottom-0 inset-x-0 h-[55%]"
        style={{
          background:
            "radial-gradient(ellipse 120% 100% at 50% 100%, rgba(221,214,254,0.85) 0%, transparent 68%)",
          filter: "blur(28px)",
        }}
        animate={{ opacity: [0.08, 0.85, 0.08], scaleX: [0.72, 1.32, 0.72] }}
        transition={{ duration: 6, ease: "easeInOut", repeat: Infinity, delay: 1.5 }}
      />

      {/* Violet-300 accent — bottom left */}
      <motion.div
        className="absolute bottom-0 left-0 h-[52%] w-[52%]"
        style={{
          background:
            "radial-gradient(ellipse 90% 90% at 0% 100%, rgba(196,181,253,0.72) 0%, transparent 65%)",
          filter: "blur(24px)",
        }}
        animate={{ opacity: [0.05, 0.80, 0.05], scale: [0.78, 1.28, 0.78] }}
        transition={{ duration: 7, ease: "easeInOut", repeat: Infinity, delay: 0.8 }}
      />

      {/* Violet-200 mid sweep — center right */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 75% 65%, rgba(221,214,254,0.65) 0%, transparent 60%)",
          filter: "blur(36px)",
        }}
        animate={{ opacity: [0, 0.80, 0], scale: [0.85, 1.20, 0.85] }}
        transition={{ duration: 8, ease: "easeInOut", repeat: Infinity, delay: 3.2 }}
      />

      {/* White-lavender bloom — top left, offsets the bottom purple weight */}
      <motion.div
        className="absolute top-0 left-0 h-[45%] w-[48%]"
        style={{
          background:
            "radial-gradient(ellipse 80% 80% at 0% 0%, rgba(242,239,255,0.90) 0%, transparent 65%)",
          filter: "blur(32px)",
        }}
        animate={{ opacity: [0.1, 0.90, 0.1], scale: [0.80, 1.25, 0.80] }}
        transition={{ duration: 9, ease: "easeInOut", repeat: Infinity, delay: 4.5 }}
      />
    </div>
  );
}
