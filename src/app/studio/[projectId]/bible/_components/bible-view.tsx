"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import type { EntityType } from "@/types/database";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CharacterAttrs {
  role?:           string;
  personality?:    string;
  motivations?:    string;
  character_arc?:  string;
  dialogue_style?: string;
}

interface BibleChapter {
  id: string;
  title: string;
  position: number;
  word_count: number;
  summary: string | null;
}

interface BibleEntity {
  id: string;
  name: string;
  type: EntityType;
  description: string | null;
  attributes: Record<string, unknown>;
}

interface BibleThread {
  id: string;
  description: string;
  status: "open" | "resolved" | "dead";
}

interface BibleRecord {
  id: string;
  project_intent: string | null;
  style_notes:    string | null;
  synopsis:       string | null;
}

interface Props {
  projectId:    string;
  projectTitle: string;
  projectGenre: string;
  bible:        BibleRecord | null;
  chapters:     BibleChapter[];
  entities:     BibleEntity[];
  threads:      BibleThread[];
}

// ── Entity display metadata ───────────────────────────────────────────────────

const ENTITY_ORDER: EntityType[] = ["character", "location", "faction", "item", "event"];

const ENTITY_LABELS: Record<EntityType, string> = {
  character: "Character",
  location:  "Location",
  faction:   "Faction",
  item:      "Item",
  event:     "Event",
};

const ENTITY_COLORS: Record<EntityType, string> = {
  character: "bg-violet-100 text-violet-700",
  location:  "bg-emerald-100 text-emerald-700",
  faction:   "bg-amber-100 text-amber-700",
  item:      "bg-blue-100 text-blue-700",
  event:     "bg-rose-100 text-rose-700",
};

const CHARACTER_ROLES = [
  { value: "protagonist",   label: "Protagonist" },
  { value: "antagonist",    label: "Antagonist" },
  { value: "supporting",    label: "Supporting Character" },
  { value: "minor",         label: "Minor Character" },
  { value: "love_interest", label: "Love Interest" },
];

const CHARACTER_SHEET_FIELDS: {
  key: keyof CharacterAttrs;
  label: string;
  placeholder: string;
}[] = [
  { key: "personality",    label: "Personality",    placeholder: "Core traits, quirks, and behavioral patterns…" },
  { key: "motivations",    label: "Motivations",    placeholder: "What drives them — goals, desires, fears, needs…" },
  { key: "character_arc",  label: "Character Arc",  placeholder: "How they change or develop through the story…" },
  { key: "dialogue_style", label: "Dialogue Style", placeholder: "How they speak: vocabulary, cadence, tone, what they leave unsaid…" },
];

// ── Spinner SVG ───────────────────────────────────────────────────────────────

