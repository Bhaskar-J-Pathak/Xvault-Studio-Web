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
import { geminiGenerate } from "@/lib/ai";
import { assembleCoauthorContext, saveCoauthorMessages } from "@/lib/coauthor-context";
import { checkRateLimit } from "@/lib/rate-limit";

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

    saveCoauthorMessages(supabase, projectId, message.trim(), ackReply, "chat").catch(
      (e) => console.error("[coauthor/chat] Save failed:", e)
    );

    return Response.json({
      ok: true,
      reply: ackReply,
      messageType: "global_change",
      instruction: message.trim(),
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

  const historyBlock = history.length
    ? history
        .map((m) => `${m.role === "user" ? "Writer" : coauthorName}: ${m.content}`)
        .join("\n")
    : "";

  const fullPrompt = historyBlock
    ? `${historyBlock}\nWriter: ${message.trim()}\n${coauthorName}:`
    : message.trim();

  let reply: string;
  try {
    reply = await geminiGenerate(
      fullPrompt,
      systemPrompt,
      600,
      false,
      "gemini-2.5-flash"
    );
  } catch (err) {
    console.error("[coauthor/chat] AI failed:", err);
    return Response.json({ error: "AI failed" }, { status: 502 });
  }

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

  saveCoauthorMessages(supabase, projectId, message.trim(), reply, messageType).catch(
    (e) => console.error("[coauthor/chat] Save failed:", e)
  );

  return Response.json({ ok: true, reply, messageType, remaining });
}
