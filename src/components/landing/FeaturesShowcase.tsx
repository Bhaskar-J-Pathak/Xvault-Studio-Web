"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView, AnimatePresence, useScroll, useTransform } from "framer-motion";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

const violetGrad: React.CSSProperties = {
  background: "linear-gradient(135deg, #7C3AED 0%, #5B21B6 55%, #3B0764 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

// ─────────────────────────────────────────────────────────────────────────────
// Demo 01 — Alex Chat
// ─────────────────────────────────────────────────────────────────────────────

function AlexChatDemo({ live }: { live: boolean }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!live) { setStep(0); return; }
    const t1 = setTimeout(() => setStep(1), 500);
    const t2 = setTimeout(() => setStep(2), 2100);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [live]);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-[0_8px_40px_rgba(109,40,217,0.10)] border border-violet-100/80">
      <div className="flex items-center gap-2.5 pb-3.5 border-b border-violet-50/80">
        <div className="h-7 w-7 rounded-full bg-violet-100 flex items-center justify-center text-[0.6rem] font-bold text-violet-700">A</div>
        <div>
          <p className="text-[0.72rem] font-semibold text-stone-800">Alex</p>
          <div className="flex items-center gap-1">
            <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}
              className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-[0.57rem] text-stone-400">loaded your full manuscript</span>
          </div>
        </div>
      </div>
      <div className="mt-3.5 space-y-3">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={live ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.35, ease }}
          className="ml-auto w-fit max-w-[78%] rounded-2xl rounded-tr-sm bg-violet-600 px-4 py-2.5"
        >
          <p className="text-[0.72rem] leading-[1.6] text-white">
            What&apos;s the tension between Nadia and Marcus?
          </p>
        </motion.div>
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="typing"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 w-fit rounded-2xl rounded-tl-sm bg-violet-50 px-4 py-3"
            >
              {[0, 1, 2].map(i => (
                <motion.span key={i}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.22 }}
                  className="h-1 w-1 rounded-full bg-violet-400"
                />
              ))}
            </motion.div>
          )}
          {step >= 2 && (
            <motion.div key="reply"
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease }}
              className="rounded-2xl rounded-tl-sm bg-violet-50 px-4 py-3"
            >
              <p className="text-[0.72rem] leading-[1.78] text-stone-600">
                In Ch. 2 you planted real tension. She knows he was at the warehouse, but hasn&apos;t confronted him yet. That thread is still open.
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[0.57rem] font-medium text-amber-600">
                  <span className="h-1 w-1 rounded-full bg-amber-400" />
                  Thread open · Ch. 2
                </span>
                <span className="text-[0.57rem] text-stone-400">Grounded in your manuscript</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Demo 02 — Ghost Writing
// ─────────────────────────────────────────────────────────────────────────────

