"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Trash2, Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase";

interface Props {
  projectId: string;
  projectTitle: string;
}

export default function ProjectCardActions({ projectId, projectTitle }: Props) {
  const router = useRouter();
  const [menuOpen,      setMenuOpen]      = useState(false);
  const [renaming,      setRenaming]      = useState(false);
  const [renameValue,   setRenameValue]   = useState(projectTitle);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting,      setDeleting]      = useState(false);
  const menuRef  = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handler(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  useEffect(() => {
    if (renaming) inputRef.current?.select();
  }, [renaming]);

  async function commitRename() {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === projectTitle) { setRenaming(false); return; }
    const supabase = createClient();
    await supabase.from("projects").update({ title: trimmed }).eq("id", projectId);
    setRenaming(false);
    router.refresh();
  }

  async function handleDelete() {
    setDeleting(true);
    const supabase = createClient();
    await supabase.from("projects").delete().eq("id", projectId);
    router.refresh();
  }

  if (renaming) {
    return (
      <div className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
        <input
          ref={inputRef}
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); commitRename(); }
            if (e.key === "Escape") { setRenaming(false); setRenameValue(projectTitle); }
          }}
          className="flex-1 min-w-0 px-2 py-1 text-xs rounded-lg border border-violet-300/70 dark:border-violet-500/40 focus:outline-none focus:ring-2 focus:ring-violet-200/60 dark:focus:ring-violet-700/40 bg-white dark:bg-white/[0.05] text-[#0F0F0F] dark:text-[#EDEBF0]"
        />
        <button
          onClick={commitRename}
          className="w-6 h-6 flex items-center justify-center rounded-md text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
        >
          <Check size={13} />
        </button>
        <button
          onClick={() => { setRenaming(false); setRenameValue(projectTitle); }}
          className="w-6 h-6 flex items-center justify-center rounded-md text-[#A1A1AA] dark:text-white/30 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors"
        >
          <X size={13} />
        </button>
      </div>
    );
  }

  if (confirmDelete) {
    return (
      <div className="flex items-center justify-between gap-1" onClick={(e) => e.preventDefault()}>
        <span className="text-[11px] text-[#71717A] dark:text-white/40">Delete project?</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setConfirmDelete(false)}
            className="px-2 py-1 text-[11px] font-medium text-[#71717A] dark:text-white/40 hover:text-[#0F0F0F] dark:hover:text-white/70 rounded-lg transition-colors"
          >
            No
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-2 py-1 text-[11px] font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
          >
            {deleting ? "…" : "Yes"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={menuRef} className="relative" onClick={(e) => e.preventDefault()}>
      <button
        onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-[#A1A1AA] dark:text-white/25 hover:text-[#0F0F0F] dark:hover:text-white/60 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors opacity-0 group-hover:opacity-100"
      >
        <MoreHorizontal size={14} />
      </button>

      {menuOpen && (
        <div className="absolute right-0 top-8 z-20 w-36 bg-white dark:bg-[#161329] border border-black/[0.07] dark:border-white/[0.07] rounded-xl shadow-lg dark:shadow-black/40 overflow-hidden py-1">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setRenaming(true); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-[#71717A] dark:text-white/50 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] hover:text-[#0F0F0F] dark:hover:text-white/80 transition-colors"
          >
            <Pencil size={12} className="opacity-60" />
            Rename
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setConfirmDelete(true); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 size={12} className="opacity-80" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
