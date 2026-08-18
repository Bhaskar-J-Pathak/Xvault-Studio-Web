/**
 * PATCH /api/studio/worldboard/relationships/[id]  — update label
 * DELETE /api/studio/worldboard/relationships/[id] — delete
 */

import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { label } = await request.json() as { label: string };

  if (!label?.trim()) return Response.json({ error: "Label is required" }, { status: 400 });

  // Verify the relationship belongs to a project owned by this user
  const { data: rel } = await supabase
    .from("relationships")
    .select("id, project_id")
    .eq("id", id)
    .single();
  if (!rel) return Response.json({ error: "Not found" }, { status: 404 });

  const { data: project } = await supabase
    .from("projects").select("id").eq("id", rel.project_id).eq("user_id", user.id).single();
  if (!project) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await supabase.from("relationships").update({ label: label.trim() }).eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const { data: rel } = await supabase
    .from("relationships")
    .select("id, project_id")
    .eq("id", id)
    .single();
  if (!rel) return Response.json({ error: "Not found" }, { status: 404 });

  const { data: project } = await supabase
    .from("projects").select("id").eq("id", rel.project_id).eq("user_id", user.id).single();
  if (!project) return Response.json({ error: "Forbidden" }, { status: 403 });

  await supabase.from("relationships").delete().eq("id", id);
  return Response.json({ ok: true });
}
