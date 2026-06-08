"use client";

import { useState } from "react";
import { X } from "lucide-react";

const PRESETS = [
  {
    label: "The Honest Friend",
    description:
      "Warm and real. Will tell you when something isn't working, but always kindly. Asks good questions.",
  },
  {
    label: "The Editor",
    description:
      "Sharp and structural. Thinks in story arcs, chapter beats, and character motivation. Direct.",
  },
  {
    label: "The Hype Person",
    description:
      "Enthusiastic and encouraging. Celebrates every win. Always in your corner.",
  },
  {
    label: "The Contrarian",
    description:
      "Pushes back on everything. Plays devil's advocate. Asks the hard questions you're avoiding.",
  },
];

interface Props {
  onSave: (name: string, personality: string) => Promise<void>;
  onClose: () => void;
  initial?: { name: string; personality: string | null };
}

export default function CoauthorSetup({ onSave, onClose, initial }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [personality, setPersonality] = useState(initial?.personality ?? "");
  const [saving, setSaving] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);

  function applyPreset(i: number) {
    setSelectedPreset(i);
    setPersonality(PRESETS[i].description);
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    await onSave(name.trim(), personality.trim());
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl p-6">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 transition-colors"
        >
          <X size={18} />
        </button>

        <h2 className="text-lg font-semibold text-neutral-900 mb-1">
          Meet your co-author
        </h2>
        <p className="text-sm text-neutral-500 mb-6">
          Give them a name and a personality. You're in control of who they are.
        </p>

        {/* Name */}
        <label className="block text-xs font-medium text-neutral-600 mb-1.5 uppercase tracking-wide">
          Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Alex, Sam, Muse…"
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 mb-5"
          maxLength={40}
          autoFocus
        />

        {/* Personality presets */}
        <label className="block text-xs font-medium text-neutral-600 mb-2 uppercase tracking-wide">
          Personality — pick a starting point
        </label>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {PRESETS.map((p, i) => (
            <button
              key={i}
              onClick={() => applyPreset(i)}
              className={`text-left rounded-lg border px-3 py-2 text-xs transition-colors ${
                selectedPreset === i
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 text-neutral-700 hover:border-neutral-400"
              }`}
            >
              <div className="font-medium">{p.label}</div>
            </button>
          ))}
        </div>

        {/* Custom personality textarea */}
        <textarea
          value={personality}
          onChange={(e) => {
            setPersonality(e.target.value);
            setSelectedPreset(null);
          }}
          placeholder="Or describe them yourself — how they speak, what they care about, how blunt they are…"
          rows={3}
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 resize-none mb-5"
        />

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={!name.trim() || saving}
          className="w-full rounded-lg bg-neutral-900 text-white text-sm font-medium py-2.5 hover:bg-neutral-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? "Saving…" : initial ? "Update co-author" : "Let's write together"}
        </button>
      </div>
    </div>
  );
}
