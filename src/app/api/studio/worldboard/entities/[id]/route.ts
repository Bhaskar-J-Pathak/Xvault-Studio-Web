/**
 * PATCH /api/studio/worldboard/entities/[id]  — update entity
 * DELETE /api/studio/worldboard/entities/[id] — delete entity + its relationships
 */

import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";

async function verifyOwnership(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>, entityId: string, userId: string) {
  const { data } = await supabase
    .from("entities")
    .select("id, project_id")
    .eq("id", entityId)
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

  let body: { name?: string; type?: string; attributes?: Record<string, string> };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (body.name !== undefined)       update.name       = body.name.trim();
  if (body.type !== undefined)       update.type       = body.type;
  if (body.attributes !== undefined) update.attributes = body.attributes;

  const { data: entity, error } = await supabase
    .from("entities")
    .update(update)
    .eq("id", id)
    .select("id, name, type, attributes, confidence, position, first_seen_chapter_id")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ entity });
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

  const projectId = existing.project_id;

  // Delete relationships involving this entity
  await supabase
    .from("relationships")
    .delete()
    .eq("project_id", projectId)
    .or(`source_id.eq.${id},target_id.eq.${id}`);

  // Delete inconsistency flags
  await supabase
    .from("inconsistency_flags")
    .delete()
    .eq("entity_id", id);

  // Delete the entity
  await supabase.from("entities").delete().eq("id", id);

  return Response.json({ ok: true });
}
