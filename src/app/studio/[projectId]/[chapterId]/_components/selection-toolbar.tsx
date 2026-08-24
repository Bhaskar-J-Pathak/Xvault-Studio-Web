"use client";

import { Loader2, X } from "lucide-react";

export interface Branch {
  label: string;
  text: string;
}

interface Props {
  rect: DOMRect;
  // Rewrite
  rewriteLoading: boolean;
  rewriteResult: string | null;
  onRewriteAccept: (text: string) => void;
  // What If
  whatIfExpanded: boolean;
  whatIfInput: string;
  whatIfLoading: boolean;
  whatIfBranches: Branch[] | null;
  // Actions
  onContinue: () => void;
  onRewrite: () => void;
  onWhatIfToggle: () => void;
  onWhatIfChange: (v: string) => void;
  onWhatIfSubmit: () => void;
  onBranchUse: (text: string) => void;
  onDismiss: () => void;
}

export default function SelectionToolbar({
  rect,
  rewriteLoading,
  rewriteResult,
  onRewriteAccept,
  whatIfExpanded,
  whatIfInput,
  whatIfLoading,
  whatIfBranches,
  onContinue,
  onRewrite,
  onWhatIfToggle,
  onWhatIfChange,
  onWhatIfSubmit,
  onBranchUse,
  onDismiss,
}: Props) {
  const midX     = Math.round((rect.left + rect.right) / 2);
  // Clamp so the pill (≈210px wide, half≈105px) never escapes the viewport on mobile
  const vw       = typeof window !== "undefined" ? window.innerWidth : 1200;
  const cx       = Math.max(115, Math.min(midX, vw - 115));
  const pillTop  = Math.max(60, rect.top - 58); // 60px min keeps it below the title bar
  const panelTop = rect.bottom + 8;

  const whatIfActive   = whatIfExpanded || !!whatIfBranches;
  const rewriteActive  = rewriteLoading || !!rewriteResult;
  const showPanel      = whatIfActive || rewriteActive;

  return (
    <>
      {/* ── Button toolbar ─────────────────────────────────────────────────── */}
      <div
        style={{ position: "fixed", top: pillTop, left: cx, transform: "translateX(-50%)", zIndex: 200 }}
      >
        <div className="flex items-center bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.12)] border border-black/[0.07] overflow-hidden">
          <button
            onPointerDown={(e) => { e.preventDefault(); onContinue(); }}
            className="px-4 py-2 text-[13px] font-medium text-[#1A1A1A]/75 hover:text-[#1A1A1A] hover:bg-[#F4F4F5] transition-colors whitespace-nowrap"
          >
            Continue
          </button>

          <span className="w-px h-5 bg-black/[0.08] shrink-0" />

          <button
            onPointerDown={(e) => { e.preventDefault(); onRewrite(); }}
            disabled={rewriteLoading}
            className={`px-4 py-2 text-[13px] font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              rewriteActive
                ? "text-violet-600 bg-violet-50"
                : "text-[#1A1A1A]/75 hover:text-[#1A1A1A] hover:bg-[#F4F4F5] disabled:opacity-50"
            }`}
          >
            {rewriteLoading && <Loader2 size={11} className="animate-spin" />}
            Rewrite
          </button>

          <span className="w-px h-5 bg-black/[0.08] shrink-0" />

          <button
            onPointerDown={(e) => { e.preventDefault(); onWhatIfToggle(); }}
            className={`px-4 py-2 text-[13px] font-medium transition-colors whitespace-nowrap ${
              whatIfActive
                ? "text-violet-600 bg-violet-50"
                : "text-[#1A1A1A]/75 hover:text-[#1A1A1A] hover:bg-[#F4F4F5]"
            }`}
          >
            What If
          </button>
        </div>
      </div>

      {/* ── Panel ──────────────────────────────────────────────────────────── */}
      {showPanel && (
        <div
          style={{
            position:  "fixed",
            top:       panelTop,
            left:      cx,
            transform: "translateX(-50%)",
            zIndex:    200,
            width:     320,
            maxWidth:  "calc(100vw - 32px)",
            maxHeight: "60vh",
            overflowY: "auto",
          }}
        >
          {/* ── Rewrite result ── */}
          {rewriteResult && (
            <div className="bg-white dark:bg-[#1a1829] rounded-2xl shadow-2xl border border-black/[0.08] dark:border-white/[0.08] overflow-hidden">
              <div className="flex items-center justify-between px-4 pt-3.5 pb-0">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[#A1A1AA] dark:text-white/25">
                  Rewrite
                </span>
                <button
                  onPointerDown={(e) => { e.preventDefault(); onDismiss(); }}
                  className="text-[#A1A1AA] dark:text-white/30 hover:text-[#71717A] dark:hover:text-white/60 transition-colors"
                >
                  <X size={13} />
                </button>
              </div>
              <div className="px-4 py-3">
                <p className="text-[12px] text-[#3F3F46] dark:text-white/65 leading-relaxed line-clamp-6">
                  {rewriteResult}
                </p>
                <div className="flex gap-2 mt-2.5">
                  <button
                    onPointerDown={(e) => { e.preventDefault(); onRewriteAccept(rewriteResult); }}
                    className="px-3 py-1.5 rounded-xl bg-[#0F0F0F] dark:bg-violet-600 text-white text-[11px] font-semibold hover:bg-[#2A2A2A] dark:hover:bg-violet-500 transition-colors"
                  >
                    Replace
                  </button>
                  <button
                    onPointerDown={(e) => { e.preventDefault(); onRewrite(); }}
                    className="px-3 py-1.5 rounded-xl bg-[#F4F4F5] dark:bg-white/[0.06] text-[11px] font-medium text-[#71717A] dark:text-white/40 hover:bg-[#E4E4E7] dark:hover:bg-white/10 hover:text-[#0F0F0F] dark:hover:text-white transition-colors"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── What If input ── */}
          {whatIfExpanded && !whatIfBranches && (
            <div className="bg-white dark:bg-[#1a1829] rounded-2xl shadow-2xl border border-black/[0.08] dark:border-white/[0.08] px-4 py-3">
              <p className="text-[10px] font-semibold text-[#A1A1AA] dark:text-white/25 uppercase tracking-widest mb-2.5">
                What if…
              </p>
              {whatIfLoading ? (
                <div className="flex items-center gap-2.5 py-0.5">
                  <Loader2 size={13} className="animate-spin text-violet-500 shrink-0" />
                  <span className="text-[12px] text-[#71717A] dark:text-white/40">Exploring branches…</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={whatIfInput}
                    onChange={(e) => onWhatIfChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter")  { e.preventDefault(); onWhatIfSubmit(); }
                      if (e.key === "Escape") { e.preventDefault(); onDismiss(); }
                    }}
                    placeholder="she doesn't go to the diner"
                    className="flex-1 min-w-0 text-[13px] text-[#0F0F0F] dark:text-[#EDEBF0] bg-transparent placeholder:text-[#A1A1AA] dark:placeholder:text-white/30 outline-none"
                  />
                  <button
                    onPointerDown={(e) => { e.preventDefault(); onWhatIfSubmit(); }}
                    disabled={!whatIfInput.trim()}
                    className="flex items-center justify-center w-7 h-7 rounded-full bg-[#0F0F0F] dark:bg-violet-600 text-white hover:bg-[#2A2A2A] dark:hover:bg-violet-500 disabled:opacity-40 transition-colors shrink-0"
                  >
                    <span className="text-[13px] leading-none select-none">→</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── What If branches ── */}
          {whatIfBranches && (
            <div className="bg-white dark:bg-[#1a1829] rounded-2xl shadow-2xl border border-black/[0.08] dark:border-white/[0.08] overflow-hidden">
              <div className="flex items-center justify-between px-4 pt-3.5 pb-0">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[#A1A1AA] dark:text-white/25">
                  What If branches
                </span>
                <button
                  onPointerDown={(e) => { e.preventDefault(); onDismiss(); }}
                  className="text-[#A1A1AA] dark:text-white/30 hover:text-[#71717A] dark:hover:text-white/60 transition-colors"
                >
                  <X size={13} />
                </button>
              </div>
              <div className="divide-y divide-black/[0.05] dark:divide-white/[0.04]">
                {whatIfBranches.map((branch) => (
                  <div key={branch.label} className="px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#A1A1AA] dark:text-white/25 mb-1.5">
                      {branch.label}
                    </p>
                    <p className="text-[12px] text-[#3F3F46] dark:text-white/65 leading-relaxed line-clamp-5">
                      {branch.text}
                    </p>
                    <button
                      onPointerDown={(e) => { e.preventDefault(); onBranchUse(branch.text); }}
                      className="mt-2 px-2.5 py-1 rounded-lg bg-[#F4F4F5] dark:bg-white/[0.06] text-[11px] font-medium text-[#71717A] dark:text-white/40 hover:bg-[#E4E4E7] dark:hover:bg-white/[0.10] hover:text-[#0F0F0F] dark:hover:text-white transition-colors"
                    >
                      Insert after
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
