"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import EditProjectModal from "./edit-project-modal";

export default function NewProjectCard() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group w-full text-left transition-transform duration-300 hover:-translate-y-1.5"
      >
        {/* Portrait book shape */}
        <div
          className="relative aspect-[2/3] overflow-hidden rounded-[4px]
            flex items-center justify-center
            border-2 border-dashed border-black/[0.12] dark:border-white/[0.18]
            bg-black/[0.02] dark:bg-white/[0.03]
            group-hover:border-black/[0.22] dark:group-hover:border-white/[0.32]
            group-hover:bg-black/[0.04] dark:group-hover:bg-white/[0.06]
            transition-all duration-300"
        >
          <div
            className="w-10 h-10 rounded-2xl bg-white dark:bg-white/[0.10]
              shadow-sm ring-1 ring-black/[0.06] dark:ring-white/[0.12]
              flex items-center justify-center
              group-hover:scale-110 transition-transform duration-300"
          >
            <Plus size={16} className="text-[#A1A1AA] dark:text-white/55 group-hover:text-[#71717A] dark:group-hover:text-white/75 transition-colors" />
          </div>
        </div>

        {/* Label below — mirrors ProjectCard text layout */}
        <div className="mt-3 px-0.5">
          <p className="text-[13px] font-semibold text-[#A1A1AA] dark:text-white/50 group-hover:text-[#0F0F0F] dark:group-hover:text-white/75 transition-colors">
            New project
          </p>
          <p className="text-[11px] text-transparent select-none">·</p>
        </div>
      </button>

      <EditProjectModal
        project={null}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
