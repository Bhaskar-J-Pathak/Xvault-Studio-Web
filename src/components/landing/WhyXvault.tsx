"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

const stages = [
  {
    label: "Import",
    chat: "Paste a summary",
    xvault: "Manuscript imported",
  },
  {
    label: "Map",
    chat: "Paste more context",
    xvault: "Story memory expands",
  },
  {
    label: "Ask",
    chat: "Earlier detail is missing",
    xvault: "Earlier detail stays available",
  },
  {
    label: "Write",
    chat: "Move the output yourself",
    xvault: "Preview at the cursor",
  },
] as const;

const memoryLabels = ["Chapters", "Characters", "Threads", "Arcs"] as const;

export default function WhyXvault() {
  const [activeStage, setActiveStage] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setInterval(() => {
      setActiveStage((current) => (current + 1) % stages.length);
    }, 2600);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  const stage = stages[activeStage];

  return (
    <section id="why-xvault" className="scroll-mt-[72px] bg-[#F4F0E8] px-6 py-24 text-[#191714] lg:px-10 lg:py-32">
      <div className="mx-auto max-w-[1280px] border-t border-[#191714]/15 pt-8 lg:pt-10">
        <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-end lg:gap-20">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#A6402D]">08 / Why Xvault</p>
            <h2 className="mt-7 max-w-[760px] font-display text-[clamp(3.5rem,6.2vw,6.7rem)] leading-[0.91] tracking-[-0.055em]">
              A novel needs memory. A blank chat starts over.
            </h2>
          </div>
          <div className="lg:pb-2">
            <p className="max-w-[560px] text-base leading-8 text-[#191714]/70">
              General AI can help with a prompt. Xvault is built around the manuscript, so the story is present before the conversation begins.
            </p>
            <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#191714]/64">
              Watch what happens as the work moves forward
            </p>
          </div>
        </div>

        <div className="mt-16 border border-[#191714]/18 bg-[#F8F3E8] shadow-[14px_16px_0_rgba(25,23,20,0.07)] lg:mt-20">
          <div className="flex items-center justify-between gap-6 border-b border-[#191714]/15 px-5 py-4 sm:px-7">
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[#191714]/64">Conceptual comparison</p>
            <AnimatePresence mode="wait">
              <motion.p
                key={stage.label}
                initial={reduceMotion ? false : { opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -5 }}
                className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[#A6402D]"
              >
                0{activeStage + 1} / {stage.label}
              </motion.p>
            </AnimatePresence>
          </div>

          <div className="grid lg:grid-cols-2">
            <div className="border-b border-[#191714]/15 p-6 sm:p-9 lg:border-b-0 lg:border-r lg:p-12">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-[2rem] tracking-[-0.035em] text-[#191714]/64">A blank AI chat</h3>
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#191714]/55">Session context</span>
              </div>

              <div className="mt-9 flex min-h-[330px] flex-col border border-[#191714]/15 bg-[#F4F0E8] p-5 sm:p-7">
                <div className="flex items-center justify-between border-b border-[#191714]/15 pb-4">
                  <div className="flex gap-1.5" aria-hidden="true">
                    <span className="h-2 w-2 rounded-full bg-[#191714]/18" />
                    <span className="h-2 w-2 rounded-full bg-[#191714]/18" />
                    <span className="h-2 w-2 rounded-full bg-[#191714]/18" />
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#191714]/55">New conversation</span>
                </div>

                <div className="flex flex-1 items-center justify-center py-10">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={stage.chat}
                      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduceMotion ? undefined : { opacity: 0, y: -12 }}
                      transition={{ duration: 0.35 }}
                      className="w-full max-w-[310px]"
                    >
                      <div className="space-y-3 opacity-45">
                        <div className="h-2 w-3/4 bg-[#191714]/20" />
                        <div className="h-2 w-full bg-[#191714]/20" />
                        <div className="h-2 w-2/3 bg-[#191714]/20" />
                      </div>
                      <p className="mt-7 text-center font-display text-[1.75rem] leading-tight tracking-[-0.03em] text-[#191714]/64">{stage.chat}</p>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="border border-[#191714]/15 bg-[#F8F3E8] px-4 py-3 font-mono text-[9px] uppercase tracking-[0.12em] text-[#191714]/55">
                  Explain the story again...
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-9 lg:p-12">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-[2rem] tracking-[-0.035em] text-[#A6402D]">Xvault Studio</h3>
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#191714]/64">Manuscript context</span>
              </div>

              <div className="mt-9 min-h-[330px] border border-[#191714]/15 bg-[#F4F0E8] p-5 sm:p-7">
                <div className="grid min-h-[274px] grid-cols-[0.78fr_1.22fr] gap-5 sm:gap-8">
                  <div className="flex flex-col justify-center gap-3">
                    {memoryLabels.map((label, index) => {
                      const visible = index <= activeStage;
                      return (
                        <motion.div
                          key={label}
                          animate={{ opacity: visible ? 1 : 0.25, x: visible ? 0 : -5 }}
                          transition={{ duration: 0.4 }}
                          className={`border px-3 py-3 font-mono text-[8px] uppercase tracking-[0.12em] sm:text-[9px] ${
                            visible ? "border-[#A6402D]/45 bg-[#F8F3E8] text-[#A6402D]" : "border-[#191714]/12 text-[#191714]/45"
                          }`}
                        >
                          {label}
                        </motion.div>
                      );
                    })}
                  </div>

                  <div className="relative flex items-center justify-center overflow-hidden border-l border-[#191714]/15 pl-5 sm:pl-8">
                    <motion.div
                      animate={{ scale: reduceMotion ? 1 : [1, 1.035, 1] }}
                      transition={{ duration: 2.6, repeat: reduceMotion ? 0 : Infinity, ease: "easeInOut" }}
                      className="relative flex aspect-square w-full max-w-[210px] items-center justify-center rounded-full border border-[#A6402D]/45"
                    >
                      <div className="absolute inset-[13%] rounded-full border border-[#A6402D]/25" />
                      <div className="relative z-10 text-center">
                        <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#A6402D] sm:text-[9px]">Story memory</span>
                        <AnimatePresence mode="wait">
                          <motion.p
                            key={stage.xvault}
                            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                            className="mx-auto mt-3 max-w-[130px] font-display text-[1.25rem] leading-tight tracking-[-0.025em]"
                          >
                            {stage.xvault}
                          </motion.p>
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 border-t border-[#191714]/15">
            {stages.map((item, index) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setActiveStage(index)}
                aria-pressed={activeStage === index}
                className={`border-[#191714]/15 px-2 py-4 font-mono text-[8px] font-semibold uppercase tracking-[0.12em] transition-colors sm:text-[9px] ${
                  index > 0 ? "border-l" : ""
                } ${activeStage === index ? "bg-[#191714] text-[#F4F0E8]" : "text-[#191714]/58 hover:bg-[#191714]/5"}`}
              >
                0{index + 1} / {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-8 border-b border-[#191714]/15 py-10 lg:grid-cols-[190px_1fr] lg:py-14">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[#A6402D]">Built for the whole book</p>
          <p className="max-w-[900px] font-display text-[clamp(2.3rem,4.4vw,4.8rem)] leading-[0.98] tracking-[-0.045em]">
            The prompt is only one moment. The manuscript is the work.
          </p>
        </div>
      </div>
    </section>
  );
}
