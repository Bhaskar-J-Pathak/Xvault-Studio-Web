"use client";

/**
 * TutorialOverlay — interactive 8-step guide for new users.
 *
 * Steps:
 *  1 — Welcome
 *  2 — Editor (auto-advance: click)
 *  3 — Ask Alex (auto-advance: response received)
 *  4 — Ctrl+K ghostwriter (auto-advance: suggestion accepted/dismissed)
 *  5 — Global Change (manual advance — explain the flagship feature)
 *  6 — Full Story Bible page (content-aware: editor vs. bible page)
 *  7 — World Board
 *  8 — Done / CTA
 *
 * Design principles:
 * - NEVER blocks interaction. No dark backdrop with pointer-events.
 * - Guide card is draggable by the header grip.
 * - Steps 2-4 auto-advance when the user performs the real action.
 * - Every step has a manual Skip so users are never stuck.
 * - All hooks run before any conditional returns (React rules compliance).
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ArrowRight, GripHorizontal } from "lucide-react";
import { usePostHog } from "posthog-js/react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TargetRect {
  top: number; left: number; width: number; height: number;
}
interface DragPos { x: number; y: number; }

interface Props {
  projectId: string;
  initialStep: number;
  initialDone: boolean;
  editorFocused?: boolean;
  chatResponseReceived?: boolean;
  commandBarOpen?: boolean;
  ghostSuggestion?: string | null;
  ghostLoading?: boolean;
  onExpandCoauthor?: () => void;
}

// ── Step target IDs ────────────────────────────────────────────────────────────

const STEP_TARGET_ID: Record<number, string | null> = {
  1: null,
  2: "tutorial-editor",
  3: "tutorial-coauthor",
  4: "tutorial-editor",
  5: "tutorial-coauthor",
  6: "tutorial-bible-link",
  7: "tutorial-worldboard-link",
  8: null,
};

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

// ── Main component ────────────────────────────────────────────────────────────

export default function TutorialOverlay({
  projectId,
  initialStep,
  initialDone,
  editorFocused = false,
  chatResponseReceived = false,
  ghostSuggestion = null,
  onExpandCoauthor,
}: Props) {
  const router   = useRouter();
  const pathname = usePathname();
  const ph       = usePostHog();

  // ALL hooks first
  const [step, setStep]             = useState(initialStep);
  const [done, setDone]             = useState(initialDone);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [visible, setVisible]       = useState(false);
  const [dragPos, setDragPos]       = useState<DragPos | null>(null);
  const autoTimer                   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advanceInProgress           = useRef(false);
  const cardRef                     = useRef<HTMLDivElement>(null);
  const ghostWasShown               = useRef(false);

  // On the full Story Bible page, step 6 acts as an "explore" step — no
  // navigation needed, so we clear the target highlight ring.
  const onBiblePage     = pathname?.includes("/bible") ?? false;
  const onWorldboardPage = pathname?.includes("/worldboard") ?? false;
  const effectiveTargetId =
    step === 6 && onBiblePage ? null : STEP_TARGET_ID[step] ?? null;

  // Measure target element
  const measureTarget = useCallback(() => {
    if (!effectiveTargetId) { setTargetRect(null); return; }
    const el = document.getElementById(effectiveTargetId);
    if (!el) { setTargetRect(null); return; }
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) { setTargetRect(null); return; }
    setTargetRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [effectiveTargetId]);

  useEffect(() => {
    measureTarget();
    const delayed = setTimeout(measureTarget, 400);
    window.addEventListener("resize", measureTarget);
    return () => { clearTimeout(delayed); window.removeEventListener("resize", measureTarget); };
  }, [measureTarget]);

  // Re-animate on step change
  useEffect(() => { setVisible(false); }, [step]);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, [step]);

  // Step 3: expand co-author; auto-skip if panel never appears
  useEffect(() => {
    if (step !== 3) return;
    if (onExpandCoauthor) onExpandCoauthor();
    const t1 = setTimeout(measureTarget, 350);
    const t2 = setTimeout(() => {
      if (!document.getElementById("tutorial-coauthor")) advance(4);
    }, 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Step 6: if the user is already on the bible page, swap content to "explore" mode
  // (no auto-advance — they click Got it themselves)

  // ── Auto-advance signals ──────────────────────────────────────────────────

  useEffect(() => {
    if (step === 2 && editorFocused) advance(3);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorFocused, step]);

  useEffect(() => {
    if (step === 3 && chatResponseReceived) advance(4);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatResponseReceived, step]);

  // Step 4: advance only after the user has received AND dismissed/accepted a suggestion
  useEffect(() => {
    if (step !== 4) return;
    if (ghostSuggestion) {
      ghostWasShown.current = true;
    } else if (ghostWasShown.current) {
      advance(6);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ghostSuggestion, step]);

  // (Step 5 is Global Change — no auto-advance, user clicks Next manually)

  // ── Drag handling ─────────────────────────────────────────────────────────

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const startMouseX = e.clientX, startMouseY = e.clientY;
    const startCardX  = rect.left,  startCardY  = rect.top;
    const rectWidth   = rect.width;

    function onMove(e: MouseEvent) {
      const cardW = rectWidth;
      const cardH = cardRef.current?.offsetHeight ?? 260;
      setDragPos({
        x: Math.max(8, Math.min(window.innerWidth  - cardW - 8, startCardX + (e.clientX - startMouseX))),
        y: Math.max(8, Math.min(window.innerHeight - cardH - 8, startCardY + (e.clientY - startMouseY))),
      });
    }
    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
  }, []);

  // ── Navigation helpers ────────────────────────────────────────────────────

  async function advance(nextStep: number) {
    if (advanceInProgress.current) return;
    advanceInProgress.current = true;
    ph?.capture("tutorial_step_reached", { step: nextStep, from_step: step });
    setStep(nextStep);
    await syncStep(nextStep);
    advanceInProgress.current = false;
  }

  async function dismiss() { setDone(true); await syncStep(9, true); }

  async function handleStartOwnStory() {
    ph?.capture("tutorial_completed", { action: "start_own_story" });
    setDone(true); await syncStep(9, true); router.push("/dashboard");
  }

  async function handleKeepExploring() {
    ph?.capture("tutorial_completed", { action: "keep_exploring" });
    setDone(true); await syncStep(9, true);
  }

  // ── Early exit — AFTER all hooks ──────────────────────────────────────────
  if (done || step === 0 || step >= 9) return null;
  if (typeof window !== "undefined" && window.innerWidth < 768) return null;

  const content = getStepContent(step, onBiblePage, onWorldboardPage);
  if (!content) return null;

  const cardStyle: React.CSSProperties = dragPos
    ? { top: dragPos.y, left: dragPos.x, width: "min(300px, calc(100vw - 32px))" }
    : { bottom: 80, right: 24, width: "min(300px, calc(100vw - 32px))" };

  return (
    <>
      {/* Pulsing highlight ring */}
      {targetRect && (
        <div
          aria-hidden
          className="fixed z-[99] pointer-events-none"
          style={{
            top:    targetRect.top    - 4,
            left:   targetRect.left   - 4,
            width:  targetRect.width  + 8,
            height: targetRect.height + 8,
            borderRadius: 10,
            boxShadow: "0 0 0 3px rgba(139, 92, 246, 0.7), 0 0 0 6px rgba(139, 92, 246, 0.2)",
            animation: "tutorial-pulse 2s ease-in-out infinite",
          }}
        />
      )}

      {/* Guide card — draggable */}
      <div ref={cardRef} className="fixed z-[100] pointer-events-none" style={cardStyle}>
        <div
          className={`pointer-events-auto bg-white rounded-2xl shadow-2xl border border-black/[0.08] overflow-hidden transition-all duration-300 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          {/* Progress bar */}
          <div className="h-[3px] bg-black/[0.05]">
            <div
              className="h-full bg-violet-500 transition-all duration-500"
              style={{ width: `${(step / 8) * 100}%` }}
            />
          </div>

          {/* Drag handle row */}
          <div
            onMouseDown={handleDragStart}
            className="flex items-center justify-between px-4 pt-3 pb-0 cursor-grab active:cursor-grabbing select-none"
          >
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#1A1A1A]/30">
              Step {step} of 8
            </span>
            <GripHorizontal size={12} className="text-[#1A1A1A]/20" />
          </div>

          <div className="p-4 pt-2">
            <h3 className="text-sm font-semibold text-[#1A1A1A] tracking-tight mb-1.5">
              {content.title}
            </h3>
            <p className="text-xs text-[#1A1A1A]/55 leading-relaxed">
              {content.body}
            </p>

            {content.hint && (
              <div className="mt-2.5 px-3 py-2 bg-violet-50 border border-violet-100 rounded-xl">
                <p className="text-[11px] text-violet-700 font-medium">{content.hint}</p>
              </div>
            )}

            {content.waiting && (
              <div className="mt-2.5 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                <p className="text-[11px] text-[#1A1A1A]/40">{content.waiting}</p>
              </div>
            )}

            <div className="mt-4 flex gap-2">
              {step === 8 ? (
                <div className="flex flex-col gap-2 w-full">
                  <button
                    onClick={handleStartOwnStory}
                    className="w-full py-2 rounded-xl bg-[#1A1A1A] text-white text-xs font-semibold hover:bg-[#2A2A2A] transition-colors"
                  >
                    Start my own story →
                  </button>
                  <button
                    onClick={handleKeepExploring}
                    className="w-full py-2 rounded-xl border border-black/[0.08] text-[#1A1A1A]/55 text-xs font-medium hover:border-black/20 hover:text-[#1A1A1A]/80 transition-colors"
                  >
                    Keep exploring the sample
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => advance(content.nextStep!)}
                  className="flex items-center gap-1.5 ml-auto px-3.5 py-2 rounded-xl bg-[#1A1A1A] text-white text-xs font-semibold hover:bg-[#2A2A2A] transition-colors"
                >
                  {content.ctaLabel ?? "Skip →"}
                  <ArrowRight size={11} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes tutorial-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
      `}</style>
    </>
  );
}

