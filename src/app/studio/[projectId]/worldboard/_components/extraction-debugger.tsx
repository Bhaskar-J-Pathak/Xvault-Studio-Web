"use client";

import { useState } from "react";
import type { ExtractionResult } from "@/lib/extraction";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DebugResult {
  wordCount:       number;
  existingSummary: string;
  prompt:          string;
  rawResponse:     string;
  parsed:          ExtractionResult | null;
}

// ── Colour map (matches canvas) ───────────────────────────────────────────────

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  character: { bg: "#EDE9FE", text: "#6D28D9", border: "#7C3AED" },
  location:  { bg: "#D1FAE5", text: "#047857", border: "#059669" },
  faction:   { bg: "#DBEAFE", text: "#1D4ED8", border: "#2563EB" },
  item:      { bg: "#FEF3C7", text: "#B45309", border: "#D97706" },
  event:     { bg: "#FEE2E2", text: "#B91C1C", border: "#DC2626" },
  lore:      { bg: "#CFFAFE", text: "#0E7490", border: "#0891B2" },
};
const FALLBACK_CLR = { bg: "#F3F4F6", text: "#6B7280", border: "#9CA3AF" };

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/35 mb-2">
      {children}
    </p>
  );
}

function EmptyNote({ text }: { text: string }) {
  return <p className="text-xs text-[#1A1A1A]/30 italic">{text}</p>;
}

