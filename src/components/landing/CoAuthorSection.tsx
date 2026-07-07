"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];
const CYCLE_MS = 4500;

const MODES = [
  {
    id: "brainstorm",
    label: "Brainstorm",
    body: "Stuck on a scene? Character motivation not landing? Ask and get story-smart ideas grounded in what you've actually written.",
  },
  {
    id: "beta",
    label: "Beta Reader",
    body: "Honest, specific feedback on pacing, character arcs, and emotional beats — before anyone else reads a word.",
  },
  {
    id: "editor",
    label: "Line Editor",
    body: "Tighten prose, cut filler, strengthen verbs. Inline suggestions that make every sentence earn its place.",
  },
  {
    id: "continuity",
    label: "Continuity",
    body: "Catches what you miss at 2am. Character details, timeline gaps, world inconsistencies flagged across every chapter.",
  },
];

// ── Brainstorm Panel ───────────────────────────────────────────────────────────
function BrainstormPanel() {
  const ideas = [
    "Marcus protects her secret before she even knew he could. No explanation — just action.",
    "They work through something mundane together. She sees how he handles pressure. Evidence, not promises.",
    "He tells her something that makes him more vulnerable, not less dangerous.",
  ];
  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="rounded-xl bg-violet-50 px-4 py-3">
        <p className="mb-1 text-[0.62rem] font-semibold uppercase tracking-widest text-violet-400">You asked</p>
        <p className="text-[0.84rem] leading-relaxed text-[#1A0A3C]/70">
          "Nadia needs a reason to trust Marcus. It can't feel forced."
        </p>
      </div>
      <div className="flex flex-col gap-2.5">
        {ideas.map((idea, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.18, duration: 0.42, ease }}
            className="flex items-start gap-3"
          >
            <span className="mt-[3px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-violet-100 text-[0.58rem] font-bold text-violet-600">
              {i + 1}
            </span>
            <p className="text-[0.82rem] leading-[1.7] text-violet-900/65">{idea}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Beta Reader Panel ──────────────────────────────────────────────────────────
function BetaReaderPanel() {
  const notes = [
    { label: "Pacing", text: "The vault scene moves too fast. The tension from Ch. 6 deserves more room here." },
    { label: "Character", text: "Nadia feels reactive. What does she actually want in this moment?" },
    { label: "Hook", text: "Your final line is doing heavy lifting. Pull it into its own paragraph." },
  ];
  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="rounded-xl border border-violet-100 bg-violet-50/50 px-4 py-3">
        <p className="font-serif text-[0.8rem] italic leading-[1.85] text-violet-900/50">
          "The corridor was dark. Nadia reached out, her fingers brushing cold stone as the vault door swung open. Marcus was already inside."
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {notes.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + i * 0.15, duration: 0.4, ease }}
            className="flex items-start gap-2.5 rounded-lg bg-violet-50 px-3 py-2.5"
          >
            <span className="mt-[1px] shrink-0 rounded bg-violet-100 px-1.5 py-0.5 text-[0.58rem] font-semibold text-violet-600">
              {item.label}
            </span>
            <p className="text-[0.78rem] leading-[1.65] text-violet-900/60">{item.text}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Line Editor Panel ──────────────────────────────────────────────────────────
function EditorPanel() {
  const tags = ["passive → active", "tighter motion", "one beat"];
  return (
    <div className="flex h-full flex-col justify-center gap-5 p-6">
      <div>
        <p className="mb-2 text-[0.6rem] font-semibold uppercase tracking-widest text-violet-900/30">Before</p>
        <p className="rounded-lg bg-violet-50 px-4 py-3 font-serif text-[0.84rem] leading-[1.85] text-violet-900/30 line-through decoration-violet-300/60">
          She moved to the door quickly and then she opened it.
        </p>
      </div>
      <div>
        <p className="mb-2 text-[0.6rem] font-semibold uppercase tracking-widest text-violet-600">After</p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.55 }}
          className="rounded-lg border border-violet-300/40 bg-violet-50 px-4 py-3 font-serif text-[0.84rem] leading-[1.85] text-[#1A0A3C]"
        >
          She crossed to the door in three strides and threw it open.
        </motion.p>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="flex flex-wrap gap-2"
      >
        {tags.map((tag) => (
          <span key={tag} className="rounded-full bg-violet-100/70 px-3 py-1 text-[0.64rem] text-violet-600">
            {tag}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ── Continuity Panel ───────────────────────────────────────────────────────────
function ContinuityPanel() {
  const refs = [
    { ch: "Chapter 3, p. 34", quote: '"The vault key hangs on a red lanyard around her neck."' },
    { ch: "Chapter 11, p. 156", quote: '"She searched her coat pocket for the key."' },
  ];
  return (
    <div className="flex h-full flex-col gap-3 p-6">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="flex items-center gap-2.5 rounded-lg border border-amber-300/40 bg-amber-50 px-3 py-2.5"
      >
        <span className="text-[0.9rem] text-amber-500">⚠</span>
        <p className="text-[0.72rem] font-semibold text-amber-600">Inconsistency detected · Ch. 3 vs Ch. 11</p>
      </motion.div>
      <div className="flex flex-col gap-2">
        {refs.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.16, duration: 0.4, ease }}
            className="rounded-lg bg-violet-50 px-3 py-2.5"
          >
            <p className="mb-1 text-[0.6rem] font-semibold text-violet-400">{item.ch}</p>
            <p className="font-serif text-[0.8rem] italic leading-[1.65] text-violet-900/65">{item.quote}</p>
          </motion.div>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.65, duration: 0.4 }}
        className="rounded-lg bg-violet-50/50 px-3 py-2.5"
      >
        <p className="text-[0.74rem] leading-[1.6] text-violet-900/55">
          <span className="font-semibold text-violet-600">Resolve:</span> Was the lanyard lost or stolen — or is this a continuity error?
        </p>
      </motion.div>
    </div>
  );
}

const PANELS: Record<string, React.FC> = {
  brainstorm: BrainstormPanel,
  beta:       BetaReaderPanel,
  editor:     EditorPanel,
  continuity: ContinuityPanel,
};

// ── Main Section ───────────────────────────────────────────────────────────────
export default function CoAuthorSection() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => {
    setActive((i) => (i + 1) % MODES.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, CYCLE_MS);
    return () => clearInterval(id);
  }, [paused, next]);

  const mode = MODES[active];
  const Panel = PANELS[mode.id];

  return (
    <section className="bg-[#EDE8FF] py-24 lg:py-32">
      <div className="mx-auto max-w-[1080px] px-6 lg:px-10">

        {/* Centered header */}
        <div className="mx-auto mb-12 max-w-[540px] text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease }}
            className="mb-5 flex justify-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-4 py-1.5">
              <motion.span
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2.2, repeat: Infinity }}
                className="h-1.5 w-1.5 rounded-full bg-violet-500"
              />
              <span className="text-[0.67rem] font-semibold tracking-wide text-violet-600">
                Meet Alex — your AI co-author
              </span>
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08, duration: 0.6, ease }}
            className="font-display text-[#1A0A3C]"
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.1, letterSpacing: "-0.025em", fontWeight: 300 }}
          >
            A co-author who actually knows your story.
          </motion.h2>

          {/* Animated mode description */}
          <div className="mt-4 h-12 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={mode.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease }}
                className="text-[0.9375rem] leading-[1.7] text-violet-900/50"
              >
                {mode.body}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        {/* Mode tabs — centered */}
        <div
          className="mb-6 flex flex-wrap justify-center gap-2"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {MODES.map((m, i) => (
            <button
              key={m.id}
              onClick={() => setActive(i)}
              className={`rounded-full px-5 py-2 text-[0.8rem] font-medium transition-all duration-300 ${
                i === active
                  ? "bg-violet-600 text-white shadow-[0_0_16px_rgba(124,58,237,0.30)]"
                  : "bg-white text-violet-900/50 shadow-sm hover:text-violet-900"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* White panel — centered */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.65, ease }}
          className="mx-auto max-w-[680px]"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="overflow-hidden rounded-2xl border border-violet-200/60 bg-white shadow-[0_8px_48px_rgba(109,40,217,0.10)]">

            {/* Title bar */}
            <div className="flex items-center gap-3 border-b border-violet-100 bg-violet-50/60 px-5 py-3">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-violet-200" />
                <div className="h-2.5 w-2.5 rounded-full bg-violet-200" />
                <div className="h-2.5 w-2.5 rounded-full bg-violet-200" />
              </div>
              <AnimatePresence mode="wait">
                <motion.span
                  key={mode.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex-1 text-center font-mono text-[0.6rem] tracking-widest text-violet-400"
                >
                  Alex · {mode.label}
                </motion.span>
              </AnimatePresence>
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2.4, repeat: Infinity }}
                className="h-1.5 w-1.5 rounded-full bg-emerald-500"
              />
            </div>

            {/* Panel content */}
            <div className="min-h-[280px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={mode.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35, ease }}
                  className="h-full"
                >
                  <Panel />
                </motion.div>
              </AnimatePresence>
            </div>

          </div>
        </motion.div>

        {/* Progress dots — centered */}
        <div className="mt-6 flex justify-center gap-1.5">
          {MODES.map((_, i) => (
            <div
              key={i}
              className={`h-[3px] rounded-full transition-all duration-500 ${
                i === active ? "w-6 bg-violet-500" : "w-3 bg-violet-900/15"
              }`}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
