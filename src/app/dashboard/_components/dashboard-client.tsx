"use client";

import { useState } from "react";
import { Plus, Upload } from "lucide-react";
import EditProjectModal from "./edit-project-modal";
import ImportModal from "./import-modal";

interface Props {
  isBeta?: boolean;
}

export default function DashboardClient({ isBeta = false }: Props) {
  const [newOpen,    setNewOpen]    = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={isBeta ? undefined : () => setImportOpen(true)}
          disabled={isBeta}
          title={isBeta ? "Import is not available during the beta" : undefined}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
            isBeta
              ? "border-black/[0.06] dark:border-white/[0.06] text-[#A1A1AA] dark:text-white/20 cursor-not-allowed"
              : "border-[#E4E4E7] dark:border-white/[0.08] text-[#71717A] dark:text-white/40 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] hover:text-[#0F0F0F] dark:hover:text-white/80"
          }`}
        >
          <Upload size={14} />
          Import
        </button>
        <button
          onClick={() => setNewOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F0F0F] dark:bg-white text-white dark:text-[#0E0C1B] text-sm font-semibold hover:bg-[#2A2A2A] dark:hover:bg-white/90 transition-colors"
        >
          <Plus size={15} />
          New project
        </button>
      </div>

      {/* New project uses EditProjectModal with project=null */}
      <EditProjectModal
        project={null}
        open={newOpen}
        onClose={() => setNewOpen(false)}
      />
      {importOpen && <ImportModal onClose={() => setImportOpen(false)} />}
    </>
  );
}
