"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

const CANVAS_TEXT = "The corridor was dark. Nadia reached out, her fingers ";
const GHOST_TEXT  = "brushing cold stone as the vault door swung open.";

// Phases:
// 0 — blank
// 1 — typing canvas text
// 2 — Ctrl+K badge
// 3 — Alex remembers panel populates
// 4 — ghost suggestion + voice match bar
// 5 — accepted

const CONTEXT_ITEMS = [
  { icon: "◉", label: "Nadia Voronova", detail: "cautious · distrustful of authority" },
  { icon: "◈", label: "The Glass Meridian", detail: "vault of forbidden texts beneath the Senate" },
  { icon: "◎", label: "Thread: Ch. 2 tension", detail: "she knows Marcus was at the warehouse" },
];

function BlinkCursor() {
  return (
    <motion.span
      animate={{ opacity: [1, 0, 1] }}
      transition={{ duration: 0.85, repeat: Infinity }}
      className="ml-[1px] inline-block h-[13px] w-[2px] translate-y-[1px] rounded-sm bg-stone-600"
    />
  );
}

export default function StudioMockup() {
  const [cycle, setCycle] = useState(0);
  const [chars, setChars]  = useState(0);
  const [phase, setPhase]  = useState(0);

  useEffect(() => {
    setChars(0);
    setPhase(0);

    const ts: ReturnType<typeof setTimeout>[] = [];
    let iv: ReturnType<typeof setInterval> | null = null;

    const after = (ms: number, fn: () => void) => {
      const t = setTimeout(fn, ms);
      ts.push(t);
    };

    after(500, () => {
      setPhase(1);
      let i = 0;
      iv = setInterval(() => {
        i++;
        setChars(i);
        if (i >= CANVAS_TEXT.length) {
          if (iv) clearInterval(iv);
          iv = null;
        }
      }, 34);
    });

    after(2600, () => setPhase(2)); // Ctrl+K
    after(3300, () => setPhase(3)); // Alex remembers
    after(5200, () => setPhase(4)); // ghost + voice match
    after(7000, () => setPhase(5)); // accepted
    after(12000, () => setCycle(c => c + 1)); // loop

    return () => {
      ts.forEach(clearTimeout);
      if (iv) clearInterval(iv);
    };
  }, [cycle]);

  const wordCount =
    phase >= 5
      ? (CANVAS_TEXT + GHOST_TEXT).trim().split(/\s+/).length
      : CANVAS_TEXT.slice(0, chars).trim().split(/\s+/).filter(Boolean).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45, duration: 0.85, ease }}
      className="w-full overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-[0_4px_6px_-1px_rgba(0,0,0,0.06),0_24px_56px_-8px_rgba(0,0,0,0.14)]"
    >
      {/* ── Title bar ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3 border-b border-black/[0.06] bg-stone-50/90 px-4 py-2.5">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
        </div>
        <span className="flex-1 text-center font-mono text-[0.58rem] tracking-wide text-stone-400">
          Chapter 3 · The Glass Meridian
        </span>
        <span className="font-mono text-[0.55rem] text-stone-300">{wordCount}w</span>
      </div>

      {/* ── Two-panel body ────────────────────────────────────── */}
      <div className="flex min-h-[280px]">

        {/* ── Writing canvas ── */}
        <div className="relative flex-1 px-7 py-5">
          <div className="mb-3.5 text-[0.52rem] font-semibold uppercase tracking-[0.24em] text-stone-300">
            Writing canvas
          </div>

          <p className="font-serif text-[0.82rem] leading-[2] text-stone-700">
            {CANVAS_TEXT.slice(0, chars)}
            {(phase === 1 || phase === 2) && <BlinkCursor />}
            {phase === 4 && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.55 }}
                className="text-violet-400/60"
              >
                {GHOST_TEXT}
              </motion.span>
            )}
            {phase >= 5 && <span>{GHOST_TEXT}</span>}
          </p>

          {/* Ctrl+K badge */}
          <AnimatePresence>
            {phase === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                transition={{ duration: 0.22 }}
                className="mt-5 flex items-center gap-2"
              >
                <kbd className="inline-flex items-center rounded border border-stone-200 bg-stone-100 px-2 py-0.5 font-mono text-[0.58rem] font-semibold text-stone-600 shadow-sm">
                  Ctrl+K
                </kbd>
                <span className="text-[0.57rem] text-stone-400">ask Alex to continue</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Voice match + Tab to accept */}
          <AnimatePresence>
            {phase === 4 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.35, duration: 0.4 }}
                className="mt-4 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[0.56rem] text-stone-400">Voice match</span>
                  <div className="h-1 w-20 overflow-hidden rounded-full bg-stone-100">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "94%" }}
                      transition={{ delay: 0.55, duration: 0.7, ease: "easeOut" }}
                      className="h-full rounded-full bg-violet-500"
                    />
                  </div>
                  <span className="text-[0.56rem] font-semibold text-violet-600">94%</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="inline-flex items-center rounded border border-violet-200 bg-violet-50 px-2 py-0.5 font-mono text-[0.58rem] font-semibold text-violet-600 shadow-sm">
                    Tab
                  </kbd>
                  <span className="text-[0.57rem] text-stone-400">to accept</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Accepted */}
          <AnimatePresence>
            {phase >= 5 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="mt-4 flex items-center gap-1.5"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-[0.57rem] text-stone-400">Accepted · written in your voice</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Alex panel ── */}
        <div className="flex w-[192px] shrink-0 flex-col border-l border-black/[0.06] bg-stone-50/70">

          {/* Header */}
          <div className="flex items-center gap-2 border-b border-black/[0.06] px-3 py-2.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-100 text-[0.52rem] font-bold text-violet-700">
              A
            </div>
            <span className="text-[0.64rem] font-semibold text-stone-700">Alex remembers</span>
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2.4, repeat: Infinity }}
              className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400"
            />
          </div>

          <div className="flex flex-1 flex-col p-3">

            {/* Idle */}
            {phase < 3 && (
              <motion.p
                animate={{ opacity: phase >= 1 ? 0.45 : 0 }}
                transition={{ duration: 0.6 }}
                className="mt-4 text-center text-[0.57rem] leading-[1.65] text-stone-400"
              >
                Reading your manuscript…
              </motion.p>
            )}

            {/* Context items */}
            {phase >= 3 && (
              <div className="flex flex-col gap-2.5">
                {CONTEXT_ITEMS.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.26, duration: 0.35, ease }}
                  >
                    <div className="flex items-start gap-1.5">
                      <span className="mt-[1px] text-[0.54rem] text-violet-500">{item.icon}</span>
                      <div>
                        <p className="text-[0.6rem] font-semibold text-stone-700">{item.label}</p>
                        <p className="text-[0.55rem] leading-[1.6] text-stone-400">{item.detail}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Suggestion preview */}
                <AnimatePresence>
                  {phase >= 4 && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className="mt-1 rounded-lg border border-violet-100 bg-violet-50/80 px-2.5 py-2"
                    >
                      <p className="text-[0.56rem] font-semibold text-violet-700">Suggested in your voice</p>
                      <p className="mt-0.5 font-serif text-[0.57rem] italic leading-[1.6] text-violet-500/80">
                        &ldquo;brushing cold stone as the vault door swung open.&rdquo;
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── Status bar ────────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 border-t border-black/[0.05] bg-stone-50/80 px-4 py-1.5">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="h-1 w-1 rounded-full bg-violet-500"
        />
        <span className="text-[0.53rem] text-stone-400">Auto-saved · World Board updating</span>
        <span className="ml-auto text-[0.53rem] text-stone-300">Xvault Studio</span>
      </div>
    </motion.div>
  );
}
