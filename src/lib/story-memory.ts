import type { SupabaseClient } from "@supabase/supabase-js";
import { geminiEmbed } from "./ai";

interface StoryMemoryRow {
  chapter_title: string;
  chapter_position: number;
  content: string;
  similarity: number;
}

interface CacheEntry { expiresAt: number; value: string }

const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 100;
const memoryCache = new Map<string, CacheEntry>();

function compactQuery(query: string): string {
  return query.replace(/\s+/g, " ").trim().slice(-1800);
}

function setCached(key: string, value: string) {
  if (memoryCache.size >= MAX_CACHE_ENTRIES) {
    const oldest = memoryCache.keys().next().value;
    if (oldest) memoryCache.delete(oldest);
  }
  memoryCache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, value });
}

/** One bounded Supabase lookup. Retrieval failure never blocks writing. */
export async function retrieveStoryMemory(
  supabase: SupabaseClient,
  projectId: string,
  query: string,
  excludeChapterId?: string
): Promise<string> {
  const compact = compactQuery(query);
  if (compact.length < 24) return "";

  const key = `${projectId}:${excludeChapterId ?? "all"}:${compact.toLowerCase()}`;
  const cached = memoryCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  if (cached) memoryCache.delete(key);

  try {
    const embedding = await geminiEmbed(compact);
    const { data, error } = await supabase.rpc("search_story_memory", {
      p_project_id: projectId,
      p_embedding: `[${embedding.join(",")}]`,
      p_limit: 6,
      p_exclude_chapter_id: excludeChapterId ?? null,
    });
    if (error) {
      console.warn("[story-memory] Retrieval unavailable:", error.message);
      return "";
    }

    const rows = ((data ?? []) as StoryMemoryRow[])
      .filter((row) => row.similarity >= 0.35)
      .slice(0, 4);
    const value = rows.map((row) => {
      const passage = row.content.trim().slice(0, 1100);
      return `Chapter ${row.chapter_position + 1}, "${row.chapter_title}" (relevance ${row.similarity.toFixed(2)}):\n${passage}`;
    }).join("\n\n");

    setCached(key, value);
    return value;
  } catch (error) {
    console.warn("[story-memory] Retrieval failed:", error);
    return "";
  }
}