function GhostWritingDemo({ live }: { live: boolean }) {
  const TYPED = "The fog came in low, swallowing the harbor whole. Mara stood at the railing, watching the lights ";
  const GHOST = "of the other ship blink once, twice, then disappear entirely.";
  const [chars, setChars] = useState(0);
  const [showGhost, setShowGhost] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!live) { setChars(0); setShowGhost(false); setAccepted(false); return; }
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setChars(i);
      if (i >= TYPED.length) {
        clearInterval(iv);
        setTimeout(() => setShowGhost(true), 600);
        setTimeout(() => setAccepted(true), 2500);
      }
    }, 26);
    return () => clearInterval(iv);
  }, [live]);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-[0_8px_40px_rgba(109,40,217,0.10)] border border-violet-100/80">
      <div className="mb-4 flex items-center gap-2 pb-3 border-b border-stone-100/80">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
        </div>
        <span className="ml-auto font-mono text-[0.57rem] text-stone-300">Chapter 4 · The Fog</span>
      </div>
      <p className="font-serif text-[0.84rem] leading-[2.1] text-stone-700 min-h-[5rem]">
        {TYPED.slice(0, chars)}
        {chars < TYPED.length && (
          <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.85, repeat: Infinity }}
            className="inline-block h-[14px] w-[2px] translate-y-[2px] rounded-sm bg-violet-600"
          />
        )}
        {showGhost && !accepted && (
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.65 }}
            className="text-violet-400/55"
          >
            {GHOST}
          </motion.span>
        )}
        {accepted && <span>{GHOST}</span>}
      </p>
      <AnimatePresence>
        {showGhost && !accepted && (
          <motion.div
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ delay: 0.25, duration: 0.35 }}
            className="mt-4 flex flex-wrap items-center gap-3"
          >
            <div className="flex items-center gap-2">
              <span className="text-[0.6rem] text-stone-400">Voice match</span>
              <div className="h-1 w-16 overflow-hidden rounded-full bg-stone-100">
                <motion.div initial={{ width: 0 }} animate={{ width: "93%" }}
                  transition={{ delay: 0.5, duration: 0.7, ease: "easeOut" }}
                  className="h-full rounded-full bg-violet-500"
                />
              </div>
              <span className="text-[0.6rem] font-semibold text-violet-600">93%</span>
            </div>
            <kbd className="inline-flex items-center rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 font-mono text-[0.6rem] font-semibold text-violet-600">
              Tab to accept
            </kbd>
          </motion.div>
        )}
        {accepted && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}
            className="mt-4 flex items-center gap-1.5"
          >
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-[0.6rem] text-stone-400">Accepted · written in your voice</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Demo 03 — World Board
// ─────────────────────────────────────────────────────────────────────────────

