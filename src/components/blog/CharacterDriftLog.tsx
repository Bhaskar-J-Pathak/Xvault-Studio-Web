"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const draftNotes = [
  { chapter: "Ch. 4", text: "Marcus agrees to help without hesitation.", flagged: false },
  { chapter: "Ch. 8", text: "Marcus hesitates before the warehouse scene.", flagged: false },
  { chapter: "Ch. 11", text: "Marcus refuses to enter the building. Says \"not this time.\"", flagged: false },
  { chapter: "Ch. 13", text: "Marcus tells Nadia to go alone. Offers no explanation.", flagged: true },
];

export function CharacterDriftLog() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div
      ref={ref}
      className="my-10 rounded-2xl border border-stone-200 bg-white p-6 not-prose"
      style={{ fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif" }}
    >
      <p className="text-[10px] font-semibold tracking-widest uppercase text-violet-600 mb-5">
        Tracking character drift
      </p>

      <div className="grid grid-cols-2 gap-0 divide-x divide-stone-200">
        {/* Plan column */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="pr-5"
        >
          <p className="text-[9px] font-bold tracking-widest uppercase text-stone-400 mb-3">Plan</p>
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 space-y-2">
            <p className="text-xs font-semibold text-stone-700">Marcus Chen</p>
            <div className="space-y-1.5 text-[11px] text-stone-500 leading-snug">
              <p>Role: loyal ally</p>
              <p>Never questions the protagonist</p>
              <p>Motivation: repaying a debt</p>
            </div>
          </div>
        </motion.div>

        {/* Draft column */}
        <div className="pl-5 space-y-2">
          <p className="text-[9px] font-bold tracking-widest uppercase text-stone-400 mb-3">Draft notes</p>
          {draftNotes.map((note, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 12 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.2 + i * 0.15, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className={`rounded-lg border p-2.5 ${
                note.flagged
                  ? "border-violet-200 bg-violet-50"
                  : "border-stone-100 bg-stone-50"
              }`}
            >
              <div className="flex items-start gap-2">
                {note.flagged && (
                  <motion.span
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500"
                  />
                )}
                <div>
                  <span className="text-[9px] font-bold text-stone-400">{note.chapter} </span>
                  <span className={`text-[11px] leading-snug ${note.flagged ? "text-stone-700" : "text-stone-500"}`}>
                    {note.text}
                  </span>
                  {note.flagged && (
                    <p className="mt-1 text-[10px] text-violet-600">
                      Drift detected. Motivation shifted. Update the plan or commit this change.
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
