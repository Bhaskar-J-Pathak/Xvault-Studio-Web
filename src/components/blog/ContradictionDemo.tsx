"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export function ContradictionDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div
      ref={ref}
      className="my-10 rounded-2xl border border-stone-200 bg-white p-6 not-prose"
      style={{ fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif" }}
    >
      <p className="text-[10px] font-semibold tracking-widest uppercase text-violet-600 mb-5">
        What a continuity error looks like
      </p>

      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-xl border border-stone-200 bg-stone-50 p-4"
        >
          <div className="text-[10px] font-semibold tracking-widest uppercase text-stone-400 mb-3">
            Chapter 3, page 40
          </div>
          <p className="text-sm text-stone-600 leading-relaxed">
            &ldquo;...her{" "}
            <span className="text-emerald-700 font-semibold">green eyes</span>{" "}
            narrowed as she studied the map spread across the table...&rdquo;
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 0.15, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-xl border border-red-200 bg-red-50 p-4"
        >
          <div className="text-[10px] font-semibold tracking-widest uppercase text-red-400 mb-3">
            Chapter 19, page 200
          </div>
          <p className="text-sm text-stone-600 leading-relaxed">
            &ldquo;...she met his gaze, her{" "}
            <span className="text-red-600 font-semibold">brown eyes</span>{" "}
            steady despite the fear crawling up her spine...&rdquo;
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.45, duration: 0.5 }}
        className="mt-4 flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5"
      >
        <motion.span
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500"
        />
        <span className="text-xs text-red-600">
          Continuity error: eye color changed between chapters. Your editor will find this.
        </span>
      </motion.div>
    </div>
  );
}
