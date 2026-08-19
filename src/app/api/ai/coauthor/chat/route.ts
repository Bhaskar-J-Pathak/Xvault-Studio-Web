/**
 * POST /api/ai/coauthor/chat
 *
 * Main chat endpoint. Writer sends a message to their co-author.
 * Detects global change requests and routes them accordingly.
 *
 * Body: { projectId, chapterId, message, recentText, history }
 * Returns: { reply, messageType } or { reply, messageType: "global_change", instruction }
 */

import { NextRequest } from "next/server";
import { createServerSupabaseClient, createServiceClient } from "@/lib/auth";
import { geminiChat } from "@/lib/ai";
import { assembleCoauthorContext, saveCoauthorMessages } from "@/lib/coauthor-context";
import { checkRateLimit, commitRateLimit } from "@/lib/rate-limit";

interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
}

// Patterns that strongly indicate a global/manuscript change request
const GLOBAL_CHANGE_PATTERNS = [
  // Explicit "throughout" / "everywhere" qualifiers
  /change\s+.+\s+(to|into)\s+.+(throughout|everywhere|in all|across all|in every)/i,
  /rename\s+.+\s+to\s+/i,
  /replace\s+.+\s+with\s+.+(throughout|everywhere|in all|across all|in every)/i,
  /update\s+.+\s+(to|into)\s+.+(throughout|everywhere|in all|across all|in every)/i,
  /make\s+.+\s+(throughout|everywhere|in all|across all|in every)/i,
  /change\s+(all|every)\s+/i,
  /replace\s+(all|every)\s+/i,
  // Single-attribute trait changes (e.g. "change Abigail's eyes to green")
  /change\s+\w+('s)?\s+\w+\s+to\s+\w+/i,
  /change\s+\w+('s)?\s+(eye|hair|skin|voice|name)\w*\s+(to|from|color)/i,
  /(make|turn)\s+\w+('s)?\s+(eyes?|hair|skin|voice)\s+\w+/i,
];

function isLikelyGlobalChange(message: string): boolean {
  return GLOBAL_CHANGE_PATTERNS.some((p) => p.test(message));
}

// Patterns that strongly indicate the writer wants prose generated in the chat
const PROSE_REQUEST_PATTERNS = [
  // "write/draft/compose a scene/paragraph/passage/chapter/dialogue/description"
  /\b(write|draft|compose)\b.{0,60}\b(scene|paragraph|passage|prose|chapter|dialogue|description|excerpt|opening|ending|climax|monologue|flashback)\b/i,
  // "write the next paragraph / scene / chapter"
  /\bwrite\s+(the\s+)?(next|following)\b/i,
  // "continue the scene / story / chapter"
  /\bcontinue\s+(the\s+)?(scene|story|chapter|writing|narrative|action|from here)\b/i,
  // "generate some prose / a scene / a paragraph"
  /\bgenerate\s+(some\s+)?(prose|text|a\s+scene|a\s+paragraph|a\s+passage|a\s+chapter)\b/i,
  // "give me a paragraph / scene / passage"
  /\bgive\s+me\s+(a|some)\s+(paragraph|scene|prose|passage|description|excerpt|chapter)\b/i,
  // "can you write/draft a scene/chapter/paragraph"
  /\b(can|could)\s+you\s+(write|draft|compose)\s+(me\s+)?(a|the|some)\s+(scene|paragraph|chapter|passage|prose|dialogue|description)\b/i,
];

function isLikelyProseRequest(message: string): boolean {
  return PROSE_REQUEST_PATTERNS.some((p) => p.test(message));
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let rateLimitResult: { block: Response | null; remaining: number };
  try {
    rateLimitResult = await checkRateLimit(user.id, createServiceClient(), 1);
  } catch (err) {
    console.error("[coauthor/chat] Rate limit check failed:", err);
    return Response.json({ error: "Service temporarily unavailable", reply: "Something went wrong on my end. Give it a moment and try again." }, { status: 503 });
  }
  const { block, remaining } = rateLimitResult;
  if (block) return block;

  let body: {
    projectId: string;
    chapterId?: string;
    message: string;
    recentText?: string;
    history?: HistoryMessage[];
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { projectId, message, recentText = "", history = [] } = body;
  if (!projectId || !message?.trim()) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  // Verify ownership + fetch co-author settings
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
  if (!project) return Response.json({ error: "Not found" }, { status: 404 });

  const coauthorName = coauthor?.name ?? "Alex";
  const coauthorPersonality = coauthor?.personality ?? null;

  // ── Global change detection ────────────────────────────────────────────────
  // Pattern-match first (fast). If matched, return a special messageType so
  // the panel can trigger the global-change analysis flow.
    if (isLikelyGlobalChange(message.trim())) {
    const ackReply = `On it — scanning the manuscript for every instance. Give me a moment, I'll show you exactly what I'll change before touching anything.`;

    await saveCoauthorMessages(supabase, projectId, message.trim(), ackReply, "chat").catch(
      (e) => console.error("[coauthor/chat] Save failed:", e)
    );

    return Response.json({
      ok: true,
      reply: ackReply,
      messageType: "global_change",
      instruction: message.trim(),
    });
  }

  // ── Prose request redirect ─────────────────────────────────────────────────
  // If the writer is asking for prose in the chat, redirect them to Ctrl+K.
  // Prose in chat history clogs the co-author's memory with text instead of
  // useful story context, which degrades the quality of feedback over time.
  if (isLikelyProseRequest(message.trim())) {
    const redirectReply = `Quick heads up before I do this. If I write prose here in our chat, it fills up my memory with text that crowds out the important stuff: your story decisions, character choices, things you have told me to track. Over time that starts to hurt the quality of my feedback.

Hit Ctrl+K right in the editor instead. It pulls the same story context and keeps our conversation clean for the things I am actually here for.

What were you thinking for this scene? Tell me the idea and I can help you shape it before you write it.`;

    await saveCoauthorMessages(supabase, projectId, message.trim(), redirectReply, "prose_redirect").catch(
      (e) => console.error("[coauthor/chat] Save failed:", e)
    );

    return Response.json({
      ok: true,
      reply: redirectReply,
      messageType: "prose_redirect",
      remaining,
    });
  }

  // ── Regular chat ───────────────────────────────────────────────────────────
  const { systemPrompt } = await assembleCoauthorContext(
    supabase,
    projectId,
    coauthorName,
    coauthorPersonality,
    recentText,
    body.chapterId
  );

  let reply: string;
  try {
    reply = await geminiChat(
      history,
      message.trim(),
      systemPrompt,
      600,
      "gemini-2.5-flash"
    );
  } catch (err) {
    console.error("[coauthor/chat] AI failed:", err);
    return Response.json({ error: "AI failed" }, { status: 502 });
  }

  await commitRateLimit(user.id, createServiceClient(), 1);

  reply = reply.trim();
  if (!reply) return Response.json({ error: "Empty response" }, { status: 500 });

  const lower = reply.toLowerCase();
  const messageType =
    lower.includes("chef's kiss") ||
    lower.includes("love this") ||
    lower.includes("brilliant") ||
    lower.includes("nailed it")
      ? "celebration"
      : lower.includes("chapter") &&
        (lower.includes("back") || lower.includes("ago") || lower.includes("thread"))
      ? "nudge"
      : "chat";

  await saveCoauthorMessages(supabase, projectId, message.trim(), reply, messageType).catch(
    (e) => console.error("[coauthor/chat] Save failed:", e)
  );

  return Response.json({ ok: true, reply, messageType, remaining });
}
