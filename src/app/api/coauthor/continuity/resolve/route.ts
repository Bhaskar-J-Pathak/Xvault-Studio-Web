/**
 * POST /api/coauthor/continuity/resolve
 *
 * The writer marks a co-author continuity message as handled. The issues linked to that
 * message are closed, so deleting the message later will not bring them back.
 *
 * Body: { projectId, messageId }
 */

import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";
import { resolveContinuityMessage } from "@/lib/coauthor-continuity";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null) as { projectId?: string; messageId?: string } | null;
  if (!body?.projectId || !body.messageId) {
    return Response.json({ error: "Missing projectId or messageId" }, { status: 400 });
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", body.projectId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!project) return Response.json({ error: "Not found" }, { status: 404 });

  await resolveContinuityMessage(supabase, body.projectId, body.messageId);
  return Response.json({ ok: true });
}