function WorldBoardDemo({ live }: { live: boolean }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-[0_8px_40px_rgba(109,40,217,0.10)] border border-violet-100/80">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-violet-500">World Board</span>
        <motion.div
          animate={live ? { opacity: [0.4, 1, 0.4] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex items-center gap-1.5"
        >
          <div className="h-1.5 w-1.5 rounded-full bg-violet-500" />
          <span className="text-[0.57rem] text-stone-400">auto-extracting entities</span>
        </motion.div>
      </div>
      <svg viewBox="0 0 500 262" className="w-full" aria-hidden="true" style={{ maxHeight: "262px" }}>
        <defs>
          <marker id="wb-tip" markerWidth="7" markerHeight="6" refX="6" refY="3" orient="auto">
            <path d="M0,0.5 L0,5.5 L6.5,3 Z" fill="#C4B5FD" />
          </marker>
        </defs>
        <motion.g initial={{ opacity: 0 }} animate={live ? { opacity: 1 } : { opacity: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
          <rect x="8" y="8" width="162" height="82" rx="9" fill="#ECFDF5" stroke="#A7F3D0" strokeWidth="1" />
          <text x="18" y="23" fontSize="6" fontWeight="700" fill="#065F46" fontFamily="ui-sans-serif, system-ui, sans-serif" letterSpacing="1.2">LOCATION</text>
          <text x="18" y="37" fontSize="9.5" fontWeight="600" fill="#111827" fontFamily="ui-sans-serif, system-ui, sans-serif">The Meridian Archive</text>
          <text x="18" y="51" fontSize="7.5" fontFamily="ui-sans-serif, system-ui, sans-serif"><tspan fill="#9CA3AF">type: </tspan><tspan fill="#4B5563">underground vault</tspan></text>
          <text x="18" y="63" fontSize="7.5" fontFamily="ui-sans-serif, system-ui, sans-serif"><tspan fill="#9CA3AF">access: </tspan><tspan fill="#4B5563">restricted, Ch. 2+</tspan></text>
          <text x="18" y="75" fontSize="7.5" fontFamily="ui-sans-serif, system-ui, sans-serif"><tspan fill="#9CA3AF">holds: </tspan><tspan fill="#4B5563">forbidden texts</tspan></text>
        </motion.g>
        <motion.g initial={{ opacity: 0 }} animate={live ? { opacity: 1 } : { opacity: 0 }} transition={{ delay: 0.3, duration: 0.4 }}>
          <rect x="330" y="8" width="162" height="82" rx="9" fill="#F5F3FF" stroke="#DDD6FE" strokeWidth="1" />
          <text x="340" y="23" fontSize="6" fontWeight="700" fill="#4C1D95" fontFamily="ui-sans-serif, system-ui, sans-serif" letterSpacing="1.2">CHARACTER</text>
          <text x="340" y="37" fontSize="9.5" fontWeight="600" fill="#111827" fontFamily="ui-sans-serif, system-ui, sans-serif">Nadia Voronova</text>
          <text x="340" y="51" fontSize="7.5" fontFamily="ui-sans-serif, system-ui, sans-serif"><tspan fill="#9CA3AF">role: </tspan><tspan fill="#4B5563">field operative</tspan></text>
          <text x="340" y="63" fontSize="7.5" fontFamily="ui-sans-serif, system-ui, sans-serif"><tspan fill="#9CA3AF">trait: </tspan><tspan fill="#4B5563">cautious, distrustful</tspan></text>
          <text x="340" y="75" fontSize="7.5" fontFamily="ui-sans-serif, system-ui, sans-serif"><tspan fill="#9CA3AF">arc: </tspan><tspan fill="#4B5563">open · Ch. 5</tspan></text>
        </motion.g>
        <motion.g initial={{ opacity: 0 }} animate={live ? { opacity: 1 } : { opacity: 0 }} transition={{ delay: 0.6, duration: 0.4 }}>
          <rect x="169" y="180" width="162" height="74" rx="9" fill="#FFFBEB" stroke="#FDE68A" strokeWidth="1" />
          <text x="179" y="195" fontSize="6" fontWeight="700" fill="#92400E" fontFamily="ui-sans-serif, system-ui, sans-serif" letterSpacing="1.2">ITEM</text>
          <text x="179" y="209" fontSize="9.5" fontWeight="600" fill="#111827" fontFamily="ui-sans-serif, system-ui, sans-serif">Encrypted Dossier</text>
          <text x="179" y="224" fontSize="7.5" fontFamily="ui-sans-serif, system-ui, sans-serif"><tspan fill="#9CA3AF">contains: </tspan><tspan fill="#4B5563">handler identity</tspan></text>
          <text x="179" y="237" fontSize="7.5" fontFamily="ui-sans-serif, system-ui, sans-serif"><tspan fill="#9CA3AF">status: </tspan><tspan fill="#4B5563">locked · 3 ciphers</tspan></text>
          <text x="179" y="249" fontSize="7.5" fontFamily="ui-sans-serif, system-ui, sans-serif"><tspan fill="#9CA3AF">found: </tspan><tspan fill="#4B5563">Ch. 3, para. 2</tspan></text>
        </motion.g>
        <motion.path d="M 170 49 Q 250 18 330 49" fill="none" stroke="#C4B5FD" strokeWidth="1.5" strokeDasharray="5 3.5" markerEnd="url(#wb-tip)"
          initial={{ pathLength: 0, opacity: 0 }} animate={live ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }} transition={{ delay: 0.85, duration: 0.65 }} />
        <motion.text x="250" y="13" textAnchor="middle" fontSize="8.5" fill="#8B5CF6" fontStyle="italic" fontFamily="ui-sans-serif, system-ui, sans-serif"
          initial={{ opacity: 0 }} animate={live ? { opacity: 1 } : { opacity: 0 }} transition={{ delay: 1.6 }}>has intel on</motion.text>
        <motion.path d="M 411 90 Q 404 138 331 180" fill="none" stroke="#C4B5FD" strokeWidth="1.5" strokeDasharray="5 3.5" markerEnd="url(#wb-tip)"
          initial={{ pathLength: 0, opacity: 0 }} animate={live ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }} transition={{ delay: 1.15, duration: 0.65 }} />
        <motion.text x="428" y="132" textAnchor="middle" fontSize="8.5" fill="#8B5CF6" fontStyle="italic" fontFamily="ui-sans-serif, system-ui, sans-serif"
          initial={{ opacity: 0 }} animate={live ? { opacity: 1 } : { opacity: 0 }} transition={{ delay: 1.95 }}>possesses</motion.text>
        <motion.path d="M 89 90 Q 82 138 169 180" fill="none" stroke="#C4B5FD" strokeWidth="1.5" strokeDasharray="5 3.5" markerEnd="url(#wb-tip)"
          initial={{ pathLength: 0, opacity: 0 }} animate={live ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }} transition={{ delay: 1.45, duration: 0.65 }} />
        <motion.text x="40" y="132" textAnchor="middle" fontSize="8.5" fill="#8B5CF6" fontStyle="italic" fontFamily="ui-sans-serif, system-ui, sans-serif"
          initial={{ opacity: 0 }} animate={live ? { opacity: 1 } : { opacity: 0 }} transition={{ delay: 2.25 }}>stores</motion.text>
      </svg>
      <motion.div
        initial={{ opacity: 0 }} animate={live ? { opacity: 1 } : { opacity: 0 }} transition={{ delay: 2.5, duration: 0.4 }}
        className="mt-3 flex flex-wrap items-center gap-3.5 border-t border-stone-50 pt-3"
      >
        {[{ color: "#6EE7B7", label: "Locations" }, { color: "#C4B5FD", label: "Characters" }, { color: "#FCD34D", label: "Items" }].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full" style={{ background: color }} />
            <span className="text-[0.58rem] text-stone-400">{label}</span>
          </div>
        ))}
        <span className="ml-auto text-[0.57rem] text-stone-400">3 entities · 3 relationships</span>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Demo 04 — Story Bible
