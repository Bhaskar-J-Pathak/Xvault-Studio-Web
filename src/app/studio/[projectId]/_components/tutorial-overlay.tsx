"use client";

/**
 * TutorialOverlay — seven-step feature tour with distinct desktop and mobile
 * copy, targets, and positioning. Mobile story-tool steps guide the reader to
 * open the drawer, then move beside the relevant item so it remains visible.
 */

import { useState, useEffect, useRef } from "react";
import { usePostHog } from "posthog-js/react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  projectId: string;
  initialStep: number;
  initialDone: boolean;
  autoOpen?: boolean;
}

interface StepContent {
  icon: string;
  title: string;
  body: string;
}

// ── Step content ──────────────────────────────────────────────────────────────

const STEPS_DESKTOP: Record<number, StepContent> = {
  1: {
    icon: "🌍",
    title: "Your World Board is building",
    body: "Xvault extracts characters, locations, and relationships from your manuscript automatically. Open World Board in the sidebar to see what it found.",
  },
  2: {
    icon: "✦",
    title: "Write from any cursor",
    body: "Place the cursor where new prose belongs and click Write. Describe what should happen, choose a length, then preview the result before inserting it.",
  },
  3: {
    icon: "💓",
    title: "Follow the emotional story",
    body: "Story Pulse tracks how major characters change from chapter to chapter and shows the manuscript evidence behind each observation.",
  },
  4: {
    icon: "💬",
    title: "Ask Alex about this manuscript",
    body: "Use the co-author panel for feedback, brainstorming, and questions. Alex receives your project context, so you do not need to paste it into a separate chat.",
  },
  5: {
    icon: "📖",
    title: "Story Bible = Alex's memory",
    body: "Add your genre, style notes, and character details in the Story Bible. The more you fill in, the better Alex writes in your voice.",
  },
  6: {
    icon: "⚙️",
    title: "Make the studio comfortable",
    body: "Open Settings to change the reading theme, font, line spacing, and paragraph indentation. Sepia is the starting theme, but the workspace is yours.",
  },
  7: {
    icon: "↗",
    title: "Select prose for more tools",
    body: "Highlight any passage to reveal Continue, Rewrite, and What If. The tools appear beside your selection and never change the manuscript without your approval.",
  },
};

const STEPS_MOBILE: Record<number, StepContent> = {
  1: {
    icon: "🌍",
    title: "World Board builds itself",
    body: "Open the menu, then tap World Board to see extracted characters, places, and relationships.",
  },
  2: {
    icon: "✦",
    title: "Write from the cursor",
    body: "Place the cursor where prose belongs, tap Write, and preview the result before inserting it.",
  },
  3: {
    icon: "💓",
    title: "Follow the emotional story",
    body: "Open the menu, then tap Story Pulse to see character changes and the evidence behind them.",
  },
  4: {
    icon: "💬",
    title: "Alex knows this manuscript",
    body: "Tap the A bubble to set up your co-author, ask questions, brainstorm, or get feedback.",
  },
  5: {
    icon: "📖",
    title: "Give Alex the story's intent",
    body: "Open the menu, then tap Story Bible to add your genre, voice, synopsis, and character details.",
  },
  6: {
    icon: "⚙️",
    title: "Make the page yours",
    body: "Settings controls the theme, font, spacing, paragraph indents, and lets you replay this tour.",
  },
  7: {
    icon: "↗",
    title: "Select text to reshape it",
    body: "Highlight a passage to reveal Continue, Rewrite, and What If. You approve every change.",
  },
};

const DESKTOP_TOTAL_STEPS = 7;
const MOBILE_TOTAL_STEPS = 7;

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

