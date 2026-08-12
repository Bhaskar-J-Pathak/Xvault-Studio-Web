"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

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
    text: "I haven't found another tool that does this.",
    tag: "Differentiation",
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
              Early access feedback
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
            &ldquo;The AI actually knows my story.&rdquo;
          </motion.blockquote>
        </div>

        {/* Attribution */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.52, duration: 0.6 }}
          className="mb-16 text-center text-[0.78rem] text-violet-900/30"
        >
          Early access writer · Closed beta
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

        {/* Google Cloud for Startups */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.95, duration: 0.6, ease }}
          className="mt-16 flex flex-col items-center gap-3"
        >
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-violet-900/25">
            Supported by
          </p>
          <div className="inline-flex items-center gap-2.5 rounded-full border border-violet-200/50 bg-white/70 px-5 py-2.5 shadow-sm backdrop-blur-sm">
            {/* Google G mark */}
            <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/>
              <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/>
              <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"/>
              <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/>
            </svg>
            <span className="text-[0.78rem] font-medium text-[#1A0A3C]/60">
              Google Cloud for Startups
            </span>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
