"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, Plus } from "lucide-react";

const GENRES = [
  { value: "",          label: "No genre selected" },
  { value: "fantasy",   label: "Fantasy" },
  { value: "scifi",     label: "Sci-Fi" },
  { value: "thriller",  label: "Thriller" },
  { value: "romance",   label: "Romance" },
  { value: "mystery",   label: "Mystery" },
  { value: "horror",    label: "Horror" },
  { value: "literary",  label: "Literary Fiction" },
  { value: "other",     label: "Other" },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function NewProjectModal({ open, onClose }: Props) {
  const router   = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [title,   setTitle]   = useState("");
  const [genre,   setGenre]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (open) {
      setTitle("");
      setGenre("");
      setError("");
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!title.trim()) { setError("Give your project a title."); return; }
      setError("");
      setLoading(true);

      try {
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: title.trim(), genre: genre || null }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Could not create project.");

        onClose();
        router.refresh();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setLoading(false);
      }
    },
    [title, genre, onClose, router]
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-[2px]" />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white dark:bg-[#161329] rounded-2xl shadow-2xl ring-1 ring-black/[0.08] dark:ring-white/[0.08] p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-[#0F0F0F] dark:text-[#EDEBF0] tracking-tight">
              New project
            </h2>
            <p className="text-sm text-[#71717A] dark:text-white/40 mt-0.5">
              Start a blank project — you can always change details later.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#A1A1AA] dark:text-white/30 hover:text-[#0F0F0F] dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="proj-title" className="block text-sm font-medium text-[#71717A] dark:text-white/60">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              id="proj-title"
              ref={inputRef}
              type="text"
              required
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. The Ember Crown"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4E4E7] dark:border-white/[0.08] bg-[#FAFAFA] dark:bg-white/[0.04] text-sm text-[#0F0F0F] dark:text-[#EDEBF0] placeholder:text-[#A1A1AA] dark:placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 dark:focus:border-violet-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="proj-genre" className="block text-sm font-medium text-[#71717A] dark:text-white/60">
              Genre <span className="text-[#A1A1AA] dark:text-white/30 font-normal">(optional)</span>
            </label>
            <select
              id="proj-genre"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4E4E7] dark:border-white/[0.08] bg-[#FAFAFA] dark:bg-white/[0.04] text-sm text-[#0F0F0F] dark:text-[#EDEBF0] focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 dark:focus:border-violet-500 transition-colors appearance-none cursor-pointer"
            >
              {GENRES.map((g) => (
                <option key={g.value} value={g.value} className="dark:bg-[#161329]">
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#E4E4E7] dark:border-white/[0.08] text-sm font-medium text-[#71717A] dark:text-white/40 hover:text-[#0F0F0F] dark:hover:text-white hover:border-black/15 dark:hover:border-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#0F0F0F] dark:bg-violet-600 text-white text-sm font-semibold hover:bg-[#2A2A2A] dark:hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Creating…" : <><Plus size={15} />Create project</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
