/**
 * POST /api/studio/threads — create a plot thread manually
 */

import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: { projectId: string; description: string };
  try { body = await request.json(); } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { projectId, description } = body;
  if (!projectId || !description?.trim()) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();
  if (!project) return Response.json({ error: "Not found" }, { status: 404 });

  const { data: thread, error } = await supabase
    .from("plot_threads")
    .insert({ project_id: projectId, description: description.trim(), status: "open" })
    .select("id, description, status")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ thread });
}
