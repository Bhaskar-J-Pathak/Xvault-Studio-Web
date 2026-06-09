"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
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
} from "lucide-react";
import { createClient } from "@/lib/supabase";
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
}

function formatWords(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n > 0 ? n.toString() : "";
}

export default function StudioSidebar({
  projectId,
  projectTitle,
  initialChapters,
}: Props) {
  const router   = useRouter();
  const params   = useParams<{ chapterId?: string }>();
  const pathname = usePathname();
  const activeId = params.chapterId;

  const [chapters,       setChapters]       = useState<Chapter[]>(initialChapters);
  const [openMenuId,     setOpenMenuId]     = useState<string | null>(null);
  const [renamingId,     setRenamingId]     = useState<string | null>(null);
  const [renameValue,    setRenameValue]    = useState("");
  const [addingChapter,  setAddingChapter]  = useState(false);

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
      if (chapters.length <= 1) return; // never delete the last chapter

      const remaining = chapters.filter((c) => c.id !== id);
      setChapters(remaining);

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
    <aside className="w-[210px] shrink-0 flex flex-col h-screen bg-[#F7F6F4] border-r border-black/[0.06]">
      {/* Back to dashboard */}
      <div className="px-3 pt-4 pb-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-xs text-[#1A1A1A]/45 hover:text-[#1A1A1A]/70 transition-colors"
        >
          <ArrowLeft size={12} />
          Dashboard
        </Link>
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

      <div className="mx-3 h-px bg-black/[0.06] mb-2" />

      {/* Views */}
      <div className="px-2 pb-2 space-y-0.5">
        <Link
          id="tutorial-worldboard-link"
          href={`/studio/${projectId}/worldboard`}
          className={`flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-colors ${
            pathname === `/studio/${projectId}/worldboard`
              ? "bg-[#1A1A1A] text-white"
              : "text-[#1A1A1A]/65 hover:bg-black/[0.05] hover:text-[#1A1A1A]"
          }`}
        >
          <Network size={13} />
          World Board
        </Link>
        <Link
          id="tutorial-bible-link"
          href={`/studio/${projectId}/bible`}
          className={`flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-colors ${
            pathname === `/studio/${projectId}/bible`
              ? "bg-[#1A1A1A] text-white"
              : "text-[#1A1A1A]/65 hover:bg-black/[0.05] hover:text-[#1A1A1A]"
          }`}
        >
          <ScrollText size={13} />
          Story Bible
        </Link>
      </div>

      <div className="mx-3 h-px bg-black/[0.06] mb-2" />

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
                      ? "bg-[#1A1A1A] text-white"
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
                      setOpenMenuId(openMenuId === chapter.id ? null : chapter.id);
                    }}
                    className={`p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                      isActive ? "text-white/60 hover:text-white" : "text-[#1A1A1A]/40 hover:text-[#1A1A1A]"
                    }`}
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
                    <button
                      onClick={() => handleDelete(chapter.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add chapter + Export + Feedback */}
      <div className="px-3 py-3 border-t border-black/[0.06] space-y-0.5">
        <button
          onClick={handleAddChapter}
          disabled={addingChapter}
          className="w-full flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-[#1A1A1A]/50 hover:text-[#1A1A1A] hover:bg-black/[0.05] disabled:opacity-40 transition-colors"
        >
          <Plus size={14} />
          {addingChapter ? "Adding…" : "New chapter"}
        </button>
        <ExportMenu projectId={projectId} />
        <FeedbackButton />
      </div>
    </aside>
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
        <div className="absolute bottom-full left-0 mb-1 w-48 rounded-xl border border-black/[0.08] bg-white shadow-lg py-1 z-50">
          {FORMATS.map((fmt) => (
            <a
              key={fmt.mime}
              href={`/api/studio/export?projectId=${projectId}&format=${fmt.mime}`}
              download
              onClick={() => setOpen(false)}
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
