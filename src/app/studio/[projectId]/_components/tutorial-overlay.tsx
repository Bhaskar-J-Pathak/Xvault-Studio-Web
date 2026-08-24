"use client";

/**
 * TutorialOverlay — lightweight 5-step feature tour for new users.
 *
 * Steps:
 *  0 → on mount, immediately syncs to step 1 then shows step 1 card
 *  1 — Co-author intro
 *  2 — Ctrl+K / ✦ ghostwriter
 *  3 — Global Change
 *  4 — World Board
 *  5 — Story Bible → on Done: done=true, step=9
 *  9 — Complete (hidden)
 *
 * Desktop: fixed bottom-left card, 300 px wide, non-blocking.
 * Mobile:  same card but higher up (above FABs), narrower text, touch-friendly copy.
 * No spotlight rings. No dragging. All manual (except step-0 auto-advance).
 */

import { useState, useEffect, useRef } from "react";
import { usePostHog } from "posthog-js/react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  projectId: string;
  initialStep: number;
  initialDone: boolean;
}

interface StepContent {
  icon: string;
  title: string;
  body: string;
}

// ── Step content ──────────────────────────────────────────────────────────────

const STEPS_DESKTOP: Record<number, StepContent> = {
  1: {
    icon: "💬",
    title: "Meet Alex, your co-author",
    body: "Alex has read everything you've written. Ask questions, get feedback, or brainstorm ideas in the chat panel on the right.",
  },
  2: {
    icon: "⌨️",
    title: "Press Ctrl+K to generate prose",
    body: "Click anywhere in the editor and press Ctrl+K. Give Alex an instruction and it writes directly at your cursor. Tab to accept, Esc to dismiss.",
  },
  3: {
    icon: "🔄",
    title: "Rename or change anything manuscript-wide",
    body: "In the chat, tell Alex to \"rename Marcus to Viktor everywhere\" or change any detail across all chapters. Alex shows you a diff before touching anything.",
  },
  4: {
    icon: "🌍",
    title: "Your World Board builds itself",
    body: "As you write, Alex automatically extracts characters, locations, and plot threads. Find it in the sidebar. No tagging needed.",
  },
  5: {
    icon: "📖",
    title: "Story Bible = Alex's memory",
    body: "Add your genre, style notes, and character details in the Story Bible. The more you fill in, the better Alex writes in your voice.",
  },
};

const STEPS_MOBILE: Record<number, StepContent> = {
  1: {
    icon: "💬",
    title: "Meet Alex, your co-author",
    body: "Alex has read everything you've written. Tap the chat bubble at the bottom-right to ask questions, get feedback, or brainstorm.",
  },
  2: {
    icon: "✦",
    title: "Tap ✦ to generate prose",
    body: "Tap the ✦ button above the chat bubble, give Alex an instruction, and it writes directly into your story. Tap Insert to accept.",
  },
  3: {
    icon: "🔄",
    title: "Rename or change anything manuscript-wide",
    body: "In the chat, tell Alex to \"rename Marcus to Viktor everywhere\" or change any detail across all chapters. Alex shows you a diff before touching anything.",
  },
  4: {
    icon: "🌍",
    title: "Your World Board builds itself",
    body: "As you write, Alex automatically extracts characters, locations, and plot threads. Tap the menu icon (top-left) → World Board.",
  },
  5: {
    icon: "📖",
    title: "Story Bible = Alex's memory",
    body: "Add your genre, style notes, and character details in the Story Bible. Tap the menu icon (top-left) → Story Bible.",
  },
};

const TOTAL_STEPS = 5;

// ── DB sync ───────────────────────────────────────────────────────────────────

