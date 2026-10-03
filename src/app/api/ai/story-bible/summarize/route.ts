/**
 * POST /api/ai/story-bible/summarize
 *
 * Generates a 2-3 sentence Story Bible summary for a chapter using Gemini Flash.
 * Stored in chapters.summary — used in the Story Bible page and as co-author context.
 *
 * Safe to call repeatedly: skips if summary already exists unless force=true.
 * Body: { chapterId: string, projectId: string, force?: boolean }
 */

import { NextRequest } from "next/server";
import { createHash } from "node:crypto";
import { createServerSupabaseClient, createServiceClient } from "@/lib/auth";
import { geminiGenerate } from "@/lib/ai";
import { lexicalToText } from "@/lib/chunking";
import { checkRateLimit, commitRateLimit, recordCreditFailure } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  let body: { chapterId: string; projectId: string; force?: boolean; manual?: boolean };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { chapterId, projectId, force = false, manual = false } = body;
  if (!chapterId || !projectId) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }
  // Old editor clients may still send background summary requests during a
  // rolling deployment. Only explicit user actions are allowed to generate.
  if (!force && !manual) {
    return Response.json({ ok: true, skipped: true, reason: "auto_refresh_disabled" });
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

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
    .select("id, title, content, word_count, summary, summary_source_hash, position")
    .eq("id", chapterId)
    .eq("project_id", projectId)
    .single();
  if (!chapter) return Response.json({ error: "Chapter not found" }, { status: 404 });

  const text = lexicalToText(chapter.content);
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const sourceHash = createHash("sha256").update(text).digest("hex");
  if (chapter.summary && chapter.summary_source_hash === sourceHash && !force) {
    return Response.json({ ok: true, summary: chapter.summary, skipped: true, wordCount });
  }

  const billable = force || manual;
  // A manual refresh costs one credit only when this chapter actually needs a
  // new summary. The fingerprint check above makes repeat clicks free.
  if (billable) {
    const { block } = await checkRateLimit(user.id, createServiceClient(), 1, projectId, "story_bible_summary");
    if (block) return block;
  }
  if (wordCount < 100) {
    return Response.json({ ok: true, summary: null, skipped: true, reason: "too_short" });
  }

  // Cover the full chapter in one request. For unusually long chapters, sample
  // beginning, middle, and ending rather than silently dropping the ending.
  const words = text.split(/\s+/).filter(Boolean);
  const excerpt = words.length <= 20000
    ? text
    : [
        "[BEGINNING]", words.slice(0, 7000).join(" "),
        "[MIDDLE]", words.slice(Math.floor(words.length / 2) - 3000, Math.floor(words.length / 2) + 3000).join(" "),
        "[ENDING]", words.slice(-7000).join(" "),
      ].join("\n\n");
  const chapterNum = (chapter.position ?? 0) + 1;

  const prompt = `Summarize this chapter for a Story Bible.

Chapter ${chapterNum}: "${chapter.title}"

TEXT:
"""
${excerpt}
"""

Write a compact 180-260 word chapter memory. Cover the entire supplied chapter, including its ending.

Include:
- Main events and the chapter's final state
- Character decisions, emotional changes, and relationship changes
- Information each character learns or still does not know
- Objects, abilities, promises, injuries, or locations that change
- Plot threads introduced, advanced, or resolved

Use short paragraphs. Be specific and factual, past tense, no editorializing, no spoilers framing. Never invent missing information.`;

  let summary: string;
  try {
    summary = await geminiGenerate(
      prompt,
      "You write concise, factual Story Bible chapter summaries. Output only the summary — no preamble.",
      1024,
      false,
      "gemini-2.5-flash"
    );
  } catch (err) {
    if (billable) await recordCreditFailure(user.id, "story_bible_summary", 1, "ai_generation", err);
    console.error("[story-bible/summarize] AI failed:", err);
    return Response.json({ error: "AI failed" }, { status: 502 });
  }

  summary = summary.trim();
  if (!summary) {
    if (billable) await recordCreditFailure(user.id, "story_bible_summary", 1, "validation", undefined, "empty_response");
    return Response.json({ error: "Empty summary" }, { status: 500 });
  }

  const { error: saveError } = await supabase
    .from("chapters")
    .update({
      summary,
      summary_source_hash: sourceHash,
      summary_word_count: wordCount,
      summary_updated_at: new Date().toISOString(),
    })
    .eq("id", chapterId);
  if (saveError) {
    if (billable) await recordCreditFailure(user.id, "story_bible_summary", 1, "persistence", saveError);
    console.error("[story-bible/summarize] Save failed:", saveError);
    return Response.json({ error: "Summary was generated but could not be saved" }, { status: 500 });
  }

  if (billable) {
    await commitRateLimit(user.id, createServiceClient(), 1, projectId, "story_bible_summary");
  }

  return Response.json({ ok: true, summary, wordCount });
}
