"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const connected = [
  { label: "Romantic subplot", link: "mirrors the protagonist's wound" },
  { label: "Mystery subplot", link: "resolves the main story question" },
  { label: "Political subplot", link: "explains the antagonist's motive" },
];

const floating = [
  { label: "Travel sequence", chapters: "Ch. 9-10" },
  { label: "Backstory flashbacks", chapters: "Ch. 6" },
];

export function SubplotWebDiagram() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div
      ref={ref}
      className="my-10 rounded-2xl border border-stone-200 bg-white p-6 not-prose"
      style={{ fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif" }}
    >
      <p className="text-[10px] font-semibold tracking-widest uppercase text-violet-600 mb-6">
        Every subplot needs a link to the core conflict
      </p>

      {/* Main conflict node */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ delay: 0.1, duration: 0.5, ease: "backOut" }}
        className="mx-auto mb-6 w-fit rounded-full border-2 border-violet-400 bg-violet-50 px-5 py-2.5 text-center"
      >
        <p className="text-[10px] font-bold tracking-widest uppercase text-violet-600">Main Conflict</p>
        <p className="text-[11px] text-violet-500 mt-0.5">Protagonist vs. their own fear</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        {/* Connected subplots */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1 bg-violet-200" />
            <p className="text-[9px] font-bold tracking-widest uppercase text-violet-500">Connected</p>
            <div className="h-px flex-1 bg-violet-200" />
          </div>
          <div className="space-y-2">
            {connected.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 8 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.25 + i * 0.1, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-lg border border-violet-200 bg-violet-50 p-3"
              >
                <div className="flex items-start gap-2">
                  <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                  <div>
                    <p className="text-[11px] font-semibold text-violet-700">{item.label}</p>
                    <p className="text-[10px] text-violet-500 mt-0.5">{item.link}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Floating subplots */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1 bg-stone-200" />
            <p className="text-[9px] font-bold tracking-widest uppercase text-stone-400">Floating</p>
            <div className="h-px flex-1 bg-stone-200" />
          </div>
          <div className="space-y-2">
            {floating.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 8 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.35 + i * 0.1, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-lg border border-stone-200 bg-stone-50 p-3"
              >
                <div className="flex items-start gap-2">
                  <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-stone-300" />
                  <div>
                    <p className="text-[11px] font-semibold text-stone-500">{item.label}</p>
                    <p className="text-[10px] text-stone-400 mt-0.5">{item.chapters}</p>
                  </div>
                </div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={inView ? { opacity: 1 } : {}}
                  transition={{ delay: 0.7 + i * 0.1 }}
                  className="mt-2 rounded border border-red-200 bg-red-50 px-2 py-1"
                >
                  <p className="text-[9px] text-red-500">No connection to main conflict</p>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.9, duration: 0.5 }}
        className="mt-5 text-xs text-stone-400 leading-relaxed"
      >
        A subplot that does not connect to the main question is a detour. A subplot that does is a mirror.
      </motion.p>
    </div>
  );
}
