"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
}

export default function GenrePicker({ open }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  if (!open) return null;

  async function handleStart() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/studio/seed-sample", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ genre: "thriller" }),
      });

      if (!res.ok) throw new Error("Failed to create your sample project.");

      const { projectId, chapterId } = await res.json();
      router.push(`/studio/${projectId}/${chapterId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#0A0A0A]/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-[#161329] rounded-3xl shadow-2xl ring-1 ring-black/[0.06] dark:ring-white/[0.07] overflow-hidden">
        <div className="px-8 pt-8 pb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#A1A1AA] dark:text-white/30 mb-3">
            Welcome to Xvault Studio
          </p>
          <h2 className="text-2xl font-semibold text-[#0F0F0F] dark:text-[#EDEBF0] tracking-tight leading-snug mb-3">
            Let's show you around.
          </h2>
          <p className="text-sm text-[#71717A] dark:text-white/40 leading-relaxed mb-8">
            We'll load a sample project — three chapters, a full World Board, and a Story Bible — so you can see exactly how your AI co-author Alex works before you bring in your own manuscript.
          </p>

          {error && (
            <p className="mb-5 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">
              {error}
            </p>
          )}

          <button
            onClick={handleStart}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#0F0F0F] dark:bg-violet-600 text-white text-sm font-semibold hover:bg-[#2A2A2A] dark:hover:bg-violet-500 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Setting up your sample project…
              </>
            ) : (
              <>
                Start the tour
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
