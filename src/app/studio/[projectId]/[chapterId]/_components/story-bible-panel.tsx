"use client";

import { useState, useEffect, useRef } from "react";

interface StoryBibleResult {
  id: string;
  content: string;
  chapterId: string;
  chapterTitle: string;
  chapterPosition: number;
  similarity: number;
}

interface Props {
  query: string;
  projectId: string;
  currentChapterId: string;
  onClose: () => void;
}

const MIN_SIMILARITY = 0.65;

export default function StoryBiblePanel({
  query,
  projectId,
  currentChapterId,
  onClose,
}: Props) {
  const [results,   setResults]   = useState<StoryBibleResult[]>([]);
  const [status,    setStatus]    = useState<"idle" | "searching" | "empty">("idle");
  const [indexing,  setIndexing]  = useState(false);
  const [indexed,   setIndexed]   = useState(false);
  const abortRef                  = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!query || query.trim().length < 30) return;

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setStatus("searching");

    fetch("/api/ai/story-bible/search", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        query:            query.trim(),
        excludeChapterId: currentChapterId,
        limit:            4,
      }),
      signal: abortRef.current.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        const filtered = (data.results ?? []).filter(
          (r: StoryBibleResult) => r.similarity >= MIN_SIMILARITY
        );
        setResults(filtered);
        setStatus(filtered.length === 0 ? "empty" : "idle");
      })
      .catch((err) => {
        if (err.name !== "AbortError") setStatus("idle");
      });
  }, [query, projectId, currentChapterId]);

  async function handleReindex() {
    setIndexing(true);
    try {
      await fetch("/api/ai/story-bible/embed-project", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, force: true }),
      });
      setIndexed(true);
      // Re-run the search now that chunks exist
      if (query && query.trim().length >= 30) {
        setStatus("searching");
        const res  = await fetch("/api/ai/story-bible/search", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            query:            query.trim(),
            excludeChapterId: currentChapterId,
            limit:            4,
          }),
        });
        const data = await res.json();
        const filtered = (data.results ?? []).filter(
          (r: StoryBibleResult) => r.similarity >= MIN_SIMILARITY
        );
        setResults(filtered);
        setStatus(filtered.length === 0 ? "empty" : "idle");
      }
    } catch {
      // silently ignore
    } finally {
      setIndexing(false);
    }
  }

  return (
    <div className="w-[268px] shrink-0 border-l border-black/[0.06] flex flex-col bg-[#FAFAF8]">

      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-black/[0.06] bg-white">
        <div className="flex items-center gap-2">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-violet-500 shrink-0">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          <span className="text-[12px] font-semibold text-[#1A1A1A]">Story Bible</span>
          {status === "searching" && (
            <svg className="animate-spin text-[#1A1A1A]/25" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-5 h-5 flex items-center justify-center rounded text-[#1A1A1A]/30 hover:text-[#1A1A1A]/60 hover:bg-black/[0.05] transition-colors"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Section label */}
      <div className="px-4 py-2 border-b border-black/[0.04]">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1A1A1A]/30">
          Related passages
        </p>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">

        {status === "idle" && results.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full px-5 py-10 text-center gap-3">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#1A1A1A]/10">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
            <p className="text-[11px] text-[#1A1A1A]/30 leading-relaxed">
              Write to surface related passages from your earlier chapters.
            </p>
          </div>
        )}

        {status === "empty" && (
          <div className="flex flex-col items-center justify-center h-full px-5 py-10 text-center gap-3">
            <p className="text-[11px] text-[#1A1A1A]/30 leading-relaxed">
              {indexed
                ? "No closely related passages found. Try writing more of the scene."
                : "No related passages found. If this is a new project, index your chapters first."}
            </p>
            {!indexed && (
              <button
                onClick={handleReindex}
                disabled={indexing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 border border-violet-100 text-[11px] font-medium text-violet-600 hover:bg-violet-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {indexing ? (
                  <>
                    <svg className="animate-spin" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    Indexing…
                  </>
                ) : (
                  "Index chapters"
                )}
              </button>
            )}
          </div>
        )}

        {results.map((result, idx) => (
          <div
            key={result.id}
            className={`px-4 py-3.5 ${idx < results.length - 1 ? "border-b border-black/[0.04]" : ""}`}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-[10px] font-semibold text-violet-500">
                Ch {result.chapterPosition}
              </span>
              <span className="text-[10px] text-[#1A1A1A]/25">·</span>
              <span className="text-[10px] text-[#1A1A1A]/45 truncate">
                {result.chapterTitle}
              </span>
            </div>
            <p className="text-[12px] text-[#1A1A1A]/55 leading-relaxed line-clamp-5">
              {result.content}
            </p>
          </div>
        ))}

      </div>
    </div>
  );
}
