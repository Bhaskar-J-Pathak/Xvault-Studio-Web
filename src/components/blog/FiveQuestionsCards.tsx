"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const questions = [
  {
    num: "01",
    question: "What does your protagonist want, and what do they fear losing even more?",
    note: "Not plot-level want. The wound underneath that shapes every decision.",
  },
  {
    num: "02",
    question: "What is the worst possible moment you can put them in?",
    note: "This is your climax. If you do not know the answer, you are driving without a destination.",
  },
  {
    num: "03",
    question: "What has to be true at the end that was not true at the beginning?",
    note: "Your theme, made concrete. \"At the end, she trusts someone again.\" Every scene builds toward that.",
  },
  {
    num: "04",
    question: "What are the three turning points between beginning and end?",
    note: "The structural hinges: commitment, apparent victory, collapse. Locate where these land.",
  },
  {
    num: "05",
    question: "Who is making the goal difficult, and why do they believe they are right?",
    note: "Conflict is only interesting when both sides make sense. Even if the antagonist is the protagonist's own psychology.",
  },
];

export function FiveQuestionsCards() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div
      ref={ref}
      className="my-10 not-prose"
      style={{ fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif" }}
    >
      <p className="text-[10px] font-semibold tracking-widest uppercase text-violet-600 mb-5">
        Answer these before chapter one
      </p>

      <div className="space-y-2.5">
        {questions.map((q, i) => (
          <motion.div
            key={q.num}
            initial={{ opacity: 0, x: -18 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: i * 0.1, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="flex gap-4 rounded-xl border border-stone-200 bg-white p-4"
          >
            <span className="mt-0.5 shrink-0 text-xs font-bold text-violet-400">
              {q.num}
            </span>
            <div className="space-y-1">
              <p className="text-sm font-medium leading-snug text-stone-800">
                {q.question}
              </p>
              <p className="text-xs leading-relaxed text-stone-400">
                {q.note}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
