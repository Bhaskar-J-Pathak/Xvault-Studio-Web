"use client";

import { useState } from "react";
import { X, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import type { EditPlan, ParagraphEdit } from "@/app/api/ai/coauthor/edit/analyze/route";

interface Props {
  plan:      EditPlan;
  projectId: string;
  onDone:    (summary: string) => void;
  onCancel:  () => void;
}

export default function EditPreviewModal({ plan, projectId, onDone, onCancel }: Props) {
  // All edits approved by default — writer skips what they don't want
  const [approved, setApproved] = useState<Set<number>>(
    new Set(plan.edits.map((_, i) => i))
  );
  const [applying, setApplying] = useState(false);

  function toggle(i: number) {
    setApproved((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  async function handleApply() {
    const selectedEdits: ParagraphEdit[] = plan.edits.filter((_, i) => approved.has(i));
    if (!selectedEdits.length) {
      onCancel();
      return;
    }

    setApplying(true);
    try {
      const res = await fetch("/api/ai/coauthor/edit/apply", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          projectId,
          chapterId: plan.chapterId,
          edits:     selectedEdits,
        }),
      });
      const data = await res.json() as { applied: number; skipped: number };
      const summary =
        data.applied > 0
          ? `Applied ${data.applied} edit${data.applied !== 1 ? "s" : ""} to "${plan.chapterTitle}".`
          : "No edits could be applied. The chapter may have changed since the analysis.";
      onDone(summary);
    } catch {
      onDone("Something went wrong while applying edits. Please try again.");
    } finally {
      setApplying(false);
    }
  }

  const totalSelected = approved.size;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">
              Line edit: {plan.chapterTitle}
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">{plan.summary}</p>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 transition-colors rounded"
          >
            <X size={16} />
          </button>
        </div>

        {/* Edit list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {plan.edits.length === 0 ? (
            <div className="text-center py-10 text-sm text-neutral-500">
              The prose in this chapter is already tight. No changes needed.
            </div>
          ) : (
            plan.edits.map((edit, i) => (
              <EditCard
                key={i}
                edit={edit}
                approved={approved.has(i)}
                onToggle={() => toggle(i)}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onCancel}
            className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            Cancel
          </button>
          <div className="flex items-center gap-3">
            {plan.edits.length > 0 && (
              <span className="text-xs text-neutral-400">
                {totalSelected} of {plan.edits.length} selected
              </span>
            )}
            <button
              onClick={handleApply}
              disabled={applying || totalSelected === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {applying ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Applying…
                </>
              ) : totalSelected === 0 ? (
                "Nothing selected"
              ) : (
                `Apply ${totalSelected} edit${totalSelected !== 1 ? "s" : ""}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Edit card ────────────────────────────────────────────────────────────────

function EditCard({
  edit,
  approved,
  onToggle,
}: {
  edit:     ParagraphEdit;
  approved: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`rounded-xl border transition-colors ${
        approved
          ? "border-neutral-200 bg-white"
          : "border-neutral-100 bg-neutral-50 opacity-50"
      }`}
    >
      <div className="flex items-start gap-3 px-3 py-3">
        {/* Toggle */}
        <button onClick={onToggle} className="flex-shrink-0 mt-0.5">
          {approved ? (
            <CheckCircle2 size={16} className="text-green-500" />
          ) : (
            <XCircle size={16} className="text-neutral-300" />
          )}
        </button>

        <div className="flex-1 min-w-0 space-y-2">
          {/* Reason */}
          <p className="text-[11px] text-neutral-400 font-medium uppercase tracking-wide">
            {edit.reason}
          </p>

          {/* Before */}
          <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-2">
            <p className="text-[10px] text-red-400 font-medium mb-1">Before</p>
            <p className="text-sm text-neutral-700 leading-relaxed">{edit.original}</p>
          </div>

          {/* After */}
          <div className="rounded-lg bg-green-50 border border-green-100 px-3 py-2">
            <p className="text-[10px] text-green-600 font-medium mb-1">After</p>
            <p className="text-sm text-neutral-800 leading-relaxed font-medium">{edit.rewritten}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
