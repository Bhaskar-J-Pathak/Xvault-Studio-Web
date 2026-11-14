/**
 * Co-author continuity memory — server-side only.
 *
 * Continuity problems found during extraction (the co-author's narrative notes, e.g.
 * blocking, awareness or timeline breaks) are saved as issues the co-author remembers.
 * They are not written into the chat right away. A "check-in" turns the issues that have
 * not been raised yet into ONE natural chat message. The issue is then linked to that
 * message.
 *
 * World Board inconsistency flags (eye colour changed, etc.) are deliberately NOT part
 * of this. They keep their own separate review card in the editor.
 *
 * Conversation rules:
 * - One message at a time. If the co-author's last proactive message has no reply from
 *   the writer yet, it stays quiet. It never stacks up messages.
 * - The link to the message uses ON DELETE SET NULL. If the writer deletes the message
 *   or clears the chat, the issue counts as not raised again, and the next check-in
 *   brings it back. An issue stops coming back only when it is fixed in the text, marked
 *   handled, or replaced by a fresh re-extraction.
 *
 * Every function here fails soft. If migration 0046 has not been applied yet, the
 * helpers log a warning and do nothing, so the editor keeps working.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { geminiGenerate } from "./ai";
import { lexicalToText } from "./chunking";

const CHECKIN_COOLDOWN_MS = 3 * 60 * 1000; // never post two continuity check-ins within 3 minutes
const MAX_ISSUES_CONSIDERED = 8;
const MAX_ISSUES_PER_MESSAGE = 3;
const MAX_CHAPTERS_IN_CONTEXT = 3;
const MAX_CHAPTER_CHARS = 60_000;

export const CONTINUITY_MESSAGE_TYPE = "continuity";
export const CONTINUITY_RESOLVED_MESSAGE_TYPE = "continuity_resolved";

/** Messages the co-author sends on its own, without being asked. */
const PROACTIVE_MESSAGE_TYPES = new Set([
  "observation",
  "nudge",
  CONTINUITY_MESSAGE_TYPE,
  CONTINUITY_RESOLVED_MESSAGE_TYPE,
]);

/**
 * True when the most recent chat message is something the co-author said on its own
 * and the writer has not answered yet. A normal reply to the writer does not count.
 */
export async function hasUnansweredProactiveMessage(
  supabase: SupabaseClient,
  projectId: string,
): Promise<boolean> {
  const { data: last } = await supabase
    .from("coauthor_messages")
    .select("role, message_type")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return Boolean(last && last.role === "assistant" && PROACTIVE_MESSAGE_TYPES.has(last.message_type));
}

/**
 * Posts a message the co-author sends on its own, but only if the writer is not still
 * owed a reply. Uses the atomic database function from migration 0047, so two requests
 * finishing at the same moment cannot both post. Returns null when it stayed quiet.
 */
export async function postProactiveMessage(
  supabase: SupabaseClient,
  projectId: string,
  content: string,
  messageType: string,
): Promise<{ id: string; created_at: string } | null> {
  const { data, error } = await supabase.rpc("post_coauthor_proactive_message", {
    p_project_id: projectId,
    p_content: content,
    p_message_type: messageType,
  });
  if (!error) {
    const row = Array.isArray(data) ? data[0] : data;
    return row?.id ? { id: row.id, created_at: row.created_at } : null;
  }

  // Migration 0047 not applied yet: best-effort check, then insert.
  console.warn("[coauthor-continuity] Atomic post unavailable, using fallback:", error.message);
  if (await hasUnansweredProactiveMessage(supabase, projectId)) return null;
  const { data: inserted, error: insertError } = await supabase
    .from("coauthor_messages")
    .insert({ project_id: projectId, role: "assistant", content, message_type: messageType })
    .select("id, created_at")
    .single();
  if (insertError || !inserted) {
    console.error("[coauthor-continuity] Could not save proactive message:", insertError?.message);
    return null;
  }
  return inserted;
}

// ── Recording issues (called by extraction routes) ────────────────────────────

export async function recordContinuityNote(
  supabase: SupabaseClient,
  projectId: string,
  chapterId: string | null,
  content: string | null | undefined,
): Promise<void> {
  const text = content?.trim();
  if (!text) return;
  const { error } = await supabase.from("coauthor_continuity_notes").insert({
    project_id: projectId,
    chapter_id: chapterId,
    content: text.slice(0, 4000),
  });
  if (error) console.warn("[coauthor-continuity] Could not record note:", error.message);
}

/**
 * A full re-extraction of a chapter replaces the earlier analysis. Open notes for that
 * chapter are marked superseded so stale or duplicate notes are not raised again.
 */
export async function supersedeChapterNotes(
  supabase: SupabaseClient,
  projectId: string,
  chapterId: string,
): Promise<void> {
  const { error } = await supabase
    .from("coauthor_continuity_notes")
    .update({ status: "superseded", updated_at: new Date().toISOString() })
    .eq("project_id", projectId)
    .eq("chapter_id", chapterId)
    .eq("status", "open");
  if (error) console.warn("[coauthor-continuity] Could not supersede notes:", error.message);
}

