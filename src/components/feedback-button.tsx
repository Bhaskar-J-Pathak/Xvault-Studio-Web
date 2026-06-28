"use client";

import { useState, useCallback } from "react";
import { usePathname } from "next/navigation";

type Mood = "good" | "meh" | "bad";

const MOODS: { value: Mood; emoji: string; label: string }[] = [
  { value: "good", emoji: "😊", label: "Love it" },
  { value: "meh",  emoji: "😐", label: "It's okay" },
  { value: "bad",  emoji: "😞", label: "Something's off" },
];

const QUESTIONS = [
  { key: "loved",   label: "What are you loving?",              placeholder: "The parts that feel right…" },
  { key: "broke",   label: "What's not working?",               placeholder: "Anything clunky, confusing, or missing…" },
  { key: "bugs",    label: "Any bugs you ran into?",            placeholder: "What happened, where, how to reproduce…" },
  { key: "wishlist",label: "What would make this 10× better?",  placeholder: "Features, ideas, things you wish existed…" },
] as const;

type QuestionKey = (typeof QUESTIONS)[number]["key"];

export default function FeedbackButton() {
  const pathname = usePathname();
  const [open,       setOpen]       = useState(false);
  const [mood,       setMood]       = useState<Mood | null>(null);
  const [answers,    setAnswers]    = useState<Record<QuestionKey, string>>({
    loved: "", broke: "", bugs: "", wishlist: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done,       setDone]       = useState(false);

  const handleOpen = useCallback(() => {
    setOpen(true);
    setMood(null);
    setAnswers({ loved: "", broke: "", bugs: "", wishlist: "" });
    setDone(false);
  }, []);

  const handleClose = useCallback(() => setOpen(false), []);

  const allAnswered = Object.values(answers).every((v) => v.trim().length > 0);
  const canSubmit   = mood !== null && allAnswered;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await fetch("/api/feedback", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood,
          loved:    answers.loved.trim()    || undefined,
          broke:    answers.broke.trim()    || undefined,
          bugs:     answers.bugs.trim()     || undefined,
          wishlist: answers.wishlist.trim() || undefined,
          page:     pathname,
        }),
      });
      setDone(true);
      setTimeout(() => setOpen(false), 2200);
    } catch {
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  }, [mood, answers, pathname]);

  return (
    <>
      {/* Trigger */}
      <button
        onClick={handleOpen}
        aria-label="Give feedback"
        className="flex items-center gap-1.5 rounded-lg text-xs px-2 py-1.5
                   text-[#1A1A1A]/35 hover:text-[#1A1A1A]/70 hover:bg-black/[0.05]
                   transition-colors w-full"
      >
        <span className="text-[10px]">✦</span>
        <span>Feedback</span>
      </button>

      {/* Panel */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-start p-6 pl-[218px]"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <div
            className="w-80 rounded-xl bg-zinc-900 border border-zinc-700 shadow-2xl
                        flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-2
                        duration-200 max-h-[80vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3 shrink-0">
              <span className="text-sm font-medium text-zinc-200">Share feedback</span>
              <button
                onClick={handleClose}
                className="text-zinc-500 hover:text-zinc-300 transition-colors text-lg leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {done ? (
              <div className="flex flex-col items-center justify-center py-10 text-zinc-300 gap-2">
                <span className="text-3xl">🙏</span>
                <span className="text-sm font-medium">Thanks — that really helps.</span>
                <span className="text-xs text-zinc-500">I read every submission personally.</span>
              </div>
            ) : (
              <>
                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-4">

                  {/* Mood */}
                  <div className="flex gap-2">
                    {MOODS.map((m) => (
                      <button
                        key={m.value}
                        onClick={() => setMood(m.value)}
                        className={`flex-1 flex flex-col items-center gap-0.5 rounded-lg py-2 text-xs
                                    border transition-colors
                                    ${mood === m.value
                                      ? "border-zinc-400 bg-zinc-800 text-zinc-200"
                                      : "border-zinc-700 bg-zinc-900 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                                    }`}
                      >
                        <span className="text-lg">{m.emoji}</span>
                        <span>{m.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Questions */}
                  {QUESTIONS.map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                        {label}
                      </label>
                      <textarea
                        value={answers[key]}
                        onChange={(e) =>
                          setAnswers((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        placeholder={placeholder}
                        rows={2}
                        className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200
                                   placeholder-zinc-600 text-xs px-3 py-2 resize-none
                                   focus:outline-none focus:border-zinc-500 transition-colors"
                      />
                    </div>
                  ))}

                </div>

                {/* Footer */}
                <div className="px-4 py-3 shrink-0 border-t border-zinc-800">
                  <button
                    onClick={handleSubmit}
                    disabled={!canSubmit || submitting}
                    className="w-full rounded-lg bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40
                               disabled:cursor-not-allowed text-zinc-200 text-xs py-2 font-medium
                               transition-colors"
                  >
                    {submitting ? "Sending…" : "Send feedback"}
                  </button>
                  {!canSubmit && (
                    <p className="text-[10px] text-zinc-600 text-center mt-1.5">
                      {!mood ? "Pick a mood first" : "Answer all questions to continue"}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
