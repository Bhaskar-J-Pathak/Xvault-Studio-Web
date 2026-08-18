"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import EditProjectModal, { type ProjectForEdit } from "./edit-project-modal";

interface Props {
  project: ProjectForEdit;
}

export default function ProjectCardActions({ project }: Props) {
  const router = useRouter();
  const [menuOpen,      setMenuOpen]      = useState(false);
  const [editOpen,      setEditOpen]      = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting,      setDeleting]      = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handler(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  async function handleDelete() {
    setDeleting(true);
    const supabase = createClient();
    await supabase.from("projects").delete().eq("id", project.id);
    router.refresh();
  }

  if (confirmDelete) {
    return (
      <div className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
        <span className="text-[11px] text-[#71717A] dark:text-white/40">Delete?</span>
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
    );
  }

  return (
    <>
      <div ref={menuRef} className="relative" onClick={(e) => e.preventDefault()}>
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-[#A1A1AA] dark:text-white/25 hover:text-[#0F0F0F] dark:hover:text-white/60 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors opacity-0 group-hover:opacity-100"
        >
          <MoreHorizontal size={14} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-8 z-20 w-36 bg-white dark:bg-[#1a1a2e] border border-black/[0.07] dark:border-white/[0.07] rounded-xl shadow-lg dark:shadow-black/40 overflow-hidden py-1">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setEditOpen(true); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-[#71717A] dark:text-white/50 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] hover:text-[#0F0F0F] dark:hover:text-white/80 transition-colors"
            >
              <Pencil size={12} className="opacity-60" />
              Edit
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

      <EditProjectModal
        project={project}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />
    </>
  );
}
