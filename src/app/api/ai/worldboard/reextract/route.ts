/**
 * POST /api/ai/worldboard/reextract
 *
 * Server-side extraction runner — processes chapters without requiring
 * the editor to be open. Used after a reset to rebuild the world board.
 *
 * Body: { projectId: string, chapterId?: string }
 *   - chapterId provided → re-extract that chapter only
 *   - chapterId omitted  → re-extract all chapters (ordered by position)
 *
 * Each chapter is processed in 5000-word chunks sequentially.
 * Later chunks see entities inserted by earlier chunks, so context accumulates.
 */

// Allow up to 5 minutes — processing all chapters sequentially can take 60-90s+
export const maxDuration = 300;

import { NextRequest } from "next/server";
import { createServerSupabaseClient, createServiceClient } from "@/lib/auth";
import { geminiGenerate } from "@/lib/ai";
import {
  buildEntitySummary,
  buildExtractionPrompt,
  parseExtractionResponse,
  mergeExtractionIntoGraph,
} from "@/lib/extraction";
import { checkRateLimit } from "@/lib/rate-limit";

const CHUNK_SIZE = 5000; // words per extraction pass

// ── Lexical JSON → plain text ─────────────────────────────────────────────────

function lexicalToText(content: unknown): string {
  if (!content || typeof content !== "object") return "";
  const parts: string[] = [];

  function walk(node: unknown) {
    if (!node || typeof node !== "object") return;
    const n = node as Record<string, unknown>;
    if (n.type === "text" && typeof n.text === "string") {
      parts.push(n.text);
    }
    if (Array.isArray(n.children)) {
      for (const child of n.children) walk(child);
    }
  }

  walk(content);
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: { projectId: string; chapterId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { projectId, chapterId } = body;
  if (!projectId) return Response.json({ error: "Missing projectId" }, { status: 400 });

  // Verify ownership
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) return Response.json({ error: "Not found" }, { status: 404 });

  let rateLimitResult: { block: Response | null; remaining: number };
  try {
    rateLimitResult = await checkRateLimit(user.id, createServiceClient(), 10);
  } catch (err) {
    console.error("[reextract] Rate limit check failed:", err);
    return Response.json({ error: "Service temporarily unavailable" }, { status: 503 });
  }
  const { block, remaining } = rateLimitResult;
  if (block) return block;

  // Fetch chapters to process
  let query = supabase
    .from("chapters")
    .select("id, title, position, content, word_count")
    .eq("project_id", projectId)
    .order("position");

  if (chapterId) {
    query = query.eq("id", chapterId) as typeof query;
  }

  const { data: chapters } = await query;
  if (!chapters?.length) {
    return Response.json({ ok: true, chaptersProcessed: 0, remaining });
  }

  let chaptersProcessed = 0;
  let totalEntities     = 0;
  let totalRelationships = 0;

  // Process each chapter sequentially
  for (const chapter of chapters) {
    const text = lexicalToText(chapter.content);
    if (!text || text.split(/\s+/).length < 50) continue;

    const words       = text.trim().split(/\s+/);
    const chapterNum  = (chapter.position ?? 0) + 1;
    let wordOffset    = 0;

    // Process chapter in chunks
    while (wordOffset < words.length) {
      const chunk = words.slice(wordOffset, wordOffset + CHUNK_SIZE).join(" ");

      // Fetch current graph state (updated by each chunk so context accumulates)
      const [{ data: existingEntities }, { data: openThreads }] = await Promise.all([
        supabase.from("entities").select("id, name, type, attributes").eq("project_id", projectId),
        supabase.from("plot_threads").select("id, description, status, last_seen_chapter_number")
          .eq("project_id", projectId).neq("status", "resolved"),
      ]);

      const summary = buildEntitySummary(existingEntities ?? [], openThreads ?? []);
      const prompt  = buildExtractionPrompt(chunk, summary);

      let rawResponse: string;
      try {
        rawResponse = await geminiGenerate(
          prompt,
          "You are a JSON extraction API for fiction manuscript analysis. Output valid JSON only.",
          8192,
          true,
          "gemini-2.5-pro"
        );
      } catch (err) {
        console.error(`[reextract] AI failed on chapter "${chapter.title}" offset ${wordOffset}:`, err);
        break;
      }

      const extracted = parseExtractionResponse(rawResponse);
      if (!extracted) {
        console.error(`[reextract] Parse failed on chapter "${chapter.title}" offset ${wordOffset}`);
        break;
      }

      const inconsistencies = await mergeExtractionIntoGraph(
        projectId,
        chapter.id,
        chapterNum,
        extracted,
        existingEntities ?? [],
        supabase
      );

      totalEntities      += extracted.entities.length;
      totalRelationships += extracted.relationships.length;
      wordOffset         += CHUNK_SIZE;

      // Silence unused variable warning
      void inconsistencies;
    }

    // Update chapter watermark to full word count
    await supabase
      .from("chapters")
      .update({ last_extracted_word: words.length })
      .eq("id", chapter.id);

    chaptersProcessed++;
  }

  return Response.json({
    ok:                 true,
    chaptersProcessed,
    totalEntities,
    totalRelationships,
    remaining,
  });
}
