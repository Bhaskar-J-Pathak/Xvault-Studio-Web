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

  let body: { projectId: string; sourceId: string; targetId: string; label: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { projectId, sourceId, targetId, label } = body;

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

  // Both endpoints must be entities in this project. This produces a useful
  // response instead of relying on a foreign-key/RLS failure from the insert.
  const { data: endpoints, error: endpointError } = await supabase
    .from("entities")
    .select("id")
    .eq("project_id", projectId)
    .in("id", [sourceId, targetId]);
  if (endpointError) return Response.json({ error: endpointError.message }, { status: 500 });
  if (endpoints?.length !== 2) {
    return Response.json({ error: "Both relationship entities must belong to this project" }, { status: 400 });
  }

  const { data: rel, error } = await supabase
    .from("relationships")
    .insert({ project_id: projectId, source_id: sourceId, target_id: targetId, label: label.trim() })
    .select("id, source_id, target_id, label")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ relationship: rel });
}