// ── Check-in ──────────────────────────────────────────────────────────────────

interface NoteRow {
  id: string;
  chapter_id: string | null;
  content: string;
}

export interface ContinuityCheckInResult {
  id: string;
  content: string;
  messageType: typeof CONTINUITY_MESSAGE_TYPE;
  created_at: string;
}

export async function runContinuityCheckIn(
  supabase: SupabaseClient,
  projectId: string,
  coauthorName: string,
  coauthorPersonality: string | null,
): Promise<ContinuityCheckInResult | null> {
  // 1. Wait for the writer. Never send a second message on top of an unanswered one.
  if (await hasUnansweredProactiveMessage(supabase, projectId)) return null;

  // 2. Cooldown, so check-ins never arrive as a burst.
  const since = new Date(Date.now() - CHECKIN_COOLDOWN_MS).toISOString();
  const { data: recent } = await supabase
    .from("coauthor_messages")
    .select("id")
    .eq("project_id", projectId)
    .eq("message_type", CONTINUITY_MESSAGE_TYPE)
    .gt("created_at", since)
    .limit(1)
    .maybeSingle();
  if (recent) return null;

  // 3. Load issues that are still open and not currently visible in the chat.
  const { data: noteData, error: notesError } = await supabase
    .from("coauthor_continuity_notes")
    .select("id, chapter_id, content")
    .eq("project_id", projectId)
    .eq("status", "open")
    .is("surfaced_message_id", null)
    .order("created_at", { ascending: true })
    .limit(MAX_ISSUES_CONSIDERED);
  if (notesError) {
    console.warn("[coauthor-continuity] Notes unavailable:", notesError.message);
    return null;
  }
  const notes = (noteData ?? []) as NoteRow[];
  if (notes.length === 0) return null;

  // 4. Load the current text of the chapters involved, so fixed issues are dropped.
  const chapterIds = [
    ...new Set(notes.map((n) => n.chapter_id).filter((id): id is string => Boolean(id))),
  ].slice(0, MAX_CHAPTERS_IN_CONTEXT);

  const { data: chapters } = chapterIds.length
    ? await supabase
        .from("chapters")
        .select("id, title, position, content")
        .eq("project_id", projectId)
        .in("id", chapterIds)
    : { data: [] as Array<{ id: string; title: string; position: number; content: unknown }> };

  const chapterLabel = new Map<string, string>();
  const chapterBlocks = (chapters ?? [])
    .slice()
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((c) => {
      const label = `Chapter ${(c.position ?? 0) + 1}${c.title ? ` "${c.title}"` : ""}`;
      chapterLabel.set(c.id, label);
      return `=== ${label} (CURRENT TEXT) ===\n${lexicalToText(c.content).slice(0, MAX_CHAPTER_CHARS)}`;
    })
    .join("\n\n");

  const noteKeys = new Map<string, string>(); // key -> note id
  const issueLines = notes.map((n, i) => {
    const key = `N${i + 1}`;
    noteKeys.set(key, n.id);
    const where = n.chapter_id ? chapterLabel.get(n.chapter_id) ?? "an earlier chapter" : "the manuscript";
    return `[${key}] (${where}) ${n.content}`;
  });

  // Issues already raised in a message that is still in the chat. Extraction can record
  // the same problem more than once; those copies must not become a new message.
  const { data: raisedData } = await supabase
    .from("coauthor_continuity_notes")
    .select("content, surfaced_message_id, updated_at")
    .eq("project_id", projectId)
    .eq("status", "open")
    .not("surfaced_message_id", "is", null)
    .order("updated_at", { ascending: false })
    .limit(MAX_ISSUES_CONSIDERED);
  const raised = (raisedData ?? []) as Array<{ content: string; surfaced_message_id: string }>;
  const latestRaisedMessageId = raised[0]?.surfaced_message_id ?? null;
  const raisedBlock = raised.length
    ? `ALREADY RAISED (you already told the writer about these, the message is still in the chat):\n${raised.map((r, i) => `[R${i + 1}] ${r.content.slice(0, 600)}`).join("\n")}\n\n`
    : "";

  const personality = coauthorPersonality?.trim()
    || "Warm, honest, and sharp. Supportive but real.";

  const prompt = `While reading the writer's manuscript earlier, you noted these possible continuity problems:
${issueLines.join("\n")}

${raisedBlock}${chapterBlocks ? `${chapterBlocks}\n\n` : ""}TASK
1. For every [N…] issue, check the CURRENT TEXT above. If the writer has already fixed it, or the text now explains it, list its key in "fixed".
2. If an [N…] issue is the same problem as one under ALREADY RAISED (for example the same character's age or the same object described two ways), list its key in "already_raised". Never mention those again.
3. From the remaining issues that are still real, choose at most ${MAX_ISSUES_PER_MESSAGE}, the most important first, and list their keys in "mention". If several [N…] issues describe the same problem, put one in "mention" and the rest in "same_as_mentioned".
4. Write "message": ONE message to the writer, as if you just looked up from their pages. It must read as one coherent thought from a co-author, not a list of separate remarks:
   - Lead with the single most important issue and point to the exact moments that clash.
   - If you mention others, weave them in naturally ("and while I was there...") instead of starting fresh topics.
   - End with exactly ONE question, so the writer has one clear thing to answer. Do not ask several questions.
   - If more issues remain beyond the ones you mention, do not describe them. You can say there are a couple of smaller things for later.
   - 2 to 4 sentences. Plain, warm, conversational. No bullet points, no headings, no em-dashes. Do not start with "I". No greeting like "Hey!".
5. If nothing new is still real, return an empty "mention" list and an empty "message".

Return JSON only: {"fixed": [], "already_raised": [], "mention": ["N1"], "same_as_mentioned": [], "message": "..."}`;

  const systemPrompt = `Your name is ${coauthorName}. You are the writer's co-author, reading along beside them.
Your personality: ${personality}
Never use em-dashes (—).`;

  let parsed: { fixed?: unknown; already_raised?: unknown; mention?: unknown; same_as_mentioned?: unknown; message?: unknown };
  try {
    const raw = await geminiGenerate(prompt, systemPrompt, 1200, true, "gemini-2.5-flash");
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    parsed = JSON.parse(raw.slice(start, end + 1));
  } catch (err) {
    console.error("[coauthor-continuity] Check-in generation failed:", err);
    return null;
  }

  const keyList = (value: unknown) =>
    Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];

  // 5. Retire notes the writer already fixed.
  const fixedNoteIds = keyList(parsed.fixed)
    .map((k) => noteKeys.get(k))
    .filter((id): id is string => Boolean(id));
  if (fixedNoteIds.length) {
    await supabase
      .from("coauthor_continuity_notes")
      .update({ status: "resolved", updated_at: new Date().toISOString() })
      .in("id", fixedNoteIds);
  }

  const toNoteIds = (value: unknown) =>
    keyList(value)
      .map((k) => noteKeys.get(k))
      .filter((id): id is string => Boolean(id) && !fixedNoteIds.includes(id!));

  // Copies of issues that are already in the chat join that message silently. If the
  // writer deletes that message, they come back together with it.
  const alreadyRaisedIds = toNoteIds(parsed.already_raised);
  if (alreadyRaisedIds.length && latestRaisedMessageId) {
    await supabase
      .from("coauthor_continuity_notes")
      .update({ surfaced_message_id: latestRaisedMessageId, updated_at: new Date().toISOString() })
      .in("id", alreadyRaisedIds)
      .is("surfaced_message_id", null);
  }

  const mentionNoteIds = toNoteIds(keyList(parsed.mention).slice(0, MAX_ISSUES_PER_MESSAGE))
    .filter((id) => !alreadyRaisedIds.includes(id));
  const duplicateNoteIds = toNoteIds(parsed.same_as_mentioned)
    .filter((id) => !alreadyRaisedIds.includes(id) && !mentionNoteIds.includes(id));
  const message = typeof parsed.message === "string" ? parsed.message.trim().replace(/\s*—\s*/g, ", ") : "";

  if (!message || mentionNoteIds.length === 0) return null;

  // 6. Post atomically: stays quiet if the writer is still owed a reply, even when
  //    another request posted while the model was thinking.
  const inserted = await postProactiveMessage(supabase, projectId, message, CONTINUITY_MESSAGE_TYPE);
  if (!inserted) return null;

  const { data: claimed } = await supabase
    .from("coauthor_continuity_notes")
    .update({ surfaced_message_id: inserted.id, updated_at: new Date().toISOString() })
    .in("id", [...mentionNoteIds, ...duplicateNoteIds])
    .is("surfaced_message_id", null)
    .select("id");

  if (!claimed?.length) {
    await supabase.from("coauthor_messages").delete().eq("id", inserted.id);
    return null;
  }

  return {
    id: inserted.id,
    content: message,
    messageType: CONTINUITY_MESSAGE_TYPE,
    created_at: inserted.created_at,
  };
}

// ── Resolve (writer says "handled") ───────────────────────────────────────────

export async function resolveContinuityMessage(
  supabase: SupabaseClient,
  projectId: string,
  messageId: string,
): Promise<void> {
  const { error: noteError } = await supabase
    .from("coauthor_continuity_notes")
    .update({ status: "dismissed", updated_at: new Date().toISOString() })
    .eq("project_id", projectId)
    .eq("surfaced_message_id", messageId)
    .eq("status", "open");
  if (noteError) console.warn("[coauthor-continuity] Could not dismiss notes:", noteError.message);

  // Keep the message in the chat, but remember that it was handled (hides the button).
  await supabase
    .from("coauthor_messages")
    .update({ message_type: CONTINUITY_RESOLVED_MESSAGE_TYPE })
    .eq("project_id", projectId)
    .eq("id", messageId)
    .eq("message_type", CONTINUITY_MESSAGE_TYPE);
}
