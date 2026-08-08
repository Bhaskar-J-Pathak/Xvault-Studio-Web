"use client";

import { motion, AnimatePresence, useInView } from "framer-motion";
import { useRef, useState } from "react";

const tabs = [
  {
    id: "characters",
    label: "Characters",
    rows: [
      { label: "Name", value: "Nadia Voss" },
      { label: "Role", value: "Protagonist" },
      { label: "Eyes", value: "Green (fixed: Ch. 3)" },
      { label: "Voice", value: "Short sentences. Avoids \"I think.\" Deflects with questions." },
      { label: "Wound", value: "Abandoned at 14. Pushes people away before they can leave." },
    ],
  },
  {
    id: "world",
    label: "World",
    rows: [
      { label: "Setting", value: "Coastal city, northern climate" },
      { label: "Era", value: "Near future, 2040s" },
      { label: "Travel", value: "3 days to capital by train. 1 week by road." },
      { label: "Rule", value: "Surveillance is ubiquitous but prone to gaps." },
      { label: "Economy", value: "Credit-based. Cash is suspicious by default." },
    ],
  },
  {
    id: "timeline",
    label: "Timeline",
    rows: [
      { label: "5 yrs ago", value: "The disappearance. Never officially resolved." },
      { label: "Day 0", value: "Nadia receives the letter. Chapter 1." },
      { label: "Day 4", value: "First contact with the antagonist. Chapter 6." },
      { label: "Day 12", value: "The funeral. Tuesday. Chapter 14." },
      { label: "Day 19", value: "The city shuts down. Chapter 22." },
    ],
  },
  {
    id: "threads",
    label: "Threads",
    rows: [
      { label: "Ch. 3", value: "The locked drawer in Nadia's office. Open." },
      { label: "Ch. 7", value: "Who sent the photograph? Unanswered." },
      { label: "Ch. 11", value: "Marcus's scar. Origin not yet explained." },
      { label: "Ch. 15", value: "The second key. Planted. Needs payoff by Act 3." },
      { label: "Ch. 18", value: "The witness who was not there. Open." },
    ],
  },
];

export function StoryBiblePreview() {
  const [active, setActive] = useState("characters");
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const activeTab = tabs.find((t) => t.id === active)!;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="my-10 overflow-hidden rounded-2xl border border-stone-200 bg-white not-prose"
      style={{ fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif" }}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2.5 border-b border-stone-200 bg-stone-50 px-5 py-3">
        <div className="h-2.5 w-2.5 rounded-full bg-stone-300" />
        <div className="h-2.5 w-2.5 rounded-full bg-stone-300" />
        <div className="h-2.5 w-2.5 rounded-full bg-stone-300" />
        <span className="ml-2 text-[10px] font-semibold tracking-widest uppercase text-stone-400">
          Story Bible
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`relative px-5 py-2.5 text-xs font-medium transition-colors ${
              active === tab.id
                ? "text-violet-700"
                : "text-stone-400 hover:text-stone-600"
            }`}
          >
            {tab.label}
            {active === tab.id && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-px bg-violet-500"
              />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[200px] p-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
          >
            <div className="space-y-3">
              {activeTab.rows.map((row, i) => (
                <motion.div
                  key={row.label}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex gap-4"
                >
                  <span className="w-20 shrink-0 pt-px text-[11px] text-stone-400">
                    {row.label}
                  </span>
                  <span className="text-[11px] leading-relaxed text-stone-600">
                    {row.value}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="border-t border-stone-100 bg-stone-50 px-5 py-3">
        <p className="text-[10px] text-stone-400">
          Every entry is a decision you have committed to. Not a possibility. A fact.
        </p>
      </div>
    </motion.div>
  );
}
