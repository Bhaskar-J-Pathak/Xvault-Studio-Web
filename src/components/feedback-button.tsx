"use client";

import { useState, useCallback } from "react";
import { usePathname } from "next/navigation";

type Mood = "good" | "meh" | "bad";

const MOODS: { value: Mood; emoji: string; label: string }[] = [
  { value: "good", emoji: "😊", label: "Love it" },
  { value: "meh",  emoji: "😐", label: "It's okay" },
  { value: "bad",  emoji: "😞", label: "Something's off" },
];

export default function FeedbackButton() {
  const pathname = usePathname();
  const [open, setOpen]         = useState(false);
  const [mood, setMood]         = useState<Mood | null>(null);
  const [text, setText]         = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]         = useState(false);

  const handleOpen = useCallback(() => {
    setOpen(true);
    setMood(null);
    setText("");
    setDone(false);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!mood) return;
    setSubmitting(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood, text: text.trim() || undefined, page: pathname }),
      });
      setDone(true);
      setTimeout(() => setOpen(false), 2000);
    } catch {
      // Silently fail — feedback is best-effort
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  }, [mood, text, pathname]);

  return (
    <>
      {/* Inline trigger button — positioned by parent */}
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

      {/* Modal backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-start p-6 pl-[218px]"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <div className="w-80 rounded-xl bg-zinc-900 border border-zinc-700 shadow-2xl
                          flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-2
                          duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
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
              /* Thank you state */
              <div className="flex flex-col items-center justify-center py-8 text-zinc-300">
                <span className="text-3xl mb-2">🙏</span>
                <span className="text-sm">Thanks — that helps a lot.</span>
              </div>
            ) : (
              <>
                {/* Mood picker */}
                <div className="flex gap-2 px-4 pb-3">
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

                {/* Text area */}
                <div className="px-4 pb-3">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="What's on your mind? (optional)"
                    rows={3}
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200
                               placeholder-zinc-600 text-xs px-3 py-2 resize-none
                               focus:outline-none focus:border-zinc-500 transition-colors"
                  />
                </div>

                {/* Submit */}
                <div className="px-4 pb-4">
                  <button
                    onClick={handleSubmit}
                    disabled={!mood || submitting}
                    className="w-full rounded-lg bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40
                               disabled:cursor-not-allowed text-zinc-200 text-xs py-2 font-medium
                               transition-colors"
                  >
                    {submitting ? "Sending…" : "Send feedback"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
