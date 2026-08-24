"use client";

import { useState } from "react";
import { Plus, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import ImportModal from "./import-modal";

interface Props {
  isBeta?: boolean;
}

export default function DashboardClient({ isBeta = false }: Props) {
  const router = useRouter();
  const [importOpen, setImportOpen] = useState(false);
  const [creating,   setCreating]   = useState(false);

  async function handleNewProject() {
    if (creating) return;
    setCreating(true);
    try {
      const res  = await fetch("/api/projects", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ title: "Untitled" }),
      });
      const json = await res.json() as { id?: string; error?: string };
      if (!res.ok || !json.id) throw new Error(json.error ?? "Could not create project.");
      router.push(`/studio/${json.id}`);
    } catch {
      setCreating(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-1.5">
        <button
          onClick={isBeta ? undefined : () => setImportOpen(true)}
          disabled={isBeta}
          title={isBeta ? "Import is not available during the beta" : undefined}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
            isBeta
              ? "text-[#C4C4C7] dark:text-white/20 cursor-not-allowed"
              : "text-[#71717A] dark:text-white/40 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] hover:text-[#0F0F0F] dark:hover:text-white/80"
          }`}
        >
          <Upload size={13} />
          Import
        </button>
        <button
          onClick={handleNewProject}
          disabled={creating}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F0F0F] dark:bg-white/[0.08] text-white dark:text-white/80 text-[13px] font-medium hover:bg-[#2A2A2A] dark:hover:bg-white/[0.12] disabled:opacity-40 transition-colors"
        >
          <Plus size={14} />
          {creating ? "Creating…" : "New"}
        </button>
      </div>

      {importOpen && <ImportModal onClose={() => setImportOpen(false)} />}
    </>
  );
}