function EntityCard({ entity }: { entity: ExtractionResult["entities"][0] }) {
  const clr   = TYPE_COLORS[entity.type] ?? FALLBACK_CLR;
  const attrs = Object.entries(entity.attributes ?? {});

  return (
    <div
      style={{ background: clr.bg, borderLeft: `3px solid ${clr.border}` }}
      className="rounded-lg px-3 py-2"
    >
      <div className="flex items-center gap-2 mb-1">
        <span
          style={{ color: clr.text, background: `${clr.border}1A` }}
          className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
        >
          {entity.type}
        </span>
        {entity.is_update && (
          <span className="text-[9px] text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 font-medium">
            UPDATE
          </span>
        )}
        {entity.confidence === "inferred" && (
          <span className="text-[9px] text-[#1A1A1A]/30 italic">inferred</span>
        )}
      </div>
      <p className="text-[13px] font-semibold text-[#1A1A1A] leading-tight mb-1">
        {entity.name}
      </p>
      {attrs.length > 0 && (
        <div className="space-y-0.5">
          {attrs.map(([k, v]) => (
            <p key={k} className="text-[10px] text-[#1A1A1A]/55">
              <span className="text-[#1A1A1A]/30">{k}: </span>
              {String(v)}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function RelationshipRow({ rel }: { rel: ExtractionResult["relationships"][0] }) {
  return (
    <div className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-slate-50 border border-slate-100">
      <span className="text-[12px] font-semibold text-slate-700">{rel.source}</span>
      <span className="text-[10px] text-slate-400">→</span>
      <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-medium">
        {rel.label}
      </span>
      <span className="text-[10px] text-slate-400">→</span>
      <span className="text-[12px] font-semibold text-slate-700">{rel.target}</span>
    </div>
  );
}

function ThreadRow({ thread }: { thread: ExtractionResult["threads"][0] }) {
  const isOpen = thread.status === "open";
  return (
    <div className="flex items-start gap-2 py-1.5 px-3 rounded-lg bg-slate-50 border border-slate-100">
      <span
        className={`mt-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${
          isOpen
            ? "bg-amber-50 text-amber-700 border border-amber-200"
            : "bg-green-50 text-green-700 border border-green-200"
        }`}
      >
        {thread.status}
      </span>
      {thread.is_new && (
        <span className="mt-0.5 text-[9px] text-violet-600 bg-violet-50 border border-violet-200 rounded px-1.5 py-0.5 font-medium shrink-0">
          NEW
        </span>
      )}
      <p className="text-[12px] text-slate-700 leading-snug">{thread.description}</p>
    </div>
  );
}

function InconsistencyRow({ inc }: { inc: ExtractionResult["inconsistencies"][0] }) {
  return (
    <div className="py-2 px-3 rounded-lg bg-red-50 border border-red-100">
      <p className="text-[11px] font-semibold text-red-700 mb-0.5">
        {inc.entity} · {inc.attribute}
      </p>
      <p className="text-[10px] text-red-600">
        <span className="opacity-60">Was: </span>{inc.established}
        <span className="mx-1 opacity-40">→</span>
        <span className="opacity-60">Found: </span>{inc.found}
      </p>
      {inc.quote && (
        <p className="text-[10px] text-red-500/70 italic mt-0.5">"{inc.quote}"</p>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ExtractionDebugger({ projectId }: { projectId: string }) {
  const [text,    setText]    = useState("");
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<DebugResult | null>(null);
  const [error,   setError]   = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  async function runExtraction() {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setShowRaw(false);
    setShowPrompt(false);

    try {
      const res = await fetch("/api/ai/worldboard/debug", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, text }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? `HTTP ${res.status}`);
        return;
      }

      const data: DebugResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div className="shrink-0 flex items-center gap-3 px-6 py-3 border-b border-black/[0.06] bg-white">
        <div>
          <p className="text-sm font-semibold text-[#1A1A1A]">Extraction Debug</p>
          <p className="text-[11px] text-[#1A1A1A]/40">
            Dry-run — nothing is saved to your World Board
          </p>
        </div>
        <span className="ml-auto text-[11px] text-[#1A1A1A]/30 bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded-full font-medium">
          Preview only
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 h-full">

          {/* Left: input */}
          <div className="flex flex-col border-r border-black/[0.06] p-5 gap-3">
            <SectionLabel>Paste chapter text</SectionLabel>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your chapter here…"
              className="flex-1 resize-none rounded-xl border border-black/[0.08] bg-[#FAFAF8] px-4 py-3 text-[13px] leading-relaxed text-[#1A1A1A] placeholder:text-[#1A1A1A]/25 focus:outline-none focus:ring-2 focus:ring-violet-200 min-h-[300px]"
            />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#1A1A1A]/35">
                {wordCount > 0 ? `${wordCount.toLocaleString()} words` : "No text"}
                {wordCount > 6000 && (
                  <span className="ml-1.5 text-amber-600">
                    (first 6 000 words sent to Gemini)
                  </span>
                )}
              </span>
              <button
                onClick={runExtraction}
                disabled={loading || wordCount === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white text-[13px] font-medium hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Extracting…
                  </>
                ) : (
                  "Run Extraction"
                )}
              </button>
            </div>

            {error && (
              <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200">
                <p className="text-[12px] text-red-600 font-medium">Error</p>
                <p className="text-[11px] text-red-500 mt-0.5">{error}</p>
              </div>
            )}
          </div>

          {/* Right: results */}
          <div className="flex flex-col p-5 gap-5 overflow-y-auto">
            {!result && !loading && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mb-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                    <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                  </svg>
                </div>
                <p className="text-sm text-[#1A1A1A]/30">
                  Paste text and click Run Extraction to see results
                </p>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <svg className="animate-spin w-6 h-6 text-violet-500" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <p className="text-sm text-[#1A1A1A]/40">Gemini is reading…</p>
              </div>
            )}

            {result && (
              <>
                {/* Stats bar */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "words sent",     value: Math.min(result.wordCount, 6000) },
                    { label: "entities",        value: result.parsed?.entities.length        ?? 0 },
                    { label: "relationships",   value: result.parsed?.relationships.length   ?? 0 },
                    { label: "threads",         value: result.parsed?.threads.length         ?? 0 },
                    { label: "inconsistencies", value: result.parsed?.inconsistencies.length ?? 0 },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-baseline gap-1 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[15px] font-bold text-[#1A1A1A]">{value}</span>
                      <span className="text-[10px] text-[#1A1A1A]/40">{label}</span>
                    </div>
                  ))}
                </div>

                {/* Existing knowledge (context sent to Gemini) */}
                <div>
                  <SectionLabel>Context Gemini received</SectionLabel>
                  <pre className="text-[11px] leading-relaxed text-slate-600 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 whitespace-pre-wrap font-mono overflow-x-auto">
                    {result.existingSummary}
                  </pre>
                </div>

                {/* Entities */}
                <div>
                  <SectionLabel>
                    Entities ({result.parsed?.entities.length ?? 0})
                  </SectionLabel>
                  {!result.parsed?.entities.length ? (
                    <EmptyNote text="None extracted" />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {result.parsed.entities.map((e, i) => (
                        <EntityCard key={i} entity={e} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Relationships */}
                <div>
                  <SectionLabel>
                    Relationships ({result.parsed?.relationships.length ?? 0})
                  </SectionLabel>
                  {!result.parsed?.relationships.length ? (
                    <EmptyNote text="None extracted" />
                  ) : (
                    <div className="space-y-1.5">
                      {result.parsed.relationships.map((r, i) => (
                        <RelationshipRow key={i} rel={r} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Plot threads */}
                <div>
                  <SectionLabel>
                    Plot threads ({result.parsed?.threads.length ?? 0})
                  </SectionLabel>
                  {!result.parsed?.threads.length ? (
                    <EmptyNote text="None extracted" />
                  ) : (
                    <div className="space-y-1.5">
                      {result.parsed.threads.map((t, i) => (
                        <ThreadRow key={i} thread={t} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Inconsistencies */}
                {(result.parsed?.inconsistencies.length ?? 0) > 0 && (
                  <div>
                    <SectionLabel>
                      Inconsistencies ({result.parsed!.inconsistencies.length})
                    </SectionLabel>
                    <div className="space-y-1.5">
                      {result.parsed!.inconsistencies.map((inc, i) => (
                        <InconsistencyRow key={i} inc={inc} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Parse failure warning */}
                {!result.parsed && (
                  <div className="px-3 py-2.5 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-[12px] font-semibold text-red-700">Parse failed</p>
                    <p className="text-[11px] text-red-500 mt-0.5">
                      Gemini returned something that couldn't be parsed as JSON.
                      Expand "Raw Response" below to inspect it.
                    </p>
                  </div>
                )}

                {/* Raw response (collapsible) */}
                <div>
                  <button
                    onClick={() => setShowRaw((v) => !v)}
                    className="flex items-center gap-1.5 text-[11px] text-[#1A1A1A]/40 hover:text-[#1A1A1A]/60 transition-colors"
                  >
                    <svg
                      width="12" height="12" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2"
                      className={`transition-transform ${showRaw ? "rotate-90" : ""}`}
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                    Raw Gemini response
                  </button>
                  {showRaw && (
                    <pre className="mt-2 text-[10px] leading-relaxed text-slate-500 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 whitespace-pre-wrap font-mono overflow-x-auto max-h-64">
                      {result.rawResponse}
                    </pre>
                  )}
                </div>

                {/* Full prompt (collapsible) */}
                <div>
                  <button
                    onClick={() => setShowPrompt((v) => !v)}
                    className="flex items-center gap-1.5 text-[11px] text-[#1A1A1A]/40 hover:text-[#1A1A1A]/60 transition-colors"
                  >
                    <svg
                      width="12" height="12" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2"
                      className={`transition-transform ${showPrompt ? "rotate-90" : ""}`}
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                    Full prompt sent to Gemini
                  </button>
                  {showPrompt && (
                    <pre className="mt-2 text-[10px] leading-relaxed text-slate-500 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 whitespace-pre-wrap font-mono overflow-x-auto max-h-64">
                      {result.prompt}
                    </pre>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