async function syncStep(step: number, done = false) {
  try {
    await fetch("/api/user/onboarding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step, ...(done ? { done: true } : {}) }),
    });
  } catch { /* non-critical */ }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TutorialOverlay({ initialStep, initialDone }: Props) {
  const ph = usePostHog();

  const [step, setStep]       = useState(initialStep);
  const [done, setDone]       = useState(initialDone);
  const [open, setOpen]       = useState(false);
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const advanceRef            = useRef(false);

  // Detect mobile after mount (avoids SSR mismatch)
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  // Step 0: advance to step 1 in DB (mark tour started) but don't auto-open
  useEffect(() => {
    if (step !== 0 || done) return;
    syncStep(1).then(() => setStep(1));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fade-in animation when overlay opens or step changes
  useEffect(() => {
    if (!open || done || step === 0 || step >= 9) return;
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, [open, step, done]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function handleNext() {
    if (advanceRef.current) return;
    advanceRef.current = true;

    if (step >= TOTAL_STEPS) {
      ph?.capture("tutorial_completed", { action: "done" });
      setDone(true);
      setOpen(false);
      await syncStep(9, true);
    } else {
      const next = step + 1;
      ph?.capture("tutorial_step_reached", { step: next, from_step: step });
      setStep(next);
      await syncStep(next);
    }

    advanceRef.current = false;
  }

  async function handleSkip() {
    if (advanceRef.current) return;
    advanceRef.current = true;
    ph?.capture("tutorial_skipped", { at_step: step });
    setDone(true);
    setOpen(false);
    await syncStep(9, true);
    advanceRef.current = false;
  }

  // ── "?" help button (always visible) ────────────────────────────────────────

  const helpButton = (
    <button
      onClick={() => setOpen((v) => !v)}
      aria-label="Open feature tour"
      className="fixed z-[99] bottom-6 left-6 w-8 h-8 rounded-full bg-white dark:bg-[#1a1829] border border-black/[0.08] dark:border-white/[0.08] shadow-sm flex items-center justify-center text-[13px] font-semibold text-[#A1A1AA] dark:text-white/30 hover:text-[#71717A] dark:hover:text-white/60 transition-colors opacity-60 hover:opacity-100"
    >
      ?
    </button>
  );

  // ── Render ───────────────────────────────────────────────────────────────────

  // Once the tour is fully done, render nothing
  if (done) return null;

  const steps = isMobile ? STEPS_MOBILE : STEPS_DESKTOP;
  const currentStep = step === 0 ? 1 : step;
  const content = steps[currentStep];

  if (!content || currentStep >= 9) return helpButton;

  const isFinal = currentStep === TOTAL_STEPS;

  if (!open) return helpButton;

  return (
    <>
      {helpButton}
      <div
        className={`fixed z-[100] transition-all duration-300 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
        } ${
          isMobile
            ? "bottom-[5.5rem] left-3 right-3"
            : "bottom-16 left-6 w-[300px]"
        }`}
      >
        <div className="bg-white dark:bg-[#1a1829] rounded-2xl shadow-2xl border border-black/[0.08] dark:border-white/[0.08] overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-3.5 pb-0">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#1A1A1A]/30 dark:text-white/25">
              Getting started · {currentStep}/{TOTAL_STEPS}
            </span>
            <button
              onClick={handleSkip}
              className="text-[11px] text-[#A1A1AA] dark:text-white/30 hover:text-[#71717A] dark:hover:text-white/60 transition-colors"
            >
              Skip
            </button>
          </div>

          {/* Body */}
          <div className="px-4 pt-3 pb-4">
            <div className="text-xl mb-2">{content.icon}</div>
            <h3 className="text-sm font-semibold text-[#0F0F0F] dark:text-[#EDEBF0] tracking-tight leading-snug mb-1.5">
              {content.title}
            </h3>
            <p className="text-[12px] text-[#71717A] dark:text-white/45 leading-relaxed">
              {content.body}
            </p>
          </div>

          {/* Footer */}
          <div className="px-4 pb-4">
            <button
              onClick={handleNext}
              className="w-full py-2.5 rounded-xl bg-[#0F0F0F] dark:bg-violet-600 text-white text-[12px] font-semibold hover:bg-[#2A2A2A] dark:hover:bg-violet-500 transition-colors"
            >
              {isFinal ? "Done ✓" : "Next →"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
