"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, useInView, AnimatePresence, useMotionValue, useTransform } from "framer-motion";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

// ─── Demo: Alex Chat ───────────────────────────────────────────────────────────

function AlexChatDemo({ live }: { live: boolean }) {
  const [showReply, setShowReply] = useState(false);
  const [dots, setDots] = useState(0);

  useEffect(() => {
    if (!live) { setShowReply(false); setDots(0); return; }
    const t1 = setTimeout(() => {
      const interval = setInterval(() => setDots((d) => (d + 1) % 4), 350);
      setTimeout(() => {
        clearInterval(interval);
        setShowReply(true);
      }, 1400);
    }, 700);
    return () => clearTimeout(t1);
  }, [live]);

  return (
    <div className="space-y-2.5 rounded-xl bg-stone-50 p-3">
      {/* User message */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={live ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.35, ease }}
        className="ml-auto w-fit max-w-[80%] rounded-xl rounded-tr-sm bg-stone-900 px-3 py-2"
      >
        <p className="text-[0.68rem] leading-[1.6] text-white">
          What&apos;s really going on between Nadia and Marcus?
        </p>
      </motion.div>

      {/* Typing indicator / reply */}
      <div className="flex items-start gap-2">
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[0.55rem] font-bold text-violet-700">
          A
        </div>
        <AnimatePresence mode="wait">
          {!showReply ? (
            <motion.div
              key="dots"
              initial={{ opacity: 0 }}
              animate={live ? { opacity: 1 } : {}}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1 rounded-xl rounded-tl-sm bg-white px-3 py-2 shadow-sm"
            >
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  animate={live ? { opacity: [0.3, 1, 0.3] } : {}}
                  transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2 }}
                  className="h-1 w-1 rounded-full bg-stone-400"
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="reply"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease }}
              className="rounded-xl rounded-tl-sm bg-white px-3 py-2 shadow-sm"
            >
              <p className="text-[0.68rem] leading-[1.7] text-stone-600">
                It&apos;s complicated. In Chapter 2 you planted real tension — she knows he was at the warehouse, but hasn&apos;t confronted him. Thread 1 is still open.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Demo: Ghost Writing ───────────────────────────────────────────────────────

