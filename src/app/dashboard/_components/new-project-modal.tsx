"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase";

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

  // Focus title input when modal opens
  useEffect(() => {
    if (open) {
      setTitle("");
      setGenre("");
      setError("");
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  // Close on Escape
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
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not signed in.");

        const { data, error: dbError } = await supabase
          .from("projects")
          .insert({
            user_id: user.id,
            title:   title.trim(),
            genre:   genre || null,
          })
          .select("id")
          .single();

        if (dbError || !data) throw new Error(dbError?.message ?? "Could not create project.");

        onClose();
        // Refresh server component data so the new card appears immediately
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
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-black/[0.08] p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-[#1A1A1A] tracking-tight">
              New project
            </h2>
            <p className="text-sm text-[#1A1A1A]/45 mt-0.5">
              Start a blank project — you can always change details later.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#1A1A1A]/40 hover:text-[#1A1A1A] hover:bg-black/[0.04] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="proj-title" className="block text-sm font-medium text-[#1A1A1A]/70">
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
              className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.08] bg-black/[0.02] text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/30 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="proj-genre" className="block text-sm font-medium text-[#1A1A1A]/70">
              Genre <span className="text-[#1A1A1A]/35 font-normal">(optional)</span>
            </label>
            <select
              id="proj-genre"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.08] bg-black/[0.02] text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-colors appearance-none cursor-pointer"
            >
              {GENRES.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-black/[0.08] text-sm font-medium text-[#1A1A1A]/60 hover:text-[#1A1A1A] hover:border-black/15 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#1A1A1A] text-white text-sm font-semibold hover:bg-[#2A2A2A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                "Creating…"
              ) : (
                <>
                  <Plus size={15} />
                  Create project
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
