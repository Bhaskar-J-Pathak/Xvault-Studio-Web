/**
 * POST /api/ai/worldboard/debug
 *
 * Dry-run extraction: runs the full pipeline (context build → Gemini → parse)
 * but does NOT write anything to the database.
 *
 * Used by the World Board debug tab to inspect what Gemini extracts from
 * arbitrary text so you can tune the prompt and spot issues.
 *
 * Returns:
 *   { existingSummary, prompt, rawResponse, parsed, wordCount }
 */

import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";
import { geminiGenerate } from "@/lib/ai";
import {
  buildEntitySummary,
  buildExtractionPrompt,
  parseExtractionResponse,
} from "@/lib/extraction";

export async function POST(request: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // ── Parse body ──────────────────────────────────────────────────────────────
  let body: { projectId: string; text: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { projectId, text } = body;
  if (!projectId || !text?.trim()) {
    return Response.json({ error: "Missing projectId or text" }, { status: 400 });
  }

  // ── Verify project ownership ────────────────────────────────────────────────
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) return Response.json({ error: "Not found" }, { status: 404 });

  // ── Fetch existing knowledge graph (same as production route) ───────────────
  const [{ data: existingEntities }, { data: openThreads }] = await Promise.all([
    supabase
      .from("entities")
      .select("id, name, type, attributes")
      .eq("project_id", projectId),
    supabase
      .from("plot_threads")
      .select("id, description, status, last_seen_chapter_number")
      .eq("project_id", projectId)
      .neq("status", "resolved"),
  ]);

  // ── Build prompt ────────────────────────────────────────────────────────────
  const existingSummary = buildEntitySummary(existingEntities ?? [], openThreads ?? []);
  const prompt          = buildExtractionPrompt(text, existingSummary);
  const wordCount       = text.trim().split(/\s+/).length;

  // ── Call Gemini (same settings as production) ───────────────────────────────
  let rawResponse: string;
  try {
    rawResponse = await geminiGenerate(
      prompt,
      "You are a JSON extraction API for fiction manuscript analysis. Output valid JSON only.",
      4096,
      true,
      "gemini-2.5-pro"
    );
  } catch (err) {
    return Response.json(
      { error: `Gemini failed: ${String(err)}` },
      { status: 502 }
    );
  }

  // ── Parse ───────────────────────────────────────────────────────────────────
  const parsed = parseExtractionResponse(rawResponse);

  return Response.json({
    wordCount,
    existingSummary,
    prompt,
    rawResponse,
    parsed,
  });
}
