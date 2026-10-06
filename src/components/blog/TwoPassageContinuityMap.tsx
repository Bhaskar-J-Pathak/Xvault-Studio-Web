"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { Brain, Heart, KeyRound, Search } from "lucide-react";
import { useRef, useState } from "react";

const scenarios = [
  {
    id: "object",
    label: "Object",
    icon: KeyRound,
    earlierChapter: "Chapter 3",
    earlier: "Mara placed the brass key in Tomas's grave and watched the earth cover it.",
    laterChapter: "Chapter 15",
    later: "Mara reached into her coat and wrapped her fingers around the brass key.",
    signal: "Missing transfer",
    question: "When did the key return to Mara's possession?",
  },
  {
    id: "knowledge",
    label: "Knowledge",
    icon: Brain,
    earlierChapter: "Chapter 6",
    earlier: "Ilyan kept the northern route secret. Even his own captain did not know it.",
    laterChapter: "Chapter 9",
    later: "The captain warned them that an ambush waited on the northern route.",
    signal: "Knowledge jump",
    question: "Who told the captain about the northern route?",
  },
  {
    id: "emotion",
    label: "Emotion",
    icon: Heart,
    earlierChapter: "Chapter 11",
    earlier: "Lio rejected Mara's apology and told her he would never trust her again.",
    laterChapter: "Chapter 13",
    later: "Lio passed Mara the map. For now, they would face the crossing together.",
    signal: "Emotional bridge",
    question: "What made cooperation possible before forgiveness?",
  },
] as const;

export function TwoPassageContinuityMap() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduceMotion = useReducedMotion();
  const [activeId, setActiveId] = useState<(typeof scenarios)[number]["id"]>("object");
  const active = scenarios.find((scenario) => scenario.id === activeId) ?? scenarios[0];
  const Icon = active.icon;
  const enter = reduceMotion ? {} : { opacity: 0, y: 14 };

  return (
    <div
      ref={ref}
      className="not-prose my-12 overflow-hidden border border-[#191714]/15 bg-[#F8F5EE]"
      style={{ fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif" }}
    >
      <div className="grid gap-6 border-b border-[#191714]/15 bg-[#191714] p-6 text-[#F4F0E8] sm:grid-cols-[1fr_auto] sm:items-end lg:p-8">
        <div>
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-[#D88B75]">
            Two-passage continuity map
          </p>
          <h3 className="mt-3 font-display text-3xl leading-none tracking-[-0.04em] sm:text-4xl">
            Find the missing bridge.
          </h3>
        </div>
        <p className="max-w-[300px] text-sm leading-6 text-[#F4F0E8]/62">
          Switch the story layer to see how the same comparison method exposes different problems.
        </p>
      </div>

      <div className="flex flex-wrap border-b border-[#191714]/15">
        {scenarios.map((scenario) => {
          const ScenarioIcon = scenario.icon;
          const selected = scenario.id === activeId;
          return (
            <button
              key={scenario.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setActiveId(scenario.id)}
              className={`relative flex min-h-12 flex-1 items-center justify-center gap-2 border-r border-[#191714]/15 px-4 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] transition-colors last:border-r-0 ${
                selected ? "bg-[#EFE7DC] text-[#A6402D]" : "bg-[#F8F5EE] text-[#191714]/55 hover:text-[#191714]"
              }`}
            >
              <ScenarioIcon className="size-4" />
              {scenario.label}
              {selected ? (
                <motion.span
                  layoutId="continuity-tab"
                  className="absolute inset-x-0 bottom-0 h-0.5 bg-[#A6402D]"
                  transition={{ duration: reduceMotion ? 0 : 0.3 }}
                />
              ) : null}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active.id}
          initial={enter}
          animate={inView ? { opacity: 1, y: 0 } : enter}
          exit={reduceMotion ? {} : { opacity: 0, y: -8 }}
          transition={{ duration: reduceMotion ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="p-6 lg:p-8"
        >
          <div className="grid gap-4 lg:grid-cols-[1fr_92px_1fr] lg:items-stretch">
            <PassageCard
              eyebrow="Earlier anchor"
              chapter={active.earlierChapter}
              text={active.earlier}
              delay={0.05}
              inView={inView}
              reduceMotion={Boolean(reduceMotion)}
            />

            <div className="relative flex min-h-16 items-center justify-center lg:min-h-0">
              <motion.div
                initial={reduceMotion ? {} : { scaleY: 0 }}
                animate={inView ? { scaleY: 1 } : {}}
                transition={{ delay: 0.28, duration: reduceMotion ? 0 : 0.45 }}
                className="absolute inset-y-0 left-1/2 w-px origin-top bg-[#191714]/15 lg:hidden"
              />
              <motion.div
                initial={reduceMotion ? {} : { scaleX: 0 }}
                animate={inView ? { scaleX: 1 } : {}}
                transition={{ delay: 0.28, duration: reduceMotion ? 0 : 0.45 }}
                className="absolute inset-x-0 top-1/2 hidden h-px origin-left bg-[#191714]/15 lg:block"
              />
              <motion.div
                initial={reduceMotion ? {} : { scale: 0.7, opacity: 0 }}
                animate={inView ? { scale: 1, opacity: 1 } : {}}
                transition={{ delay: 0.48, duration: reduceMotion ? 0 : 0.35 }}
                className="relative z-10 flex size-11 items-center justify-center border border-[#A6402D]/30 bg-[#F8F5EE] text-[#A6402D]"
              >
                <Icon className="size-5" />
              </motion.div>
            </div>

            <PassageCard
              eyebrow="Later dependency"
              chapter={active.laterChapter}
              text={active.later}
              delay={0.15}
              inView={inView}
              reduceMotion={Boolean(reduceMotion)}
            />
          </div>

          <motion.div
            initial={reduceMotion ? {} : { opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.62, duration: reduceMotion ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="mt-5 grid gap-4 border border-[#A6402D]/25 bg-[#EFE7DC] p-5 sm:grid-cols-[auto_1fr] sm:items-center"
          >
            <div className="flex size-11 items-center justify-center bg-[#A6402D] text-white">
              <Search className="size-5" />
            </div>
            <div>
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[#A6402D]">
                {active.signal}
              </p>
              <p className="mt-1 text-sm font-semibold leading-6 text-[#191714]">{active.question}</p>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function PassageCard({
  eyebrow,
  chapter,
  text,
  delay,
  inView,
  reduceMotion,
}: {
  eyebrow: string;
  chapter: string;
  text: string;
  delay: number;
  inView: boolean;
  reduceMotion: boolean;
}) {
  return (
    <motion.article
      initial={reduceMotion ? {} : { opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: reduceMotion ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="border border-[#191714]/15 bg-white/45 p-5"
    >
      <div className="flex items-center justify-between gap-4 border-b border-[#191714]/10 pb-3">
        <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#A6402D]">{eyebrow}</p>
        <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#191714]/42">{chapter}</p>
      </div>
      <p className="mt-4 text-sm leading-7 text-[#191714]/72">“{text}”</p>
    </motion.article>
  );
}