export default function TutorialOverlay({ initialStep, initialDone, autoOpen = false }: Props) {
  const ph = usePostHog();

  const [step, setStep]       = useState(initialStep);
  const [done, setDone]       = useState(initialDone);
  const [open, setOpen]       = useState(autoOpen);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const advanceRef            = useRef(false);
  const autoOpenTrackedRef    = useRef(false);
  const cardRef               = useRef<HTMLDivElement>(null);
  const totalSteps            = isMobile ? MOBILE_TOTAL_STEPS : DESKTOP_TOTAL_STEPS;

  // Point at the real control without blocking it. Mobile story-tool steps use
  // the visible menu button because the sidebar itself starts off-canvas.
  useEffect(() => {
    const card = cardRef.current;
    if (!card || !open || done) return;

    const desktopTargets: Record<number, string> = {
      1: "worldboard",
      2: "write",
      3: "story-pulse",
      4: "coauthor",
      5: "story-bible",
      6: "settings",
      7: "selection-tools",
    };
    const mobileTargets: Record<number, string[]> = {
      1: sidebarOpen ? ["worldboard", "mobile-menu"] : ["mobile-menu"],
      2: ["write"],
      3: sidebarOpen ? ["story-pulse", "mobile-menu"] : ["mobile-menu"],
      4: ["coauthor"],
      5: sidebarOpen ? ["story-bible", "mobile-menu"] : ["mobile-menu"],
      6: ["settings"],
      7: ["selection-tools"],
    };
    const currentStep = Math.min(step === 0 ? 1 : step, totalSteps);
    const targetNames = isMobile ? mobileTargets[currentStep] : [desktopTargets[currentStep]];
    const candidates = targetNames.flatMap(targetName => Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${targetName}"]`)));
    const target = candidates.find((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && rect.right > 0 && rect.left < window.innerWidth;
    });
    if (!target) return;

    const position = () => {
      const rect = target.getBoundingClientRect();
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const viewportTop = window.visualViewport?.offsetTop ?? 0;
      const isSidebarTarget = isMobile && sidebarOpen && [1, 3, 5].includes(currentStep) && target.dataset.tour !== "mobile-menu";
      const availableBesideSidebar = window.innerWidth - rect.right - 20;
      const cardWidth = isSidebarTarget && availableBesideSidebar >= 176
        ? Math.min(208, availableBesideSidebar)
        : isMobile ? Math.min(328, window.innerWidth - 32) : 300;
      card.style.width = `${cardWidth}px`;
      const cardHeight = card.offsetHeight || 260;
      const gap = isMobile ? 12 : 14;
      const left = isSidebarTarget && availableBesideSidebar >= 176
        ? rect.right + 8
        : isMobile
        ? Math.min(window.innerWidth - cardWidth - 12, Math.max(12, rect.left + rect.width / 2 - cardWidth / 2))
        : rect.right + gap + cardWidth < window.innerWidth
          ? rect.right + gap
          : Math.max(16, rect.left - cardWidth - gap);
      const spaceBelow = viewportTop + viewportHeight - rect.bottom - gap;
      const top = isMobile
        ? isSidebarTarget && availableBesideSidebar < 176
          ? Math.max(viewportTop + 12, viewportTop + viewportHeight - cardHeight - 16)
          : rect.height > viewportHeight * 0.6
          ? Math.max(viewportTop + 12, viewportTop + viewportHeight - cardHeight - 72)
          : spaceBelow >= cardHeight
            ? rect.bottom + gap
            : Math.max(viewportTop + 12, rect.top - cardHeight - gap)
        : Math.min(viewportTop + viewportHeight - cardHeight - 16, Math.max(viewportTop + 16, rect.top - 24));
      card.style.left = `${left}px`;
      card.style.top = `${top}px`;
      card.style.bottom = "auto";
    };

    target.classList.add("xv-tour-highlight");
    position();
    window.addEventListener("resize", position);
    window.visualViewport?.addEventListener("resize", position);
    window.visualViewport?.addEventListener("scroll", position);
    return () => {
      target.classList.remove("xv-tour-highlight");
      window.removeEventListener("resize", position);
      window.visualViewport?.removeEventListener("resize", position);
      window.visualViewport?.removeEventListener("scroll", position);
    };
  }, [open, done, isMobile, sidebarOpen, step, totalSteps]);

  useEffect(() => {
    const update = (event: Event) => setSidebarOpen(Boolean((event as CustomEvent<{ open?: boolean }>).detail?.open));
    window.addEventListener("xv-sidebar-change", update);
    return () => window.removeEventListener("xv-sidebar-change", update);
  }, []);

  useEffect(() => {
    if (!autoOpen || done || autoOpenTrackedRef.current) return;
    autoOpenTrackedRef.current = true;
    setOpen(true);
    ph?.capture("tutorial_opened", { trigger: "manuscript_added", step });
  }, [autoOpen, done, ph, step]);

  // Detect mobile after mount (avoids SSR mismatch)
  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  // Step 0: advance to step 1 in DB (mark tour started) but don't auto-open
  useEffect(() => {
    if (step !== 0 || done) return;
    syncStep(1).then(() => setStep(1));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function handleNext() {
    if (advanceRef.current) return;
    advanceRef.current = true;

    if (step >= totalSteps) {
      ph?.capture("tutorial_completed", { action: "done" });
      setDone(true);
      setOpen(false);
      await syncStep(9, true);
    } else {
      const next = step + 1;
      if (isMobile && sidebarOpen) {
        window.dispatchEvent(new CustomEvent("xv-tour-sidebar-request", { detail: { open: false } }));
      }
      ph?.capture("tutorial_step_reached", { step: next, from_step: step });
      setStep(next);
      await syncStep(next);
    }

    advanceRef.current = false;
  }

  async function handleSkip() {
    if (advanceRef.current) return;
    advanceRef.current = true;
    if (isMobile && sidebarOpen) {
      window.dispatchEvent(new CustomEvent("xv-tour-sidebar-request", { detail: { open: false } }));
    }
    ph?.capture("tutorial_skipped", { at_step: step });
    setDone(true);
    setOpen(false);
    await syncStep(9, true);
    advanceRef.current = false;
  }

  async function handleBack() {
    if (advanceRef.current || step <= 1) return;
    advanceRef.current = true;
    const previous = step - 1;
    ph?.capture("tutorial_step_back", { step: previous, from_step: step });
    setStep(previous);
    await syncStep(previous);
    advanceRef.current = false;
  }

  // ── "?" help button (always visible) ────────────────────────────────────────

  const helpButton = (
    <button
      onClick={() => setOpen((v) => !v)}
      aria-label="Open feature tour"
      className="fixed z-[119] bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 h-11 w-11 rounded-full bg-white dark:bg-[#1a1829] border border-black/[0.08] dark:border-white/[0.08] shadow-sm flex items-center justify-center text-[13px] font-semibold text-[#A1A1AA] dark:text-white/30 hover:text-[#71717A] dark:hover:text-white/60 transition-colors opacity-70 hover:opacity-100 md:bottom-6 md:left-6 md:h-8 md:w-8 md:opacity-60"
    >
      ?
    </button>
  );

  // ── Render ───────────────────────────────────────────────────────────────────

  // Once the tour is fully done, render nothing
  if (done) return null;

  const steps = isMobile ? STEPS_MOBILE : STEPS_DESKTOP;
  const currentStep = Math.min(step === 0 ? 1 : step, totalSteps);
  const content = steps[currentStep];

  if (!content || currentStep >= 9) return helpButton;

  const isFinal = currentStep === totalSteps;
  const isNarrowSidebarStep = isMobile && sidebarOpen && [1, 3, 5].includes(currentStep);

  if (!open) return helpButton;

  return (
    <>
      {helpButton}
      <div
        key={currentStep}
        ref={cardRef}
        role="dialog"
        aria-label="Feature tour"
        className={`fixed z-[120] animate-[xv-tour-enter_220ms_ease-out] ${isMobile ? "left-4" : "bottom-16 left-6 w-[300px]"}`}
      >
        <div className={`xv-tour-card border border-black/[0.08] bg-white shadow-2xl dark:border-white/[0.08] dark:bg-[#1a1829] ${isMobile ? "rounded-xl" : "rounded-2xl"} overflow-hidden`}>

          {/* Header */}
          <div className={`flex items-center justify-between ${isMobile ? "px-3 pt-2" : "px-4 pt-3.5"}`}>
            <span className="xv-tour-meta text-[10px] font-semibold uppercase tracking-widest text-[#1A1A1A]/30 dark:text-white/25">
              Getting started · {currentStep}/{totalSteps}
            </span>
            <button
              onClick={handleSkip}
              className="xv-tour-skip -mr-2 flex min-h-11 items-center px-2 text-[11px] text-[#A1A1AA] dark:text-white/30 hover:text-[#71717A] dark:hover:text-white/60 transition-colors md:min-h-0"
            >
              Skip
            </button>
          </div>

          {/* Body */}
          <div className={isMobile ? "px-3 pb-2 pt-1" : "px-4 pb-4 pt-3"}>
            <div className={isMobile ? "flex items-center gap-2" : ""}>
              <div className={isMobile ? "text-base" : "mb-2 text-xl"}>{content.icon}</div>
              <h3 className="xv-tour-title text-sm font-semibold text-[#0F0F0F] dark:text-[#EDEBF0] tracking-tight leading-snug">
                {content.title}
              </h3>
            </div>
            <p className={`xv-tour-body text-[#71717A] dark:text-white/45 ${isMobile ? "mt-1.5 text-[11px] leading-4" : "mt-1.5 text-[12px] leading-relaxed"}`}>
              {content.body}
            </p>
          </div>

          {/* Footer */}
          <div className={isMobile ? "flex items-center justify-between gap-2 px-3 pb-3" : "px-4 pb-4"}>
            {isMobile && (
              <div className="flex min-w-0 items-center gap-2">
                {currentStep > 1 && <button onClick={handleBack} className="min-h-10 shrink-0 px-1 text-[11px] font-medium text-[#6B3E1A]/60 hover:text-[#6B3E1A] dark:text-white/45 dark:hover:text-white/70">← Back</button>}
                {!isNarrowSidebarStep && <div className="flex gap-1" aria-hidden>{Array.from({ length: totalSteps }, (_, index) => <span key={index} className={`h-1 rounded-full ${index + 1 === currentStep ? "w-4 bg-violet-500" : "w-1 bg-black/15"}`} />)}</div>}
              </div>
            )}
            <button
              onClick={handleNext}
              className={`xv-tour-next min-h-10 shrink-0 rounded-xl bg-[#0F0F0F] text-[12px] font-semibold text-white transition-colors hover:bg-[#2A2A2A] dark:bg-violet-600 dark:hover:bg-violet-500 ${isMobile ? isNarrowSidebarStep ? "min-w-0 px-3" : "min-w-24 px-4" : "w-full"}`}
            >
              {isFinal ? "Done ✓" : "Next →"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
