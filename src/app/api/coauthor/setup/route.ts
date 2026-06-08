/**
 * POST /api/coauthor/setup
 *
 * Creates or updates the co-author settings for a project.
 * Body: { projectId, name, personality }
 */

import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: { projectId: string; name: string; personality?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { projectId, name, personality = "" } = body;
  if (!projectId || !name?.trim()) {
    return Response.json({ error: "Missing projectId or name" }, { status: 400 });
  }

  // Verify ownership
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();
  if (!project) return Response.json({ error: "Not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("coauthors")
    .upsert(
      {
        project_id: projectId,
        name: name.trim(),
        personality: personality.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "project_id" }
    )
    .select("id, name, personality")
    .single();

  if (error) {
    console.error("[coauthor/setup] DB error:", error);
    return Response.json({ error: "DB error" }, { status: 500 });
  }

  return Response.json({ ok: true, coauthor: data });
}

/**
 * GET /api/coauthor/setup?projectId=...
 * Fetch existing co-author settings for a project.
 */
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const projectId = request.nextUrl.searchParams.get("projectId");
  if (!projectId) return Response.json({ error: "Missing projectId" }, { status: 400 });

  // Verify ownership
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();
  if (!project) return Response.json({ error: "Not found" }, { status: 404 });

  const { data: coauthor } = await supabase
    .from("coauthors")
    .select("id, name, personality")
    .eq("project_id", projectId)
    .maybeSingle();

  return Response.json({ coauthor: coauthor ?? null });
}