// ─────────────────────────────────────────────────────────────────────────────

const THREADS = [
  { label: "Who sent the encrypted message?", status: "open", dotClass: "bg-amber-400" },
  { label: "Marcus at the warehouse", status: "open", dotClass: "bg-amber-400" },
  { label: "Nadia's handler identity", status: "resolved", dotClass: "bg-emerald-400" },
  { label: "The Glass Vault's real location", status: "open", dotClass: "bg-amber-400" },
];

function StoryBibleDemo({ live }: { live: boolean }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-[0_8px_40px_rgba(109,40,217,0.10)] border border-violet-100/80">
      <div className="mb-4 flex items-center justify-between border-b border-stone-50 pb-3">
        <span className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-violet-500">Plot Threads</span>
        <span className="text-[0.57rem] text-stone-400">auto-tracked</span>
      </div>
      <div className="space-y-2.5">
        {THREADS.map((t, i) => (
          <motion.div key={t.label}
            initial={{ opacity: 0, x: -8 }}
            animate={live ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2 + i * 0.18, duration: 0.45, ease }}
            className="flex items-center gap-3 rounded-xl bg-stone-50/70 px-3.5 py-3"
          >
            <motion.div
              animate={t.status === "open" && live ? { opacity: [0.5, 1, 0.5] } : {}}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
              className={`h-2 w-2 shrink-0 rounded-full ${t.dotClass}`}
            />
            <p className="flex-1 text-[0.7rem] leading-[1.5] text-stone-600">{t.label}</p>
            <span className={`shrink-0 text-[0.58rem] font-semibold ${t.status === "open" ? "text-amber-500" : "text-emerald-500"}`}>
              {t.status}
            </span>
          </motion.div>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0 }} animate={live ? { opacity: 1 } : {}} transition={{ delay: 1.1, duration: 0.4 }}
        className="mt-3 border-t border-stone-50 pt-3"
      >
        <span className="text-[0.6rem] text-stone-400">3 open · 1 resolved · dead-branch detection active</span>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Demo 05 — Global Replace
// ─────────────────────────────────────────────────────────────────────────────

const REPLACE_LINES = [
  { pre: "\u201c", name: "Nadia", post: ",\u201d he said quietly, avoiding her eyes." },
  { pre: "", name: "Nadia", post: " moved toward the exit without a word." },
  { pre: "He watched ", name: "Nadia", post: " disappear into the crowd." },
];

function GlobalReplaceDemo({ live }: { live: boolean }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!live) { setPhase(0); return; }
    const ts = [
      setTimeout(() => setPhase(1), 700),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 1700),
    ];
    return () => ts.forEach(clearTimeout);
  }, [live]);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-[0_8px_40px_rgba(109,40,217,0.10)] border border-violet-100/80">
      <div className="mb-4 flex items-center gap-2.5 rounded-xl bg-stone-50 p-3">
        <div className="flex items-center gap-2 rounded-lg border border-stone-100 bg-white px-2.5 py-1.5">
          <span className="text-[0.58rem] text-stone-400">Find</span>
          <span className="font-mono text-[0.7rem] font-semibold text-rose-600">Nadia</span>
        </div>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 text-stone-300">
          <path d="M2 7h10M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="flex items-center gap-2 rounded-lg border border-stone-100 bg-white px-2.5 py-1.5">
          <span className="text-[0.58rem] text-stone-400">Replace</span>
          <span className="font-mono text-[0.7rem] font-semibold text-emerald-600">Mara</span>
        </div>
        <span className="ml-auto text-[0.57rem] text-stone-400">51 matches</span>
      </div>
      <div className="space-y-2">
        {REPLACE_LINES.map((line, i) => (
          <div key={i} className="flex items-baseline gap-1 rounded-xl bg-stone-50/70 px-3.5 py-2.5 font-serif text-[0.78rem]">
            <span className="text-stone-600">{line.pre}</span>
            <span className="relative inline-block min-w-[2.8rem]">
              <AnimatePresence mode="wait">
                {phase <= i ? (
                  <motion.span key="old" exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }} className="text-rose-500">
                    {line.name}
                  </motion.span>
                ) : (
                  <motion.span key="new" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }} className="font-semibold text-emerald-600">
                    Mara
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
            <span className="text-stone-600">{line.post}</span>
          </div>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0 }} animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }} transition={{ duration: 0.4 }}
        className="mt-3.5 flex items-center gap-1.5 border-t border-stone-50 pt-3"
      >
        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        <span className="text-[0.6rem] text-stone-400">51 replacements complete. Voice and context preserved.</span>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Chapter data
