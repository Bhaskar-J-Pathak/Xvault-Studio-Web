/**
 * POST /api/ai/coauthor/edit/apply
 *
 * Phase 2 — Apply approved paragraph edits to a chapter.
 * Snapshots the current content to chapter_versions BEFORE touching
 * anything, then applies each approved edit in order.
 *
 * Body:    { projectId, chapterId, edits: ParagraphEdit[] }
 * Returns: { applied: number, skipped: number }
 */

import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";
import { lexicalReplaceParagraphByIndex } from "@/lib/lexical-replace";
import type { ParagraphEdit } from "../analyze/route";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: { projectId: string; chapterId: string; edits: ParagraphEdit[] };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { projectId, chapterId, edits } = body;
  if (!projectId || !chapterId || !Array.isArray(edits) || !edits.length) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  // Verify ownership via project
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();
  if (!project) return Response.json({ error: "Not found" }, { status: 404 });

  // Fetch the chapter
  const { data: chapter } = await supabase
    .from("chapters")
    .select("id, title, content")
    .eq("id", chapterId)
    .eq("project_id", projectId)
    .single();
  if (!chapter) return Response.json({ error: "Chapter not found" }, { status: 404 });

  // ── Snapshot before touching anything ──────────────────────────────────────
  const editCount = edits.length;
  await supabase.from("chapter_versions").insert({
    chapter_id:     chapterId,
    content:        chapter.content,
    change_type:    "edit_session",
    change_summary: `Line edit: ${editCount} paragraph${editCount !== 1 ? "s" : ""} rewritten in "${chapter.title}"`,
  });

  // ── Apply edits in index order ──────────────────────────────────────────────
  // Sort descending so that replacing a later paragraph doesn't shift earlier indices
  const sorted = [...edits].sort((a, b) => b.index - a.index);

  let content = chapter.content as Record<string, unknown>;
  let applied = 0;
  let skipped = 0;

  for (const edit of sorted) {
    const { content: updated, replaced } = lexicalReplaceParagraphByIndex(
      content,
      edit.index,
      edit.rewritten
    );
    if (replaced) {
      content = updated;
      applied++;
    } else {
      skipped++;
    }
  }

  if (applied === 0) {
    return Response.json({ ok: true, applied: 0, skipped });
  }

  // Save the updated chapter
  const { error } = await supabase
    .from("chapters")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", chapterId);

  if (error) {
    console.error("[edit/apply] Save failed:", error);
    return Response.json({ error: "Failed to save chapter" }, { status: 500 });
  }

  return Response.json({ ok: true, applied, skipped });
}
