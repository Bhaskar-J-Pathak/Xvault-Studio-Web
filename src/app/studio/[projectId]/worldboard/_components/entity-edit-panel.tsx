"use client";

import { useEffect, useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface DBEntity {
  id:                    string;
  name:                  string;
  type:                  string;
  attributes:            Record<string, unknown>;
  confidence:            string;
  position:              { x: number; y: number } | null;
  first_seen_chapter_id: string | null;
}

interface Props {
  projectId: string;
  entity:    DBEntity | null; // null = creating new
  onSaved:   (entity: DBEntity) => void;
  onDeleted: (id: string) => void;
  onClose:   () => void;
}

// ── Type config ────────────────────────────────────────────────────────────────

const TYPES = [
  { value: "character", label: "Character", color: "#7C3AED" },
  { value: "location",  label: "Location",  color: "#059669" },
  { value: "faction",   label: "Faction",   color: "#2563EB" },
  { value: "item",      label: "Item",      color: "#D97706" },
  { value: "event",     label: "Event",     color: "#DC2626" },
  { value: "lore",      label: "Lore",      color: "#0891B2" },
] as const;

function typeColor(type: string) {
  return TYPES.find((t) => t.value === type)?.color ?? "#9CA3AF";
}

function typeLabel(type: string) {
  return TYPES.find((t) => t.value === type)?.label ?? type;
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function EntityEditPanel({ projectId, entity, onSaved, onDeleted, onClose }: Props) {
  const isNew = entity === null;

  const [name,          setName]          = useState(entity?.name ?? "");
  const [type,          setType]          = useState(entity?.type ?? "character");
  const [attrRows,      setAttrRows]      = useState<{ key: string; value: string }[]>([]);
  const [saving,        setSaving]        = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting,      setDeleting]      = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  // Sync when entity changes
  useEffect(() => {
    setName(entity?.name ?? "");
    setType(entity?.type ?? "character");
    setAttrRows(
      Object.entries(entity?.attributes ?? {}).map(([key, value]) => ({
        key,
        value: String(value),
      }))
    );
    setConfirmDelete(false);
    setError(null);
  }, [entity?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard: Escape to close
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // ── Attribute helpers ────────────────────────────────────────────────────────

  function addAttr() {
    setAttrRows((prev) => [...prev, { key: "", value: "" }]);
  }

  function updateAttr(i: number, field: "key" | "value", val: string) {
    setAttrRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: val } : r)));
  }

  function removeAttr(i: number) {
    setAttrRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  // ── Save ─────────────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!name.trim()) { setError("Name is required."); return; }
    setError(null);
    setSaving(true);

    // Convert attrRows back to object, skip blank keys
    const attributes: Record<string, string> = {};
    for (const row of attrRows) {
      const k = row.key.trim();
      if (k) attributes[k] = row.value.trim();
    }

    try {
      if (isNew) {
        const res = await fetch("/api/studio/worldboard/entities", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ projectId, name: name.trim(), type, attributes }),
        });
        const data = await res.json() as { entity?: DBEntity; error?: string };
        if (!res.ok || !data.entity) { setError(data.error ?? "Failed to create."); return; }
        onSaved(data.entity);
      } else {
        const res = await fetch(`/api/studio/worldboard/entities/${entity!.id}`, {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ name: name.trim(), type, attributes }),
        });
        const data = await res.json() as { entity?: DBEntity; error?: string };
        if (!res.ok || !data.entity) { setError(data.error ?? "Failed to save."); return; }
        onSaved(data.entity);
      }
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!entity) return;
    setDeleting(true);
    try {
      await fetch(`/api/studio/worldboard/entities/${entity.id}`, { method: "DELETE" });
      onDeleted(entity.id);
    } finally {
      setDeleting(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const color = typeColor(type);

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-[340px] bg-white border-l border-black/[0.08] shadow-2xl flex flex-col">

        {/* Header */}
        <div className="shrink-0 flex items-center gap-2.5 px-4 py-3.5 border-b border-black/[0.06]">
          <span
            style={{ background: `${color}18`, color, borderColor: `${color}40` }}
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border"
          >
            {typeLabel(type)}
          </span>
          <span className="flex-1 text-[13px] font-semibold text-[#1A1A1A] truncate">
            {isNew ? "New Entity" : (name || "Entity")}
          </span>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-md text-[#1A1A1A]/40 hover:text-[#1A1A1A]/70 hover:bg-black/[0.05] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

          {/* Name */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#1A1A1A]/40 mb-1.5">
              Name
            </label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Entity name…"
              className="w-full px-3 py-2 text-[13px] text-[#1A1A1A] bg-[#F8F8F8] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 placeholder-[#1A1A1A]/25"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#1A1A1A]/40 mb-1.5">
              Type
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  style={type === t.value ? { background: `${t.color}15`, borderColor: `${t.color}50`, color: t.color } : {}}
                  className={`px-2 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${
                    type === t.value
                      ? ""
                      : "border-black/[0.08] text-[#1A1A1A]/50 hover:text-[#1A1A1A]/70 hover:bg-black/[0.03]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Attributes */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#1A1A1A]/40">
                Attributes
              </label>
              <button
                onClick={addAttr}
                className="text-[11px] text-violet-600 hover:text-violet-700 font-medium transition-colors"
              >
                + Add
              </button>
            </div>

            {attrRows.length === 0 && (
              <p className="text-[12px] text-[#1A1A1A]/30 italic py-2">
                No attributes yet. Click "+ Add" to add one.
              </p>
            )}

            <div className="space-y-1.5">
              {attrRows.map((row, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={row.key}
                    onChange={(e) => updateAttr(i, "key", e.target.value)}
                    placeholder="key"
                    className="w-[38%] px-2.5 py-1.5 text-[12px] text-[#1A1A1A] bg-[#F8F8F8] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 placeholder-[#1A1A1A]/25"
                  />
                  <input
                    type="text"
                    value={row.value}
                    onChange={(e) => updateAttr(i, "value", e.target.value)}
                    placeholder="value"
                    className="flex-1 px-2.5 py-1.5 text-[12px] text-[#1A1A1A] bg-[#F8F8F8] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 placeholder-[#1A1A1A]/25"
                  />
                  <button
                    onClick={() => removeAttr(i)}
                    className="w-6 h-6 flex items-center justify-center rounded-md text-[#1A1A1A]/30 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-[12px] text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-black/[0.06] px-4 py-3 bg-[#FAFAFA]">
          {!isNew && !confirmDelete && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-[12px] text-red-500 hover:text-red-600 font-medium transition-colors mr-auto"
              >
                Delete entity
              </button>
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-[#1A1A1A]/50 hover:text-[#1A1A1A]/70 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ background: "#7C3AED" }}
                className="px-4 py-1.5 rounded-lg text-[12px] font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          )}

          {!isNew && confirmDelete && (
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-[#1A1A1A]/60 mr-auto">Delete this entity?</span>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-[#1A1A1A]/50 hover:text-[#1A1A1A]/70 transition-colors"
              >
                No
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-1.5 rounded-lg text-[12px] font-medium bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {deleting ? "Deleting…" : "Yes, delete"}
              </button>
            </div>
          )}

          {isNew && (
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-[#1A1A1A]/50 hover:text-[#1A1A1A]/70 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ background: "#7C3AED" }}
                className="px-4 py-1.5 rounded-lg text-[12px] font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {saving ? "Creating…" : "Create entity"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