// ── Step content ───────────────────────────────────────────────────────────────

interface StepContent {
  title: string;
  body: string;
  hint?: string;
  waiting?: string;
  ctaLabel?: string;
  nextStep: number;
}

function getStepContent(
  step: number,
  onBiblePage: boolean,
  onWorldboardPage: boolean
): StepContent | null {
  switch (step) {
    case 1:
      return {
        title: "Welcome to your sample project.",
        body: "The Glass Meridian — a thriller across 3 chapters. Your AI co-author Alex has already read all of it. Let's take a quick tour.",
        ctaLabel: "Let's go",
        nextStep: 2,
      };

    case 2:
      return {
        title: "Your editor — click inside to start.",
        body: "Everything auto-saves as you write. Word count is bottom-left. Click anywhere in the story text to continue.",
        hint: "← Click anywhere in the story",
        waiting: "Waiting for you to click in the editor…",
        ctaLabel: "Next →",
        nextStep: 3,
      };

    case 3:
      return {
        title: "Ask Alex something.",
        body: "Alex has read Chapter 1 and left you a note. Type a message in the chat and hit Enter — see what comes back.",
        hint: "Try: \"What do you think of the opening?\"",
        waiting: "Waiting for Alex's reply…",
        ctaLabel: "Next →",
        nextStep: 4,
      };

    case 4:
      return {
        title: "AI ghostwriter — press Ctrl+K.",
        body: "Click anywhere in the text, press Ctrl+K, and give Alex an instruction. Press Tab to accept, Esc to dismiss.",
        hint: "Try: \"What does Nadia find in the diner?\"",
        waiting: "Waiting for you to try it and check the result…",
        ctaLabel: "Next →",
        nextStep: 5,
      };

    case 5:
      return {
        title: "Global Change — rewrite across every chapter.",
        body: "This is the big one. Tell Alex to rename a character, shift a plot detail, or change something about the writing — and it scans every chapter at once, shows you a diff of every planned edit, and waits for your approval before touching anything.",
        hint: "Try in the chat: \"Rename Marcus to Viktor everywhere\"",
        ctaLabel: "Next →",
        nextStep: 6,
      };

    case 6:
      // Context-aware: different content on the bible page vs. the editor
      if (onBiblePage) {
        return {
          title: "This is Alex's brain.",
          body: "Every section feeds your co-author before every reply:\n\n• Braindump — freewrite your premise, themes, anything unformed. Alex reads it raw.\n• Genre — sets the lens Alex uses for suggestions.\n• Style & Voice — prose rhythm, POV, tense. Alex imitates what you describe here.\n• Chapter Summaries — auto-generated; power the Synopsis. Edit them to correct AI drift.\n• Characters & World — hit Analyze on any character to build a deep profile from your manuscript.\n• Plot Threads — open story debts Alex tracks automatically.\n\nThe more you keep this updated, the smarter and more on-voice Alex becomes.",
          hint: "Explore each section, then click Got it.",
          ctaLabel: "Got it",
          nextStep: 7,
        };
      }
      return {
        title: "Full Story Bible — Alex's long-term memory.",
        body: "Click Story Bible in the sidebar. Every section feeds Alex before every reply: braindump, genre, style notes, AI chapter summaries, character profiles, and tracked plot threads. The more you fill it in, the better Alex writes in your voice.",
        hint: "← Click Story Bible in the sidebar",
        waiting: "Waiting for you to open the Story Bible…",
        ctaLabel: "Next →",
        nextStep: 7,
      };

    case 7:
      return {
        title: "World Board — your characters and places.",
        body: "Click World Board in the sidebar. Every character, location, and faction was extracted from the manuscript automatically — no tagging needed. You can edit entities, add relationships, or re-index after big rewrites.",
        hint: onWorldboardPage
          ? "You're here. Explore, then click Got it."
          : "← Click World Board in the sidebar",
        ctaLabel: "Got it",
        nextStep: 8,
      };

    case 8:
      return {
        title: "You're ready to write.",
        body: "14 days, 100 AI credits. Alex is reading everything you write. Your world builds itself. Nothing gets lost.",
        nextStep: 9,
      };

    default:
      return null;
  }
}