// ─────────────────────────────────────────────────────────────────────────────

interface HeadingLine {
  text: string;
  gradient?: boolean;
}

interface ChapterData {
  num: string;
  tag: string;
  lines: HeadingLine[];
  description: string;
  details: string[];
  Demo: React.ComponentType<{ live: boolean }>;
}

const CHAPTERS: ChapterData[] = [
  {
    num: "01",
    tag: "Co-Author",
    lines: [
      { text: "Alex knows your story." },
      { text: "Every character." },
      { text: "Every thread.", gradient: true },
    ],
    description: "Alex lives in a panel next to your canvas. Before you type a word, it reads your entire manuscript. Ask it anything: who a character is, what happened in Chapter 3, which plot threads are still open. Every answer grounded in what you've actually written.",
    details: [
      "Remembers characters, locations, and factions from your draft",
      "Cites the exact chapter and paragraph it's referencing",
      "Never hallucinates. Only answers from your manuscript.",
    ],
    Demo: AlexChatDemo,
  },
  {
    num: "02",
    tag: "AI Writing",
    lines: [
      { text: "Your voice," },
      { text: "amplified.", gradient: true },
    ],
    description: "Press Ctrl+K. Describe what should happen next. The AI writes it in your voice, trained on your existing chapters, not a generic model. Tab to accept, Esc to dismiss. No rewriting the suggestion to sound like you. It already does.",
    details: [
      "Voice match score shown before you accept",
      "Trained on your prose, not generic internet text",
      "Ghost text appears inline. No modal, no context switch.",
    ],
    Demo: GhostWritingDemo,
  },
  {
    num: "03",
    tag: "World Building",
    lines: [
      { text: "Your universe," },
      { text: "mapped automatically.", gradient: true },
    ],
    description: "Every character, location, and faction extracted as you write. Your story's world becomes a living knowledge graph. No spreadsheets, no manual entry. Mention a new place in Chapter 7, it's on the World Board before you finish the paragraph.",
    details: [
      "Auto-extracts entities from every save",
      "Relationship edges built from narrative context",
      "Click any node to see every scene that references it",
    ],
    Demo: WorldBoardDemo,
  },
  {
    num: "04",
    tag: "Plot Intelligence",
    lines: [
      { text: "Plot threads," },
      { text: "never dropped.", gradient: true },
    ],
    description: "Story Bible tracks every open question your manuscript raises, and flags you when one goes unanswered for too long. Dead branches, forgotten subplots, unresolved conflicts: caught before your readers find them.",
    details: [
      "Open / resolved status tracked per thread automatically",
      "Dead-branch detection for abandoned plot lines",
      "Full semantic search across your manuscript history",
    ],
    Demo: StoryBibleDemo,
  },
  {
    num: "05",
    tag: "Global Editing",
    lines: [
      { text: "Rename a character." },
      { text: "Everywhere.", gradient: true },
      { text: "Correctly.", gradient: true },
    ],
    description: "Global Replace understands context. It doesn't just match strings. It understands grammar, voice, and casing. Rename Nadia to Mara and every pronoun, possessive, and dialogue tag updates correctly across all 80,000 words.",
    details: [
      "Context-aware replacement, not simple string matching",
      "Preserves pronouns, possessives, and dialogue attributions",
      "Preview every change before you commit",
    ],
    Demo: GlobalReplaceDemo,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Feature chapter — sticky stacking card
// ─────────────────────────────────────────────────────────────────────────────

// Slightly deeper lavender per card so stacked cards are distinguishable
const CARD_BG = ["#EAE6FF", "#E5E0FF", "#E0DAFF", "#DDD6FE", "#D9D3FD"] as const;

function FeatureChapter({
  chapter,
  index,
  total,
  reverse,
}: {
  chapter: ChapterData;
  index: number;
  total: number;
  reverse: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isLast = index === total - 1;

  // Track scroll progress through this card's "zone"
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // As user scrolls past this card, scale it down (push into background)
  // Last card stays at full scale since nothing covers it
  const scale = useTransform(scrollYProgress, [0, 1], [1, isLast ? 1 : 0.88]);

  // Entrance animation
  const inView = useInView(containerRef, { once: true, margin: "-8%" });
  const demoRef = useRef<HTMLDivElement>(null);
  const demoLive = useInView(demoRef, { once: false, margin: "-10%" });

  const { Demo } = chapter;
  const bg = CARD_BG[index] ?? "#DDD6FE";

  return (
    <div
      ref={containerRef}
      className="sticky top-0 h-screen overflow-hidden"
      style={{ zIndex: index + 2 }}
    >
      <motion.div
        style={{ scale, transformOrigin: "top center", backgroundColor: bg }}
        className="relative flex h-full w-full items-center overflow-hidden px-6 py-20 lg:px-16 xl:px-24"
      >

        {/* Ghost chapter number */}
        <div
          aria-hidden
          className="pointer-events-none absolute select-none font-display"
          style={{
            fontSize: "36vw",
            fontWeight: 300,
            fontStyle: "italic",
            color: "rgba(109,40,217,0.05)",
            bottom: "-5vw",
            right: reverse ? "auto" : "-2vw",
            left: reverse ? "-2vw" : "auto",
            lineHeight: 1,
            letterSpacing: "-0.045em",
          }}
        >
          {chapter.num}
        </div>

        <div className="relative z-10 mx-auto w-full max-w-[1280px]">

          {/* Chapter tag */}
          <motion.div
            initial={{ opacity: 0, x: reverse ? 16 : -16 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.55, ease }}
            className="mb-10 flex items-center gap-3"
          >
            <span className="font-mono text-[0.58rem] font-bold tracking-[0.25em] text-violet-400/55">
              {chapter.num}
            </span>
            <div className="h-px w-8 bg-violet-400/30" />
            <span className="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-violet-600">
              {chapter.tag}
            </span>
          </motion.div>

          {/* Content grid — text and demo, alternating sides */}
          <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[1fr_420px] lg:gap-16 xl:grid-cols-[1fr_480px] xl:gap-20">

            {/* Text column */}
            <div className={reverse ? "lg:order-2" : "lg:order-1"}>

              {/* Staggered headline */}
              <div className="mb-10">
                {chapter.lines.map((line, i) => (
                  <div key={i} className="overflow-hidden leading-[1.01]">
                    <motion.h2
                      initial={{ y: "112%" }}
                      animate={inView ? { y: "0%" } : {}}
                      transition={{ delay: 0.07 + i * 0.13, duration: 0.88, ease }}
                      className="font-display"
                      style={{
                        fontSize: "clamp(2.6rem, 5vw, 6rem)",
                        lineHeight: 1.02,
                        letterSpacing: "-0.03em",
                        fontWeight: 300,
                        color: "#1A0A3C",
                        ...(line.gradient ? violetGrad : {}),
                      }}
                    >
                      {line.text}
                    </motion.h2>
                  </div>
                ))}
              </div>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.4, duration: 0.72, ease }}
                className="max-w-[44ch] text-[1rem] leading-[1.9] text-violet-900/50"
              >
                {chapter.description}
              </motion.p>

              {/* Bullets */}
              <ul className="mt-7 space-y-3">
                {chapter.details.map((d, i) => (
                  <motion.li
                    key={d}
                    initial={{ opacity: 0, x: reverse ? 10 : -10 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.54 + i * 0.09, duration: 0.5, ease }}
                    className="flex items-start gap-2.5"
                  >
                    <span className="mt-[0.46rem] h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                    <span className="text-[0.875rem] leading-[1.72] text-violet-900/46">{d}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Demo column */}
            <motion.div
              ref={demoRef}
              className={reverse ? "lg:order-1" : "lg:order-2"}
              initial={{ opacity: 0, y: 28 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.22, duration: 0.85, ease }}
            >
              <Demo live={demoLive} />
            </motion.div>

          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// In the Lab — teaser
// ─────────────────────────────────────────────────────────────────────────────

const LAB_ITEMS = [
  { icon: "◎", name: "Story Alex", desc: "A custom Alex tuned per story. Set its genre, tone, character focus, and narrative goals. One story, one co-author that actually knows the job.", badge: "In dev", hot: true },
  { icon: "⊞", name: "Adaptation Agent", desc: "One click turns your novel into a screenplay, pilot script, or webtoon script. Scene headings, dialogue, action lines: all auto-formatted and ready.", badge: "In dev", hot: true },
  { icon: "⟡", name: "What If Agent", desc: "Pick any moment in your story and ask what if X happened instead. The agent branches your manuscript and explores the alternate timeline fully.", badge: "In dev", hot: true },
  { icon: "✦", name: "Manuscript Feedback", desc: "Full draft analysis across pacing, consistency, believability, and originality. Actionable notes, not vague praise. Like a beta reader with no feelings to hurt.", badge: "Planned", hot: false },
  { icon: "⊹", name: "Scene Expander", desc: "Thin scene? One command and it fills out sensory detail, subtext, and pacing without touching your voice. No rewriting required.", badge: "Planned", hot: false },
  { icon: "◈", name: "Visualize", desc: "Generate reference images for characters, locations, and key scenes directly from your descriptions. Keep the visual identity of your story consistent.", badge: "Planned", hot: false },
];

function LabTeaser() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div ref={ref} className="px-6 pb-28 lg:px-16 xl:px-24">
      <div className="relative overflow-hidden rounded-3xl bg-white px-8 py-16 shadow-[0_4px_6px_rgba(109,40,217,0.04),0_24px_64px_rgba(109,40,217,0.08)] lg:px-16 lg:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 55% 50% at 0% 0%, rgba(237,232,255,0.55) 0%, transparent 65%)," +
              "radial-gradient(ellipse 40% 45% at 100% 100%, rgba(221,214,254,0.35) 0%, transparent 60%)",
          }}
        />
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease }}
            className="mb-14"
          >
            <div className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5">
              <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }}
                className="h-1.5 w-1.5 rounded-full bg-violet-500" />
              <span className="text-[0.65rem] font-semibold tracking-wide text-violet-600">In the Lab</span>
            </div>
            <h2 className="font-display mb-4 text-[#1A0A3C]"
              style={{ fontSize: "clamp(2.2rem, 3.6vw, 3.2rem)", lineHeight: 1.08, letterSpacing: "-0.024em", fontWeight: 300 }}>
              We&rsquo;re just getting started.
            </h2>
            <p className="max-w-[50ch] text-[0.9375rem] leading-[1.82] text-violet-900/45">
              The novel is the most complex form of writing there is. We&rsquo;re building everything it demands.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {LAB_ITEMS.map((item, i) => (
              <motion.div key={item.name}
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.14 + i * 0.09, duration: 0.62, ease }}
                className="group relative overflow-hidden rounded-2xl border border-violet-100/70 bg-violet-50/40 p-5 transition-all duration-300 hover:bg-violet-50/80 hover:border-violet-200/70 hover:shadow-[0_4px_20px_rgba(109,40,217,0.06)]"
              >
                <div className="mb-4 flex items-start justify-between gap-2">
                  <span className="text-[1.15rem] text-violet-500">{item.icon}</span>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.56rem] font-semibold ${item.hot ? "border border-violet-200 bg-violet-100 text-violet-600" : "border border-stone-200 bg-stone-50 text-stone-400"}`}>
                    {item.badge}
                  </span>
                </div>
                <p className="mb-1.5 text-[0.83rem] font-semibold text-[#1A0A3C]">{item.name}</p>
                <p className="text-[0.75rem] leading-[1.72] text-violet-900/45">{item.desc}</p>
              </motion.div>
            ))}
          </div>
          <motion.p
            initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.9, duration: 0.6 }}
            className="mt-10 text-[0.75rem] text-violet-900/25"
          >
            Features ship to beta users first. Join the waitlist to get early access.
          </motion.p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Intro section
// ─────────────────────────────────────────────────────────────────────────────

function IntroSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div ref={ref} className="relative flex min-h-[75vh] items-center justify-center overflow-hidden px-6 py-28 text-center lg:px-10">

      {/* Dot grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(124,58,237,0.15) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-[860px]">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease }}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-violet-300/40 bg-white/60 px-4 py-1.5 shadow-sm backdrop-blur-md"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
          <span className="text-[0.67rem] font-semibold tracking-wide text-violet-600">The Full Arsenal</span>
        </motion.div>

        <div className="overflow-hidden">
          <motion.h2
            initial={{ y: "108%" }}
            animate={inView ? { y: "0%" } : {}}
            transition={{ delay: 0.06, duration: 0.88, ease }}
            className="font-display text-[#1A0A3C]"
            style={{ fontSize: "clamp(3rem, 5.8vw, 5.6rem)", lineHeight: 0.96, letterSpacing: "-0.032em", fontWeight: 300 }}
          >
            Built for novelists.
          </motion.h2>
        </div>

        <div className="overflow-hidden">
          <motion.h2
            initial={{ y: "108%" }}
            animate={inView ? { y: "0%" } : {}}
            transition={{ delay: 0.14, duration: 0.88, ease }}
            className="font-display"
            style={{ fontSize: "clamp(3rem, 5.8vw, 5.6rem)", lineHeight: 0.96, letterSpacing: "-0.032em", fontWeight: 300, ...violetGrad }}
          >
            Not just a chatbot.
          </motion.h2>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.34, duration: 0.75, ease }}
          className="mx-auto mt-9 max-w-[46ch] text-[1rem] leading-[1.9] text-violet-900/48"
        >
          Every feature designed around one truth: writing a novel is not the same as writing anything else.
        </motion.p>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="mt-14 flex flex-col items-center gap-2"
        >
          <span className="text-[0.58rem] font-bold uppercase tracking-[0.22em] text-violet-400/45">
            scroll to explore
          </span>
          <motion.div
            animate={{ opacity: [0.25, 0.65, 0.25], y: [0, 5, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            className="h-10 w-px rounded-full bg-gradient-to-b from-violet-500/45 to-transparent"
          />
        </motion.div>
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

export default function FeaturesShowcase() {
  return (
    <div id="features" className="relative bg-[#DDD6FE]">
      <IntroSection />

      {/* Stacking section — darker bg peeks through when cards scale back */}
      <div className="relative bg-[#3B0764]">
        {CHAPTERS.map((chapter, i) => (
          <FeatureChapter
            key={chapter.num}
            chapter={chapter}
            index={i}
            total={CHAPTERS.length}
            reverse={i % 2 !== 0}
          />
        ))}
      </div>

      <LabTeaser />
    </div>
  );
}
