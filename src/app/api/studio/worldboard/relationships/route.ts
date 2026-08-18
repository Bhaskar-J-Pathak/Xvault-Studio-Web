/**
 * POST /api/studio/worldboard/relationships
 * Create a new relationship between two entities.
 * Body: { projectId, sourceId, targetId, label }
 */

import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId, sourceId, targetId, label } =
    await request.json() as { projectId: string; sourceId: string; targetId: string; label: string };

  if (!projectId || !sourceId || !targetId || !label?.trim()) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (sourceId === targetId) {
    return Response.json({ error: "Source and target must be different" }, { status: 400 });
  }

  // Verify project ownership
  const { data: project } = await supabase
    .from("projects").select("id").eq("id", projectId).eq("user_id", user.id).single();
  if (!project) return Response.json({ error: "Not found" }, { status: 404 });

  const { data: rel, error } = await supabase
    .from("relationships")
    .insert({ project_id: projectId, source_id: sourceId, target_id: targetId, label: label.trim() })
    .select("id, source_id, target_id, label")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ relationship: rel });
}
