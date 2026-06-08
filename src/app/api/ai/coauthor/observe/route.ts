/**
 * POST /api/ai/coauthor/observe
 *
 * Proactive observation. Called after the writer pauses (15s after a 150+ word burst).
 * Alex reads the recent text and decides whether to say something — or stay quiet.
 * Returns { observation: string | null, messageType: string | null }
 *
 * Body: { projectId, chapterId, recentText, wordCountDelta }
 */

import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";
import { geminiGenerate } from "@/lib/ai";
import { assembleCoauthorContext } from "@/lib/coauthor-context";
import { saveCoauthorMessages } from "@/lib/coauthor-context";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    projectId: string;
    chapterId?: string;
    recentText: string;
    wordCountDelta?: number;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { projectId, recentText, wordCountDelta = 0 } = body;
  if (!projectId || !recentText?.trim()) {
    return Response.json({ observation: null, messageType: null });
  }

  // Verify ownership + fetch co-author
  const [{ data: project }, { data: coauthor }] = await Promise.all([
    supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("coauthors")
      .select("name, personality")
      .eq("project_id", projectId)
      .maybeSingle(),
  ]);
  if (!project) return Response.json({ observation: null, messageType: null });

  // Block if the last message in the conversation is already from the assistant.
  // The co-author should not pile on until the user has said something back.
  const { data: lastMsg } = await supabase
    .from("coauthor_messages")
    .select("role")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastMsg?.role === "assistant") {
    return Response.json({ observation: null, messageType: null });
  }

  // Server-side cooldown: refuse if an observation/nudge was saved in the last 30 minutes.
  // Celebrations are intentionally excluded — we no longer send them proactively.
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const { data: recentObs } = await supabase
    .from("coauthor_messages")
    .select("created_at")
    .eq("project_id", projectId)
    .eq("role", "assistant")
    .in("message_type", ["observation", "nudge"])
    .gt("created_at", thirtyMinutesAgo)
    .limit(1)
    .maybeSingle();

  if (recentObs) {
    return Response.json({ observation: null, messageType: null });
  }

  const coauthorName = coauthor?.name ?? "Alex";
  const coauthorPersonality = coauthor?.personality ?? null;

  const { systemPrompt } = await assembleCoauthorContext(
    supabase,
    projectId,
    coauthorName,
    coauthorPersonality,
    recentText
  );

  const observePrompt = `The writer just paused after writing approximately ${wordCountDelta} new words.
Read the recent text carefully.

Your job is to stay quiet unless there is a specific craft problem that needs flagging.

Only speak up if you notice ONE of these:
- A character speaking or acting in a way that contradicts their established voice or history
- An open plot thread from earlier that is being ignored or contradicted here
- A pacing problem serious enough to hurt the story (e.g. the scene has stalled or is rushing a key moment)

Do NOT:
- Compliment the writing or tell the writer what you liked
- Ask general questions about what happens next
- Comment unless there is a real, specific issue

If there is no concrete craft problem — output only the word: QUIET
QUIET is almost always the right answer.

If there IS a specific problem, describe it directly in 1-2 sentences. No preamble.`;

  let raw: string;
  try {
    raw = await geminiGenerate(
      observePrompt,
      systemPrompt,
      200,
      false,
      "gemini-2.5-flash"
    );
  } catch (err) {
    console.error("[coauthor/observe] AI failed:", err);
    return Response.json({ observation: null, messageType: null });
  }

  raw = raw.trim();

  // If Alex decides to stay quiet — only match exact "QUIET" response
  if (!raw || raw.toUpperCase() === "QUIET") {
    return Response.json({ observation: null, messageType: null });
  }

  // Classify — proactive observations are either nudges (thread-related) or observations (craft issues).
  // Celebrations are no longer sent proactively; the co-author only compliments in chat.
  const lower = raw.toLowerCase();
  const messageType =
    lower.includes("thread") || lower.includes("earlier") || lower.includes("chapter") &&
    (lower.includes("back") || lower.includes("ago") || lower.includes("introduced"))
      ? "nudge"
      : "observation";

  // Save observation as assistant-only message
  await supabase.from("coauthor_messages").insert({
    project_id: projectId,
    role: "assistant",
    content: raw,
    message_type: messageType,
  });

  return Response.json({ observation: raw, messageType });
}
