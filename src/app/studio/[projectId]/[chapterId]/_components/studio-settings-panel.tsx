"use client";

import { X, Check } from "lucide-react";

export interface EditorPrefs {
  font:             "serif" | "sans" | "mono";
  lineSpacing:      "compact" | "relaxed" | "loose";
  theme:            "light" | "sepia" | "dark";
  indentParagraphs: boolean;
}

export const DEFAULT_PREFS: EditorPrefs = {
  font:             "serif",
  lineSpacing:      "relaxed",
  theme:            "light",
  indentParagraphs: false,
};

export const PREFS_KEY = "xv_editor_prefs";

export const THEME_MAP = {
  light: { bg: "#FFFFFF",  text: "#1A1A1A", textMuted: "rgba(26,26,26,0.38)",   placeholder: "rgba(26,26,26,0.20)",     border: "rgba(0,0,0,0.06)",          desk: "#E8E4DB" },
  sepia: { bg: "#F8F4E8",  text: "#6B3E1A", textMuted: "rgba(107,62,26,0.42)", placeholder: "rgba(107,62,26,0.25)",    border: "rgba(107,62,26,0.10)",       desk: "#DDD0AF" },
  dark:  { bg: "#1C1C1C",  text: "#E0DDD5", textMuted: "rgba(224,221,213,0.38)", placeholder: "rgba(224,221,213,0.20)", border: "rgba(255,255,255,0.07)",     desk: "#111111" },
} as const;

export const FONT_MAP = {
  serif: "var(--font-fraunces), Georgia, serif",
  sans:  "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
  mono:  "var(--font-geist-mono), ui-monospace, monospace",
} as const;

export const LINE_SPACING_MAP = {
  compact:  "1.6",
  relaxed:  "1.85",
  loose:    "2.2",
} as const;

// ── Panel component ───────────────────────────────────────────────────────────

interface Props {
  open:     boolean;
  onClose:  () => void;
  credits:  number;
  isTrial:  boolean;
  cap:      number;
  prefs:    EditorPrefs;
  onChange: (p: EditorPrefs) => void;
}

