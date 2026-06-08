"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import WorldBoardCanvas, { type WorldBoardCanvasHandle, type DBEntity } from "./world-board-canvas";
import ExtractionDebugger from "./extraction-debugger";
import EntityEditPanel from "./entity-edit-panel";

// ── Exported types (used by page.tsx) ─────────────────────────────────────────

export interface Chapter {
  id:       string;
  title:    string;
  position: number;
}

interface DBRelationship {
  id:        string;
  source_id: string;
  target_id: string;
  label:     string;
}

interface Props {
  initialEntities:      DBEntity[];
  initialRelationships: DBRelationship[];
  projectId:            string;
  chapters:             Chapter[];
}

type Tab = "canvas" | "debug";

// ── Main component ────────────────────────────────────────────────────────────

export default function WorldBoardView({
  initialEntities,
  initialRelationships,
  projectId,
  chapters,
}: Props) {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const showDebug    = searchParams.get("debug") === "1";
  const [tab,               setTab]               = useState<Tab>("canvas");
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [resetting,         setResetting]         = useState(false);
  const [reExtracting,      setReExtracting]      = useState(false);
  const [confirmOpen,       setConfirmOpen]       = useState(false);
  const [reExtractProgress, setReExtractProgress] = useState<string | null>(null);
  const [resetScope,        setResetScope]        = useState<"project" | string>("project");

  // Entity state — managed client-side for instant updates
  const [entities,         setEntities]         = useState<DBEntity[]>(initialEntities);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [creatingNew,      setCreatingNew]      = useState(false);

  const canvasRef = useRef<WorldBoardCanvasHandle>(null);

  // ── Chapter-scoped filtering ─────────────────────────────────────────────────

  const visibleEntities = selectedChapterId
    ? entities.filter((e) => e.first_seen_chapter_id === selectedChapterId)
    : entities;

  const visibleIds = new Set(visibleEntities.map((e) => e.id));

  const visibleRelationships = selectedChapterId
    ? initialRelationships.filter(
        (r) => visibleIds.has(r.source_id) && visibleIds.has(r.target_id)
      )
    : initialRelationships;

  // ── Entity edit callbacks ────────────────────────────────────────────────────

  const handleEntityClick = useCallback((id: string) => {
    setCreatingNew(false);
    setSelectedEntityId(id);
  }, []);

  const handleSaved = useCallback((updated: DBEntity) => {
    if (creatingNew) {
      setEntities((prev) => [...prev, updated]);
      canvasRef.current?.addEntity(updated);
    } else {
      setEntities((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      canvasRef.current?.updateEntity(updated);
    }
    setSelectedEntityId(null);
    setCreatingNew(false);
  }, [creatingNew]);

  const handleDeleted = useCallback((id: string) => {
    setEntities((prev) => prev.filter((e) => e.id !== id));
    canvasRef.current?.deleteEntity(id);
    setSelectedEntityId(null);
  }, []);

  const handlePanelClose = useCallback(() => {
    setSelectedEntityId(null);
    setCreatingNew(false);
  }, []);

  // ── Derived: entity for panel ────────────────────────────────────────────────

  const panelEntity = selectedEntityId
    ? (entities.find((e) => e.id === selectedEntityId) ?? null)
    : null;

  const panelOpen = selectedEntityId !== null || creatingNew;

  // ── Reset handler ────────────────────────────────────────────────────────────

  async function executeReset() {
    const isProject = resetScope === "project";
    const scopeBody = isProject ? { projectId } : { projectId, chapterId: resetScope };

    try {
      setResetting(true);
      const resetRes = await fetch("/api/studio/worldboard/reset", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(scopeBody),
      });
      if (!resetRes.ok) return;
      setResetting(false);

      setReExtracting(true);
      if (isProject) {
        setReExtractProgress("Re-extracting all chapters…");
      } else {
        const ch = chapters.find((c) => c.id === resetScope);
        setReExtractProgress(
          ch ? `Re-extracting Ch ${ch.position + 1} · ${ch.title}…` : "Re-extracting chapter…"
        );
      }

      await fetch("/api/ai/worldboard/reextract", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(scopeBody),
      });

      if (!isProject) setSelectedChapterId(null);
      router.refresh();
    } finally {
      setResetting(false);
      setReExtracting(false);
      setReExtractProgress(null);
      setConfirmOpen(false);
    }
  }

  function openConfirm(scope: "project" | string) {
    setResetScope(scope);
    setConfirmOpen(true);
  }

  // ── Confirmation modal scope label ───────────────────────────────────────────

  const scopeLabel =
    resetScope === "project"
      ? "the entire project"
      : `"${chapters.find((c) => c.id === resetScope)?.title ?? "this chapter"}"`;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar + controls */}
      <div className="shrink-0 flex items-center gap-1 px-4 pt-1.5 pb-0 border-b border-black/[0.06] bg-white">

        {/* Tabs */}
        <TabButton active={tab === "canvas"} onClick={() => setTab("canvas")}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-60">
            <circle cx="12" cy="5"  r="2" /><circle cx="5"  cy="19" r="2" /><circle cx="19" cy="19" r="2" />
            <line x1="12" y1="7" x2="5.5" y2="17" /><line x1="12" y1="7" x2="18.5" y2="17" />
          </svg>
          Canvas
        </TabButton>

        {showDebug && (
          <TabButton active={tab === "debug"} onClick={() => setTab("debug")}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-60">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            Debug
          </TabButton>
        )}

        {/* Right-side controls */}
        <div className="ml-auto flex items-center gap-2 pb-1.5">

          {/* Add entity button — canvas tab only */}
          {tab === "canvas" && (
            <button
              onClick={() => { setSelectedEntityId(null); setCreatingNew(true); }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-violet-600 border border-violet-200 bg-violet-50 hover:bg-violet-100 transition-colors"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add entity
            </button>
          )}

          {/* Chapter filter — canvas tab only */}
          {tab === "canvas" && chapters.length > 0 && (
            <div className="flex items-center gap-1.5">
              <select
                value={selectedChapterId ?? ""}
                onChange={(e) => setSelectedChapterId(e.target.value || null)}
                className="text-[11px] text-[#1A1A1A]/60 bg-white border border-black/[0.08] rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-violet-200 cursor-pointer"
              >
                <option value="">All chapters</option>
                {chapters.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    Ch {ch.position + 1} · {ch.title}
                  </option>
                ))}
              </select>

              {selectedChapterId && (
                <button
                  onClick={() => openConfirm(selectedChapterId)}
                  title="Reset this chapter's entities"
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-amber-600 border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                  Re-extract chapter
                </button>
              )}
            </div>
          )}

          {/* Full project reset */}
          {tab === "canvas" && (
            <button
              onClick={() => openConfirm("project")}
              title="Reset entire world board"
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-red-500 border border-red-200 bg-red-50 hover:bg-red-100 transition-colors"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
              Reset all
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative" style={{ minHeight: 0 }}>
        {tab === "canvas" ? (
          <WorldBoardCanvas
            key={selectedChapterId ?? "all"}
            ref={canvasRef}
            initialEntities={visibleEntities}
            initialRelationships={visibleRelationships}
            projectId={projectId}
            onEntityClick={handleEntityClick}
          />
        ) : showDebug ? (
          <ExtractionDebugger projectId={projectId} />
        ) : null}

        {/* Entity edit panel */}
        {panelOpen && (
          <EntityEditPanel
            projectId={projectId}
            entity={creatingNew ? null : panelEntity}
            onSaved={handleSaved}
            onDeleted={handleDeleted}
            onClose={handlePanelClose}
          />
        )}
      </div>

      {/* Confirm reset modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl px-6 py-5 max-w-sm w-full mx-4">
            <h2 className="text-sm font-semibold text-[#1A1A1A] mb-1">
              {resetScope === "project" ? "Reset entire World Board?" : "Re-extract this chapter?"}
            </h2>
            <p className="text-[12px] text-[#1A1A1A]/50 mb-5 leading-relaxed">
              This will clear all entities, relationships and plot threads for{" "}
              <span className="font-medium text-[#1A1A1A]/70">{scopeLabel}</span>{" "}
              and immediately re-extract them from the manuscript. This may take a minute.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-1.5 rounded-lg text-[12px] font-medium text-[#1A1A1A]/50 hover:text-[#1A1A1A]/70 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeReset}
                disabled={resetting}
                className="px-4 py-1.5 rounded-lg text-[12px] font-medium bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {resetting ? "Clearing…" : "Reset & re-extract"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Re-extraction progress overlay */}
      {reExtracting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl px-6 py-5 max-w-sm w-full mx-4 flex flex-col items-center gap-3">
            <svg className="animate-spin text-violet-500" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            <p className="text-[13px] font-medium text-[#1A1A1A]">
              {reExtractProgress ?? "Re-extracting…"}
            </p>
            <p className="text-[11px] text-[#1A1A1A]/40 text-center">
              Running AI extraction on your manuscript. This may take a minute.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab button ────────────────────────────────────────────────────────────────

function TabButton({
  active, onClick, children,
}: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-t-lg border-b-2 transition-colors ${
        active
          ? "border-violet-500 text-violet-600 bg-violet-50/50"
          : "border-transparent text-[#1A1A1A]/40 hover:text-[#1A1A1A]/60 hover:bg-black/[0.03]"
      }`}
    >
      {children}
    </button>
  );
}
