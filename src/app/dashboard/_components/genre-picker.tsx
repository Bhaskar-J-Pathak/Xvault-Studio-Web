"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface Genre {
  id: string;
  label: string;
  tagline: string;
  available: boolean;
}

const GENRES: Genre[] = [
  {
    id: "thriller",
    label: "Thriller",
    tagline: "Tension, deception, and a clock that never stops",
    available: true,
  },
  {
    id: "fantasy",
    label: "Fantasy",
    tagline: "Worlds beyond the known, rules you get to write",
    available: false,
  },
  {
    id: "scifi",
    label: "Sci-Fi",
    tagline: "What technology makes possible, and what it costs",
    available: false,
  },
  {
    id: "romance",
    label: "Romance",
    tagline: "Connection, vulnerability, and what we risk for it",
    available: false,
  },
];

interface Props {
  open: boolean;
}

export default function GenrePicker({ open }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  if (!open) return null;

  async function handlePick(genre: string) {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/studio/seed-sample", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ genre }),
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
      <div className="w-full max-w-xl bg-white dark:bg-[#161329] rounded-3xl shadow-2xl ring-1 ring-black/[0.06] dark:ring-white/[0.07] overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-black/[0.06] dark:border-white/[0.06]">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#A1A1AA] dark:text-white/30 mb-2">
            Welcome to Xvault Studio
          </p>
          <h2 className="text-2xl font-semibold text-[#0F0F0F] dark:text-[#EDEBF0] tracking-tight leading-snug">
            What kind of story do you want to write?
          </h2>
          <p className="text-sm text-[#71717A] dark:text-white/40 mt-2">
            We'll set up a sample project so you can see how everything works — your AI co-author, World Board, and Story Bible, fully loaded and ready.
          </p>
        </div>

        {/* Genre grid */}
        <div className="p-6 grid grid-cols-2 gap-3">
          {GENRES.map((genre) => (
            <GenreCard
              key={genre.id}
              genre={genre}
              loading={loading}
              onPick={handlePick}
            />
          ))}
        </div>

        {error && (
          <p className="mx-6 mb-6 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">
            {error}
          </p>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-2.5 pb-6 text-sm text-[#71717A] dark:text-white/40">
            <Loader2 size={14} className="animate-spin" />
            Setting up your sample project…
          </div>
        )}
      </div>
    </div>
  );
}

function GenreCard({
  genre,
  loading,
  onPick,
}: {
  genre: Genre;
  loading: boolean;
  onPick: (id: string) => void;
}) {
  const isDisabled = !genre.available || loading;

  return (
    <button
      onClick={() => genre.available && !loading && onPick(genre.id)}
      disabled={isDisabled}
      className={`text-left p-4 rounded-2xl border transition-all ${
        genre.available
          ? "border-[#E4E4E7] dark:border-white/[0.08] bg-white dark:bg-white/[0.03] hover:border-violet-300 dark:hover:border-violet-500/40 hover:bg-violet-50 dark:hover:bg-violet-900/15 hover:shadow-sm cursor-pointer group"
          : "border-[#E4E4E7] dark:border-white/[0.05] bg-[#FAFAFA] dark:bg-white/[0.02] cursor-not-allowed opacity-50"
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className={`text-sm font-semibold ${genre.available ? "text-[#0F0F0F] dark:text-[#EDEBF0] group-hover:text-violet-700 dark:group-hover:text-violet-400" : "text-[#A1A1AA] dark:text-white/30"} transition-colors`}>
          {genre.label}
        </span>
        {genre.available ? (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">
            Ready
          </span>
        ) : (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-[#A1A1AA] dark:text-white/30 shrink-0">
            Coming soon
          </span>
        )}
      </div>
      <p className={`text-xs leading-relaxed ${genre.available ? "text-[#71717A] dark:text-white/40 group-hover:text-violet-600 dark:group-hover:text-violet-400" : "text-[#A1A1AA] dark:text-white/25"} transition-colors`}>
        {genre.tagline}
      </p>
    </button>
  );
}
