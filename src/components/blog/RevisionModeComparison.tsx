"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export function RevisionModeComparison() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div
      ref={ref}
      className="my-10 rounded-2xl border border-stone-200 bg-white p-6 not-prose"
      style={{ fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif" }}
    >
      <p className="text-[10px] font-semibold tracking-widest uppercase text-violet-600 mb-5">
        Revision: two experiences
      </p>

      <div className="grid grid-cols-2 gap-4">
        {/* Without bible */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.15, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-xl border border-stone-200 bg-stone-50 p-4"
        >
          <p className="text-[9px] font-bold tracking-widest uppercase text-red-400 mb-3">
            Without a bible
          </p>

          {/* Manuscript excerpt with confusion */}
          <div className="rounded border border-stone-200 bg-white p-3 mb-3 text-[11px] text-stone-500 leading-relaxed">
            <span>&ldquo;...she met his gaze, her </span>
            <span className="rounded bg-amber-100 px-0.5 text-amber-700 font-medium">
              [green? brown?]
            </span>
            <span> eyes steady...&rdquo;</span>
          </div>

          {/* Search bar */}
          <div className="rounded border border-stone-200 bg-white px-3 py-2 flex items-center justify-between mb-3">
            <span className="text-[10px] text-stone-400 font-mono">Ctrl+F &ldquo;eye color&rdquo;</span>
            <motion.span
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.7 }}
              className="text-[10px] font-semibold text-red-500"
            >
              47 results
            </motion.span>
          </div>

          {/* Flags */}
          <div className="space-y-1.5">
            {["Which version is right?", "When did this change?", "Check Ch. 3 through 19"].map((flag, i) => (
              <motion.div
                key={flag}
                initial={{ opacity: 0, x: -8 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.5 + i * 0.12 }}
                className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-2 py-1"
              >
                <span className="text-amber-500 text-[10px]">?</span>
                <span className="text-[10px] text-amber-700">{flag}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* With bible */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.25, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-xl border border-violet-200 bg-violet-50 p-4"
        >
          <p className="text-[9px] font-bold tracking-widest uppercase text-violet-500 mb-3">
            With a bible
          </p>

          {/* Manuscript excerpt, clean */}
          <div className="rounded border border-violet-200 bg-white p-3 mb-3 text-[11px] text-stone-500 leading-relaxed">
            <span>&ldquo;...she met his gaze, her </span>
            <span className="text-violet-700 font-semibold underline decoration-violet-300 decoration-dotted">
              green eyes
            </span>
            <span> steady...&rdquo;</span>
          </div>

          {/* Bible lookup */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.55, duration: 0.45 }}
            className="rounded-lg border border-violet-200 bg-white p-3 mb-3"
          >
            <p className="text-[11px] font-semibold text-violet-700 mb-1">Nadia Voss</p>
            <p className="text-[10px] text-stone-500">Eyes: green <span className="text-stone-400">(established Ch. 3)</span></p>
            <p className="text-[10px] text-stone-400 mt-0.5">Voice: short sentences</p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.75 }}
            className="text-[10px] text-violet-600 font-medium"
          >
            1 lookup. Done.
          </motion.p>
        </motion.div>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.9, duration: 0.5 }}
        className="mt-5 text-xs text-stone-400 leading-relaxed"
      >
        A story bible does not change how you write. It changes what revision costs.
      </motion.p>
    </div>
  );
}
