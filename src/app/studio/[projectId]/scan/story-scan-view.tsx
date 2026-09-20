"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { usePostHog } from "posthog-js/react";
import {
  ArrowRight, BookHeart, Check, CircleAlert, HeartPulse,
  Loader2, Network, ScanSearch, Sparkles,
} from "lucide-react";

interface Chapter { id: string; title: string; position: number; word_count: number }
interface Entity { id: string; name: string; type: string }
interface Thread { id: string; description: string; status: string }
interface Observation {
  id: string; chapter_id: string; character_name: string; emotional_state: string;
  severity: string; continuity_note: string | null;
}

interface Props {
  projectId: string;
  projectTitle: string;
  chapters: Chapter[];
  entities: Entity[];
  relationshipCount: number;
  threads: Thread[];
  observations: Observation[];
  showUpgradePrompt: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  character: "characters", location: "locations", faction: "factions",
  item: "items", event: "events", lore: "pieces of lore",
};

export default function StoryScanView(props: Props) {
  const { projectId, projectTitle, chapters, entities, relationshipCount, threads, observations, showUpgradePrompt } = props;
  const router = useRouter();
  const ph = usePostHog();
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState("");
  const [error, setError] = useState("");

  const worldChapters = chapters.filter((chapter) => chapter.word_count >= 50).slice(0, 3);
  const pulseChapters = chapters.filter((chapter) => chapter.word_count >= 100).slice(0, 3);
  const estimatedCredits = worldChapters.reduce((sum, chapter) => sum + Math.ceil(chapter.word_count / 5000) * 4, 0) + pulseChapters.length;
  const hasResults = entities.length > 0 || observations.length > 0 || threads.length > 0;
  const warningCount = observations.filter((row) => row.severity === "warning" || row.severity === "notice").length;
  const characters = [...new Set(observations.map((row) => row.character_name))];
  const chapterById = useMemo(() => new Map(chapters.map((chapter) => [chapter.id, chapter])), [chapters]);
  const typeCounts = entities.reduce<Record<string, number>>((counts, entity) => {
    counts[entity.type] = (counts[entity.type] ?? 0) + 1;
    return counts;
  }, {});

  async function runScan() {
    if (!worldChapters.length) return;
    setRunning(true); setError("");
    ph?.capture("story_scan_started", { project_id: projectId, chapters: worldChapters.length, estimated_credits: estimatedCredits });
    try {
      setStage("Mapping characters, places and relationships…");
      for (const chapter of worldChapters) {
        const response = await fetch("/api/ai/worldboard/reextract", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, chapterId: chapter.id }),
        });
        const data = await response.json().catch(() => ({})) as { error?: string };
        if (!response.ok) throw new Error(data.error ?? `Could not scan ${chapter.title}.`);
      }

      if (pulseChapters.length) {
        setStage("Following the emotional movement…");
        const response = await fetch("/api/ai/story-pulse", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, chapterLimit: pulseChapters.length }),
        });
        const data = await response.json().catch(() => ({})) as { error?: string };
        if (!response.ok) throw new Error(data.error ?? "Could not build the emotional scan.");
      }

      setStage("Building your results…");
      ph?.capture("story_scan_completed", { project_id: projectId, chapters: worldChapters.length });
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The scan could not finish. Please try again.");
      ph?.capture("story_scan_failed", { project_id: projectId, error: String(reason) });
      router.refresh();
    } finally {
      setRunning(false); setStage("");
    }
  }

  return (
    <main className="story-scan h-full overflow-y-auto bg-[#FAFAF8]">
      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-violet-600">
              <ScanSearch size={16} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">Your manuscript, made visible</span>
            </div>
            <h1 className="scan-title font-serif text-3xl text-[#1A1A1A]">{hasResults ? "Your Story Scan" : "Scan your first chapters"}</h1>
            <p className="scan-body mt-2 max-w-2xl text-sm leading-6 text-[#1A1A1A]/60">
              {hasResults
                ? `Here is what Xvault can already see inside ${projectTitle}. These findings grow as the manuscript grows.`
                : "See the characters, relationships and emotional movement already present in your writing. This is analysis, not a verdict on your story."}
            </p>
          </div>
          {hasResults && <div className="flex flex-wrap gap-2">
            <button onClick={runScan} disabled={running || !worldChapters.length} className="scan-secondary inline-flex items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium disabled:opacity-50">
              {running ? <Loader2 size={14} className="animate-spin" /> : <ScanSearch size={14} />}{running ? stage : "Refresh scan"}
            </button>
            <Link href={`/studio/${projectId}/${chapters[0]?.id ?? ""}`} className="scan-secondary inline-flex items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium">Return to manuscript <ArrowRight size={14} /></Link>
          </div>}
        </header>

        {!hasResults ? (
          <section className="scan-card overflow-hidden rounded-3xl border border-black/[0.07] bg-white shadow-sm">
            <div className="border-b border-black/[0.06] bg-gradient-to-br from-violet-50 to-white px-6 py-8 sm:px-9">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-600">First Story Scan</p>
              <h2 className="scan-title mt-3 max-w-2xl font-serif text-2xl text-[#1A1A1A] sm:text-3xl">Give Xvault a few minutes to understand what you have written.</h2>
              <p className="scan-body mt-3 max-w-2xl text-sm leading-6 text-black/55">It will scan up to your first three eligible chapters. Nothing is rewritten, judged or shared.</p>
            </div>
            <div className="grid gap-px bg-black/[0.06] sm:grid-cols-3">
              <ScanPromise icon={<Network size={18} />} title="Map the world" text="Find characters, locations, factions, objects and the relationships between them." />
              <ScanPromise icon={<HeartPulse size={18} />} title="Follow the feeling" text="Track what major characters want, fear and emotionally carry from chapter to chapter." />
              <ScanPromise icon={<BookHeart size={18} />} title="Ground every insight" text="Connect observations to evidence from your prose so you can decide what matters." />
            </div>
            <div className="px-6 py-7 sm:px-9">
              {worldChapters.length ? (
                <>
                  <div className="mb-5 flex flex-col gap-2 rounded-2xl border border-violet-100 bg-violet-50/60 px-4 py-3 text-xs text-violet-900/70 sm:flex-row sm:items-center sm:justify-between">
                    <span>Scanning {worldChapters.length} {worldChapters.length === 1 ? "chapter" : "chapters"} · {worldChapters.reduce((sum, row) => sum + row.word_count, 0).toLocaleString()} words</span>
                    <span className="font-semibold text-violet-700">Uses approximately {estimatedCredits} AI credits</span>
                  </div>
                  <button onClick={runScan} disabled={running} className="scan-primary inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#1A1A1A] px-6 text-sm font-semibold text-white disabled:opacity-60 sm:w-auto">
                    {running ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    {running ? stage : "Scan my story"}
                  </button>
                </>
              ) : (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
                  <CircleAlert size={18} className="mt-0.5 shrink-0" />
                  <div><p className="font-semibold">Add a little more prose first</p><p className="mt-1 text-amber-800/75">The scan needs at least one saved chapter with 50 words.</p></div>
                </div>
              )}
              {error && <p role="alert" className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            </div>
          </section>
        ) : (
          <>
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <ResultNumber value={entities.length} label="story elements" />
              <ResultNumber value={relationshipCount} label="relationships" />
              <ResultNumber value={characters.length} label="emotional arcs" />
              <ResultNumber value={warningCount} label="moments worth reviewing" />
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-2">
              <ResultCard icon={<Network size={16} />} eyebrow="World Board" title="The world already taking shape" href={`/studio/${projectId}/worldboard`}>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(typeCounts).map(([type, count]) => <span key={type} className="scan-chip rounded-full bg-violet-50 px-3 py-1.5 text-xs text-violet-700">{count} {TYPE_LABELS[type] ?? type}</span>)}
                </div>
                <p className="scan-muted mt-4 text-sm leading-6 text-black/50">{entities.slice(0, 8).map((entity) => entity.name).join(" · ")}{entities.length > 8 ? " · more" : ""}</p>
              </ResultCard>
              <ResultCard icon={<HeartPulse size={16} />} eyebrow="Story Pulse" title="The feeling underneath the plot" href={`/studio/${projectId}/pulse`}>
                {observations.length ? <div className="space-y-3">{observations.slice(0, 3).map((row) => <div key={row.id} className="scan-inset rounded-xl bg-black/[0.025] px-3.5 py-3"><p className="text-xs font-semibold text-violet-700">{row.character_name} · {chapterById.get(row.chapter_id)?.title}</p><p className="scan-body mt-1 text-sm text-black/65">{row.emotional_state}</p></div>)}</div> : <p className="scan-muted text-sm text-black/50">Add a chapter with at least 100 words to reveal its emotional movement.</p>}
              </ResultCard>
            </section>

            {threads.length > 0 && <section className="scan-card mt-6 rounded-2xl border border-black/[0.07] bg-white p-5 sm:p-6"><div className="mb-4 flex items-center gap-2"><BookHeart size={16} className="text-violet-600"/><h2 className="scan-title font-serif text-xl">Questions your story has opened</h2></div><div className="space-y-2">{threads.slice(0, 4).map((thread) => <div key={thread.id} className="scan-inset flex items-start gap-2 rounded-xl bg-black/[0.025] px-3.5 py-3 text-sm text-black/65"><Check size={14} className="mt-0.5 shrink-0 text-violet-500"/><span>{thread.description}</span></div>)}</div></section>}

            {showUpgradePrompt ? (
              <section className="mt-6 rounded-2xl bg-[#1A1A1A] px-6 py-6 text-white sm:flex sm:items-center sm:justify-between sm:gap-6">
                <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-300">This is the beginning</p><h2 className="mt-2 font-serif text-2xl">Keep the model of your story growing.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-white/60">Xvault updates these relationships, threads and emotional arcs as the manuscript changes.</p></div>
                <Link href="/pricing" onClick={() => ph?.capture("story_scan_upgrade_clicked", { project_id: projectId })} className="mt-5 inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-[#1A1A1A] sm:mt-0">See plans <ArrowRight size={14}/></Link>
              </section>
            ) : (
              <section className="scan-card mt-6 rounded-2xl border border-black/[0.07] bg-white px-6 py-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
                <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-600">Story model active</p><h2 className="scan-title mt-2 font-serif text-2xl">Keep writing. Refresh when the story moves.</h2><p className="scan-muted mt-2 max-w-xl text-sm leading-6 text-black/50">Run another scan after adding or substantially revising chapters to update the relationships, threads and emotional arcs shown here.</p></div>
                <Link href={`/studio/${projectId}/${chapters[0]?.id ?? ""}`} className="scan-primary mt-5 inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1A1A1A] px-5 text-sm font-semibold text-white sm:mt-0">Continue writing <ArrowRight size={14}/></Link>
              </section>
            )}
          </>
        )}
        {hasResults && error && <p role="alert" className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      </div>
    </main>
  );
}

function ScanPromise({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="scan-card bg-white px-6 py-6"><span className="text-violet-600">{icon}</span><h3 className="scan-title mt-3 font-semibold">{title}</h3><p className="scan-muted mt-1.5 text-xs leading-5 text-black/50">{text}</p></div>;
}

function ResultNumber({ value, label }: { value: number; label: string }) {
  return <div className="scan-card rounded-2xl border border-black/[0.07] bg-white px-5 py-5"><p className="scan-title font-serif text-3xl">{value}</p><p className="scan-muted mt-1 text-xs text-black/45">{label}</p></div>;
}

function ResultCard({ icon, eyebrow, title, href, children }: { icon: React.ReactNode; eyebrow: string; title: string; href: string; children: React.ReactNode }) {
  return <article className="scan-card rounded-2xl border border-black/[0.07] bg-white p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2 text-violet-600">{icon}<span className="text-[10px] font-semibold uppercase tracking-widest">{eyebrow}</span></div><h2 className="scan-title mt-2 font-serif text-xl">{title}</h2></div><Link href={href} className="scan-secondary flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-black/10"><ArrowRight size={14}/></Link></div><div className="mt-5">{children}</div></article>;
}
