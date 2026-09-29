/**
 * POST /api/ai/story-bible/embed-project
 *
 * Re-embeds all chapters in a project. Used to recover from a failed seed embed
 * or to force a full re-index. Skips chapters that are already up-to-date unless
 * force=true.
 *
 * Body: { projectId: string, force?: boolean }
 */

export const maxDuration = 60;

import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";
import { geminiEmbed } from "@/lib/ai";
import { lexicalToText, chunkText } from "@/lib/chunking";

async function embedBatch(texts: string[]): Promise<(number[] | null)[]> {
  const SIZE = 5;
  const results: (number[] | null)[] = [];
  for (let i = 0; i < texts.length; i += SIZE) {
    const batch = await Promise.all(
      texts.slice(i, i + SIZE).map((t) => geminiEmbed(t).catch(() => null))
    );
    results.push(...batch);
  }
  return results;
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: { projectId: string; force?: boolean };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { projectId, force = false } = body;
  if (!projectId) return Response.json({ error: "Missing projectId" }, { status: 400 });

  // Verify ownership
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();
  if (!project) return Response.json({ error: "Not found" }, { status: 404 });

  const { data: chapters } = await supabase
    .from("chapters")
    .select("id, content, last_embedded_word, word_count")
    .eq("project_id", projectId)
    .order("position");

  if (!chapters?.length) {
    return Response.json({ ok: true, chaptersEmbedded: 0, reason: "no_chapters" });
  }

  const { data: existingChunks, error: existingChunksError } = await supabase
    .from("story_chunks")
    .select("id, chapter_id, chunk_index")
    .eq("project_id", projectId);
  if (existingChunksError) {
    return Response.json({ error: "Could not read the current story index" }, { status: 500 });
  }
  const existingChunkIds = new Map(
    (existingChunks ?? []).map((chunk) => [
      `${chunk.chapter_id}:${chunk.chunk_index}`,
      chunk.id as string,
    ])
  );

  let chaptersEmbedded = 0;

  for (const chapter of chapters) {
    const text  = lexicalToText(chapter.content);
    const words = text.split(/\s+/).filter(Boolean);

    if (words.length < 50) continue;

    const lastEmbedded = (chapter.last_embedded_word as number) ?? 0;
    // Skip if already embedded and not forcing a re-index
    if (!force && lastEmbedded > 0 && Math.abs(words.length - lastEmbedded) < 150) continue;

    const chunks     = chunkText(text);
    const embeddings = await embedBatch(chunks.map((c) => c.content));
    if (embeddings.some((embedding) => !embedding)) continue;

    const rows = chunks.map((chunk, index) => ({
      id:          existingChunkIds.get(`${chapter.id}:${index}`) ?? crypto.randomUUID(),
      project_id:  projectId,
      chapter_id:  chapter.id,
      content:     chunk.content,
      embedding:   `[${(embeddings[index] as number[]).join(",")}]`,
      chunk_index: index,
      word_start:  chunk.wordStart,
    }));
    const { error: upsertError } = await supabase.from("story_chunks").upsert(rows, {
      onConflict: "id",
    });
    if (upsertError) continue;

    // Remove only chunks beyond the new chapter length. Existing positions
    // were updated in place by the bulk upsert above.
    const { error: staleDeleteError } = await supabase.from("story_chunks")
      .delete()
      .eq("chapter_id", chapter.id)
      .gte("chunk_index", chunks.length);
    if (staleDeleteError) continue;

    if (rows.length > 0) {
      const { error: watermarkError } = await supabase
        .from("chapters")
        .update({ last_embedded_word: words.length })
        .eq("id", chapter.id);
      if (watermarkError) continue;
      chaptersEmbedded++;
    }
  }

  return Response.json({ ok: true, chaptersEmbedded });
}