function Spinner({ size = 10 }: { size?: number }) {
  return (
    <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

// ── Section divider ───────────────────────────────────────────────────────────

function Divider() {
  return <div className="h-px bg-black/[0.06] mb-10" />;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function BibleView({
  projectId,
  projectTitle,
  projectGenre,
  bible,
  chapters,
  entities,
  threads: initialThreads,
}: Props) {
  // ── Thread state ──────────────────────────────────────────────────────────
  const [threads,        setThreads]        = useState<BibleThread[]>(initialThreads);
  const [newThreadText,  setNewThreadText]  = useState("");
  const [addingThread,   setAddingThread]   = useState(false);
  const [showAddThread,  setShowAddThread]  = useState(false);

  async function markThreadResolved(id: string) {
    setThreads((prev) => prev.map((t) => t.id === id ? { ...t, status: "resolved" } : t));
    await fetch(`/api/studio/threads/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status: "resolved" }),
    });
  }

  async function addThread() {
    const text = newThreadText.trim();
    if (!text) return;
    setAddingThread(true);
    try {
      const res = await fetch("/api/studio/threads", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ projectId, description: text }),
      });
      const data = await res.json() as { thread?: BibleThread };
      if (data.thread) {
        setThreads((prev) => [...prev, data.thread!]);
        setNewThreadText("");
        setShowAddThread(false);
      }
    } finally {
      setAddingThread(false);
    }
  }

  // ── Field state ────────────────────────────────────────────────────────────
  const [intent,      setIntent]      = useState(bible?.project_intent ?? "");
  const [genre,       setGenre]       = useState(projectGenre);
  const [styleNotes,  setStyleNotes]  = useState(bible?.style_notes ?? "");
  const [synopsis,    setSynopsis]    = useState(bible?.synopsis ?? "");

  const [intentSaving,  setIntentSaving]  = useState(false);
  const [intentError,   setIntentError]   = useState(false);
  const [genreSaving,   setGenreSaving]   = useState(false);
  const [styleSaving,   setStyleSaving]   = useState(false);
  const [styleError,    setStyleError]    = useState(false);

  const [synopsisGenerating, setSynopsisGenerating] = useState(false);
  const [synopsisError,      setSynopsisError]      = useState("");

  const [summaries,     setSummaries]     = useState<Record<string, string>>(
    Object.fromEntries(chapters.map((c) => [c.id, c.summary ?? ""]))
  );
  const [generating,    setGenerating]    = useState<Record<string, boolean>>({});
  const [generateError, setGenerateError] = useState<Record<string, string>>({});

  const [entityAttrs, setEntityAttrs] = useState<Record<string, CharacterAttrs>>(
    Object.fromEntries(
      entities.map((e) => [e.id, {
        role:           (e.attributes?.role           as string) ?? "",
        personality:    (e.attributes?.personality    as string) ?? "",
        motivations:    (e.attributes?.motivations    as string) ?? "",
        character_arc:  (e.attributes?.character_arc  as string) ?? "",
        dialogue_style: (e.attributes?.dialogue_style as string) ?? "",
      }])
    )
  );
  const [expandedEntities, setExpandedEntities] = useState<Record<string, boolean>>({});
  const [analyzing,        setAnalyzing]        = useState<Record<string, boolean>>({});
  const [analyzeError,     setAnalyzeError]     = useState<Record<string, string>>({});

  // Debounce refs for auto-saves
  const intentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const genreTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const styleTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Global save state
  type SaveStatus = "idle" | "saving" | "saved" | "error";
  const [saveStatus, setSaveStatus]   = useState<SaveStatus>("idle");
  const savedResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Upsert helper ─────────────────────────────────────────────────────────
  const upsertBible = useCallback(async (patch: Record<string, unknown>): Promise<boolean> => {
    const supabase = createClient();
    const { error } = await supabase.from("story_bibles").upsert(
      { project_id: projectId, ...patch, updated_at: new Date().toISOString() },
      { onConflict: "project_id" }
    );
    if (error) console.error("[bible] upsert failed:", error);
    return !error;
  }, [projectId]);

  // ── Save All ──────────────────────────────────────────────────────────────
  const handleSaveAll = useCallback(async () => {
    // Flush any pending debounce timers so we don't double-save
    if (intentTimerRef.current) { clearTimeout(intentTimerRef.current); intentTimerRef.current = null; }
    if (genreTimerRef.current)  { clearTimeout(genreTimerRef.current);  genreTimerRef.current  = null; }
    if (styleTimerRef.current)  { clearTimeout(styleTimerRef.current);  styleTimerRef.current  = null; }
    if (savedResetRef.current)  { clearTimeout(savedResetRef.current);  savedResetRef.current  = null; }

    setSaveStatus("saving");

    const supabase = createClient();

    const ops: Promise<boolean>[] = [
      // All bible text fields in one upsert
      upsertBible({ project_intent: intent, style_notes: styleNotes, synopsis }),
      // Genre lives on the projects table
      Promise.resolve(supabase.from("projects").update({ genre }).eq("id", projectId))
        .then(({ error }) => !error),
      // Chapter summaries
      ...chapters.map((ch) =>
        Promise.resolve(supabase.from("chapters").update({ summary: summaries[ch.id] ?? "" }).eq("id", ch.id))
          .then(({ error }) => !error)
      ),
      // Character attributes
      ...entities.filter((e) => e.type === "character").map((entity) =>
        Promise.resolve(
          supabase.from("entities")
            .update({ attributes: { ...(entity.attributes ?? {}), ...entityAttrs[entity.id] } })
            .eq("id", entity.id)
        ).then(({ error }) => !error)
      ),
    ];

    const results = await Promise.all(ops);
    const allOk   = results.every(Boolean);

    setSaveStatus(allOk ? "saved" : "error");
    savedResetRef.current = setTimeout(() => setSaveStatus("idle"), 2500);
  }, [intent, genre, styleNotes, synopsis, chapters, summaries, entities, entityAttrs, projectId, upsertBible]);

  // Ctrl+S / Cmd+S keyboard shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSaveAll();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSaveAll]);

  // ── Intent ────────────────────────────────────────────────────────────────
  const handleIntentChange = (value: string) => {
    setIntent(value);
    setIntentError(false);
    if (intentTimerRef.current) clearTimeout(intentTimerRef.current);
    intentTimerRef.current = setTimeout(async () => {
      setIntentSaving(true);
      const ok = await upsertBible({ project_intent: value });
      setIntentSaving(false);
      if (!ok) setIntentError(true);
    }, 1500);
  };

  // ── Genre ─────────────────────────────────────────────────────────────────
  const handleGenreChange = (value: string) => {
    setGenre(value);
    if (genreTimerRef.current) clearTimeout(genreTimerRef.current);
    genreTimerRef.current = setTimeout(async () => {
      setGenreSaving(true);
      const supabase = createClient();
      await supabase.from("projects").update({ genre: value }).eq("id", projectId);
      setGenreSaving(false);
    }, 1500);
  };

  // ── Style & Voice ─────────────────────────────────────────────────────────
  const handleStyleChange = (value: string) => {
    setStyleNotes(value);
    setStyleError(false);
    if (styleTimerRef.current) clearTimeout(styleTimerRef.current);
    styleTimerRef.current = setTimeout(async () => {
      setStyleSaving(true);
      const ok = await upsertBible({ style_notes: value });
      setStyleSaving(false);
      if (!ok) setStyleError(true);
    }, 1500);
  };

  // ── Synopsis: save on blur ────────────────────────────────────────────────
  const handleSynopsisSave = useCallback(async (value: string) => {
    await upsertBible({ synopsis: value });
  }, [upsertBible]);

  // ── Synopsis: AI generate ─────────────────────────────────────────────────
  const handleGenerateSynopsis = useCallback(async () => {
    setSynopsisGenerating(true);
    setSynopsisError("");
    try {
      const res  = await fetch("/api/ai/story-bible/generate-synopsis", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ projectId, force: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSynopsisError(data.error ?? `Error ${res.status}`);
        return;
      }
      if (data.synopsis) setSynopsis(data.synopsis);
    } catch {
      setSynopsisError("Network error");
    } finally {
      setSynopsisGenerating(false);
    }
  }, [projectId]);

  // ── Chapter summaries ─────────────────────────────────────────────────────
  const handleSummarySave = useCallback(async (chapterId: string, value: string) => {
    const supabase = createClient();
    await supabase.from("chapters").update({ summary: value }).eq("id", chapterId);
  }, []);

  const handleGenerate = useCallback(async (chapterId: string) => {
    setGenerating((p) => ({ ...p, [chapterId]: true }));
    setGenerateError((p) => ({ ...p, [chapterId]: "" }));
    try {
      const res  = await fetch("/api/ai/story-bible/summarize", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ projectId, chapterId, force: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGenerateError((p) => ({ ...p, [chapterId]: data.error ?? `Error ${res.status}` }));
        return;
      }
      if (data.summary) {
        setSummaries((p) => ({ ...p, [chapterId]: data.summary }));
      } else if (data.reason === "too_short") {
        setGenerateError((p) => ({ ...p, [chapterId]: "Chapter needs 100+ words first" }));
      }
    } catch {
      setGenerateError((p) => ({ ...p, [chapterId]: "Network error" }));
    } finally {
      setGenerating((p) => ({ ...p, [chapterId]: false }));
    }
  }, [projectId]);

  // ── Character sheet ───────────────────────────────────────────────────────
  const handleAttrSave = useCallback(async (entityId: string, attrs: CharacterAttrs) => {
    const entity = entities.find((e) => e.id === entityId);
    if (!entity) return;
    const supabase = createClient();
    await supabase.from("entities")
      .update({ attributes: { ...(entity.attributes ?? {}), ...attrs } })
      .eq("id", entityId);
  }, [entities]);

  const updateAttr = (entityId: string, key: keyof CharacterAttrs, value: string) =>
    setEntityAttrs((p) => ({ ...p, [entityId]: { ...p[entityId], [key]: value } }));

  const handleAnalyze = useCallback(async (entityId: string) => {
    setAnalyzing((p) => ({ ...p, [entityId]: true }));
    setAnalyzeError((p) => ({ ...p, [entityId]: "" }));
    try {
      const res  = await fetch("/api/ai/story-bible/analyze-character", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ projectId, entityId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAnalyzeError((p) => ({ ...p, [entityId]: data.error ?? `Error ${res.status}` }));
        return;
      }
      if (data.profile) {
        setEntityAttrs((p) => ({ ...p, [entityId]: { ...p[entityId], ...data.profile } }));
        setExpandedEntities((p) => ({ ...p, [entityId]: true }));
      }
    } catch {
      setAnalyzeError((p) => ({ ...p, [entityId]: "Network error" }));
    } finally {
      setAnalyzing((p) => ({ ...p, [entityId]: false }));
    }
  }, [projectId]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const entitiesByType = ENTITY_ORDER.reduce((acc, type) => {
    acc[type] = entities.filter((e) => e.type === type);
    return acc;
  }, {} as Record<EntityType, BibleEntity[]>);

  const activeThreads  = threads.filter((t) => t.status === "open");
  const hasSomeSummary = chapters.some((c) => summaries[c.id]?.trim());

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="h-full overflow-y-auto bg-[#FAFAF8]">
      <div className="max-w-[740px] mx-auto px-8 py-12">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="mb-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#1A1A1A]/30 mb-1">
              Story Bible
            </p>
            <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">{projectTitle}</h1>
          </div>

          <div className="flex items-center gap-2 shrink-0 mt-1">
            {saveStatus === "saved" && (
              <span className="flex items-center gap-1 text-[11px] text-emerald-600">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Saved
              </span>
            )}
            {saveStatus === "error" && (
              <span className="text-[11px] text-red-400">Save failed</span>
            )}
            <button
              onClick={handleSaveAll}
              disabled={saveStatus === "saving"}
              title="Save all (Ctrl+S)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium bg-violet-50 text-violet-600 hover:bg-violet-100 disabled:opacity-50 transition-colors"
            >
              {saveStatus === "saving" ? <><Spinner size={10} /> Saving…</> : "Save"}
            </button>
          </div>
        </div>

        {/* ── Braindump / Intent ──────────────────────────────────────────── */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-[13px] font-semibold text-[#1A1A1A]">Braindump</h2>
            {intentSaving && <span className="text-[11px] text-[#1A1A1A]/30">Saving…</span>}
            {intentError && <span className="text-[11px] text-red-400">Save failed — check your connection</span>}
          </div>
          <p className="text-[11px] text-[#1A1A1A]/40 mb-3">
            The raw seed of this story. Why does it exist? What feeling are you chasing? Write freely — this feeds your co-author.
          </p>
          <textarea
            value={intent}
            onChange={(e) => handleIntentChange(e.target.value)}
            placeholder="A person from our world finds themselves in…"
            className="w-full min-h-[100px] bg-white border border-black/[0.08] rounded-xl px-4 py-3 text-[14px] text-[#1A1A1A] placeholder:text-[#1A1A1A]/20 resize-none outline-none focus:border-violet-300 focus:ring-1 focus:ring-violet-100 transition-colors leading-relaxed"
          />
        </section>

        {/* ── Genre ──────────────────────────────────────────────────────── */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-[13px] font-semibold text-[#1A1A1A]">Genre</h2>
            {genreSaving && <span className="text-[11px] text-[#1A1A1A]/30">Saving…</span>}
          </div>
          <p className="text-[11px] text-[#1A1A1A]/40 mb-3">
            Genre shapes tone, pacing, and reader expectations. Be specific — "Dark Portal Fantasy" beats "Fantasy".
          </p>
          <input
            type="text"
            value={genre}
            onChange={(e) => handleGenreChange(e.target.value)}
            placeholder="e.g. Dark Portal Fantasy, Cozy Mystery, Military Sci-fi…"
            className="w-full bg-white border border-black/[0.08] rounded-xl px-4 py-3 text-[14px] text-[#1A1A1A] placeholder:text-[#1A1A1A]/20 outline-none focus:border-violet-300 focus:ring-1 focus:ring-violet-100 transition-colors"
          />
        </section>

        {/* ── Style & Voice ───────────────────────────────────────────────── */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-[13px] font-semibold text-[#1A1A1A]">Style & Voice</h2>
            {styleSaving && <span className="text-[11px] text-[#1A1A1A]/30">Saving…</span>}
            {styleError && <span className="text-[11px] text-red-400">Save failed — check your connection</span>}
          </div>
          <p className="text-[11px] text-[#1A1A1A]/40 mb-3">
            How this story is written. POV, tense, sentence rhythm, tone, what you avoid. Your co-author reads this before every suggestion.
          </p>
          <textarea
            value={styleNotes}
            onChange={(e) => handleStyleChange(e.target.value)}
            placeholder="Third-person limited. Past tense. Short punchy sentences. Cinematic action beats. No clichés. Dark but not grimdark…"
            className="w-full min-h-[100px] bg-white border border-black/[0.08] rounded-xl px-4 py-3 text-[14px] text-[#1A1A1A] placeholder:text-[#1A1A1A]/20 resize-none outline-none focus:border-violet-300 focus:ring-1 focus:ring-violet-100 transition-colors leading-relaxed"
          />
        </section>

        <Divider />

        {/* ── Synopsis ────────────────────────────────────────────────────── */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-[13px] font-semibold text-[#1A1A1A]">Synopsis</h2>
            <button
              onClick={handleGenerateSynopsis}
              disabled={synopsisGenerating || !hasSomeSummary}
              title={!hasSomeSummary ? "Generate chapter summaries first" : ""}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-violet-50 text-violet-600 hover:bg-violet-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {synopsisGenerating ? <><Spinner size={10} /> Generating…</> : "Generate from summaries"}
            </button>
          </div>
          <p className="text-[11px] text-[#1A1A1A]/40 mb-3">
            The full arc of your story. AI-generated from your chapter summaries, always editable.
          </p>

          {synopsisError && (
            <p className="text-[11px] text-red-500 mb-2">{synopsisError}</p>
          )}

          <textarea
            value={synopsis}
            onChange={(e) => setSynopsis(e.target.value)}
            onBlur={(e) => handleSynopsisSave(e.target.value)}
            placeholder={
              hasSomeSummary
                ? "Click 'Generate from summaries' to build a full story synopsis…"
                : "Generate chapter summaries first, then create a synopsis here…"
            }
            className="w-full min-h-[180px] bg-white border border-black/[0.08] rounded-xl px-4 py-3 text-[14px] text-[#1A1A1A] placeholder:text-[#1A1A1A]/20 resize-none outline-none focus:border-violet-300 focus:ring-1 focus:ring-violet-100 transition-colors leading-relaxed"
          />
        </section>

        <Divider />

        {/* ── Chapter Summaries ────────────────────────────────────────────── */}
        <section className="mb-10">
          <h2 className="text-[13px] font-semibold text-[#1A1A1A] mb-1">Chapter Summaries</h2>
          <p className="text-[11px] text-[#1A1A1A]/40 mb-5">
            AI-generated per chapter, always editable. Click Generate to create or refresh.
          </p>

          {chapters.length === 0 ? (
            <p className="text-[13px] text-[#1A1A1A]/30">No chapters yet.</p>
          ) : (
            <div className="space-y-4">
              {chapters.map((chapter) => (
                <div key={chapter.id} className="bg-white border border-black/[0.07] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="shrink-0 text-[11px] font-semibold text-violet-500">
                        Ch {chapter.position + 1}
                      </span>
                      <span className="text-[11px] text-[#1A1A1A]/30">·</span>
                      <span className="text-[13px] font-medium text-[#1A1A1A] truncate">
                        {chapter.title}
                      </span>
                      <span className="shrink-0 text-[11px] text-[#1A1A1A]/30">
                        {chapter.word_count > 0
                          ? `${chapter.word_count.toLocaleString()} words`
                          : "empty"}
                      </span>
                    </div>
                    <button
                      onClick={() => handleGenerate(chapter.id)}
                      disabled={generating[chapter.id] || chapter.word_count < 100}
                      title={chapter.word_count < 100 ? "Write 100+ words first" : ""}
                      className="shrink-0 ml-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-violet-50 text-violet-600 hover:bg-violet-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {generating[chapter.id] ? <><Spinner size={10} /> Generating…</> : "Generate"}
                    </button>
                  </div>

                  {generateError[chapter.id] && (
                    <p className="text-[11px] text-red-500 mb-2">{generateError[chapter.id]}</p>
                  )}

                  <textarea
                    value={summaries[chapter.id] ?? ""}
                    onChange={(e) => setSummaries((p) => ({ ...p, [chapter.id]: e.target.value }))}
                    onBlur={(e) => handleSummarySave(chapter.id, e.target.value)}
                    placeholder={
                      chapter.word_count < 100
                        ? "Write at least 100 words in this chapter to generate a summary…"
                        : "No summary yet. Click Generate to create one."
                    }
                    className="w-full min-h-[68px] bg-[#FAFAF8] border border-black/[0.06] rounded-lg px-3 py-2.5 text-[13px] text-[#1A1A1A] placeholder:text-[#1A1A1A]/20 resize-none outline-none focus:border-violet-300 focus:ring-1 focus:ring-violet-100 transition-colors leading-relaxed"
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        <Divider />

        {/* ── Characters & World ───────────────────────────────────────────── */}
        <section className="mb-10">
          <h2 className="text-[13px] font-semibold text-[#1A1A1A] mb-1">Characters & World</h2>
          <p className="text-[11px] text-[#1A1A1A]/40 mb-5">
            Extracted from your manuscript by the World Board. Click Analyze to build a deep character profile.
          </p>

          {entities.length === 0 ? (
            <p className="text-[13px] text-[#1A1A1A]/30">
              No entities extracted yet. Write more and World Board will populate automatically.
            </p>
          ) : (
            <div className="space-y-7">
              {ENTITY_ORDER.map((type) => {
                const group = entitiesByType[type];
                if (!group?.length) return null;
                return (
                  <div key={type}>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1A1A1A]/30 mb-3">
                      {ENTITY_LABELS[type]}s
                    </p>
                    <div className="space-y-3">
                      {group.map((entity) => {
                        const isChar     = entity.type === "character";
                        const isExpanded = expandedEntities[entity.id] ?? false;
                        const attrs      = entityAttrs[entity.id] ?? {};
                        const hasSheet   = isChar && (
                          attrs.personality || attrs.motivations ||
                          attrs.character_arc || attrs.dialogue_style
                        );

                        return (
                          <div key={entity.id} className="bg-white border border-black/[0.07] rounded-xl overflow-hidden">

                            {/* Header row */}
                            <div className="flex items-start gap-3 px-4 py-3">
                              <span className={`shrink-0 mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${ENTITY_COLORS[entity.type]}`}>
                                {ENTITY_LABELS[entity.type]}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-semibold text-[#1A1A1A]">{entity.name}</p>
                                {entity.description && (
                                  <p className="text-[12px] text-[#1A1A1A]/55 leading-relaxed mt-0.5">
                                    {entity.description}
                                  </p>
                                )}
                              </div>

                              {isChar && (
                                <div className="shrink-0 flex items-center gap-2">
                                  {analyzeError[entity.id] && (
                                    <span className="text-[10px] text-red-500">{analyzeError[entity.id]}</span>
                                  )}
                                  <button
                                    onClick={() => handleAnalyze(entity.id)}
                                    disabled={analyzing[entity.id]}
                                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium bg-violet-50 text-violet-600 hover:bg-violet-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                  >
                                    {analyzing[entity.id] ? <><Spinner size={9} /> Analyzing…</> : "Analyze"}
                                  </button>
                                  <button
                                    onClick={() => setExpandedEntities((p) => ({ ...p, [entity.id]: !p[entity.id] }))}
                                    className="w-6 h-6 flex items-center justify-center rounded-lg text-[#1A1A1A]/30 hover:text-[#1A1A1A]/60 hover:bg-black/[0.05] transition-colors"
                                  >
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                                      className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}>
                                      <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Expanded character sheet */}
                            {isChar && isExpanded && (
                              <div className="border-t border-black/[0.05] px-4 py-4 space-y-4 bg-[#FAFAF8]">

                                {/* Role */}
                                <div>
                                  <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#1A1A1A]/35 mb-1.5">
                                    Role
                                  </label>
                                  <select
                                    value={attrs.role ?? ""}
                                    onChange={(e) => {
                                      updateAttr(entity.id, "role", e.target.value);
                                      handleAttrSave(entity.id, { ...attrs, role: e.target.value });
                                    }}
                                    className="w-full max-w-[220px] bg-white border border-black/[0.08] rounded-lg px-3 py-1.5 text-[12px] text-[#1A1A1A] outline-none focus:border-violet-300 focus:ring-1 focus:ring-violet-100 transition-colors"
                                  >
                                    <option value="">— Select role —</option>
                                    {CHARACTER_ROLES.map((r) => (
                                      <option key={r.value} value={r.value}>{r.label}</option>
                                    ))}
                                  </select>
                                </div>

                                {/* Deep fields */}
                                {CHARACTER_SHEET_FIELDS.map((field) => (
                                  <div key={field.key}>
                                    <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#1A1A1A]/35 mb-1.5">
                                      {field.label}
                                    </label>
                                    <textarea
                                      value={(attrs[field.key] as string) ?? ""}
                                      onChange={(e) => updateAttr(entity.id, field.key, e.target.value)}
                                      onBlur={() => handleAttrSave(entity.id, attrs)}
                                      placeholder={field.placeholder}
                                      className="w-full min-h-[68px] bg-white border border-black/[0.07] rounded-lg px-3 py-2.5 text-[13px] text-[#1A1A1A] placeholder:text-[#1A1A1A]/20 resize-none outline-none focus:border-violet-300 focus:ring-1 focus:ring-violet-100 transition-colors leading-relaxed"
                                    />
                                  </div>
                                ))}

                                {!hasSheet && (
                                  <p className="text-[11px] text-[#1A1A1A]/30 italic">
                                    Click Analyze to auto-fill these fields from your manuscript.
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── What the Story Still Owes ──────────────────────────────────── */}
        <>
          <Divider />
          <section className="mb-10">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-[13px] font-semibold text-[#1A1A1A]">
                What the Story Still Owes the Reader
              </h2>
              <button
                onClick={() => setShowAddThread((v) => !v)}
                className="text-[11px] text-violet-600 hover:text-violet-700 font-medium transition-colors"
              >
                + Add thread
              </button>
            </div>
            <p className="text-[11px] text-[#1A1A1A]/40 mb-5">
              Open plot threads — every one must be paid off before the story ends.
            </p>

            {/* Add thread input */}
            {showAddThread && (
              <div className="flex gap-2 mb-4">
                <input
                  autoFocus
                  type="text"
                  value={newThreadText}
                  onChange={(e) => setNewThreadText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addThread();
                    if (e.key === "Escape") { setShowAddThread(false); setNewThreadText(""); }
                  }}
                  placeholder="Describe the unresolved thread…"
                  className="flex-1 px-3 py-2 text-[13px] bg-white border border-black/[0.08] rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 placeholder-[#1A1A1A]/25"
                />
                <button
                  onClick={addThread}
                  disabled={addingThread || !newThreadText.trim()}
                  className="px-4 py-2 text-[12px] font-medium bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors"
                >
                  {addingThread ? "Adding…" : "Add"}
                </button>
              </div>
            )}

            {activeThreads.length === 0 && !showAddThread ? (
              <p className="text-[12px] text-[#1A1A1A]/30 italic">
                No open threads. The story owes the reader nothing — or you haven&apos;t written enough yet.
              </p>
            ) : (
              <div className="space-y-2">
                {activeThreads.map((thread) => (
                  <div key={thread.id} className="group flex items-start gap-3 bg-white border border-black/[0.07] rounded-xl px-4 py-3 hover:border-black/[0.12] transition-colors">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-[7px]" />
                    <p className="flex-1 text-[13px] text-[#1A1A1A]/75 leading-relaxed">
                      {thread.description}
                    </p>
                    <button
                      onClick={() => markThreadResolved(thread.id)}
                      title="Mark as resolved"
                      className="shrink-0 opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-emerald-600 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all"
                    >
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Resolve
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>

        <div className="h-16" />
      </div>
    </div>
  );
}
