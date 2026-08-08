"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const beats = [
  { label: "Opening", sub: "World before" },
  { label: "Inciting Event", sub: "Disruption" },
  { label: "Turn 1", sub: "Commitment" },
  { label: "Midpoint", sub: "Apparent win" },
  { label: "Turn 2", sub: "Collapse" },
  { label: "Climax", sub: "Worst moment" },
  { label: "Resolution", sub: "New world" },
];

const nodeStyle = [
  "border-stone-300 bg-stone-100 text-stone-400",
  "border-stone-300 bg-stone-100 text-stone-500",
  "border-violet-300 bg-violet-50 text-violet-600",
  "border-violet-400 bg-violet-100 text-violet-700",
  "border-violet-300 bg-violet-50 text-violet-600",
  "border-violet-500 bg-violet-600 text-white",
  "border-stone-300 bg-stone-100 text-stone-500",
];

export function SevenBeatSpine() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div
      ref={ref}
      className="my-10 rounded-2xl border border-stone-200 bg-white p-6 not-prose"
      style={{ fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif" }}
    >
      <p className="text-[10px] font-semibold tracking-widest uppercase text-violet-600 mb-8">
        The seven beat spine — one page, every novel
      </p>

      <div className="overflow-x-auto pb-1">
        <div className="relative min-w-[580px]">
          {/* Track */}
          <div
            className="absolute left-6 right-6 bg-stone-200"
            style={{ top: "18px", height: "1px" }}
          />
          {/* Animated fill */}
          <motion.div
            className="absolute left-6 origin-left bg-violet-400"
            style={{ top: "18px", height: "1px", right: "24px" }}
            initial={{ scaleX: 0 }}
            animate={inView ? { scaleX: 1 } : {}}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          />

          <div className="flex justify-between">
            {beats.map((beat, i) => (
              <div key={beat.label} className="flex flex-col items-center" style={{ width: "14.28%" }}>
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={inView ? { scale: 1, opacity: 1 } : {}}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.4, ease: "backOut" }}
                  className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full border text-[11px] font-bold ${nodeStyle[i]}`}
                >
                  {i + 1}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
                  className="mt-3 text-center"
                >
                  <p className="text-[10px] font-semibold leading-tight text-stone-600">
                    {beat.label}
                  </p>
                  <p className="mt-0.5 text-[9px] text-stone-400">{beat.sub}</p>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="mt-6 text-xs text-stone-400 leading-relaxed"
      >
        Every scene in your novel lives somewhere between these seven points. Knowing where keeps you from losing the thread.
      </motion.p>
    </div>
  );
}
