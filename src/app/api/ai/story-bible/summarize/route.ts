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
import { createServerSupabaseClient } from "@/lib/auth";
import { geminiGenerate } from "@/lib/ai";
import { lexicalToText } from "@/lib/chunking";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: { chapterId: string; projectId: string; force?: boolean };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { chapterId, projectId, force = false } = body;
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
    .select("id, title, content, word_count, summary, position")
    .eq("id", chapterId)
    .eq("project_id", projectId)
    .single();
  if (!chapter) return Response.json({ error: "Chapter not found" }, { status: 404 });

  // Skip if summary exists and not forced
  if (chapter.summary && !force) {
    return Response.json({ ok: true, summary: chapter.summary, skipped: true });
  }

  const text = lexicalToText(chapter.content);
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (wordCount < 100) {
    return Response.json({ ok: true, summary: null, skipped: true, reason: "too_short" });
  }

  // Use first 3000 words — enough to capture key events without overshooting cost
  const excerpt    = text.split(/\s+/).slice(0, 3000).join(" ");
  const chapterNum = (chapter.position ?? 0) + 1;

  const prompt = `Summarize this chapter for a Story Bible.

Chapter ${chapterNum}: "${chapter.title}"

TEXT:
"""
${excerpt}
"""

Write 2-3 sentences that capture:
1. The main events and what changes
2. Key characters involved and how they change
3. Any plot threads introduced or resolved

Rules: specific and factual, past tense, no editorializing, no spoilers framing.`;

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
    console.error("[story-bible/summarize] AI failed:", err);
    return Response.json({ error: "AI failed" }, { status: 502 });
  }

  summary = summary.trim();
  if (!summary) return Response.json({ error: "Empty summary" }, { status: 500 });

  await supabase
    .from("chapters")
    .update({ summary })
    .eq("id", chapterId);

  return Response.json({ ok: true, summary });
}
