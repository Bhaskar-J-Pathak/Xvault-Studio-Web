"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import {
  ArrowLeft,
  Plus,
  BookOpen,
  MoreHorizontal,
  Trash2,
  Pencil,
  Check,
  X,
  Network,
  ScrollText,
  Download,
  Upload,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { textToLexical } from "@/lib/text-to-lexical";
import FeedbackButton from "@/components/feedback-button";

interface Chapter {
  id: string;
  title: string;
  word_count: number;
  position: number;
}

interface Props {
  projectId: string;
  projectTitle: string;
  initialChapters: Chapter[];
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

function formatWords(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n > 0 ? n.toString() : "";
}

export default function StudioSidebar({
  projectId,
  projectTitle,
  initialChapters,
  isMobileOpen,
  onMobileClose,
}: Props) {
  const router   = useRouter();
  const params   = useParams<{ chapterId?: string }>();
  const pathname = usePathname();
  const activeId = params.chapterId;
  const ph = usePostHog();

  const [chapters,         setChapters]         = useState<Chapter[]>(initialChapters);
  const [openMenuId,       setOpenMenuId]       = useState<string | null>(null);
  const [renamingId,       setRenamingId]       = useState<string | null>(null);
  const [renameValue,      setRenameValue]      = useState("");
  const [addingChapter,    setAddingChapter]    = useState(false);
  const [confirmDeleteId,  setConfirmDeleteId]  = useState<string | null>(null);

  // ── Add chapter ────────────────────────────────────────────────
  const handleAddChapter = useCallback(async () => {
    if (addingChapter) return;
    setAddingChapter(true);
    try {
      const supabase = createClient();
      const nextPos  = chapters.length > 0
        ? Math.max(...chapters.map((c) => c.position)) + 1
        : 0;

      const { data, error } = await supabase
        .from("chapters")
        .insert({
          project_id: projectId,
          title:      `Chapter ${chapters.length + 1}`,
          position:   nextPos,
        })
        .select("id, title, word_count, position")
        .single();

      if (error || !data) throw error;

      ph?.capture("chapter_created", { total_chapters: chapters.length + 1 });
      setChapters((prev) => [...prev, data]);
      router.push(`/studio/${projectId}/${data.id}`);
    } catch {
      // silent — chapter list will still be consistent
    } finally {
      setAddingChapter(false);
    }
  }, [addingChapter, chapters, projectId, router]);

  // ── Rename chapter ──────────────────────────────────────────────
  const startRename = (chapter: Chapter) => {
    setOpenMenuId(null);
    setRenamingId(chapter.id);
    setRenameValue(chapter.title);
  };

  const commitRename = useCallback(
    async (id: string) => {
      const trimmed = renameValue.trim();
      if (!trimmed) { setRenamingId(null); return; }

      setChapters((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: trimmed } : c))
      );
      setRenamingId(null);

      const supabase = createClient();
      await supabase.from("chapters").update({ title: trimmed }).eq("id", id);
    },
    [renameValue]
  );

  // ── Delete chapter ──────────────────────────────────────────────
  const handleDelete = useCallback(
    async (id: string) => {
      setOpenMenuId(null);
      setConfirmDeleteId(null);
      if (chapters.length <= 1) return; // never delete the last chapter

      const remaining = chapters.filter((c) => c.id !== id);
      setChapters(remaining);

      ph?.capture("chapter_deleted");
      const supabase = createClient();
      await supabase.from("chapters").delete().eq("id", id);

      // If we deleted the active chapter, navigate to the first remaining one
      if (id === activeId) {
        router.push(`/studio/${projectId}/${remaining[0].id}`);
      } else {
        router.refresh();
      }
    },
    [chapters, activeId, projectId, router]
  );

  return (
    <aside className={`studio-sidebar
      fixed inset-y-0 left-0 z-50 w-[210px] shrink-0 flex flex-col h-[100dvh]
      bg-[#F7F6F4] border-r border-black/[0.06]
      transition-transform duration-300 ease-in-out
      md:relative md:translate-x-0 md:z-auto
      ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
    `}>
      {/* Back to dashboard */}
      <div className="px-3 pt-4 pb-2 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-xs text-[#1A1A1A]/45 hover:text-[#1A1A1A]/70 transition-colors"
        >
          <ArrowLeft size={12} />
          Dashboard
        </Link>
        <button
          onClick={onMobileClose}
          className="md:hidden p-1 rounded-lg text-[#1A1A1A]/30 hover:text-[#1A1A1A]/60 hover:bg-black/[0.05] transition-colors"
          aria-label="Close"
        >
          <X size={13} />
        </button>
      </div>

      {/* Project title */}
      <div className="px-4 pb-3 pt-1">
        <div className="flex items-center gap-2">
          <BookOpen size={13} className="text-[#1A1A1A]/40 shrink-0" />
          <p className="text-sm font-semibold text-[#1A1A1A] truncate leading-snug">
            {projectTitle}
          </p>
        </div>
      </div>

      <div className="sb-divider mx-3 h-px bg-black/[0.06] mb-2" />

      {/* Views */}
      <div className="px-2 pb-2 space-y-0.5">
        <Link
          href={`/studio/${projectId}/worldboard`}
          className={`flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-colors ${
            pathname === `/studio/${projectId}/worldboard`
              ? "sb-active bg-[#1A1A1A] text-white"
              : "text-[#1A1A1A]/65 hover:bg-black/[0.05] hover:text-[#1A1A1A]"
          }`}
        >
          <Network size={13} />
          World Board
        </Link>
        <Link
          href={`/studio/${projectId}/bible`}
          className={`flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-colors ${
            pathname === `/studio/${projectId}/bible`
              ? "sb-active bg-[#1A1A1A] text-white"
              : "text-[#1A1A1A]/65 hover:bg-black/[0.05] hover:text-[#1A1A1A]"
          }`}
        >
          <ScrollText size={13} />
          Story Bible
        </Link>
      </div>

      <div className="sb-divider mx-3 h-px bg-black/[0.06] mb-2" />

      {/* Chapter list */}
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
        <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-[#1A1A1A]/35">
          Chapters
        </p>

        {chapters.map((chapter) => {
          const isActive  = chapter.id === activeId;
          const isRenaming = renamingId === chapter.id;

          return (
            <div key={chapter.id} className="relative group">
              {isRenaming ? (
                <div className="flex items-center gap-1 px-2 py-1.5">
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter")  commitRename(chapter.id);
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    className="flex-1 min-w-0 text-sm bg-white rounded-lg px-2 py-0.5 border border-violet-300 outline-none text-[#1A1A1A]"
                  />
                  <button onClick={() => commitRename(chapter.id)} className="text-green-600 hover:text-green-700">
                    <Check size={13} />
                  </button>
                  <button onClick={() => setRenamingId(null)} className="text-[#1A1A1A]/40 hover:text-[#1A1A1A]">
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <Link
                  href={`/studio/${projectId}/${chapter.id}`}
                  onClick={() => setOpenMenuId(null)}
                  className={`flex items-center justify-between px-2 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "sb-active bg-[#1A1A1A] text-white"
                      : "text-[#1A1A1A]/65 hover:bg-black/[0.05] hover:text-[#1A1A1A]"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate leading-snug">
                      {chapter.title}
                    </p>
                    {chapter.word_count > 0 && (
                      <p className={`text-[11px] mt-0.5 ${isActive ? "text-white/50" : "text-[#1A1A1A]/35"}`}>
                        {formatWords(chapter.word_count)} words
                      </p>
                    )}
                  </div>

                  {/* Context menu trigger */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setConfirmDeleteId(null);
                      setOpenMenuId(openMenuId === chapter.id ? null : chapter.id);
                    }}
                    className={`p-0.5 rounded transition-opacity ${
                      isActive ? "text-white/60 hover:text-white" : "text-[#1A1A1A]/40 hover:text-[#1A1A1A]"
                    } opacity-100 md:opacity-0 md:group-hover:opacity-100`}
                  >
                    <MoreHorizontal size={13} />
                  </button>
                </Link>
              )}

              {/* Context menu */}
              {openMenuId === chapter.id && !isRenaming && (
                <div className="absolute right-0 top-full mt-1 z-10 bg-white rounded-xl border border-black/[0.08] shadow-lg py-1 w-36">
                  <button
                    onClick={() => startRename(chapter)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#1A1A1A]/70 hover:bg-black/[0.04] hover:text-[#1A1A1A] transition-colors"
                  >
                    <Pencil size={13} />
                    Rename
                  </button>
                  {chapters.length > 1 && (
                    confirmDeleteId === chapter.id ? (
                      <div className="px-3 py-2 space-y-1.5">
                        <p className="text-[11px] text-[#1A1A1A]/50">Delete this chapter?</p>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleDelete(chapter.id)}
                            className="flex-1 text-xs py-1 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors font-medium"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="flex-1 text-xs py-1 rounded-lg border border-black/[0.08] text-[#1A1A1A]/60 hover:bg-black/[0.04] transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(chapter.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={13} />
                        Delete
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add chapter + Import + Export + Feedback */}
      <div className="sb-footer px-3 py-3 border-t border-black/[0.06] space-y-0.5">
        <button
          onClick={handleAddChapter}
          disabled={addingChapter}
          className="w-full flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-[#1A1A1A]/50 hover:text-[#1A1A1A] hover:bg-black/[0.05] disabled:opacity-40 transition-colors"
        >
          <Plus size={14} />
          {addingChapter ? "Adding…" : "New chapter"}
        </button>
        <ImportMenu
          projectId={projectId}
          chapters={chapters}
          onChaptersAdded={(added) => {
            setChapters((prev) => [...prev, ...added]);
            router.push(`/studio/${projectId}/${added[0].id}`);
          }}
        />
        <ExportMenu projectId={projectId} />
        <FeedbackButton />
      </div>
    </aside>
  );
}

// ── Import chapter picker ─────────────────────────────────────────────────────

interface ParsedChapterPreview {
  title:    string;
  body:     string;
  words:    number;
  selected: boolean;
}

function ImportMenu({
  projectId,
  chapters: existingChapters,
  onChaptersAdded,
}: {
  projectId: string;
  chapters:  Chapter[];
  onChaptersAdded: (added: Chapter[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef  = useRef<HTMLDivElement>(null);
  const ph = usePostHog();

  type Stage = "idle" | "parsing" | "preview" | "importing";
  const [stage,   setStage]   = useState<Stage>("idle");
  const [preview, setPreview] = useState<ParsedChapterPreview[]>([]);
  const [error,   setError]   = useState<string | null>(null);

  // Close preview on outside click
  useEffect(() => {
    if (stage !== "preview") return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setStage("idle");
        setPreview([]);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [stage]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ""; // allow re-selecting same file
    setError(null);
    setStage("parsing");

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res  = await fetch("/api/studio/import", { method: "POST", body: fd });
      const data = await res.json() as {
        chapters?: { title: string; body: string; words: number }[];
        error?: string;
      };
      if (!res.ok) { setError(data.error ?? "Failed to read file."); setStage("idle"); return; }

      const chapters = data.chapters ?? [];
      if (chapters.length === 0) { setError("No content found in file."); setStage("idle"); return; }

      if (chapters.length === 1) {
        // Single chapter — import straight away, no preview needed
        await doImport(chapters);
      } else {
        setPreview(chapters.map((c) => ({ ...c, selected: true })));
        setStage("preview");
      }
    } catch {
      setError("Something went wrong. Try again.");
      setStage("idle");
    }
  }

  async function doImport(toImport: { title: string; body: string }[]) {
    setStage("importing");
    try {
      const supabase = createClient();
      const nextPos  = existingChapters.length > 0
        ? Math.max(...existingChapters.map((c) => c.position)) + 1
        : 0;

      const rows = toImport.map((ch, i) => ({
        project_id: projectId,
        title:      ch.title,
        position:   nextPos + i,
        content:    textToLexical(ch.body),
        word_count: ch.body.split(/\s+/).filter(Boolean).length,
      }));

      const { data, error: dbErr } = await supabase
        .from("chapters")
        .insert(rows)
        .select("id, title, word_count, position");

      if (dbErr || !data) throw dbErr;

      ph?.capture("chapters_imported", { chapter_count: rows.length });
      setStage("idle");
      setPreview([]);
      onChaptersAdded(data as Chapter[]);
    } catch {
      setError("Import failed. Try again.");
      setStage("idle");
    }
  }

  const busy = stage === "parsing" || stage === "importing";
  const selectedCount = preview.filter((c) => c.selected).length;

  return (
    <div ref={menuRef} className="relative">
      <input
        ref={inputRef}
        type="file"
        accept=".txt,.docx"
        className="hidden"
        onChange={handleFile}
      />

      <button
        onClick={() => { setError(null); inputRef.current?.click(); }}
        disabled={busy}
        className="w-full flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-[#1A1A1A]/40 hover:text-[#1A1A1A]/70 hover:bg-black/[0.05] disabled:opacity-40 transition-colors"
      >
        {busy
          ? <Loader2 size={14} className="animate-spin" />
          : <Upload size={14} />
        }
        {stage === "parsing"   ? "Reading…"
         : stage === "importing" ? "Importing…"
         : "Import chapter"}
      </button>

      {error && (
        <p className="px-3 pb-1 text-[10px] text-red-500 leading-tight">{error}</p>
      )}

      {stage === "preview" && preview.length > 0 && (
        <div className="absolute bottom-full left-0 mb-1 w-64 rounded-xl border border-black/[0.08] bg-white shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-black/[0.06]">
            <span className="text-[10px] font-semibold text-[#A1A1AA] uppercase tracking-widest">
              {preview.length} chapters detected
            </span>
            <button
              onClick={() => {
                const allSelected = preview.every((c) => c.selected);
                setPreview((p) => p.map((c) => ({ ...c, selected: !allSelected })));
              }}
              className="text-[10px] text-[#1A1A1A]/40 hover:text-[#1A1A1A] transition-colors"
            >
              {preview.every((c) => c.selected) ? "Deselect all" : "Select all"}
            </button>
          </div>

          {/* Chapter list */}
          <div className="max-h-48 overflow-y-auto py-1">
            {preview.map((ch, i) => (
              <label
                key={i}
                className="flex items-start gap-2.5 px-3 py-1.5 hover:bg-black/[0.03] cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={ch.selected}
                  onChange={() =>
                    setPreview((p) =>
                      p.map((c, j) => j === i ? { ...c, selected: !c.selected } : c)
                    )
                  }
                  className="mt-0.5 shrink-0 accent-[#1A1A1A]"
                />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[#1A1A1A] truncate leading-snug">{ch.title}</p>
                  <p className="text-[10px] text-[#A1A1AA]">{ch.words.toLocaleString()} words</p>
                </div>
              </label>
            ))}
          </div>

          {/* Footer */}
          <div className="px-3 py-2.5 border-t border-black/[0.06] flex gap-2">
            <button
              onClick={() => {
                const selected = preview.filter((c) => c.selected);
                if (selected.length > 0) doImport(selected);
              }}
              disabled={selectedCount === 0}
              className="flex-1 text-xs py-1.5 rounded-lg bg-[#1A1A1A] text-white hover:bg-[#333] disabled:opacity-40 transition-colors font-medium"
            >
              Import {selectedCount > 0 ? `${selectedCount} ` : ""}chapter{selectedCount !== 1 ? "s" : ""}
            </button>
            <button
              onClick={() => { setStage("idle"); setPreview([]); }}
              className="text-xs py-1.5 px-2.5 rounded-lg border border-black/[0.08] text-[#1A1A1A]/60 hover:bg-black/[0.04] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Export format picker ──────────────────────────────────────────────────────

const FORMATS = [
  { label: "Word Document",  ext: "docx", mime: "docx" },
  { label: "EPUB",           ext: "epub", mime: "epub" },
  { label: "PDF",            ext: "pdf",  mime: "pdf"  },
  { label: "Plain Text",     ext: "txt",  mime: "txt"  },
] as const;

function ExportMenu({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const ph = usePostHog();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-[#1A1A1A]/40 hover:text-[#1A1A1A]/70 hover:bg-black/[0.05] transition-colors"
      >
        <Download size={14} />
        Export
      </button>

      {open && (
        <div className="export-dropdown absolute bottom-full left-0 mb-1 w-48 rounded-xl border border-black/[0.08] bg-white shadow-lg py-1 z-50">
          {FORMATS.map((fmt) => (
            <a
              key={fmt.mime}
              href={`/api/studio/export?projectId=${projectId}&format=${fmt.mime}`}
              download
              onClick={() => { ph?.capture("manuscript_exported", { format: fmt.ext }); setOpen(false); }}
              className="flex items-center justify-between px-3 py-2 text-sm text-[#1A1A1A]/60 hover:bg-black/[0.04] hover:text-[#1A1A1A] transition-colors"
            >
              <span>{fmt.label}</span>
              <span className="text-[11px] font-mono text-[#1A1A1A]/25">.{fmt.ext}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
