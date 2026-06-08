"use client";

import { useState } from "react";
import { X, CheckCircle2, XCircle, AlertTriangle, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import type { ChangePlan, ChangeItem, FlaggedItem } from "@/app/api/ai/coauthor/global-change/route";

interface Props {
  plan: ChangePlan;
  projectId: string;
  coauthorName: string;
  onDone: (summary: string) => void;
  onCancel: () => void;
}

export default function GlobalChangePreview({
  plan,
  projectId,
  coauthorName,
  onDone,
  onCancel,
}: Props) {
  // Track which changes are approved (all clear ones by default)
  const [approved, setApproved] = useState<Set<number>>(
    new Set(plan.changes.map((_, i) => i))
  );
  // Flagged items default to skipped — writer must explicitly approve
  const [approvedFlagged, setApprovedFlagged] = useState<Set<number>>(new Set());
  const [applying, setApplying] = useState(false);
  const [expandedContexts, setExpandedContexts] = useState<Set<string>>(new Set());

  function toggleApproved(i: number) {
    setApproved((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  function toggleFlagged(i: number) {
    setApprovedFlagged((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  function toggleContext(key: string) {
    setExpandedContexts((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  async function handleApply() {
    const approvedChanges: ChangeItem[] = [
      ...plan.changes.filter((_, i) => approved.has(i)),
      ...plan.flagged
        .filter((_, i) => approvedFlagged.has(i))
        .map((f) => ({
          chapterId: f.chapterId,
          chapterTitle: f.chapterTitle,
          original: f.passage,
          replacement: deriveReplacement(f.passage, plan),
          context: f.passage,
          confidence: "flagged" as const,
          verified: false,
        })),
    ];

    if (!approvedChanges.length) {
      onCancel();
      return;
    }

    setApplying(true);
    try {
      const res = await fetch("/api/ai/coauthor/global-change/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, changes: approvedChanges }),
      });
      const data = await res.json() as {
        applied: number;
        skipped: number;
        details: string[];
      };

      const summary =
        data.applied > 0
          ? `Applied ${data.applied} change${data.applied !== 1 ? "s" : ""} across the manuscript.${
              data.skipped > 0 ? ` ${data.skipped} couldn't be matched exactly — check manually.` : ""
            }`
          : "No changes could be applied — phrases may have changed since the analysis.";

      onDone(summary);
    } catch {
      onDone("Something went wrong while applying changes. Please try again.");
    } finally {
      setApplying(false);
    }
  }

  const totalSelected = approved.size + approvedFlagged.size;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-neutral-900 flex items-center justify-center">
                <span className="text-white text-[9px] font-bold">
                  {coauthorName.charAt(0).toUpperCase()}
                </span>
              </div>
              <h2 className="text-sm font-semibold text-neutral-900">
                {coauthorName}'s change plan
              </h2>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5 ml-7">
              {plan.summary}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 transition-colors rounded"
          >
            <X size={16} />
          </button>
        </div>

        {/* Instruction */}
        <div className="px-5 py-3 bg-neutral-50 border-b border-neutral-100">
          <p className="text-xs text-neutral-500">
            <span className="font-medium text-neutral-700">Instruction: </span>
            {plan.instruction}
          </p>
        </div>

        {/* Changes list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">

          {/* Clear matches */}
          {plan.changes.length > 0 && (
            <div>
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-2">
                Clear matches — {plan.changes.length}
              </p>
              <div className="space-y-2">
                {plan.changes.map((change, i) => (
                  <ChangeCard
                    key={i}
                    index={i}
                    change={change}
                    approved={approved.has(i)}
                    onToggle={() => toggleApproved(i)}
                    expandedContexts={expandedContexts}
                    onToggleContext={toggleContext}
                    cardKey={`clear-${i}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Flagged / ambiguous */}
          {plan.flagged.length > 0 && (
            <div>
              <p className="text-xs font-medium text-amber-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <AlertTriangle size={11} />
                Ambiguous — {plan.flagged.length} (skipped by default)
              </p>
              <div className="space-y-2">
                {plan.flagged.map((item, i) => (
                  <FlaggedCard
                    key={i}
                    item={item}
                    approved={approvedFlagged.has(i)}
                    onToggle={() => toggleFlagged(i)}
                  />
                ))}
              </div>
            </div>
          )}

          {plan.changes.length === 0 && plan.flagged.length === 0 && (
            <div className="text-center py-8 text-sm text-neutral-500">
              No changes found for this instruction.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-neutral-100 flex items-center justify-between gap-3">
          <button
            onClick={onCancel}
            className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            Cancel
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-400">
              {totalSelected} change{totalSelected !== 1 ? "s" : ""} selected
            </span>
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
              ) : (
                `Apply ${totalSelected} change${totalSelected !== 1 ? "s" : ""}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Change card ──────────────────────────────────────────────────────────────

function ChangeCard({
  index,
  change,
  approved,
  onToggle,
  expandedContexts,
  onToggleContext,
  cardKey,
}: {
  index: number;
  change: ChangeItem;
  approved: boolean;
  onToggle: () => void;
  expandedContexts: Set<string>;
  onToggleContext: (key: string) => void;
  cardKey: string;
}) {
  const expanded = expandedContexts.has(cardKey);

  return (
    <div
      className={`rounded-xl border transition-colors ${
        approved
          ? "border-neutral-200 bg-white"
          : "border-neutral-100 bg-neutral-50 opacity-50"
      }`}
    >
      <div className="flex items-start gap-3 px-3 py-2.5">
        {/* Toggle */}
        <button
          onClick={onToggle}
          className="flex-shrink-0 mt-0.5"
        >
          {approved ? (
            <CheckCircle2 size={16} className="text-green-500" />
          ) : (
            <XCircle size={16} className="text-neutral-300" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-neutral-400 mb-1">{change.chapterTitle}</p>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-sm text-neutral-900 line-through decoration-red-400">
              {change.original}
            </span>
            <span className="text-neutral-400 text-xs">→</span>
            <span className="text-sm text-green-700 font-medium">
              {change.replacement}
            </span>
          </div>
        </div>

        {/* Context toggle */}
        <button
          onClick={() => onToggleContext(cardKey)}
          className="flex-shrink-0 text-neutral-400 hover:text-neutral-600 transition-colors mt-0.5"
          title="Show context"
        >
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* Context sentence */}
      {expanded && change.context && (
        <div className="px-3 pb-2.5 ml-7">
          <p className="text-xs text-neutral-500 leading-relaxed border-l-2 border-neutral-200 pl-2">
            {highlightPhrase(change.context, change.original)}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Flagged card ─────────────────────────────────────────────────────────────

function FlaggedCard({
  item,
  approved,
  onToggle,
}: {
  item: FlaggedItem;
  approved: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`rounded-xl border transition-colors ${
        approved
          ? "border-amber-200 bg-amber-50"
          : "border-neutral-100 bg-neutral-50"
      }`}
    >
      <div className="flex items-start gap-3 px-3 py-2.5">
        <button onClick={onToggle} className="flex-shrink-0 mt-0.5">
          {approved ? (
            <CheckCircle2 size={16} className="text-amber-500" />
          ) : (
            <AlertTriangle size={16} className="text-amber-400" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-neutral-400 mb-1">{item.chapterTitle}</p>
          <p className="text-sm text-neutral-700 italic">"{item.passage}"</p>
          <p className="text-xs text-amber-600 mt-1">{item.reason}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Render the context string with the original phrase visually highlighted. */
function highlightPhrase(context: string, phrase: string): React.ReactNode {
  if (!phrase) return context;
  const idx = context.toLowerCase().indexOf(phrase.toLowerCase());
  if (idx === -1) return context;
  return (
    <>
      {context.slice(0, idx)}
      <mark className="bg-yellow-100 text-yellow-900 rounded px-0.5 not-italic">
        {context.slice(idx, idx + phrase.length)}
      </mark>
      {context.slice(idx + phrase.length)}
    </>
  );
}

/**
 * For flagged items approved by the writer, derive the replacement
 * by doing a simple phrase-match against the known changes in the plan.
 */
function deriveReplacement(passage: string, plan: ChangePlan): string {
  // Try to find a similar clear change to infer the replacement pattern
  for (const change of plan.changes) {
    const origLower = change.original.toLowerCase();
    const passLower = passage.toLowerCase();
    // If both contain the same "from" string, use the same "to" string
    if (
      origLower.includes(plan.subject.toLowerCase()) &&
      passLower.includes(plan.subject.toLowerCase())
    ) {
      // Derive by applying the same word-level diff
      return passage.replace(
        new RegExp(change.original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"),
        change.replacement
      );
    }
  }
  return passage; // fallback: no change (writer should edit manually)
}
