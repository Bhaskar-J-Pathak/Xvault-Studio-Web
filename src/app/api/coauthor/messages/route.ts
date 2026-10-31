/**
 * GET  /api/coauthor/messages?projectId=...&limit=30   — fetch history
 * DELETE /api/coauthor/messages?projectId=...          — clear all messages for project
 * DELETE /api/coauthor/messages?projectId=...&id=...   — delete single message
 */

import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const projectId = request.nextUrl.searchParams.get("projectId");
  const limit = Math.min(parseInt(request.nextUrl.searchParams.get("limit") ?? "30"), 50);
  if (!projectId) return Response.json({ error: "Missing projectId" }, { status: 400 });

  // Verify ownership
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();
  if (!project) return Response.json({ error: "Not found" }, { status: 404 });

  const { data: messages } = await supabase
    .from("coauthor_messages")
    .select("id, role, content, message_type, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return Response.json({ messages: messages ?? [] });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const projectId  = request.nextUrl.searchParams.get("projectId");
  const messageId  = request.nextUrl.searchParams.get("id");
  if (!projectId) return Response.json({ error: "Missing projectId" }, { status: 400 });

  // Verify ownership & fetch metadata
  const { data: project } = await supabase
    .from("projects")
    .select("id, metadata")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();
  if (!project) return Response.json({ error: "Not found" }, { status: 404 });

  if (messageId) {
    // Delete a single message
    await supabase
      .from("coauthor_messages")
      .delete()
      .eq("id", messageId)
      .eq("project_id", projectId);
  } else {
    // Clear all messages for this project + reset co-author continuity state
    const currentMetadata = (project.metadata && typeof project.metadata === "object")
      ? (project.metadata as Record<string, unknown>)
      : {};

    await Promise.all([
      // 1. Delete all messages
      supabase
        .from("coauthor_messages")
        .delete()
        .eq("project_id", projectId),

      // 2. Clear any queued continuity issues from project metadata
      supabase
        .from("projects")
        .update({
          metadata: {
            ...currentMetadata,
            pending_continuity_queue: [],
          },
        })
        .eq("id", projectId),

      // 3. Reset watermark so extraction evaluates from word 0
      supabase
        .from("chapters")
        .update({ last_extracted_word: 0 })
        .eq("project_id", projectId),
    ]);

    // 4. Trigger re-extraction in the background to re-analyze and post the opening observation
    const origin = request.nextUrl.origin;
    fetch(`${origin}/api/ai/worldboard/reextract`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: request.headers.get("cookie") ?? "",
      },
      body: JSON.stringify({ projectId }),
    }).catch((err) => console.error("[coauthor/messages] Background reextract trigger failed:", err));
  }

  return Response.json({ ok: true });
}