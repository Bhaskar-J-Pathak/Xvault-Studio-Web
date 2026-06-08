/**
 * POST /api/ai/story-bible/search
 *
 * Semantic search over story_chunks for a project using pgvector cosine similarity.
 * Returns the top N chunks most relevant to the query, excluding the current chapter.
 * Used by the Story Bible panel in the editor and by the co-author for context.
 *
 * Body: { projectId, query, excludeChapterId?, limit? }
 */

import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";
import { geminiEmbed } from "@/lib/ai";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    projectId: string;
    query: string;
    excludeChapterId?: string;
    limit?: number;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { projectId, query, excludeChapterId, limit = 4 } = body;
  if (!projectId || !query?.trim()) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  // Embed the query (cap at 1000 chars to control cost)
  let queryEmbedding: number[];
  try {
    queryEmbedding = await geminiEmbed(query.trim().slice(0, 1000));
  } catch (err) {
    console.error("[story-bible/search] Embed failed:", err);
    return Response.json({ error: "Embed failed" }, { status: 502 });
  }

  // pgvector similarity search via Supabase RPC
  const { data: chunks, error: rpcError } = await supabase.rpc(
    "search_story_chunks",
    {
      p_project_id:         projectId,
      p_embedding:          `[${queryEmbedding.join(",")}]`,
      p_limit:              limit,
      p_exclude_chapter_id: excludeChapterId ?? null,
    }
  );

  if (rpcError) {
    console.error("[story-bible/search] RPC error:", rpcError);
    return Response.json({ error: "Search failed" }, { status: 500 });
  }

  if (!chunks?.length) {
    return Response.json({ ok: true, results: [] });
  }

  // Fetch chapter metadata for display labels
  const chapterIds = [...new Set(chunks.map((c: { chapter_id: string }) => c.chapter_id))];
  const { data: chapterRows } = await supabase
    .from("chapters")
    .select("id, title, position")
    .in("id", chapterIds);

  const chapterMap = new Map(
    (chapterRows ?? []).map((ch: { id: string; title: string; position: number }) => [ch.id, ch])
  );

  const results = chunks.map((c: {
    id: string;
    chapter_id: string;
    content: string;
    chunk_index: number;
    similarity: number;
  }) => ({
    id:              c.id,
    content:         c.content,
    chapterId:       c.chapter_id,
    chapterTitle:    chapterMap.get(c.chapter_id)?.title ?? "Chapter",
    chapterPosition: (chapterMap.get(c.chapter_id)?.position ?? 0) + 1,
    similarity:      Math.round(c.similarity * 100) / 100,
  }));

  return Response.json({ ok: true, results });
}
