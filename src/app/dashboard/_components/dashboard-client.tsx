"use client";

import { useState } from "react";
import { ArrowRight, FilePlus2, Upload } from "lucide-react";
import ImportModal from "./import-modal";
import EditProjectModal from "./edit-project-modal";
import { usePostHog } from "posthog-js/react";

interface Props {
  isBeta?: boolean;
  autoOpenImport?: boolean;
  modalOnly?: boolean;
}

export default function DashboardClient({ isBeta = false, autoOpenImport = false, modalOnly = false }: Props) {
  const ph = usePostHog();
  const [importOpen, setImportOpen] = useState(autoOpenImport && !isBeta);
  const [newProjectOpen, setNewProjectOpen] = useState(false);

  return (
    <>
      {!modalOnly && <div className="grid w-full max-w-[520px] grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={isBeta ? undefined : () => {
            ph?.capture("first_session_path_selected", { path: "import_manuscript" });
            setImportOpen(true);
          }}
          disabled={isBeta}
          title={isBeta ? "Import is not available during the beta" : undefined}
          className={`group flex items-center gap-3 rounded-2xl border px-4 py-4 text-left transition-all ${
            isBeta
              ? "text-[#C4C4C7] dark:text-white/20 cursor-not-allowed"
              : "border-violet-200 bg-violet-50/60 text-[#0F0F0F] hover:border-violet-300 hover:bg-violet-50 dark:border-violet-500/25 dark:bg-violet-500/10 dark:text-white/90"
          }`}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white">
            <Upload size={16} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-semibold">Import manuscript</span>
            <span className="mt-0.5 block text-[11px] text-[#71717A] dark:text-white/45">See what Xvault finds</span>
          </span>
          <ArrowRight size={14} className="text-violet-500 transition-transform group-hover:translate-x-0.5" />
        </button>
        <button
          onClick={() => {
            ph?.capture("first_session_path_selected", { path: "blank_project" });
            setNewProjectOpen(true);
          }}
          className="group flex items-center gap-3 rounded-2xl border border-black/[0.08] bg-white px-4 py-4 text-left text-[#0F0F0F] shadow-sm transition-all hover:border-black/[0.15] hover:shadow-md disabled:opacity-40 dark:border-white/[0.10] dark:bg-white/[0.05] dark:text-white/90"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0F0F0F] text-white dark:bg-white/10">
            <FilePlus2 size={16} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-semibold">Start something new</span>
            <span className="mt-0.5 block text-[11px] text-[#71717A] dark:text-white/45">Name and set up your manuscript</span>
          </span>
          <ArrowRight size={14} className="text-[#A1A1AA] transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>}

      {importOpen && <ImportModal onClose={() => setImportOpen(false)} />}
      <EditProjectModal
        project={null}
        open={newProjectOpen}
        onClose={() => setNewProjectOpen(false)}
      />
    </>
  );
}
