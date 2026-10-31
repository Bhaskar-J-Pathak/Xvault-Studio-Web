/**
 * POST /api/studio/worldboard/reset
 *
 * Wipes world-board data for a project, resets co-author observation queues
 * and messages, and resets the extraction watermark on chapters so the
 * extraction runner re-evaluates everything from word 0.
 *
 * Body: { projectId: string, chapterId?: string }
 *   - If chapterId is provided → chapter-scoped reset (only entities first
 *     seen in that chapter + their relationships + that chapter's threads).
 *   - If omitted → full project reset.
 */

import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";

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

  // Verify ownership & fetch current project metadata
  const { data: project } = await supabase
    .from("projects")
    .select("id, metadata")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) return Response.json({ error: "Not found" }, { status: 404 });

  const currentMetadata = (project.metadata && typeof project.metadata === "object")
    ? (project.metadata as Record<string, unknown>)
    : {};

  if (chapterId) {
    // ── Chapter-scoped reset ───────────────────────────────────────────────────
    // Verify chapter belongs to this project
    const { data: chapter } = await supabase
      .from("chapters")
      .select("id")
      .eq("id", chapterId)
      .eq("project_id", projectId)
      .single();

    if (!chapter) return Response.json({ error: "Chapter not found" }, { status: 404 });

    // Find entities first seen in this chapter
    const { data: chapterEntities } = await supabase
      .from("entities")
      .select("id")
      .eq("project_id", projectId)
      .eq("first_seen_chapter_id", chapterId);

    const entityIds = (chapterEntities ?? []).map((e) => e.id);

    if (entityIds.length > 0) {
      // Delete relationships involving these entities
      await supabase
        .from("relationships")
        .delete()
        .eq("project_id", projectId)
        .or(`source_id.in.(${entityIds.join(",")}),target_id.in.(${entityIds.join(",")})`);

      // Delete inconsistency flags for these entities
      await supabase
        .from("inconsistency_flags")
        .delete()
        .eq("project_id", projectId)
        .in("entity_id", entityIds);

      // Delete the entities
      await supabase
        .from("entities")
        .delete()
        .in("id", entityIds);
    }

    // Delete plot threads introduced in this chapter
    await supabase
      .from("plot_threads")
      .delete()
      .eq("project_id", projectId)
      .eq("introduced_chapter_id", chapterId);

    // Delete updates associated with this chapter
    await supabase
      .from("worldboard_updates")
      .delete()
      .eq("project_id", projectId)
      .eq("chapter_id", chapterId);

    // Reset extraction watermark for this chapter only
    await supabase
      .from("chapters")
      .update({ last_extracted_word: 0 })
      .eq("id", chapterId);

    // Clear co-author observation queue and chat for a clean re-test
    await Promise.all([
      supabase.from("coauthor_messages").delete().eq("project_id", projectId),
      supabase.from("projects").update({
        metadata: {
          ...currentMetadata,
          pending_continuity_queue: [],
        },
      }).eq("id", projectId),
    ]);

  } else {
    // ── Full project reset ─────────────────────────────────────────────────────
    await Promise.all([
      supabase.from("inconsistency_flags").delete().eq("project_id", projectId),
      supabase.from("relationships").delete().eq("project_id", projectId),
      supabase.from("entities").delete().eq("project_id", projectId),
      supabase.from("plot_threads").delete().eq("project_id", projectId),
      supabase.from("worldboard_updates").delete().eq("project_id", projectId),
      supabase.from("chapters").update({ last_extracted_word: 0 }).eq("project_id", projectId),

      // Reset co-author chat messages and pending continuity queues
      supabase.from("coauthor_messages").delete().eq("project_id", projectId),
      supabase.from("projects").update({
        metadata: {
          ...currentMetadata,
          pending_continuity_queue: [],
        },
      }).eq("id", projectId),
    ]);
  }

  return Response.json({ ok: true, scope: chapterId ? "chapter" : "project" });
}