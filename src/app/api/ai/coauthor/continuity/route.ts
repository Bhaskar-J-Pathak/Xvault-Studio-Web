/**
 * POST /api/ai/coauthor/continuity
 *
 * Co-author continuity check-in. Any continuity issues the co-author has noticed but
 * not yet raised in the chat (including issues whose message was deleted) are turned
 * into ONE natural message. Issues already fixed in the text are dropped quietly.
 *
 * The panel calls this when it opens and after each World Board extraction.
 * There is no credit charge: the writer did not ask for this, and the server-side
 * cooldown plus the "only when there are unraised issues" guard keep the cost small.
 *
 * Body: { projectId }
 * Returns { message: { id, content, messageType, created_at } | null }
 */

import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";
import { runContinuityCheckIn } from "@/lib/coauthor-continuity";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null) as { projectId?: string } | null;
  const projectId = body?.projectId;
  if (!projectId) return Response.json({ message: null });

  const [{ data: project }, { data: coauthor }] = await Promise.all([
    supabase.from("projects").select("id").eq("id", projectId).eq("user_id", user.id).maybeSingle(),
    supabase.from("coauthors").select("name, personality").eq("project_id", projectId).maybeSingle(),
  ]);
  if (!project || !coauthor) return Response.json({ message: null });

  try {
    const message = await runContinuityCheckIn(
      supabase,
      projectId,
      coauthor.name ?? "Alex",
      coauthor.personality ?? null,
    );
    return Response.json({ message });
  } catch (err) {
    console.error("[coauthor/continuity] Check-in failed:", err);
    return Response.json({ message: null });
  }
}

