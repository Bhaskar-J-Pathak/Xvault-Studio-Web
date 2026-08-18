"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, Upload, Loader2 } from "lucide-react";
import DefaultCover from "./default-cover";
import Image from "next/image";

const GENRES = [
  { value: "",                label: "No genre" },
  { value: "fantasy",        label: "Fantasy" },
  { value: "dark-fantasy",   label: "Dark Fantasy" },
  { value: "urban-fantasy",  label: "Urban Fantasy" },
  { value: "scifi",          label: "Sci-Fi" },
  { value: "dystopian",      label: "Dystopian" },
  { value: "thriller",       label: "Thriller" },
  { value: "suspense",       label: "Suspense" },
  { value: "mystery",        label: "Mystery" },
  { value: "crime",          label: "Crime / Noir" },
  { value: "horror",         label: "Horror" },
  { value: "romance",        label: "Romance" },
  { value: "paranormal",     label: "Paranormal Romance" },
  { value: "literary",       label: "Literary Fiction" },
  { value: "historical",     label: "Historical Fiction" },
  { value: "contemporary",   label: "Contemporary Fiction" },
  { value: "ya",             label: "Young Adult" },
  { value: "womens",         label: "Women's Fiction" },
  { value: "adventure",      label: "Adventure" },
  { value: "magical-realism",label: "Magical Realism" },
  { value: "other",          label: "Other" },
];

const STATUSES = [
  { value: "drafting",   label: "Drafting" },
  { value: "paused",     label: "Paused" },
  { value: "completed",  label: "Completed" },
];

export interface ProjectForEdit {
  id:               string;
  title:            string;
  genre:            string | null;
  synopsis:         string | null;
  writing_status:   string | null;
  cover_image_url:  string | null;
}

interface Props {
  project:  ProjectForEdit | null; // null = new project mode
  open:     boolean;
  onClose:  () => void;
}

