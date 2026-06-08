"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Upload, FileText, Loader2, AlertCircle, ChevronRight } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface ParsedChapter {
  title: string;
  words: number;
  body:  string;
}

type Step = "upload" | "preview" | "importing";

const GENRES = [
  { value: "",         label: "No genre" },
  { value: "fantasy",  label: "Fantasy" },
  { value: "scifi",    label: "Sci-Fi" },
  { value: "thriller", label: "Thriller" },
  { value: "romance",  label: "Romance" },
  { value: "mystery",  label: "Mystery" },
  { value: "horror",   label: "Horror" },
  { value: "literary", label: "Literary" },
  { value: "other",    label: "Other" },
];

// ── Main component ─────────────────────────────────────────────────────────────

export default function ImportModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step,      setStep]      = useState<Step>("upload");
  const [dragging,  setDragging]  = useState(false);
  const [parsing,   setParsing]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  // Preview state
  const [title,    setTitle]    = useState("");
  const [genre,    setGenre]    = useState("");
  const [chapters, setChapters] = useState<ParsedChapter[]>([]);

  // ── File handling ──────────────────────────────────────────────────────────

  async function processFile(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["txt", "docx"].includes(ext)) {
      setError("Please upload a .txt or .docx file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File is too large (max 10 MB).");
      return;
    }

    setError(null);
    setParsing(true);

    try {
      const form = new FormData();
      form.append("file", file);

      const res  = await fetch("/api/studio/import", { method: "POST", body: form });
      const data = await res.json() as {
        suggestedTitle?: string;
        chapters?: ParsedChapter[];
        error?: string;
      };

      if (!res.ok || !data.chapters) {
        setError(data.error ?? "Failed to parse the file.");
        return;
      }

      setTitle(data.suggestedTitle ?? "Imported Manuscript");
      setChapters(data.chapters);
      setStep("preview");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setParsing(false);
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Confirm import ─────────────────────────────────────────────────────────

  async function handleImport() {
    if (!title.trim() || chapters.length === 0) return;
    setStep("importing");
    setError(null);

    try {
      const res  = await fetch("/api/studio/import/confirm", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ title: title.trim(), genre: genre || undefined, chapters }),
      });
      const data = await res.json() as { projectId?: string; error?: string };

      if (!res.ok || !data.projectId) {
        setError(data.error ?? "Failed to create project.");
        setStep("preview");
        return;
      }

      router.push(`/studio/${data.projectId}`);
      onClose();
    } catch {
      setError("Network error — please try again.");
      setStep("preview");
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.06]">
          <div>
            <h2 className="text-sm font-semibold text-[#1A1A1A]">Import manuscript</h2>
            <p className="text-[11px] text-[#1A1A1A]/45 mt-0.5">
              {step === "upload"    && "Upload a .txt or .docx file"}
              {step === "preview"   && `${chapters.length} chapter${chapters.length !== 1 ? "s" : ""} detected`}
              {step === "importing" && "Creating your project…"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#1A1A1A]/40 hover:text-[#1A1A1A]/70 hover:bg-black/[0.05] transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Upload step ────────────────────────────────────────────── */}
          {(step === "upload" || parsing) && (
            <div className="p-5">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                className="hidden"
                onChange={handleFileInput}
              />

              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => !parsing && fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-12 px-6 text-center cursor-pointer transition-all ${
                  dragging
                    ? "border-violet-400 bg-violet-50"
                    : "border-black/[0.10] hover:border-violet-300 hover:bg-violet-50/40"
                } ${parsing ? "pointer-events-none" : ""}`}
              >
                {parsing ? (
                  <>
                    <Loader2 size={28} className="text-violet-500 animate-spin" />
                    <p className="text-sm font-medium text-[#1A1A1A]/60">Parsing your manuscript…</p>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center">
                      <Upload size={22} className="text-violet-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#1A1A1A]">
                        Drop your manuscript here
                      </p>
                      <p className="text-xs text-[#1A1A1A]/45 mt-1">
                        .txt or .docx · max 10 MB
                      </p>
                    </div>
                    <button
                      type="button"
                      className="px-4 py-1.5 text-xs font-medium text-violet-600 border border-violet-200 rounded-lg hover:bg-violet-50 transition-colors"
                    >
                      Browse file
                    </button>
                  </>
                )}
              </div>

              {error && (
                <div className="mt-3 flex items-start gap-2 text-[12px] text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                  <AlertCircle size={13} className="shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <p className="text-[11px] text-[#1A1A1A]/30 text-center mt-4">
                Chapters are detected automatically from headings.
                Works best with Word documents using Heading styles.
              </p>
            </div>
          )}

          {/* ── Preview step ───────────────────────────────────────────── */}
          {step === "preview" && (
            <div className="p-5 space-y-4">

              {/* Project title */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#1A1A1A]/40 mb-1.5">
                  Project title
                </label>
                <input
                  autoFocus
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] text-[#1A1A1A] bg-[#F8F8F8] border border-black/[0.08] rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300"
                />
              </div>

              {/* Genre */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#1A1A1A]/40 mb-1.5">
                  Genre (optional)
                </label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] text-[#1A1A1A] bg-[#F8F8F8] border border-black/[0.08] rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-200 cursor-pointer"
                >
                  {GENRES.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>

              {/* Chapter list */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#1A1A1A]/40 mb-1.5">
                  Chapters detected
                </label>
                <div className="rounded-xl border border-black/[0.07] overflow-hidden max-h-[280px] overflow-y-auto">
                  {chapters.map((ch, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-3 py-2.5 border-b border-black/[0.04] last:border-0 hover:bg-black/[0.02] transition-colors"
                    >
                      <span className="text-[11px] font-mono text-[#1A1A1A]/30 w-6 shrink-0 text-right">
                        {i + 1}
                      </span>
                      <FileText size={12} className="text-[#1A1A1A]/25 shrink-0" />
                      <span className="flex-1 text-[13px] text-[#1A1A1A]/80 truncate">
                        {ch.title}
                      </span>
                      <span className="text-[11px] text-[#1A1A1A]/35 shrink-0">
                        {ch.words.toLocaleString()} words
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 text-[12px] text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                  <AlertCircle size={13} className="shrink-0 mt-0.5" />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* ── Importing step ──────────────────────────────────────────── */}
          {step === "importing" && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 size={28} className="text-violet-500 animate-spin" />
              <p className="text-sm font-medium text-[#1A1A1A]/60">
                Creating {chapters.length} chapter{chapters.length !== 1 ? "s" : ""}…
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== "importing" && (
          <div className="px-5 py-4 border-t border-black/[0.06] flex items-center justify-between">
            {step === "preview" ? (
              <button
                onClick={() => { setStep("upload"); setError(null); }}
                className="text-[13px] text-[#1A1A1A]/45 hover:text-[#1A1A1A]/70 transition-colors"
              >
                ← Back
              </button>
            ) : (
              <button
                onClick={onClose}
                className="text-[13px] text-[#1A1A1A]/45 hover:text-[#1A1A1A]/70 transition-colors"
              >
                Cancel
              </button>
            )}

            {step === "preview" && (
              <button
                onClick={handleImport}
                disabled={!title.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#1A1A1A] text-white text-[13px] font-semibold hover:bg-[#2A2A2A] disabled:opacity-40 transition-colors"
              >
                Create project
                <ChevronRight size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
