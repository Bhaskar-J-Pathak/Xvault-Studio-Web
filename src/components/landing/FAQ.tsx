"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

const FAQS = [
  {
    q: "Is Xvault Studio free to start?",
    a: "Yes. Sign up in 10 seconds — no credit card needed. You get 100 AI credits and 14 days of full access. After your trial, the free plan gives you continued access with a smaller monthly credit allowance. Paid plans with higher limits are coming at full launch.",
  },
  {
    q: "Is this the full product?",
    a: "Xvault Studio is currently in public beta. The core writing experience — Alex, Ghost Writing, World Board, Story Bible, and Global Replace — is fully functional. We're actively building toward a full launch with expanded features and subscription plans. Beta users get full access and directly shape what we build next.",
  },
  {
    q: "What exactly is Alex?",
    a: "Alex is your AI co-author. Before it says a word, it reads your entire manuscript — every chapter, every character, every open thread. Ask it anything about your story, get ghost suggestions in your voice, or just talk through a plot problem. Alex always has context.",
  },
  {
    q: "How does Ghost Writing preserve my voice?",
    a: "Press Ctrl+K anywhere in the editor. Alex generates suggestions trained on your existing chapters — not generic AI output. The more you've written, the better it understands your rhythm, vocabulary, and style. Every suggestion is optional and editable.",
  },
  {
    q: "Can I export my manuscript?",
    a: "Yes. You can export your manuscript as a Word document (.docx) from the studio sidebar at any time. EPUB and PDF export are in development and coming at full launch. Your work is always yours to take.",
  },
  {
    q: "Is my manuscript safe in the cloud?",
    a: "Yes. Your chapters are encrypted in transit and at rest. Only you can access your projects. We never use your manuscript to train AI models, and you can export or delete your data at any time.",
  },
  {
    q: "Do I need to install anything?",
    a: "Nothing. Xvault Studio runs entirely in your browser — Chrome, Firefox, Safari, Edge. Open a tab and start writing. Your work is auto-saved to the cloud, so you can pick up on any device, anywhere.",
  },
];

// ─── Mobile accordion item ──────────────────────────────────────────────────

