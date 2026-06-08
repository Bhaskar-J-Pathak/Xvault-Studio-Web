/**
 * POST /api/ai/story-bible/generate-synopsis
 *
 * Generates a 3-5 paragraph story synopsis from chapter summaries + project intent.
 * Stored in story_bibles.synopsis.
 *
 * Body: { projectId, force? }
 */

import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";
import { geminiGenerate } from "@/lib/ai";

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
    .select("id, title, genre")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();
  if (!project) return Response.json({ error: "Not found" }, { status: 404 });

  // Fetch existing bible (for intent + existing synopsis)
  const { data: bible } = await supabase
    .from("story_bibles")
    .select("id, project_intent, synopsis")
    .eq("project_id", projectId)
    .maybeSingle();

  if (bible?.synopsis && !force) {
    return Response.json({ ok: true, synopsis: bible.synopsis, skipped: true });
  }

  // Fetch chapters with summaries, ordered by position
  const { data: chapters } = await supabase
    .from("chapters")
    .select("id, title, position, summary, word_count")
    .eq("project_id", projectId)
    .order("position");

  const summarised = (chapters ?? []).filter((c) => c.summary?.trim());
  if (!summarised.length) {
    return Response.json(
      { error: "Generate at least one chapter summary first" },
      { status: 400 }
    );
  }

  const chapterBlock = summarised
    .map((c) => `Chapter ${c.position + 1} — "${c.title}":\n${c.summary}`)
    .join("\n\n");

  const genreNote = project.genre ? `Genre: ${project.genre}\n` : "";
  const intentNote = bible?.project_intent
    ? `Project Intent: ${bible.project_intent}\n`
    : "";

  const prompt = `Create a Story Bible Synopsis for the following story.

Title: "${project.title}"
${genreNote}${intentNote}
Chapter Summaries:
${chapterBlock}

Write a 3–5 paragraph Synopsis covering the full story arc so far.
Include: the opening situation and protagonist(s), the central conflict and stakes, major plot beats and turning points, key character relationships, and where the story is heading.
Be specific — use character names and concrete events. Present tense. No editorialising.`;

  let synopsis: string;
  try {
    synopsis = await geminiGenerate(
      prompt,
      "You write compelling, specific Story Bible synopses. Output only the synopsis — no preamble or labels.",
      2048,
      false,
      "gemini-2.5-flash"
    );
  } catch (err) {
    console.error("[generate-synopsis] AI failed:", err);
    return Response.json({ error: "AI failed" }, { status: 502 });
  }

  synopsis = synopsis.trim();
  if (!synopsis) return Response.json({ error: "Empty response" }, { status: 500 });

  // Upsert into story_bibles
  await supabase.from("story_bibles").upsert(
    { project_id: projectId, synopsis, updated_at: new Date().toISOString() },
    { onConflict: "project_id" }
  );

  return Response.json({ ok: true, synopsis });
}
