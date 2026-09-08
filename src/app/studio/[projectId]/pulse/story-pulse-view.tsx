"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { HeartPulse, Loader2, Quote, Sparkles, TriangleAlert } from "lucide-react";

interface Chapter { id: string; title: string; position: number; word_count: number }
interface Observation {
  id: string; chapter_id: string; character_name: string; emotional_state: string;
  desire: string | null; fear: string | null; change_summary: string | null;
  evidence_quote: string; continuity_note: string | null;
  severity: "none" | "notice" | "warning"; confidence: "explicit" | "inferred";
}

export default function StoryPulseView({
  projectId, chapters, initialObservations, setupRequired,
}: { projectId: string; chapters: Chapter[]; initialObservations: Observation[]; setupRequired: boolean }) {
  const router = useRouter();
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const usableChapters = chapters.filter((chapter) => chapter.word_count >= 100);
  const chapterById = new Map(chapters.map((chapter) => [chapter.id, chapter]));
  const characters = useMemo(() => [...new Set(initialObservations.map((row) => row.character_name))].sort(), [initialObservations]);
  const active = selected && characters.includes(selected) ? selected : characters[0];
  const timeline = initialObservations.filter((row) => row.character_name === active)
    .sort((a, b) => (chapterById.get(a.chapter_id)?.position ?? 0) - (chapterById.get(b.chapter_id)?.position ?? 0));

  async function analyze() {
    setAnalyzing(true); setError("");
    try {
      const response = await fetch("/api/ai/story-pulse", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId }),
      });
      const data = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Story Pulse analysis failed.");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Story Pulse analysis failed.");
    } finally { setAnalyzing(false); }
  }

  return (
    <main
      className="h-full overflow-y-auto"
      style={{ backgroundColor: "#FAFAF8", color: "#1A1A1A" }}
    >
      <div className="max-w-5xl mx-auto px-6 md:px-10 py-10">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-9">
          <div>
            <div className="flex items-center gap-2 text-violet-600 mb-2"><HeartPulse size={16} /><span className="text-[11px] font-semibold uppercase tracking-[0.18em]">Emotional continuity</span></div>
            <h1 className="font-serif text-3xl text-[#1A1A1A]">Story Pulse</h1>
            <p className="mt-2 text-sm text-[#1A1A1A]/65 max-w-xl">Follow how each character feels, wants, fears and changes across the manuscript. Possible jumps are suggestions, never verdicts.</p>
          </div>
          <button onClick={analyze} disabled={analyzing || usableChapters.length === 0 || setupRequired}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1A1A1A] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40">
            {analyzing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {analyzing ? "Reading emotional arcs…" : initialObservations.length ? "Analyze again" : "Analyze manuscript"}
          </button>
        </header>

        {setupRequired && <p role="alert" className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Story Pulse needs database migration <code>0023_story_pulse.sql</code> before its first analysis.</p>}

        <div className="mb-7 rounded-xl border border-violet-100 bg-violet-50/60 px-4 py-3 text-xs text-violet-800">
          Analyzes {usableChapters.length} saved {usableChapters.length === 1 ? "chapter" : "chapters"} · costs {usableChapters.length} AI {usableChapters.length === 1 ? "credit" : "credits"}
        </div>
        {error && <p role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        {!initialObservations.length ? (
          <section className="rounded-2xl border border-black/[0.07] bg-white px-8 py-16 text-center">
            <HeartPulse size={30} className="mx-auto mb-4 text-violet-300" />
            <h2 className="font-serif text-xl">See the emotional story between the plot points</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-black/45">Run the first analysis to create evidence-linked emotional timelines for the characters in your saved chapters.</p>
          </section>
        ) : (
          <div className="grid md:grid-cols-[220px_1fr] gap-6">
            <aside className="rounded-2xl border border-black/[0.07] bg-white p-3 h-fit">
              <p className="px-2 py-2 text-[10px] font-semibold uppercase tracking-widest text-black/50">Characters</p>
              {characters.map((name) => <button key={name} onClick={() => setSelected(name)} className={`w-full rounded-lg px-3 py-2 text-left text-sm ${active === name ? "bg-violet-100 text-violet-800 font-medium" : "text-[#1A1A1A]/70 hover:bg-black/[0.03] hover:text-[#1A1A1A]"}`}>{name}</button>)}
            </aside>
            <section>
              <h2 className="font-serif text-2xl text-[#1A1A1A] mb-5">{active}&apos;s emotional arc</h2>
              <div className="space-y-4">
                {timeline.map((row) => {
                  const chapter = chapterById.get(row.chapter_id);
                  return <article key={row.id} className="rounded-2xl border border-black/[0.07] bg-white p-5">
                    <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-widest text-violet-600">Chapter {(chapter?.position ?? 0) + 1} · {chapter?.title}</p><h3 className="mt-1.5 text-base font-semibold text-[#1A1A1A]">{row.emotional_state}</h3></div><span className="rounded-full bg-black/[0.04] px-2 py-1 text-[10px] text-black/55">{row.confidence}</span></div>
                    {(row.desire || row.fear) && <div className="mt-4 grid sm:grid-cols-2 gap-3 text-xs"><div className="rounded-lg bg-emerald-50 p-3"><span className="font-semibold text-emerald-700">Wants</span><p className="mt-1 text-black/60">{row.desire || "Not clear"}</p></div><div className="rounded-lg bg-rose-50 p-3"><span className="font-semibold text-rose-700">Fears</span><p className="mt-1 text-black/60">{row.fear || "Not clear"}</p></div></div>}
                    {row.change_summary && <p className="mt-4 text-sm text-black/60"><span className="font-medium text-black/75">What changed:</span> {row.change_summary}</p>}
                    <blockquote className="mt-4 flex gap-2 border-l-2 border-violet-300 pl-3 text-xs italic leading-relaxed text-black/65"><Quote size={12} className="mt-0.5 shrink-0 text-violet-500" />“{row.evidence_quote}”</blockquote>
                    {row.continuity_note && row.severity !== "none" && <div className={`mt-4 flex gap-2 rounded-xl p-3 text-xs ${row.severity === "warning" ? "bg-amber-50 text-amber-800" : "bg-blue-50 text-blue-800"}`}><TriangleAlert size={14} className="shrink-0" /><div><strong>{row.severity === "warning" ? "Possible emotional discontinuity" : "Worth reviewing"}</strong><p className="mt-1 opacity-80">{row.continuity_note}</p></div></div>}
                  </article>;
                })}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
