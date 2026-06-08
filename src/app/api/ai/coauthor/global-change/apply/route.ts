/**
 * POST /api/ai/coauthor/global-change/apply
 *
 * Phase 2 — Apply.
 * Takes the writer-approved subset of changes and applies them to chapter content.
 * Groups by chapterId for efficient batch updates.
 *
 * Body: { projectId, changes: ChangeItem[] }
 * Returns: { applied: number, skipped: number, details: string[] }
 */

import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";
import { lexicalReplace } from "@/lib/lexical-replace";
import type { ChangeItem } from "../route";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: { projectId: string; changes: ChangeItem[] };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { projectId, changes } = body;
  if (!projectId || !Array.isArray(changes) || !changes.length) {
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

  // Group approved changes by chapterId
  const byChapter = new Map<string, ChangeItem[]>();
  for (const change of changes) {
    if (!byChapter.has(change.chapterId)) byChapter.set(change.chapterId, []);
    byChapter.get(change.chapterId)!.push(change);
  }

  const chapterIds = Array.from(byChapter.keys());

  // Fetch all affected chapters at once
  const { data: chapters } = await supabase
    .from("chapters")
    .select("id, content")
    .in("id", chapterIds)
    .eq("project_id", projectId);

  if (!chapters?.length) {
    return Response.json({ error: "Chapters not found" }, { status: 404 });
  }

  let totalApplied = 0;
  let totalSkipped = 0;
  const details: string[] = [];

  // Apply all changes for each chapter, then save once
  const updates: Array<{ id: string; content: Record<string, unknown> }> = [];

  for (const chapter of chapters) {
    const chapterChanges = byChapter.get(chapter.id) ?? [];
    let content = chapter.content as Record<string, unknown>;
    let chapterCount = 0;

    for (const change of chapterChanges) {
      const { content: updated, count } = lexicalReplace(
        content,
        change.original,
        change.replacement
      );
      if (count > 0) {
        content = updated;
        chapterCount += count;
        totalApplied += count;
      } else {
        totalSkipped++;
        details.push(
          `Skipped in chapter "${change.chapterTitle}": phrase not found verbatim — "${change.original.slice(0, 50)}"`
        );
      }
    }

    if (chapterCount > 0) {
      updates.push({ id: chapter.id, content });
    }
  }

  // Batch-save all modified chapters
  const saveErrors: string[] = [];
  await Promise.all(
    updates.map(async ({ id, content }) => {
      const { error } = await supabase
        .from("chapters")
        .update({ content, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) saveErrors.push(id);
    })
  );

  if (saveErrors.length) {
    console.error("[global-change/apply] Save errors for chapters:", saveErrors);
  }

  return Response.json({
    ok: true,
    applied: totalApplied,
    skipped: totalSkipped,
    details,
    saveErrors: saveErrors.length,
  });
}
