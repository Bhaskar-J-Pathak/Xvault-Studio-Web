/**
 * POST /api/ai/story-bible/embed
 *
 * Chunks a chapter's text and embeds each chunk with Gemini text-embedding-004.
 * Results stored in story_chunks for semantic search (Story Bible panel + co-author).
 *
 * Called client-side (fire-and-forget) after save when word count changes by >150.
 * Body: { chapterId: string, projectId: string }
 */

export const maxDuration = 60;

import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";
import { geminiEmbed } from "@/lib/ai";
import { lexicalToText, chunkText } from "@/lib/chunking";

const EMBED_MIN_DELTA = 150;

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

  if (words.length < 50) {
    return Response.json({ ok: true, chunksCreated: 0, reason: "too_short" });
  }

  const lastEmbedded = (chapter.last_embedded_word as number) ?? 0;
  if (Math.abs(words.length - lastEmbedded) < EMBED_MIN_DELTA) {
    return Response.json({ ok: true, chunksCreated: 0, reason: "unchanged" });
  }

  const chunks     = chunkText(text);
  const embeddings = await embedBatch(chunks.map((c) => c.content));

  // Replace all existing chunks for this chapter atomically
  await supabase.from("story_chunks").delete().eq("chapter_id", chapterId);

  let chunksCreated = 0;
  for (let i = 0; i < chunks.length; i++) {
    const embedding = embeddings[i];
    if (!embedding) continue;

    const { error } = await supabase.from("story_chunks").insert({
      project_id:  projectId,
      chapter_id:  chapterId,
      content:     chunks[i].content,
      embedding:   `[${embedding.join(",")}]`,
      chunk_index: i,
      word_start:  chunks[i].wordStart,
    });

    if (!error) chunksCreated++;
  }

  await supabase
    .from("chapters")
    .update({ last_embedded_word: words.length })
    .eq("id", chapterId);

  return Response.json({ ok: true, chunksCreated });
}
