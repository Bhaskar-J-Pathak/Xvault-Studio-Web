"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

const CANVAS_TEXT  = "The corridor was dark. Nadia reached out, her fingers ";
const GHOST_TEXT   = "brushing cold stone as the vault door swung open.";
const FULL_TEXT    = CANVAS_TEXT + GHOST_TEXT;

// Phases
// 0 — blank
// 1 — typing canvas text
// 2 — Ctrl+K badge shown
// 3 — ghost suggestion visible
// 4 — ghost accepted, text solid
// 5 — Alex question sent
// 6 — Alex typing dots
// 7 — Alex answer visible

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

    // Start typing at 500ms
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
      }, 34); // 34ms/char → ~1836ms to finish
    });

    // 500 + 1836 + 200 buffer ≈ 2536 → use 2600
    after(2600, () => setPhase(2)); // Ctrl+K
    after(3200, () => setPhase(3)); // ghost suggestion
    after(4600, () => setPhase(4)); // accept
    after(5900, () => setPhase(5)); // Alex question
    after(6500, () => setPhase(6)); // Alex typing
    after(8300, () => setPhase(7)); // Alex answer
    after(13000, () => setCycle(c => c + 1)); // loop

    return () => {
      ts.forEach(clearTimeout);
      if (iv) clearInterval(iv);
    };
  }, [cycle]);

  const wordCount =
    phase >= 4
      ? FULL_TEXT.trim().split(/\s+/).length
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
        <span className="font-mono text-[0.55rem] text-stone-300">
          {wordCount}w
        </span>
      </div>

      {/* ── Two-panel body ────────────────────────────────────── */}
      <div className="flex min-h-[268px]">

        {/* ── Writing canvas ── */}
        <div className="relative flex-1 px-7 py-5">
          <div className="mb-3.5 text-[0.52rem] font-semibold uppercase tracking-[0.24em] text-stone-300">
            Writing canvas
          </div>

          <p className="font-serif text-[0.82rem] leading-[2] text-stone-700">
            {CANVAS_TEXT.slice(0, chars)}
            {(phase === 1 || phase === 2) && <BlinkCursor />}
            {phase === 3 && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.55 }}
                className="text-violet-400/55"
              >
                {GHOST_TEXT}
              </motion.span>
            )}
            {phase >= 4 && <span>{GHOST_TEXT}</span>}
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
                <span className="text-[0.57rem] text-stone-400">inline ghost suggestion</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tab to accept */}
          <AnimatePresence>
            {phase === 3 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.5, duration: 0.3 }}
                className="mt-5 flex items-center gap-2"
              >
                <kbd className="inline-flex items-center rounded border border-violet-200 bg-violet-50 px-2 py-0.5 font-mono text-[0.58rem] font-semibold text-violet-600 shadow-sm">
                  Tab
                </kbd>
                <span className="text-[0.57rem] text-stone-400">to accept</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Accepted */}
          <AnimatePresence>
            {phase === 4 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-5 flex items-center gap-1.5"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-[0.57rem] text-stone-400">Suggestion accepted</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Alex panel ── */}
        <div className="flex w-[178px] shrink-0 flex-col border-l border-black/[0.06] bg-stone-50/70">

          {/* Alex header */}
          <div className="flex items-center gap-2 border-b border-black/[0.06] px-3 py-2.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-100 text-[0.52rem] font-bold text-violet-700">
              A
            </div>
            <span className="text-[0.64rem] font-semibold text-stone-700">Alex</span>
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2.4, repeat: Infinity }}
              className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400"
            />
          </div>

          <div className="flex flex-1 flex-col gap-2 p-3">

            {/* Idle hint */}
            {phase < 5 && (
              <motion.p
                animate={{ opacity: phase >= 1 ? 0.5 : 0 }}
                transition={{ duration: 0.6 }}
                className="mt-4 text-center text-[0.57rem] leading-[1.65] text-stone-400"
              >
                Ask anything about your story
              </motion.p>
            )}

            {/* User question */}
            <AnimatePresence>
              {phase >= 5 && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease }}
                  className="ml-auto w-fit max-w-full rounded-xl rounded-tr-sm bg-stone-900 px-2.5 py-1.5"
                >
                  <p className="text-[0.57rem] leading-[1.65] text-white">
                    What&apos;s really going on between Nadia and Marcus?
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Typing dots */}
            <AnimatePresence>
              {phase === 6 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-1.5"
                >
                  <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[0.48rem] font-bold text-violet-700">
                    A
                  </div>
                  <div className="flex items-center gap-1 rounded-xl rounded-tl-sm bg-white px-2.5 py-2 shadow-sm">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2 }}
                        className="h-1 w-1 rounded-full bg-stone-400"
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Alex answer */}
            <AnimatePresence>
              {phase === 7 && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease }}
                  className="flex items-start gap-1.5"
                >
                  <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[0.48rem] font-bold text-violet-700">
                    A
                  </div>
                  <div className="rounded-xl rounded-tl-sm bg-white px-2.5 py-2 shadow-sm">
                    <p className="text-[0.57rem] leading-[1.72] text-stone-600">
                      It&apos;s complicated. In Ch.2 you planted real tension — she knows he was at the warehouse, but hasn&apos;t confronted him. Thread 1 is still open.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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
        <span className="text-[0.53rem] text-stone-400">
          Auto-saved · World Board updating
        </span>
        <span className="ml-auto text-[0.53rem] text-stone-300">Xvault Studio</span>
      </div>
    </motion.div>
  );
}
