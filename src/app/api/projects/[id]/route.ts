/**
 * PATCH /api/projects/[id]
 * Update project title, genre, synopsis, writing_status.
 */
import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));

  const patch: Record<string, unknown> = {};
  if (typeof body.title  === "string" && body.title.trim())  patch.title  = body.title.trim();
  if (typeof body.genre  === "string")  patch.genre  = body.genre  || null;
  if (typeof body.synopsis === "string") patch.synopsis = body.synopsis.trim() || null;
  if (["drafting", "paused", "completed"].includes(body.writing_status))
    patch.writing_status = body.writing_status;

  if (Object.keys(patch).length === 0)
    return Response.json({ error: "Nothing to update." }, { status: 400 });

  const { error } = await supabase
    .from("projects")
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