export default function EditProjectModal({ project, open, onClose }: Props) {
  const router    = useRouter();
  const fileRef   = useRef<HTMLInputElement>(null);
  const isNew     = !project;

  const [title,         setTitle]         = useState("");
  const [genre,         setGenre]         = useState("");
  const [synopsis,      setSynopsis]      = useState("");
  const [status,        setStatus]        = useState("drafting");
  const [coverUrl,      setCoverUrl]      = useState<string | null>(null);
  const [coverPreview,  setCoverPreview]  = useState<string | null>(null);
  const [coverFile,     setCoverFile]     = useState<File | null>(null);
  const [uploading,     setUploading]     = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState("");

  // Reset form when modal opens
  useEffect(() => {
    if (!open) return;
    setTitle(project?.title ?? "");
    setGenre(project?.genre ?? "");
    setSynopsis(project?.synopsis ?? "");
    setStatus(project?.writing_status ?? "drafting");
    setCoverUrl(project?.cover_image_url ?? null);
    setCoverPreview(null);
    setCoverFile(null);
    setError("");
  }, [open, project]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setCoverPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError("Title is required."); return; }
    setError("");
    setSaving(true);

    try {
      let projectId = project?.id;

      // ── Create or update project details ─────────────────────────────────
      if (isNew) {
        const res  = await fetch("/api/projects", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            title:          title.trim(),
            genre:          genre || null,
            synopsis:       synopsis.trim() || null,
            writing_status: status,
          }),
        });
        const json = await res.json() as { id?: string; error?: string };
        if (!res.ok) throw new Error(json.error ?? "Could not create project.");
        projectId = json.id;
      } else {
        const res = await fetch(`/api/projects/${project.id}`, {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            title:          title.trim(),
            genre:          genre || null,
            synopsis:       synopsis.trim() || null,
            writing_status: status,
          }),
        });
        if (!res.ok) throw new Error("Could not update project.");
      }

      // ── Upload cover if a new file was selected ───────────────────────────
      if (coverFile && projectId) {
        setUploading(true);
        const fd = new FormData();
        fd.append("file", coverFile);
        await fetch(`/api/projects/${projectId}/cover`, { method: "POST", body: fd });
        setUploading(false);
      }

      onClose();
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  }, [title, genre, synopsis, status, coverFile, project, isNew, onClose, router]);

  if (!open) return null;

  const displayCover = coverPreview ?? coverUrl;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[3px]" />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white dark:bg-[#13131f] rounded-2xl shadow-2xl ring-1 ring-black/[0.08] dark:ring-white/[0.07] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06] dark:border-white/[0.06]">
          <h2 className="text-sm font-semibold text-[#0F0F0F] dark:text-[#EDEBF0] tracking-tight">
            {isNew ? "New project" : "Edit project"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#A1A1AA] dark:text-white/30 hover:text-[#0F0F0F] dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">

            {/* Cover image */}
            <div>
              <p className="text-[10px] font-semibold text-[#A1A1AA] dark:text-white/30 uppercase tracking-widest mb-2">
                Cover
              </p>
              <div className="flex items-end gap-4">
                {/* Preview */}
                <div
                  className="w-[80px] h-[112px] rounded-xl overflow-hidden ring-1 ring-black/[0.08] dark:ring-white/[0.08] shrink-0 cursor-pointer"
                  onClick={() => fileRef.current?.click()}
                  title="Click to upload cover"
                >
                  {displayCover ? (
                    <Image
                      src={displayCover}
                      alt="Cover"
                      width={80}
                      height={112}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <DefaultCover genre={genre} title={title || "Untitled"} />
                  )}
                </div>

                {/* Upload controls */}
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4E4E7] dark:border-white/[0.08] text-[12px] font-medium text-[#71717A] dark:text-white/40 hover:text-[#0F0F0F] dark:hover:text-white hover:border-black/15 dark:hover:border-white/20 transition-colors"
                  >
                    <Upload size={11} />
                    Upload image
                  </button>
                  {displayCover && (
                    <button
                      type="button"
                      onClick={() => { setCoverPreview(null); setCoverUrl(null); setCoverFile(null); }}
                      className="text-[11px] text-[#A1A1AA] dark:text-white/25 hover:text-red-500 transition-colors text-left"
                    >
                      Remove
                    </button>
                  )}
                  <p className="text-[10px] text-[#A1A1AA] dark:text-white/20 leading-relaxed">
                    JPEG, PNG or WebP · max 5 MB<br />
                    Portrait format works best
                  </p>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-[10px] font-semibold text-[#A1A1AA] dark:text-white/30 uppercase tracking-widest mb-2">
                Title <span className="text-red-400 normal-case font-normal">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={120}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. The Ember Crown"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4E4E7] dark:border-white/[0.08] bg-[#FAFAFA] dark:bg-white/[0.04] text-sm text-[#0F0F0F] dark:text-[#EDEBF0] placeholder:text-[#A1A1AA] dark:placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 dark:focus:border-violet-500 transition-colors"
              />
            </div>

            {/* Genre */}
            <div>
              <label className="block text-[10px] font-semibold text-[#A1A1AA] dark:text-white/30 uppercase tracking-widest mb-2">
                Genre
              </label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4E4E7] dark:border-white/[0.08] bg-[#FAFAFA] dark:bg-white/[0.04] text-sm text-[#0F0F0F] dark:text-[#EDEBF0] focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 dark:focus:border-violet-500 transition-colors appearance-none cursor-pointer"
              >
                {GENRES.map((g) => (
                  <option key={g.value} value={g.value} className="dark:bg-[#13131f]">
                    {g.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Synopsis */}
            <div>
              <label className="block text-[10px] font-semibold text-[#A1A1AA] dark:text-white/30 uppercase tracking-widest mb-2">
                Synopsis <span className="normal-case font-normal text-[#A1A1AA]/60 dark:text-white/20">optional</span>
              </label>
              <textarea
                rows={3}
                maxLength={500}
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                placeholder="A short description of your story…"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4E4E7] dark:border-white/[0.08] bg-[#FAFAFA] dark:bg-white/[0.04] text-sm text-[#0F0F0F] dark:text-[#EDEBF0] placeholder:text-[#A1A1AA] dark:placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 dark:focus:border-violet-500 transition-colors resize-none leading-relaxed"
              />
            </div>

            {/* Writing status */}
            <div>
              <p className="text-[10px] font-semibold text-[#A1A1AA] dark:text-white/30 uppercase tracking-widest mb-2">
                Status
              </p>
              <div className="flex gap-2">
                {STATUSES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setStatus(s.value)}
                    className={`flex-1 py-2 rounded-xl text-[12px] font-medium border transition-colors ${
                      status === s.value
                        ? "bg-[#0F0F0F] dark:bg-violet-600 text-white border-transparent"
                        : "border-[#E4E4E7] dark:border-white/[0.08] text-[#71717A] dark:text-white/40 hover:border-black/15 dark:hover:border-white/15 hover:text-[#0F0F0F] dark:hover:text-white/70"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-[12px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl px-3 py-2">
                {error}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-black/[0.06] dark:border-white/[0.06] flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#E4E4E7] dark:border-white/[0.08] text-sm font-medium text-[#71717A] dark:text-white/40 hover:text-[#0F0F0F] dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#0F0F0F] dark:bg-violet-600 text-white text-sm font-semibold hover:bg-[#2A2A2A] dark:hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {(saving || uploading) ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  {uploading ? "Uploading…" : "Saving…"}
                </>
              ) : (
                isNew ? "Create project" : "Save changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
