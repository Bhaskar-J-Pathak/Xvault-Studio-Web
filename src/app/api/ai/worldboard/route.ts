/**
 * POST /api/ai/worldboard
 *
 * Runs a delta extraction pass over new manuscript text.
 * Populates entities, relationships, plot threads, and flags inconsistencies.
 *
 * Cost: ~$0.01 per 80k-word novel — uses Gemini Flash (not counted against quota).
 * Does NOT count against the user's AI request quota.
 */

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

export async function POST(request: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // ── Parse body ──────────────────────────────────────────────────────────────
  let body: {
    projectId:     string;
    chapterId:     string;
    deltaText:     string;
    chapterNumber: number;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { projectId, chapterId, deltaText, chapterNumber } = body;

  if (!projectId || !chapterId || !deltaText?.trim()) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  // ── Verify project ownership ────────────────────────────────────────────────
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) return Response.json({ error: "Not found" }, { status: 404 });

  let rateLimitResult: { block: Response | null; remaining: number };
  try {
    rateLimitResult = await checkRateLimit(user.id, createServiceClient(), 4);
  } catch (err) {
    console.error("[worldboard] Rate limit check failed:", err);
    return Response.json({ error: "Service temporarily unavailable" }, { status: 503 });
  }
  const { block, remaining } = rateLimitResult;
  if (block) return block;

  // ── Fetch existing knowledge graph (compact context) ───────────────────────
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

  // ── Build prompt (compact summary + delta text) ────────────────────────────
  const summary = buildEntitySummary(existingEntities ?? [], openThreads ?? []);
  const prompt  = buildExtractionPrompt(deltaText, summary);

  // ── Call Gemini Flash for extraction ──────────────────────────────────────
  // ~$0.01 per 80k-word novel. Does not count against the user's AI quota.
  let rawResponse: string;
  try {
    rawResponse = await geminiGenerate(
      prompt,
      "You are a JSON extraction API for fiction manuscript analysis. Output valid JSON only.",
      8192,
      true,
      "gemini-2.5-pro"   // Pro quality — at $22/user subscription, extraction cost is ~$0.90/novel
    );
  } catch (err) {
    console.error("[worldboard] AI extraction failed:", err);
    return Response.json({ error: "AI extraction failed" }, { status: 502 });
  }

  // ── Parse ───────────────────────────────────────────────────────────────────
  const extracted = parseExtractionResponse(rawResponse);
  if (!extracted) {
    console.error("[worldboard] Parse failed. Raw:", rawResponse.slice(0, 300));
    return Response.json({ error: "Failed to parse extraction result" }, { status: 500 });
  }

  // ── Merge into graph ────────────────────────────────────────────────────────
  const inconsistencies = await mergeExtractionIntoGraph(
    projectId,
    chapterId,
    chapterNumber,
    extracted,
    existingEntities ?? [],
    supabase
  );

  // ── Update chapter extraction watermark ────────────────────────────────────
  const currentWordCount = deltaText.trim().split(/\s+/).length;
  await supabase.rpc("advance_chapter_extraction", {
    p_chapter_id: chapterId,
    p_word_delta: currentWordCount,
  });

  return Response.json({
    ok:                true,
    entitiesProcessed: extracted.entities.length,
    relationshipsAdded: extracted.relationships.length,
    threadsTracked:    extracted.threads.length,
    inconsistencies:   inconsistencies.length,
    flagged:           inconsistencies,
    remaining,
  });
}