export default function StudioSettingsPanel({
  open,
  onClose,
  credits,
  isTrial,
  cap,
  prefs,
  onChange,
}: Props) {
  if (!open) return null;

  const creditPct = Math.min(100, cap > 0 ? Math.round((credits / cap) * 100) : 0);

  return (
    <>
      {/* Invisible backdrop for click-outside */}
      <div className="fixed inset-0 z-[190]" onClick={onClose} aria-hidden />

      {/* Floating card — positioned just below the title bar, aligned right */}
      <div
        className="fixed top-[52px] right-4 z-[200] w-64 max-h-[calc(100dvh-68px)] overflow-y-auto rounded-2xl bg-white border border-black/[0.08] shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.06] shrink-0">
          <span className="text-[10px] font-semibold text-[#A1A1AA] uppercase tracking-widest">
            Editor Settings
          </span>
          <button
            onClick={onClose}
            className="text-[#C4C4C7] hover:text-[#71717A] transition-colors"
            aria-label="Close settings"
          >
            <X size={13} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* Credits */}
          <div className="px-4 py-3 border-b border-black/[0.06]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold text-[#A1A1AA] uppercase tracking-widest">
                {isTrial ? "Trial credits" : "AI Credits"}
              </span>
              <span className="text-[11px] font-semibold text-[#1A1A1A] tabular-nums">
                {credits}<span className="text-[#C4C4C7] font-normal"> / {cap}</span>
              </span>
            </div>
            <div className="h-1 bg-[#F4F4F5] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  creditPct <= 20 ? "bg-amber-400" : "bg-[#1A1A1A]"
                }`}
                style={{ width: `${creditPct}%` }}
              />
            </div>
          </div>

          {/* Theme */}
          <div className="px-4 py-3 border-b border-black/[0.06]">
            <p className="text-[10px] font-semibold text-[#A1A1AA] uppercase tracking-widest mb-2">
              Theme
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {([
                { key: "light" as const, label: "Light",  swatch: "#FFFFFF", border: "#E4E4E7" },
                { key: "sepia" as const, label: "Sepia",  swatch: "#F8F4E8", border: "#DDD6BE" },
                { key: "dark"  as const, label: "Dark",   swatch: "#1C1C1C", border: "#3A3A3A" },
              ]).map(({ key, label, swatch, border }) => (
                <button
                  key={key}
                  onClick={() => onChange({ ...prefs, theme: key })}
                  className={`flex flex-col items-center gap-1.5 py-2 rounded-xl text-left transition-colors ${
                    prefs.theme === key
                      ? "bg-[#F4F4F5] ring-1 ring-black/[0.08]"
                      : "hover:bg-[#F9F9F9]"
                  }`}
                >
                  <span
                    className="w-6 h-6 rounded-lg shrink-0 border"
                    style={{ backgroundColor: swatch, borderColor: border }}
                  />
                  <span className="text-[10px] font-medium text-[#1A1A1A]">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Font */}
          <div className="px-4 py-3 border-b border-black/[0.06]">
            <p className="text-[10px] font-semibold text-[#A1A1AA] uppercase tracking-widest mb-2">
              Font
            </p>
            <div className="space-y-0.5">
              {([
                { key: "serif" as const, label: "Serif",      sample: "The rain had stopped…" },
                { key: "sans"  as const, label: "Sans-serif", sample: "The rain had stopped…" },
                { key: "mono"  as const, label: "Monospace",  sample: "The rain had stopped…" },
              ]).map(({ key, label, sample }) => (
                <button
                  key={key}
                  onClick={() => onChange({ ...prefs, font: key })}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors ${
                    prefs.font === key
                      ? "bg-[#F4F4F5] ring-1 ring-black/[0.08]"
                      : "hover:bg-[#F9F9F9]"
                  }`}
                >
                  <div>
                    <p className="text-[11px] font-medium text-[#1A1A1A]" style={{ fontFamily: FONT_MAP[key] }}>
                      {label}
                    </p>
                    <p className="text-[10px] text-[#A1A1AA]" style={{ fontFamily: FONT_MAP[key] }}>
                      {sample}
                    </p>
                  </div>
                  {prefs.font === key && <Check size={11} className="text-[#1A1A1A] shrink-0 ml-2" />}
                </button>
              ))}
            </div>
          </div>

          {/* Line spacing */}
          <div className="px-4 py-3 border-b border-black/[0.06]">
            <p className="text-[10px] font-semibold text-[#A1A1AA] uppercase tracking-widest mb-2">
              Line Spacing
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {([
                { key: "compact" as const,  label: "Compact" },
                { key: "relaxed" as const,  label: "Relaxed" },
                { key: "loose"   as const,  label: "Loose"   },
              ]).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => onChange({ ...prefs, lineSpacing: key })}
                  className={`py-1.5 rounded-xl text-[11px] font-medium transition-colors ${
                    prefs.lineSpacing === key
                      ? "bg-[#1A1A1A] text-white"
                      : "bg-[#F4F4F5] text-[#71717A] hover:bg-[#EBEBEB]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Indent paragraphs */}
          <div className="px-4 py-3">
            <button
              onClick={() => onChange({ ...prefs, indentParagraphs: !prefs.indentParagraphs })}
              className="w-full flex items-center justify-between"
            >
              <div>
                <p className="text-[11px] font-medium text-[#1A1A1A] text-left">Indent paragraphs</p>
                <p className="text-[10px] text-[#A1A1AA] text-left mt-0.5">First-line indent</p>
              </div>
              <div
                className={`relative w-9 h-5 rounded-full shrink-0 transition-colors duration-200 ${
                  prefs.indentParagraphs ? "bg-[#1A1A1A]" : "bg-[#E4E4E7]"
                }`}
              >
                <span
                  className={`absolute top-[3px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-all duration-200 ${
                    prefs.indentParagraphs ? "left-[19px]" : "left-[3px]"
                  }`}
                />
              </div>
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
