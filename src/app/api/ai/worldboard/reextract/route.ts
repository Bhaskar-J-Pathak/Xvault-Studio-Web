/**
 * POST /api/ai/worldboard/reextract
 *
 * Server-side extraction runner — processes chapters without requiring
 * the editor to be open. Used after a reset to rebuild the world board.
 *
 * Body: { projectId: string, chapterId?: string }
 *   - chapterId provided → re-extract that chapter only
 *   - chapterId omitted  → re-extract all chapters (ordered by position)
 */

export const maxDuration = 300;

import { NextRequest } from "next/server";
import { createServerSupabaseClient, createServiceClient } from "@/lib/auth";
import { geminiGenerate, WORLDBOARD_MODEL } from "@/lib/ai";
import {
  buildEntitySummary,
  buildExtractionPrompt,
  parseExtractionResponse,
  mergeExtractionIntoGraph,
  hasWorldBoardChanges,
  type WorldBoardMergeResult,
  type ExistingRelationship,
} from "@/lib/extraction";
import {
  checkRateLimit,
  commitRateLimit,
  recordCreditFailure,
} from "@/lib/rate-limit";

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

  const state = content as Record<string, unknown>;
  walk(state.root ?? content);
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: { projectId: string; chapterId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { projectId, chapterId } = body;
  if (!projectId) {
    return Response.json({ error: "Missing projectId" }, { status: 400 });
  }

  // Verify ownership & retrieve custom co-author metadata
  const { data: project } = await supabase
    .from("projects")
    .select("id, title, metadata")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) return Response.json({ error: "Not found" }, { status: 404 });

  const projectMetadata = (project.metadata && typeof project.metadata === "object")
    ? (project.metadata as Record<string, unknown>)
    : {};

  // Fetch optional profile-level coauthor name fallback
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("coauthor_name")
    .eq("id", user.id)
    .maybeSingle();

  const coauthorName =
    (projectMetadata.coauthor_name as string) ||
    userProfile?.coauthor_name ||
    "your co-author";

  // Fetch chapters to process
  let query = supabase
    .from("chapters")
    .select("id, title, position, content, word_count, summary")
    .eq("project_id", projectId)
    .order("position");

  if (chapterId) {
    query = query.eq("id", chapterId) as typeof query;
  }

  const { data: chapters, error: chapterError } = await query;
  if (chapterError) {
    return Response.json({ error: "Could not load saved chapters." }, { status: 500 });
  }
  if (!chapters?.length) {
    return Response.json({ error: "No chapters found to extract." }, { status: 400 });
  }

  // ── Count total chunks ──────────────────────────────────────────────────────
  const CREDITS_PER_CHUNK = 4;
  let totalChunks = 0;
  const chapterTexts: Map<string, string> = new Map();

  for (const chapter of chapters) {
    const text = lexicalToText(chapter.content);
    if (!text || text.split(/\s+/).length < 50) continue;
    chapterTexts.set(chapter.id, text);
    totalChunks += Math.ceil(text.trim().split(/\s+/).length / CHUNK_SIZE);
  }

  if (totalChunks === 0) {
    return Response.json(
      { error: "Extraction needs at least one chapter with 50 words of saved text." },
      { status: 400 }
    );
  }

  const totalCredits = totalChunks * CREDITS_PER_CHUNK;

  let rateLimitResult: { block: Response | null; remaining: number };
  try {
    rateLimitResult = await checkRateLimit(
      user.id,
      createServiceClient(),
      totalCredits,
      projectId,
      "worldboard_reextract"
    );
  } catch (err) {
    console.error("[reextract] Rate limit check failed:", err);
    return Response.json({ error: "Service temporarily unavailable" }, { status: 503 });
  }
  const { block, remaining } = rateLimitResult;
  if (block) return block;

  // ── Reset watermark so clean runs & demos always process from start ──────────
  if (chapterId) {
    await supabase.from("chapters").update({ last_extracted_word: 0 }).eq("id", chapterId);
  } else {
    await supabase.from("chapters").update({ last_extracted_word: 0 }).eq("project_id", projectId);
  }

  let chaptersProcessed = 0;
  let totalEntities = 0;
  let totalRelationships = 0;

  // Collected continuity findings to queue across chunks
  const gatheredContinuityIssues: Array<{
    chapterNumber: number;
    character: string;
    issue: string;
    conversational_hook?: string;
  }> = [];

  for (const chapter of chapters) {
    const text = chapterTexts.get(chapter.id);
    if (!text) continue;

    const words = text.trim().split(/\s+/);
    const chapterNum = (chapter.position ?? 0) + 1;
    let wordOffset = 0;

    let chapterFailure: string | null = null;
    while (wordOffset < words.length) {
      const chunk = words.slice(wordOffset, wordOffset + CHUNK_SIZE).join(" ");

      const [
        { data: existingEntities, error: entityError },
        { data: openThreads, error: threadError },
        { data: rawRels },
        { data: allChapters },
      ] = await Promise.all([
        supabase
          .from("entities")
          .select("id, name, type, attributes")
          .eq("project_id", projectId),
        supabase
          .from("plot_threads")
          .select("id, description, status, last_seen_chapter_number")
          .eq("project_id", projectId)
          .neq("status", "resolved"),
        supabase
          .from("relationships")
          .select("label, source:entities!source_id(name), target:entities!target_id(name)")
          .eq("project_id", projectId),
        supabase
          .from("chapters")
          .select("position, title, summary")
          .eq("project_id", projectId)
          .order("position"),
      ]);

      if (entityError || threadError) {
        await recordCreditFailure(
          user.id,
          "worldboard_reextract",
          CREDITS_PER_CHUNK,
          "persistence",
          entityError || threadError
        );
        return Response.json({ error: "Could not load World Board data." }, { status: 500 });
      }

      const cleanRels: ExistingRelationship[] = (rawRels ?? [])
        .map((r: any) => ({
          source: r.source?.name,
          target: r.target?.name,
          label: r.label,
        }))
        .filter((r: any) => r.source && r.target && r.label);

      const priorSummaries = (allChapters ?? [])
        .filter((c: any) => c.position < chapter.position && c.summary)
        .map((c: any) => `Chapter ${c.position + 1} (${c.title}): ${c.summary}`)
        .join("\n");

      const summary = buildEntitySummary(
        existingEntities ?? [],
        openThreads ?? [],
        cleanRels,
        priorSummaries
      );
      const prompt = buildExtractionPrompt(chunk, summary);

      let rawResponse: string;
      try {
        rawResponse = await geminiGenerate(
          prompt,
          `You are ${coauthorName}, a supportive and perceptive fiction co-author. Output valid JSON only.`,
          8192,
          true,
          WORLDBOARD_MODEL
        );
      } catch (err) {
        await recordCreditFailure(
          user.id,
          "worldboard_reextract",
          CREDITS_PER_CHUNK,
          "ai_generation",
          err
        );
        console.error(`[reextract] AI failed on chapter "${chapter.title}" offset ${wordOffset}:`, err);
        chapterFailure = `AI extraction failed for chapter "${chapter.title}".`;
        break;
      }

      const extracted = parseExtractionResponse(rawResponse);
      if (!extracted) {
        await recordCreditFailure(
          user.id,
          "worldboard_reextract",
          CREDITS_PER_CHUNK,
          "validation",
          undefined,
          "invalid_response"
        );
        chapterFailure = `The AI returned an invalid extraction for chapter "${chapter.title}".`;
        break;
      }

      let mergeResult: WorldBoardMergeResult;
      try {
        mergeResult = await mergeExtractionIntoGraph(
          projectId,
          chapter.id,
          chapterNum,
          extracted,
          existingEntities ?? [],
          supabase,
          openThreads ?? []
        );

        if (hasWorldBoardChanges(mergeResult.changes)) {
          const { error: historyError } = await supabase
            .from("worldboard_updates")
            .insert({
              project_id: projectId,
              chapter_id: chapter.id,
              chapter_number: chapterNum,
              changes: mergeResult.changes,
            });
          if (historyError) {
            console.warn("[reextract] Could not save update history:", historyError.message);
          }
        }

        // Collect continuity issues into the list
        if (extracted.continuity_issues && extracted.continuity_issues.length > 0) {
          for (const item of extracted.continuity_issues) {
            gatheredContinuityIssues.push({
              chapterNumber: chapterNum,
              character: item.character,
              issue: item.issue,
              conversational_hook: extracted.coauthor_continuity_note ?? undefined,
            });
          }
        } else if (extracted.coauthor_continuity_note) {
          gatheredContinuityIssues.push({
            chapterNumber: chapterNum,
            character: "Continuity",
            issue: extracted.coauthor_continuity_note,
            conversational_hook: extracted.coauthor_continuity_note,
          });
        }
      } catch (err) {
        await recordCreditFailure(user.id, "worldboard_reextract", CREDITS_PER_CHUNK, "persistence", err);
        console.error(`[reextract] Database merge failed on "${chapter.title}" offset ${wordOffset}:`, err);
        chapterFailure = `Could not save extracted data for chapter "${chapter.title}".`;
        break;
      }

      totalEntities +=
        mergeResult.changes.addedEntities.length +
        mergeResult.changes.updatedEntities.length;
      totalRelationships += mergeResult.changes.addedRelationships.length;
      const completedWords = Math.min(words.length, wordOffset + CHUNK_SIZE);

      const { error: progressError } = await supabase
        .from("chapters")
        .update({ last_extracted_word: completedWords })
        .eq("id", chapter.id);

      if (progressError) {
        await recordCreditFailure(user.id, "worldboard_reextract", CREDITS_PER_CHUNK, "persistence", progressError);
        return Response.json({ error: "Extracted data was saved, but progress could not be saved." }, { status: 500 });
      }

      await commitRateLimit(user.id, createServiceClient(), CREDITS_PER_CHUNK, projectId, "worldboard_reextract");
      wordOffset = completedWords;
    }

    if (chapterFailure) {
      return Response.json({
        ok: false,
        error: chapterFailure,
        chaptersProcessed,
        totalEntities,
        totalRelationships,
      }, { status: 502 });
    }

    chaptersProcessed++;
  }

  // ── Dispatch: Send 1 conversational opener, queue the rest ──────────────────
  if (gatheredContinuityIssues.length > 0) {
    const [firstIssue, ...queuedIssues] = gatheredContinuityIssues;

    const openingMessage =
      firstIssue.conversational_hook ||
      `Hey, I noticed a potential continuity snag in Chapter ${firstIssue.chapterNumber}: ${firstIssue.issue}. Did you want to look at that or keep it as is?`;

    // 1. Send the primary observation bubble
    const { error: coauthorError } = await supabase
      .from("coauthor_messages")
      .insert({
        project_id: projectId,
        role: "assistant",
        content: openingMessage,
        message_type: "observation",
      });

    if (coauthorError) {
      console.warn("[reextract] Could not save primary coauthor message:", coauthorError.message);
    }

    // 2. Persist remaining issues into the project queue
    const updatedMetadata = {
      ...projectMetadata,
      pending_continuity_queue: queuedIssues,
    };

    await supabase
      .from("projects")
      .update({ metadata: updatedMetadata })
      .eq("id", projectId);
  } else {
    // If no issues were found, clear any old pending queue
    const updatedMetadata = { ...projectMetadata };
    delete updatedMetadata.pending_continuity_queue;
    await supabase.from("projects").update({ metadata: updatedMetadata }).eq("id", projectId);
  }

  return Response.json({
    ok: true,
    chaptersProcessed,
    totalEntities,
    totalRelationships,
    remaining,
  });
}