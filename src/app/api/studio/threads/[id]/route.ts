/**
 * PATCH /api/studio/threads/[id]  — update status or description
 * DELETE /api/studio/threads/[id] — delete a thread
 */

import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";

async function verifyOwnership(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  threadId: string,
  userId: string
) {
  const { data } = await supabase
    .from("plot_threads")
    .select("id, project_id")
    .eq("id", threadId)
    .single();
  if (!data) return null;

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", data.project_id)
    .eq("user_id", userId)
    .single();

  return project ? data : null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await verifyOwnership(supabase, id, user.id);
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  let body: { status?: string; description?: string };
  try { body = await request.json(); } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (body.status !== undefined) {
    if (!["open", "resolved", "dead"].includes(body.status)) {
      return Response.json({ error: "Invalid status" }, { status: 400 });
    }
    update.status = body.status;
  }
  if (body.description !== undefined) update.description = body.description.trim();

  const { data: thread, error } = await supabase
    .from("plot_threads")
    .update(update)
    .eq("id", id)
    .select("id, description, status")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ thread });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await verifyOwnership(supabase, id, user.id);
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  await supabase.from("plot_threads").delete().eq("id", id);
  return Response.json({ ok: true });
}
