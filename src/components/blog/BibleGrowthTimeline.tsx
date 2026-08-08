"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const rows = [
  {
    chapter: "Write Ch. 1",
    sub: "Protagonist introduced",
    entry: "Nadia: green eyes, short sentences, deflects with questions",
    cost: "2 min",
  },
  {
    chapter: "Write Ch. 4",
    sub: "New location introduced",
    entry: "Halford Station: northern coast, 3 days to capital by train",
    cost: "3 min",
  },
  {
    chapter: "Write Ch. 9",
    sub: "Secondary character added",
    entry: "Marcus: scar along left jaw, speaks in questions",
    cost: "2 min",
  },
  {
    chapter: "Write Ch. 14",
    sub: "Major plot decision",
    entry: "The funeral is Tuesday. Chapter 14 is Day 12 of the story.",
    cost: "1 min",
  },
];

export function BibleGrowthTimeline() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div
      ref={ref}
      className="my-10 rounded-2xl border border-stone-200 bg-white p-6 not-prose"
      style={{ fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif" }}
    >
      <p className="text-[10px] font-semibold tracking-widest uppercase text-violet-600 mb-6">
        The bible grows with the draft
      </p>

      <div className="relative">
        {/* Vertical spine */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-stone-200 -translate-x-1/2" />
        <motion.div
          className="absolute left-1/2 top-0 w-px bg-violet-300 origin-top -translate-x-1/2"
          initial={{ scaleY: 0 }}
          animate={inView ? { scaleY: 1 } : {}}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          style={{ bottom: 0 }}
        />

        <div className="space-y-5">
          {rows.map((row, i) => (
            <div key={i} className="grid grid-cols-2 gap-4 items-start">
              {/* Left: chapter */}
              <motion.div
                initial={{ opacity: 0, x: -14 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.35 + i * 0.15, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="text-right pr-5"
              >
                <p className="text-[11px] font-semibold text-stone-700">{row.chapter}</p>
                <p className="text-[10px] text-stone-400">{row.sub}</p>
              </motion.div>

              {/* Center dot */}
              <motion.div
                className="absolute left-1/2 -translate-x-1/2"
                style={{ top: `${i * 72 + 4}px` }}
                initial={{ scale: 0 }}
                animate={inView ? { scale: 1 } : {}}
                transition={{ delay: 0.4 + i * 0.15, duration: 0.3, ease: "backOut" }}
              >
                <div className="h-2.5 w-2.5 rounded-full border-2 border-violet-400 bg-white" />
              </motion.div>

              {/* Right: bible entry */}
              <motion.div
                initial={{ opacity: 0, x: 14 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.45 + i * 0.15, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="pl-5"
              >
                <div className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2">
                  <p className="text-[11px] text-violet-700 leading-snug">{row.entry}</p>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={inView ? { opacity: 1 } : {}}
                    transition={{ delay: 0.6 + i * 0.15 }}
                    className="mt-1 text-[9px] text-stone-400"
                  >
                    {row.cost}
                  </motion.p>
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="mt-6 text-xs text-stone-400 leading-relaxed"
      >
        Five minutes after each session. That is the entire cost.
      </motion.p>
    </div>
  );
}
