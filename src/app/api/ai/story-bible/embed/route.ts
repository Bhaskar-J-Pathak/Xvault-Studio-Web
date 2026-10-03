/**
 * POST /api/ai/story-bible/embed
 *
 * Chunks a chapter's text and embeds each chunk with Gemini text-embedding-004.
 * Results stored in story_chunks for semantic search (Story Bible panel + co-author).
 *
 * Called client-side after an idle period when the manuscript changed materially.
 * Body: { chapterId: string, projectId: string }
 */

export const maxDuration = 60;

import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";
import { geminiEmbed } from "@/lib/ai";
import { lexicalToText, chunkText } from "@/lib/chunking";

/** Embed a batch of texts in parallel, capped at 5 concurrent calls. */
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

  let body: { chapterId: string; projectId: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { chapterId, projectId } = body;
  if (!chapterId || !projectId) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  // Verify ownership
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();
  if (!project) return Response.json({ error: "Not found" }, { status: 404 });

  const { data: chapter } = await supabase
    .from("chapters")
    .select("id, content, last_embedded_word")
    .eq("id", chapterId)
    .eq("project_id", projectId)
    .single();
  if (!chapter) return Response.json({ error: "Chapter not found" }, { status: 404 });

  const text  = lexicalToText(chapter.content);
  const words = text.split(/\s+/).filter(Boolean);

  const { data: existingChunks, error: existingError } = await supabase
    .from("story_chunks")
    .select("id, chunk_index, content")
    .eq("chapter_id", chapterId);

  if (existingError) {
    return Response.json({ error: "Could not read the current story index" }, { status: 500 });
  }

  if (words.length < 50) {
    if (existingChunks?.length) {
      const { error: deleteError } = await supabase
        .from("story_chunks")
        .delete()
        .eq("chapter_id", chapterId);
      if (deleteError) {
        return Response.json({ error: "Could not clear the old story index" }, { status: 500 });
      }
    }
    if ((chapter.last_embedded_word ?? 0) !== words.length) {
      await supabase
        .from("chapters")
        .update({ last_embedded_word: words.length })
        .eq("id", chapterId);
    }
    return Response.json({ ok: true, chunksCreated: 0, chunksDeleted: existingChunks?.length ?? 0, wordCount: words.length, reason: "too_short" });
  }

  const chunks = chunkText(text);
  const existingByIndex = new Map(
    (existingChunks ?? []).map((chunk) => [chunk.chunk_index as number, chunk])
  );
  const changedChunks = chunks
    .map((chunk, index) => ({ ...chunk, index, existing: existingByIndex.get(index) }))
    .filter((chunk) => !chunk.existing || chunk.existing.content !== chunk.content);
  const staleIds = (existingChunks ?? [])
    .filter((chunk) => (chunk.chunk_index as number) >= chunks.length)
    .map((chunk) => chunk.id as string);

  if (changedChunks.length === 0 && staleIds.length === 0) {
    if ((chapter.last_embedded_word ?? 0) !== words.length) {
      await supabase
        .from("chapters")
        .update({ last_embedded_word: words.length })
        .eq("id", chapterId);
    }
    return Response.json({ ok: true, chunksCreated: 0, chunksDeleted: 0, wordCount: words.length, reason: "unchanged" });
  }

  const embeddings = await embedBatch(changedChunks.map((chunk) => chunk.content));
  if (embeddings.some((embedding) => !embedding)) {
    return Response.json({ error: "Could not generate every story index embedding" }, { status: 502 });
  }
  const replacementRows = changedChunks.map((chunk, index) => {
    const embedding = embeddings[index] as number[];
    return {
      id:          (chunk.existing?.id as string | undefined) ?? crypto.randomUUID(),
      project_id:  projectId,
      chapter_id:  chapterId,
      content:     chunk.content,
      embedding:   `[${embedding.join(",")}]`,
      chunk_index: chunk.index,
      word_start:  chunk.wordStart,
    };
  });

  if (replacementRows.length) {
    const { error: upsertError } = await supabase.from("story_chunks").upsert(replacementRows, {
      onConflict: "id",
    });
    if (upsertError) {
      return Response.json({ error: "Could not save the updated story index" }, { status: 500 });
    }
  }

  if (staleIds.length) {
    const { error: deleteError } = await supabase
      .from("story_chunks")
      .delete()
      .in("id", staleIds);
    if (deleteError) {
      return Response.json({ error: "The new story index was saved, but old chunks could not be removed" }, { status: 500 });
    }
  }

  const { error: watermarkError } = await supabase
    .from("chapters")
    .update({ last_embedded_word: words.length })
    .eq("id", chapterId);
  if (watermarkError) {
    return Response.json({ error: "Story index updated, but its progress marker could not be saved" }, { status: 500 });
  }

  return Response.json({
    ok: true,
    chunksCreated: replacementRows.length,
    chunksDeleted: staleIds.length,
    chunksUnchanged: chunks.length - changedChunks.length,
    wordCount: words.length,
  });
}
