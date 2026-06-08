/**
 * POST /api/studio/worldboard/entities
 * Create a new entity manually.
 * Body: { projectId, name, type, attributes?, position? }
 */

import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: { projectId: string; name: string; type: string; attributes?: Record<string, string>; position?: { x: number; y: number } };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { projectId, name, type, attributes = {}, position } = body;
  if (!projectId || !name || !type) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Verify ownership
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();
  if (!project) return Response.json({ error: "Not found" }, { status: 404 });

  const pos = position ?? {
    x: Math.round(200 + Math.random() * 400),
    y: Math.round(200 + Math.random() * 300),
  };

  const { data: entity, error } = await supabase
    .from("entities")
    .insert({
      project_id:  projectId,
      name:        name.trim(),
      type,
      attributes,
      confidence:  "explicit",
      position:    pos,
    })
    .select("id, name, type, attributes, confidence, position, first_seen_chapter_id")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ entity });
}