function AccordionItem({
  faq,
  index,
  isOpen,
  onToggle,
  delay,
}: {
  faq: typeof FAQS[number];
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 14 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.65, ease }}
      className="border-b border-violet-200/50"
    >
      <button
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-6 py-5 text-left"
        aria-expanded={isOpen}
      >
        <div className="flex items-start gap-4">
          <span
            className={`mt-0.5 shrink-0 font-mono text-[0.6rem] font-bold tracking-[0.2em] transition-colors duration-300 ${
              isOpen ? "text-violet-600" : "text-violet-400/40"
            }`}
          >
            0{index + 1}
          </span>
          <span
            className={`text-[0.9rem] font-medium leading-snug tracking-tight transition-colors duration-300 ${
              isOpen ? "text-[#1A0A3C]" : "text-violet-900/55"
            }`}
          >
            {faq.q}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.28, ease }}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ${
            isOpen
              ? "border-violet-200 bg-violet-50 text-violet-600"
              : "border-violet-200/60 text-violet-900/40"
          }`}
        >
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true">
            <path d="M4.5 1v7M1 4.5h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease }}
            className="overflow-hidden"
          >
            <div className="mb-5 ml-9 flex gap-3">
              <div className="w-[2px] shrink-0 rounded-full bg-violet-500/30" />
              <p className="text-[0.875rem] leading-[1.85] text-violet-900/50">{faq.a}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Section ────────────────────────────────────────────────────────────────

export default function FAQ() {
  const [active, setActive] = useState(0);

  const hRef    = useRef<HTMLDivElement>(null);
  const hInView  = useInView(hRef, { once: true, margin: "-60px" });
  const listRef  = useRef<HTMLDivElement>(null);
  const listInView = useInView(listRef, { once: true, margin: "-40px" });

  return (
    <section id="faq" className="bg-[#EDE8FF] px-6 py-24 lg:px-10 lg:py-32">
      <div className="mx-auto max-w-[1380px]">

        {/* Header */}
        <div ref={hRef} className="mb-16">
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={hInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.55 }}
            className="mb-6 flex items-center gap-3"
          >
            <div className="h-px w-8 bg-violet-300/60" />
            <span className="text-[0.63rem] font-semibold uppercase tracking-[0.28em] text-violet-600/50">
              FAQ
            </span>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="overflow-hidden">
              <motion.h2
                initial={{ y: "100%" }}
                animate={hInView ? { y: "0%" } : {}}
                transition={{ delay: 0.06, duration: 0.85, ease }}
                className="font-display font-bold leading-[1.03] tracking-[-0.04em] text-[#1A0A3C]"
                style={{ fontSize: "clamp(2.4rem,4vw,3.6rem)" }}
              >
                Questions &amp; answers.
              </motion.h2>
            </div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={hInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3, duration: 0.6, ease }}
              className="text-[0.875rem] text-violet-900/50"
            >
              Something else?{" "}
              <a
                href="mailto:hello@xvaultstudio.com"
                className="font-medium text-violet-600 underline-offset-2 hover:underline"
              >
                Email us &rarr;
              </a>
            </motion.p>
          </div>
        </div>

        {/* ── Desktop: split panel ── */}
        <div ref={listRef} className="hidden lg:grid lg:grid-cols-[1fr_1.3fr] lg:gap-20 xl:gap-28">

          {/* Left — question list */}
          <div className="border-t border-violet-200/50">
            {FAQS.map((faq, i) => (
              <motion.button
                key={faq.q}
                initial={{ opacity: 0, x: -12 }}
                animate={listInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: i * 0.07, duration: 0.6, ease }}
                onClick={() => setActive(i)}
                className={`group flex w-full items-start gap-4 border-b border-violet-200/50 py-6 text-left transition-all duration-200 ${
                  active === i ? "" : "hover:bg-white/50"
                }`}
              >
                {/* Active indicator */}
                <div className="mt-1.5 flex h-4 w-4 shrink-0 items-center justify-center">
                  <motion.div
                    animate={{ scale: active === i ? 1 : 0 }}
                    transition={{ duration: 0.25, ease }}
                    className="h-1.5 w-1.5 rounded-full bg-violet-500"
                  />
                </div>

                <div className="flex flex-1 items-start gap-3">
                  <span
                    className={`mt-0.5 shrink-0 font-mono text-[0.58rem] font-bold tracking-[0.2em] transition-colors duration-200 ${
                      active === i ? "text-violet-600" : "text-violet-400/40"
                    }`}
                  >
                    0{i + 1}
                  </span>
                  <span
                    className={`text-[0.9rem] font-medium leading-snug tracking-tight transition-colors duration-200 ${
                      active === i
                        ? "text-[#1A0A3C]"
                        : "text-violet-900/50 group-hover:text-violet-900/90"
                    }`}
                  >
                    {faq.q}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Right — active answer */}
          <div className="flex items-start pt-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.32, ease }}
                className="w-full"
              >
                <div className="mb-1 font-mono text-[0.6rem] font-bold uppercase tracking-[0.22em] text-violet-600">
                  0{active + 1}
                </div>
                <h3 className="mb-6 font-display text-[1.25rem] font-bold leading-snug tracking-[-0.025em] text-[#1A0A3C]">
                  {FAQS[active].q}
                </h3>
                <div className="flex gap-4">
                  <div className="w-[2px] shrink-0 rounded-full bg-violet-500/25" />
                  <p className="text-[0.9375rem] leading-[1.88] text-violet-900/50">
                    {FAQS[active].a}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

        </div>

        {/* ── Mobile: accordion ── */}
        <div className="border-t border-violet-200/50 lg:hidden">
          {FAQS.map((faq, i) => (
            <AccordionItem
              key={faq.q}
              faq={faq}
              index={i}
              isOpen={active === i}
              onToggle={() => setActive(active === i ? -1 : i)}
              delay={0.04 + i * 0.06}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
