"use client";

import { useEffect } from "react";
import { AlertTriangle, GitBranch, Link2, Plus, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase";

export interface WorldBoardUpdate {
  id: string;
  chapter_id: string | null;
  chapter_number: number;
  changes: {
    addedEntities?: Array<{ id: string; name: string; type: string; attributes?: Record<string, string> }>;
    updatedEntities?: Array<{
      id: string;
      name: string;
      attributes: Array<{ key: string; from: string | null; to: string }>;
    }>;
    addedRelationships?: Array<{ source: string; target: string; label: string }>;
    addedThreads?: Array<{ description: string; status: string }>;
    updatedThreads?: Array<{ description: string; from: string; to: string }>;
    inconsistencies?: Array<{ entity: string; attribute: string; established: string; found: string }>;
  };
  viewed_at: string | null;
  created_at: string;
}

interface Props {
  projectId: string;
  updates: WorldBoardUpdate[];
  chapterTitles: Map<string, string>;
  onViewed: () => void;
  onEntityOpen: (id: string) => void;
}

function readableKey(value: string) {
  return value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}

function updateCount(update: WorldBoardUpdate) {
  const c = update.changes;
  return (c.addedEntities?.length ?? 0) + (c.updatedEntities?.length ?? 0) +
    (c.addedRelationships?.length ?? 0) + (c.addedThreads?.length ?? 0) +
    (c.updatedThreads?.length ?? 0) + (c.inconsistencies?.length ?? 0);
}

export default function WorldBoardChanges({ projectId, updates, chapterTitles, onViewed, onEntityOpen }: Props) {
  useEffect(() => {
    const unseen = updates.filter((update) => !update.viewed_at).map((update) => update.id);
    if (unseen.length === 0) return;
    const supabase = createClient();
    supabase
      .from("worldboard_updates")
      .update({ viewed_at: new Date().toISOString() })
      .in("id", unseen)
      .eq("project_id", projectId)
      .then(({ error }) => {
        if (error) console.warn("[worldboard] Could not mark updates viewed:", error.message);
        else onViewed();
      });
  }, [onViewed, projectId, updates]);

  if (updates.length === 0) {
    return (
      <div className="world-board-empty flex h-full items-center justify-center px-6 text-center">
        <div className="max-w-xs">
          <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-violet-50 text-violet-500">
            <RefreshCw size={17} />
          </div>
          <h2 className="world-board-title text-sm font-semibold text-[#1A1A1A]">No changes recorded yet</h2>
          <p className="world-board-muted mt-1 text-xs leading-5 text-[#1A1A1A]/45">
            Keep writing. New characters, details, relationships, and plot threads will appear here after the World Board updates.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="world-board-changes h-full overflow-y-auto px-3 py-4 sm:px-6">
      <div className="mx-auto max-w-2xl space-y-3 pb-8">
        <div className="px-1 pb-1">
          <h2 className="world-board-title text-sm font-semibold text-[#1A1A1A]">What changed</h2>
          <p className="world-board-muted mt-0.5 text-[11px] text-[#1A1A1A]/45">A factual history of what Xvault added or revised as you wrote.</p>
        </div>

        {updates.map((update) => {
          const c = update.changes;
          const chapterTitle = update.chapter_id ? chapterTitles.get(update.chapter_id) : null;
          return (
            <article key={update.id} className="world-board-card rounded-2xl border border-black/[0.07] bg-white p-3.5 shadow-sm sm:p-4">
              <header className="flex items-start justify-between gap-3 border-b border-black/[0.06] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    {!update.viewed_at && <span className="h-2 w-2 rounded-full bg-violet-500" aria-label="New update" />}
                    <h3 className="world-board-title text-[13px] font-semibold text-[#1A1A1A]">
                      Chapter {update.chapter_number}{chapterTitle ? ` · ${chapterTitle}` : ""}
                    </h3>
                  </div>
                  <p className="world-board-muted mt-0.5 text-[10px] text-[#1A1A1A]/40">
                    {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(update.created_at))}
                  </p>
                </div>
                <span className="world-board-chip shrink-0 rounded-full bg-violet-50 px-2 py-1 text-[10px] font-medium text-violet-600">
                  {updateCount(update)} {updateCount(update) === 1 ? "change" : "changes"}
                </span>
              </header>

              <div className="mt-3 space-y-3">
                {(c.addedEntities ?? []).map((entity) => (
                  <ChangeRow key={`add-${entity.id}`} icon={<Plus size={13} />} tone="green" title={`Added ${entity.name}`} subtitle={readableKey(entity.type)} onClick={() => onEntityOpen(entity.id)} />
                ))}

                {(c.updatedEntities ?? []).map((entity) => (
                  <div key={`update-${entity.id}`} className="world-board-inset rounded-xl bg-black/[0.025] p-3">
                    <button onClick={() => onEntityOpen(entity.id)} className="flex w-full items-center gap-2 text-left">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-amber-50 text-amber-600"><RefreshCw size={12} /></span>
                      <span className="world-board-title text-[12px] font-medium text-[#1A1A1A]">Updated {entity.name}</span>
                    </button>
                    <div className="mt-2 space-y-1.5 pl-8">
                      {entity.attributes.map((attribute) => (
                        <p key={attribute.key} className="world-board-body text-[11px] leading-4 text-[#1A1A1A]/60">
                          <span className="font-medium">{readableKey(attribute.key)}:</span>{" "}
                          {attribute.from && <><span className="line-through opacity-55">{attribute.from}</span><span className="mx-1">→</span></>}
                          <span>{attribute.to}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                ))}

                {(c.addedRelationships ?? []).map((relationship, index) => (
                  <ChangeRow key={`rel-${index}`} icon={<Link2 size={13} />} tone="violet" title={`${relationship.source} ${relationship.label} ${relationship.target}`} subtitle="New relationship" />
                ))}

                {(c.addedThreads ?? []).map((thread, index) => (
                  <ChangeRow key={`thread-${index}`} icon={<GitBranch size={13} />} tone="blue" title={thread.description} subtitle="New plot thread" />
                ))}

                {(c.updatedThreads ?? []).map((thread, index) => (
                  <ChangeRow key={`thread-update-${index}`} icon={<GitBranch size={13} />} tone="blue" title={thread.description} subtitle={`${readableKey(thread.from)} → ${readableKey(thread.to)}`} />
                ))}

                {(c.inconsistencies ?? []).map((issue, index) => (
                  <ChangeRow key={`issue-${index}`} icon={<AlertTriangle size={13} />} tone="red" title={`${issue.entity}: ${readableKey(issue.attribute)}`} subtitle={`${issue.established} → ${issue.found}`} />
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function ChangeRow({ icon, title, subtitle, tone, onClick }: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  tone: "green" | "violet" | "blue" | "red";
  onClick?: () => void;
}) {
  const colors = {
    green: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
    blue: "bg-blue-50 text-blue-600",
    red: "bg-red-50 text-red-600",
  };
  const content = <>
    <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${colors[tone]}`}>{icon}</span>
    <span className="min-w-0">
      <span className="world-board-title block text-[12px] font-medium leading-4 text-[#1A1A1A]">{title}</span>
      <span className="world-board-muted block text-[10px] leading-4 text-[#1A1A1A]/40">{subtitle}</span>
    </span>
  </>;
  return onClick
    ? <button onClick={onClick} className="flex w-full items-start gap-2 text-left">{content}</button>
    : <div className="flex items-start gap-2">{content}</div>;
}