function GhostWritingDemo({ live }: { live: boolean }) {
  const TYPED = "She stepped into the corridor, her hand outstretched — ";
  const GHOST = "fingers brushing cold stone as the vault door swung open.";
  const [chars, setChars] = useState(0);
  const [showGhost, setShowGhost] = useState(false);

  useEffect(() => {
    if (!live) { setChars(0); setShowGhost(false); return; }
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setChars(i);
      if (i >= TYPED.length) {
        clearInterval(interval);
        setTimeout(() => setShowGhost(true), 460);
      }
    }, 26);
    return () => clearInterval(interval);
  }, [live]);

  return (
    <div className="rounded-xl bg-stone-50 p-4">
      <div className="font-serif text-[0.82rem] leading-[2] text-stone-700 min-h-[3.5rem]">
        {TYPED.slice(0, chars)}
        {chars < TYPED.length && (
          <motion.span
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.9, repeat: Infinity }}
            className="inline-block h-[13px] w-[2px] translate-y-[2px] rounded-sm bg-stone-800"
          />
        )}
        {showGhost && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7 }}
            className="text-violet-400/60"
          >
            {GHOST}
          </motion.span>
        )}
      </div>
      <AnimatePresence>
        {showGhost && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            className="mt-3 flex items-center gap-1.5"
          >
            <div className="h-1.5 w-1.5 rounded-full bg-violet-500" />
            <span className="text-[0.62rem] font-medium text-stone-400">
              Ghost suggestion &middot; Ctrl+K &middot; Tab to accept
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Demo: World Board (entity graph) ─────────────────────────────────────────

const GRAPH_NODES = [
  { id: "n", x: 60,  y: 30,  label: "Nadia Kell",      color: "#7C3AED", r: 7 },
  { id: "m", x: 240, y: 30,  label: "Marcus Vane",     color: "#7C3AED", r: 7 },
  { id: "g", x: 150, y: 100, label: "Meridian Group",  color: "#D97706", r: 6 },
  { id: "r", x: 55,  y: 155, label: "Rooftop, Ch.3",   color: "#D97706", r: 6 },
  { id: "e", x: 260, y: 155, label: "Elias Dorn",      color: "#E11D48", r: 6 },
] as const;

const GRAPH_EDGES = [
  ["n", "m"], ["n", "g"], ["m", "g"], ["g", "r"], ["g", "e"],
] as const;

function WorldBoardDemo({ live }: { live: boolean }) {
  const getN = (id: string) => GRAPH_NODES.find((n) => n.id === id)!;
  return (
    <div className="rounded-xl bg-stone-50 p-3">
      <svg viewBox="0 0 315 185" className="w-full" aria-hidden="true">
        {GRAPH_EDGES.map(([a, b], i) => {
          const na = getN(a), nb = getN(b);
          return (
            <motion.path
              key={`${a}-${b}`}
              d={`M ${na.x} ${na.y} L ${nb.x} ${nb.y}`}
              stroke="#E2E0DC"
              strokeWidth="1.5"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={live ? { pathLength: 1 } : {}}
              transition={{ delay: 0.15 + i * 0.18, duration: 0.55, ease: "easeOut" }}
            />
          );
        })}
        {GRAPH_NODES.map((node, i) => (
          <g key={node.id}>
            <motion.circle
              cx={node.x} cy={node.y}
              fill="white" stroke={node.color} strokeWidth="1.5"
              initial={{ r: 0 }} animate={live ? { r: node.r } : {}}
              transition={{ delay: 0.5 + i * 0.1, duration: 0.4, type: "spring", damping: 14 }}
            />
            <motion.circle
              cx={node.x} cy={node.y} fill={node.color}
              initial={{ r: 0 }} animate={live ? { r: node.r * 0.48 } : {}}
              transition={{ delay: 0.62 + i * 0.1, duration: 0.35, type: "spring", damping: 14 }}
            />
            <motion.text
              x={node.x + (node.x > 160 ? -(node.r + 4) : node.r + 4)}
              y={node.y + 3.5}
              textAnchor={node.x > 160 ? "end" : "start"}
              fontSize={7.5} fill="#78716C"
              fontFamily="ui-sans-serif, system-ui, sans-serif"
              initial={{ opacity: 0 }} animate={live ? { opacity: 1 } : {}}
              transition={{ delay: 0.8 + i * 0.1, duration: 0.4 }}
            >
              {node.label}
            </motion.text>
          </g>
        ))}
      </svg>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={live ? { opacity: 1, scale: 1 } : {}}
        transition={{ delay: 1.5, duration: 0.4, ease }}
        className="flex items-center gap-1.5 px-1 pt-1"
      >
        <motion.div
          animate={live ? { opacity: [0.4, 1, 0.4] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
          className="h-1.5 w-1.5 rounded-full bg-violet-500"
        />
        <span className="text-[0.6rem] font-semibold text-stone-500">5 entities indexed · auto-extracted</span>
      </motion.div>
    </div>
  );
}

// ─── Demo: Story Bible (plot threads) ─────────────────────────────────────────

function StoryBibleDemo({ live }: { live: boolean }) {
  const THREADS = [
    { label: "Who sent the encrypted message?", status: "open",     color: "text-amber-600 bg-amber-50 border-amber-200" },
    { label: "Marcus at the warehouse",          status: "open",     color: "text-amber-600 bg-amber-50 border-amber-200" },
    { label: "Nadia's handler identity",         status: "resolved", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  ];

  return (
    <div className="rounded-xl bg-stone-50 p-3 space-y-2">
      {THREADS.map((t, i) => (
        <motion.div
          key={t.label}
          initial={{ opacity: 0, x: -8 }}
          animate={live ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 0.3 + i * 0.2, duration: 0.45, ease }}
          className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2.5 shadow-sm"
        >
          <p className="text-[0.68rem] leading-[1.5] text-stone-600 flex-1">{t.label}</p>
          <span className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[0.58rem] font-semibold ${t.color}`}>
            <span className="h-1 w-1 rounded-full bg-current" />
            {t.status}
          </span>
        </motion.div>
      ))}
      <motion.div
        initial={{ opacity: 0 }}
        animate={live ? { opacity: 1 } : {}}
        transition={{ delay: 1.2, duration: 0.4 }}
        className="px-1 pt-0.5"
      >
        <span className="text-[0.6rem] text-stone-400">2 open · 1 resolved · auto-tracked</span>
      </motion.div>
    </div>
  );
}

// ─── Demo: Global Replace ─────────────────────────────────────────────────────

const REPLACE_LINES = [
  { pre: "\u201c",      name: "Nadia", post: ",\u201d he said quietly." },
  { pre: "",            name: "Nadia", post: " moved toward the exit." },
  { pre: "He watched ", name: "Nadia", post: " disappear into the crowd." },
];

function GlobalReplaceDemo({ live }: { live: boolean }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    if (!live) return;
    const ts = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 980),
      setTimeout(() => setPhase(3), 1460),
    ];
    return () => ts.forEach(clearTimeout);
  }, [live]);

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-md bg-stone-100 px-2.5 py-1">
          <span className="text-[0.6rem] text-stone-400">Find</span>
          <span className="text-[0.7rem] font-semibold text-rose-600">Nadia</span>
        </div>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-stone-300">
          <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="flex items-center gap-1.5 rounded-md bg-stone-100 px-2.5 py-1">
          <span className="text-[0.6rem] text-stone-400">Replace</span>
          <span className="text-[0.7rem] font-semibold text-emerald-600">Mara</span>
        </div>
      </div>
      <div className="space-y-1.5">
        {REPLACE_LINES.map((line, i) => (
          <div
            key={i}
            className="flex items-baseline gap-1 rounded-lg bg-stone-50 px-3 py-2 font-serif text-[0.75rem] text-stone-600"
          >
            <span>{line.pre}</span>
            <span className="relative inline-block min-w-[2.8rem]">
              <AnimatePresence mode="wait">
                {phase <= i ? (
                  <motion.span key="old" exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.15 }}>
                    {line.name}
                  </motion.span>
                ) : (
                  <motion.span
                    key="new"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="font-medium text-emerald-600"
                  >
                    Mara
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
            <span>{line.post}</span>
          </div>
        ))}
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="mt-2.5 text-[0.62rem] text-stone-400"
      >
        3 of 51 replacements &mdash; done
      </motion.p>
    </div>
  );
}

// ─── Feature data ──────────────────────────────────────────────────────────────

const FEATURES = [
  {
    id: "alex",
    num: "01",
    category: "Co-Author",
    title: "Alex — Your Co-Author",
    description:
      "Alex reads your entire manuscript before it says a word. Ask anything — who Nadia is, what's in Chapter 3, which threads are unresolved. Every answer is grounded in your actual story.",
    demo: (live: boolean) => <AlexChatDemo live={live} />,
  },
  {
    id: "ghost-writing",
    num: "02",
    category: "AI Writing",
    title: "Ghost Writing",
    description:
      "Press Ctrl+K. Describe what you want to happen. The AI writes it in your voice — trained on your existing chapters, not a generic model. Tab to accept, Esc to dismiss.",
    demo: (live: boolean) => <GhostWritingDemo live={live} />,
  },
  {
    id: "world-board",
    num: "03",
    category: "World Building",
    title: "World Board",
    description:
      "Every character, location, and faction extracted as you write. Your story's universe mapped automatically into a live knowledge graph — no spreadsheets required.",
    demo: (live: boolean) => <WorldBoardDemo live={live} />,
  },
  {
    id: "story-bible",
    num: "04",
    category: "Plot Intel",
    title: "Story Bible",
    description:
      "Plot threads, style notes, and your writer's intent — all tracked automatically. Nothing introduced in your manuscript disappears without a trace.",
    demo: (live: boolean) => <StoryBibleDemo live={live} />,
  },
  {
    id: "global-replace",
    num: "05",
    category: "Editing",
    title: "Global Replace",
    description:
      "Rename a character once. It propagates everywhere — preserving voice, tense, and context across your entire manuscript automatically.",
    demo: (live: boolean) => <GlobalReplaceDemo live={live} />,
  },
];

// ─── Feature row ───────────────────────────────────────────────────────────────

function FeatureRow({
  num, category, title, description, isActive, onHover, delay, inView,
}: {
  num: string; category: string; title: string; description: string;
  isActive: boolean; onHover: () => void; delay: number; inView: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ delay, duration: 0.65, ease }}
      className="group relative cursor-default border-b border-black/[0.07]"
      onMouseEnter={onHover}
    >
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 bg-stone-950"
        initial={false}
        animate={{ scaleX: isActive ? 1 : 0, opacity: isActive ? 1 : 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ originX: "left" as const }}
      />
      <div className="relative z-10 flex items-center gap-4 py-5 lg:py-6">
        <span className={`w-8 shrink-0 font-mono text-[0.6rem] font-bold tracking-[0.2em] transition-colors duration-300 ${isActive ? "text-stone-500" : "text-stone-300"}`}>
          {num}
        </span>
        <h3
          className="flex-1 font-display font-bold tracking-[-0.028em] transition-colors duration-300"
          style={{ fontSize: "clamp(1.15rem,2.1vw,1.75rem)" }}
        >
          <span className={isActive ? "text-white" : "text-stone-900"}>{title}</span>
        </h3>
        <span className={`hidden shrink-0 text-[0.67rem] font-medium uppercase tracking-[0.18em] transition-colors duration-300 sm:block ${isActive ? "text-stone-500" : "text-stone-400"}`}>
          {category}
        </span>
        <motion.svg
          width="16" height="16" viewBox="0 0 16 16" fill="none"
          className={`shrink-0 transition-colors duration-300 ${isActive ? "text-white/50" : "text-stone-300"}`}
          animate={{ x: isActive ? 4 : 0 }}
          transition={{ duration: 0.3, ease }}
        >
          <path d="M2 8h12M9 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </motion.svg>
      </div>
      <p className={`relative z-10 pb-4 text-[0.875rem] leading-[1.78] lg:hidden ${isActive ? "text-stone-400" : "text-stone-500"}`}>
        {description}
      </p>
    </motion.div>
  );
}

// ─── Spotlight demo panel ─────────────────────────────────────────────────────

function DemoPanel({ features, activeRow }: { features: typeof FEATURES; activeRow: number }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const opacity = useMotionValue(0);

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = panelRef.current?.getBoundingClientRect();
      if (!rect) return;
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
      opacity.set(1);
    },
    [mouseX, mouseY, opacity]
  );

  const background = useTransform(
    [mouseX, mouseY],
    ([x, y]: number[]) =>
      `radial-gradient(300px circle at ${x}px ${y}px, rgba(124,58,237,0.07), transparent 70%)`
  );

  return (
    <div
      ref={panelRef}
      onMouseMove={onMouseMove}
      onMouseLeave={() => opacity.set(0)}
      className="relative hidden shrink-0 lg:block lg:w-[340px] xl:w-[400px]"
    >
      <motion.div
        aria-hidden="true"
        style={{ background, opacity }}
        transition={{ opacity: { duration: 0.3 } }}
        className="pointer-events-none absolute inset-0 z-0 rounded-[1.25rem]"
      />
      <div className="sticky top-28">
        <AnimatePresence mode="wait">
          {features.map((feat, i) =>
            activeRow === i ? (
              <motion.div
                key={feat.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease }}
                className="relative z-10"
              >
                <p className="mb-5 text-[0.875rem] leading-[1.8] text-stone-500">{feat.description}</p>
                <div className="overflow-hidden rounded-[1.25rem] border border-black/[0.07] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_12px_32px_rgba(0,0,0,0.06)]">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-violet-600">
                      {feat.category}
                    </span>
                    <span className="font-mono text-[0.58rem] text-stone-400">{feat.num}</span>
                  </div>
                  {feat.demo(true)}
                </div>
              </motion.div>
            ) : null
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Section ───────────────────────────────────────────────────────────────────

export default function Features() {
  const [activeRow, setActiveRow] = useState(0);
  const hRef    = useRef<HTMLDivElement>(null);
  const hInView  = useInView(hRef,    { once: true, margin: "-60px" });
  const bodyRef  = useRef<HTMLDivElement>(null);
  const bodyInView = useInView(bodyRef, { once: true, margin: "-60px" });

  return (
    <section id="features" className="bg-white px-6 py-24 lg:px-10 lg:py-32">
      <div className="mx-auto max-w-[1380px]">

        {/* Header */}
        <div ref={hRef} className="mb-14 grid gap-6 lg:grid-cols-[1fr_28ch] lg:items-end">
          <div>
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={hInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.55 }}
              className="mb-5 flex items-center gap-3"
            >
              <div className="h-px w-8 bg-stone-300" />
              <span className="text-[0.63rem] font-semibold uppercase tracking-[0.28em] text-stone-400">
                Full Arsenal
              </span>
            </motion.div>
            <div className="overflow-hidden">
              <motion.h2
                initial={{ y: "100%" }}
                animate={hInView ? { y: "0%" } : {}}
                transition={{ delay: 0.06, duration: 0.85, ease }}
                className="font-display font-bold leading-[1.03] tracking-[-0.04em] text-stone-900"
                style={{ fontSize: "clamp(2.4rem,4.8vw,4.2rem)" }}
              >
                Built for
              </motion.h2>
            </div>
            <div className="overflow-hidden">
              <motion.h2
                initial={{ y: "100%" }}
                animate={hInView ? { y: "0%" } : {}}
                transition={{ delay: 0.12, duration: 0.85, ease }}
                className="font-display font-bold leading-[1.03] tracking-[-0.04em] text-stone-400"
                style={{ fontSize: "clamp(2.4rem,4.8vw,4.2rem)" }}
              >
                long-form fiction.
              </motion.h2>
            </div>
          </div>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={hInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.28, duration: 0.72, ease }}
            className="text-balance text-[0.9375rem] leading-[1.82] text-stone-500 lg:text-right"
          >
            No GPT wrapper. No prompt box. Real tools built for long-form fiction.
          </motion.p>
        </div>

        {/* Feature rows + demo panel */}
        <div ref={bodyRef} className="flex flex-col gap-0 lg:flex-row lg:items-start lg:gap-16 xl:gap-24">
          <div className="min-w-0 flex-1 border-t border-black/[0.07]">
            {FEATURES.map((feat, i) => (
              <FeatureRow
                key={feat.id}
                num={feat.num}
                category={feat.category}
                title={feat.title}
                description={feat.description}
                isActive={activeRow === i}
                onHover={() => setActiveRow(i)}
                delay={i * 0.07}
                inView={bodyInView}
              />
            ))}
          </div>
          <DemoPanel features={FEATURES} activeRow={activeRow} />
        </div>

      </div>
    </section>
  );
}
