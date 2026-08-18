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

export interface DBRelationship {
  id:        string;
  source_id: string;
  target_id: string;
  label:     string;
}

interface Props {
  projectId:               string;
  entity:                  DBEntity | null; // null = creating new
  allEntities:             DBEntity[];
  relationships:           DBRelationship[];
  onSaved:                 (entity: DBEntity) => void;
  onDeleted:               (id: string) => void;
  onClose:                 () => void;
  onRelationshipCreated:   (rel: DBRelationship) => void;
  onRelationshipUpdated:   (id: string, label: string) => void;
  onRelationshipDeleted:   (id: string) => void;
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

// ── Relationship row ───────────────────────────────────────────────────────────

function RelRow({
  rel, isOutgoing, otherName, onUpdate, onDelete,
}: {
  rel:        DBRelationship;
  isOutgoing: boolean;
  otherName:  string;
  onUpdate:   (id: string, label: string) => Promise<void>;
  onDelete:   (id: string) => Promise<void>;
}) {
  const [editing,  setEditing]  = useState(false);
  const [label,    setLabel]    = useState(rel.label);
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function save() {
    if (!label.trim()) return;
    setSaving(true);
    await onUpdate(rel.id, label.trim());
    setSaving(false);
    setEditing(false);
  }

  async function remove() {
    setDeleting(true);
    await onDelete(rel.id);
  }

  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-black/[0.05] last:border-0">
      {/* Direction indicator */}
      <span
        title={isOutgoing ? "Outgoing" : "Incoming"}
        className={`mt-0.5 shrink-0 text-[10px] font-bold w-4 text-center ${isOutgoing ? "text-violet-500" : "text-emerald-500"}`}
      >
        {isOutgoing ? "→" : "←"}
      </span>

      {/* Other entity */}
      <span className="shrink-0 text-[12px] font-medium text-[#1A1A1A] w-[90px] truncate" title={otherName}>
        {otherName}
      </span>

      {/* Label */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex items-center gap-1">
            <input
              autoFocus
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
              className="flex-1 min-w-0 px-2 py-0.5 text-[11px] bg-white border border-violet-300 rounded-md focus:outline-none focus:ring-1 focus:ring-violet-300"
            />
            <button
              onClick={save}
              disabled={saving}
              className="text-[10px] font-medium text-violet-600 hover:text-violet-700 disabled:opacity-40 shrink-0"
            >
              {saving ? "…" : "Save"}
            </button>
            <button
              onClick={() => { setEditing(false); setLabel(rel.label); }}
              className="text-[10px] text-[#1A1A1A]/40 hover:text-[#1A1A1A]/60 shrink-0"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-[11px] text-[#1A1A1A]/50 hover:text-[#1A1A1A]/80 text-left truncate max-w-full block"
            title="Click to edit"
          >
            {label || <span className="italic opacity-50">no label</span>}
          </button>
        )}
      </div>

      {/* Delete */}
      {!editing && (
        <button
          onClick={remove}
          disabled={deleting}
          className="shrink-0 w-5 h-5 flex items-center justify-center rounded text-[#1A1A1A]/20 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
        >
          {deleting ? "…" : (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function EntityEditPanel({
  projectId, entity, allEntities, relationships,
  onSaved, onDeleted, onClose,
  onRelationshipCreated, onRelationshipUpdated, onRelationshipDeleted,
}: Props) {
  const isNew = entity === null;

  const [name,          setName]          = useState(entity?.name ?? "");
  const [type,          setType]          = useState(entity?.type ?? "character");
  const [attrRows,      setAttrRows]      = useState<{ key: string; value: string }[]>([]);
  const [saving,        setSaving]        = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting,      setDeleting]      = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  // Add relationship form
  const [showAddRel,  setShowAddRel]  = useState(false);
  const [relTarget,   setRelTarget]   = useState("");
  const [relLabel,    setRelLabel]    = useState("");
  const [addingRel,   setAddingRel]   = useState(false);
  const [relError,    setRelError]    = useState<string | null>(null);

  // Sync when entity changes
  useEffect(() => {
    setName(entity?.name ?? "");
    setType(entity?.type ?? "character");
    setAttrRows(
      Object.entries(entity?.attributes ?? {}).map(([key, value]) => ({
        key, value: String(value),
      }))
    );
    setConfirmDelete(false);
    setError(null);
    setShowAddRel(false);
    setRelTarget("");
    setRelLabel("");
    setRelError(null);
  }, [entity?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // ── Relationships for this entity ─────────────────────────────────────────────

  const myRels = entity
    ? relationships.filter((r) => r.source_id === entity.id || r.target_id === entity.id)
    : [];

  const otherEntities = allEntities.filter((e) => e.id !== entity?.id);

  // ── Attribute helpers ────────────────────────────────────────────────────────

  function addAttr() { setAttrRows((prev) => [...prev, { key: "", value: "" }]); }
  function updateAttr(i: number, field: "key" | "value", val: string) {
    setAttrRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: val } : r)));
  }
  function removeAttr(i: number) { setAttrRows((prev) => prev.filter((_, idx) => idx !== i)); }

  // ── Save entity ───────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!name.trim()) { setError("Name is required."); return; }
    setError(null);
    setSaving(true);

    const attributes: Record<string, string> = {};
    for (const row of attrRows) {
      const k = row.key.trim();
      if (k) attributes[k] = row.value.trim();
    }

    try {
      if (isNew) {
        const res = await fetch("/api/studio/worldboard/entities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, name: name.trim(), type, attributes }),
        });
        const data = await res.json() as { entity?: DBEntity; error?: string };
        if (!res.ok || !data.entity) { setError(data.error ?? "Failed to create."); return; }
        onSaved(data.entity);
      } else {
        const res = await fetch(`/api/studio/worldboard/entities/${entity!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), type, attributes }),
        });
        const data = await res.json() as { entity?: DBEntity; error?: string };
        if (!res.ok || !data.entity) { setError(data.error ?? "Failed to save."); return; }
        onSaved(data.entity);
      }
    } finally {
      setSaving(false);
    }
  }

  // ── Delete entity ─────────────────────────────────────────────────────────────

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

  // ── Relationship CRUD ─────────────────────────────────────────────────────────

  async function handleAddRelationship() {
    if (!relTarget || !relLabel.trim()) { setRelError("Pick a target and enter a label."); return; }
    setRelError(null);
    setAddingRel(true);
    try {
      const res = await fetch("/api/studio/worldboard/relationships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          sourceId: entity!.id,
          targetId: relTarget,
          label:    relLabel.trim(),
        }),
      });
      const data = await res.json() as { relationship?: DBRelationship; error?: string };
      if (!res.ok || !data.relationship) { setRelError(data.error ?? "Failed to add."); return; }
      onRelationshipCreated(data.relationship);
      setShowAddRel(false);
      setRelTarget("");
      setRelLabel("");
    } finally {
      setAddingRel(false);
    }
  }

  async function handleUpdateRel(id: string, label: string) {
    await fetch(`/api/studio/worldboard/relationships/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    });
    onRelationshipUpdated(id, label);
  }

  async function handleDeleteRel(id: string) {
    await fetch(`/api/studio/worldboard/relationships/${id}`, { method: "DELETE" });
    onRelationshipDeleted(id);
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const color = typeColor(type);

  return (
    <div
      className="fixed inset-0 z-40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

          {/* Name */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#1A1A1A]/40 mb-1.5">Name</label>
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
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#1A1A1A]/40 mb-1.5">Type</label>
            <div className="grid grid-cols-3 gap-1.5">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  style={type === t.value ? { background: `${t.color}15`, borderColor: `${t.color}50`, color: t.color } : {}}
                  className={`px-2 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${
                    type === t.value ? "" : "border-black/[0.08] text-[#1A1A1A]/50 hover:text-[#1A1A1A]/70 hover:bg-black/[0.03]"
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
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#1A1A1A]/40">Attributes</label>
              <button onClick={addAttr} className="text-[11px] text-violet-600 hover:text-violet-700 font-medium">+ Add</button>
            </div>
            {attrRows.length === 0 && (
              <p className="text-[12px] text-[#1A1A1A]/30 italic py-2">No attributes yet.</p>
            )}
            <div className="space-y-1.5">
              {attrRows.map((row, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <input
                    type="text" value={row.key} onChange={(e) => updateAttr(i, "key", e.target.value)}
                    placeholder="key"
                    className="w-[38%] px-2.5 py-1.5 text-[12px] text-[#1A1A1A] bg-[#F8F8F8] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 placeholder-[#1A1A1A]/25"
                  />
                  <input
                    type="text" value={row.value} onChange={(e) => updateAttr(i, "value", e.target.value)}
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

          {/* Relationships — only for existing entities */}
          {!isNew && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#1A1A1A]/40">
                  Relationships
                  {myRels.length > 0 && (
                    <span className="ml-1 text-[10px] font-normal text-[#1A1A1A]/30 normal-case">({myRels.length})</span>
                  )}
                </label>
                {!showAddRel && (
                  <button
                    onClick={() => setShowAddRel(true)}
                    className="text-[11px] text-violet-600 hover:text-violet-700 font-medium"
                  >
                    + Add
                  </button>
                )}
              </div>

              {myRels.length === 0 && !showAddRel && (
                <p className="text-[12px] text-[#1A1A1A]/30 italic py-1">No relationships yet.</p>
              )}

              {myRels.length > 0 && (
                <div className="mb-2">
                  {myRels.map((rel) => {
                    const isOut  = rel.source_id === entity!.id;
                    const otherId = isOut ? rel.target_id : rel.source_id;
                    const other  = allEntities.find((e) => e.id === otherId);
                    return (
                      <RelRow
                        key={rel.id}
                        rel={rel}
                        isOutgoing={isOut}
                        otherName={other?.name ?? "Unknown"}
                        onUpdate={handleUpdateRel}
                        onDelete={handleDeleteRel}
                      />
                    );
                  })}
                </div>
              )}

              {/* Add relationship form */}
              {showAddRel && (
                <div className="mt-2 p-3 bg-[#F8F8F8] rounded-xl border border-black/[0.06] space-y-2">
                  <select
                    value={relTarget}
                    onChange={(e) => setRelTarget(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-[12px] text-[#1A1A1A] bg-white border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-200"
                  >
                    <option value="">Select target entity…</option>
                    {otherEntities.map((e) => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={relLabel}
                    onChange={(e) => setRelLabel(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAddRelationship(); }}
                    placeholder="Relationship label (e.g. friend of, mentor of)"
                    className="w-full px-2.5 py-1.5 text-[12px] text-[#1A1A1A] bg-white border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-200 placeholder-[#1A1A1A]/30"
                  />
                  {relError && <p className="text-[11px] text-red-500">{relError}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setShowAddRel(false); setRelTarget(""); setRelLabel(""); setRelError(null); }}
                      className="flex-1 py-1.5 rounded-lg text-[12px] font-medium text-[#1A1A1A]/50 hover:text-[#1A1A1A]/70 border border-black/[0.08] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddRelationship}
                      disabled={addingRel}
                      style={{ background: "#7C3AED" }}
                      className="flex-1 py-1.5 rounded-lg text-[12px] font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                      {addingRel ? "Adding…" : "Add"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-[12px] text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
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
              <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-[#1A1A1A]/50 hover:text-[#1A1A1A]/70 transition-colors">
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
              <button onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-[#1A1A1A]/50 hover:text-[#1A1A1A]/70 transition-colors">
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
              <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-[#1A1A1A]/50 hover:text-[#1A1A1A]/70 transition-colors">
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
