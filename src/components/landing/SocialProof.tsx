"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

// Three honest sentiment extractions from closed beta feedback.
// All from the same early access writer — not inflated to look like multiple sources.
const SENTIMENTS = [
  {
    text: "The AI matches my voice very well.",
    tag: "Voice matching",
  },
  {
    text: "Helps me brainstorm in ways I didn't expect.",
    tag: "Co-author",
  },
  {
    text: "A 10/10 once the rough edges are gone.",
    tag: "Potential",
  },
];

export default function SocialProof() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section className="relative bg-[#EDE8FF] px-6 py-24 lg:px-10 lg:py-32">

      <div ref={ref} className="mx-auto max-w-[960px]">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease }}
          className="mb-10 flex justify-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5">
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2.2, repeat: Infinity }}
              className="h-1.5 w-1.5 rounded-full bg-violet-500"
            />
            <span className="text-[0.67rem] font-semibold tracking-wide text-violet-600">
              Closed beta · Early access, 2026
            </span>
          </span>
        </motion.div>

        {/* Pull quote */}
        <div className="mb-8 overflow-hidden text-center">
          <motion.blockquote
            initial={{ y: "108%" }}
            animate={inView ? { y: "0%" } : {}}
            transition={{ delay: 0.06, duration: 0.92, ease }}
            className="font-display mx-auto text-[#1A0A3C]"
            style={{
              fontSize: "clamp(2.4rem, 5vw, 4.6rem)",
              lineHeight: 1.02,
              letterSpacing: "-0.03em",
              fontWeight: 300,
              maxWidth: "18ch",
            }}
          >
            &ldquo;A writing tool I haven&rsquo;t found yet.&rdquo;
          </motion.blockquote>
        </div>

        {/* Attribution */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.52, duration: 0.6 }}
          className="mb-16 text-center text-[0.78rem] text-violet-900/30"
        >
          Early access writer · Closed beta feedback
        </motion.p>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : {}}
          transition={{ delay: 0.55, duration: 0.7, ease }}
          className="mb-16 h-px w-full origin-left bg-gradient-to-r from-violet-200/60 via-violet-300/40 to-transparent"
        />

        {/* Sentiment chips */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {SENTIMENTS.map((s, i) => (
            <motion.div
              key={s.tag}
              initial={{ opacity: 0, y: 14 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.62 + i * 0.1, duration: 0.65, ease }}
              className="rounded-2xl border border-violet-200/60 bg-white px-6 py-5 shadow-sm"
            >
              {/* Tag */}
              <span className="mb-3 block text-[0.6rem] font-bold uppercase tracking-[0.2em] text-violet-400">
                {s.tag}
              </span>
              {/* Quote */}
              <p
                className="font-display text-[#1A0A3C]/80 italic"
                style={{ fontSize: "clamp(1rem, 1.4vw, 1.125rem)", lineHeight: 1.55, fontWeight: 300 }}
              >
                &ldquo;{s.text}&rdquo;
              </p>
            </motion.div>
          ))}
        </div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 1.0, duration: 0.6 }}
          className="mt-10 text-center text-[0.72rem] text-violet-900/22"
        >
          Sentiments extracted from a single closed beta writer. We&rsquo;re still early.
        </motion.p>

      </div>
    </section>
  );
}
