import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json().catch(() => null) as { decision?: string; response?: string } | null;
  if (!body || !["typo", "intentional", "explained"].includes(body.decision ?? "")) {
    return Response.json({ error: "Invalid decision" }, { status: 400 });
  }
  const { data: flag } = await supabase.from("inconsistency_flags")
    .select("id, project_id, entity_id, attribute, found_value, status")
    .eq("id", id).eq("status", "pending").single();
  if (!flag) return Response.json({ error: "Flag not found" }, { status: 404 });
  const { data: project } = await supabase.from("projects").select("id")
    .eq("id", flag.project_id).eq("user_id", user.id).single();
  if (!project) return Response.json({ error: "Not found" }, { status: 404 });

  if (body.decision === "intentional" && flag.entity_id) {
    const { data: entity } = await supabase.from("entities").select("attributes").eq("id", flag.entity_id).single();
    if (entity) {
      const attributes = { ...(entity.attributes as Record<string, unknown> ?? {}), [flag.attribute]: flag.found_value };
      const { error } = await supabase.from("entities").update({ attributes }).eq("id", flag.entity_id);
      if (error) return Response.json({ error: "Could not update the Worldboard profile" }, { status: 500 });
    }
  }
  const status = body.decision === "typo" ? "resolved_typo" : body.decision === "explained" ? "resolved_explained" : "resolved_intentional";
  const { error } = await supabase.from("inconsistency_flags")
    .update({ status, writer_response: body.response?.trim().slice(0, 2000) || null }).eq("id", id);
  if (error) return Response.json({ error: "Could not save your decision" }, { status: 500 });
  return Response.json({ ok: true });
}
