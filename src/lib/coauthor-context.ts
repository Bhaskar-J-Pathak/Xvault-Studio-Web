/**
 * Assembles the full context package for the co-author AI.
 * Called by all three co-author routes: chat, observe, suggest.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { lexicalToText } from "./chunking";

interface CoauthorContext {
  systemPrompt: string;
  coauthorName: string;
}

export async function assembleCoauthorContext(
  supabase: SupabaseClient,
  projectId: string,
  coauthorName: string,
  coauthorPersonality: string | null,
  recentText: string,
  chapterId?: string
): Promise<CoauthorContext> {
  // Fetch everything in parallel, including full chapter content if chapterId provided
  const [
    { data: project },
    { data: bible },
    { data: entities },
    { data: threads },
    { data: chapter },
  ] = await Promise.all([
    supabase
      .from("projects")
      .select("title, genre")
      .eq("id", projectId)
      .single(),
    supabase
      .from("story_bibles")
      .select("project_intent, style_notes, synopsis")
      .eq("project_id", projectId)
      .maybeSingle(),
    supabase
      .from("entities")
      .select("name, type, attributes")
      .eq("project_id", projectId)
      .order("name"),
    supabase
      .from("plot_threads")
      .select("description, status")
      .eq("project_id", projectId)
      .eq("status", "open")
      .order("created_at"),
    chapterId
      ? supabase
          .from("chapters")
          .select("content, title, position")
          .eq("id", chapterId)
          .single()
      : Promise.resolve({ data: null }),
  ]);

  // Build character profiles block
  const characters = (entities ?? []).filter((e) => e.type === "character");
  // Physical appearance keys shown first so the AI always sees them
  const PHYSICAL_KEYS = ["hair_color", "eye_color", "skin_tone", "build", "height", "distinctive_features", "age"];
  const CHAR_KEYS = ["personality", "motivations", "character_arc", "dialogue_style", "abilities", "role", "origin", "aliases"];

  const characterBlock = characters.length
    ? characters
        .map((c) => {
          const attrs = (c.attributes ?? {}) as Record<string, string>;
          const lines: string[] = [`• ${c.name}`];

          // Physical appearance — always first
          const physicalLines = PHYSICAL_KEYS
            .filter((k) => attrs[k]?.trim())
            .map((k) => `  ${k.replace(/_/g, " ")}: ${attrs[k]}`);
          if (physicalLines.length) lines.push(...physicalLines);

          // Character profile
          const charLines = CHAR_KEYS
            .filter((k) => attrs[k]?.trim())
            .map((k) => `  ${k.replace(/_/g, " ")}: ${attrs[k]}`);
          if (charLines.length) lines.push(...charLines);

          // Any other extracted attributes (catch-all for future/custom keys)
          const knownKeys = new Set([...PHYSICAL_KEYS, ...CHAR_KEYS]);
          const otherLines = Object.entries(attrs)
            .filter(([k, v]) => !knownKeys.has(k) && v?.trim())
            .map(([k, v]) => `  ${k.replace(/_/g, " ")}: ${v}`);
          if (otherLines.length) lines.push(...otherLines);

          return lines.join("\n");
        })
        .join("\n\n")
    : "No character profiles yet.";

  // Other entities (locations, factions, items)
  const otherEntities = (entities ?? []).filter((e) => e.type !== "character");
  const worldBlock = otherEntities.length
    ? otherEntities
        .map((e) => `• ${e.name} (${e.type})`)
        .join("\n")
    : "";

  // Open threads
  const threadBlock = (threads ?? []).length
    ? (threads ?? []).map((t) => `• ${t.description}`).join("\n")
    : "No open threads.";

  const genreNote = project?.genre ? `Genre: ${project.genre}\n` : "";
  const synopsisNote = bible?.synopsis
    ? `STORY SO FAR:\n${bible.synopsis}\n`
    : "";
  const intentNote = bible?.project_intent
    ? `WRITER'S INTENT:\n${bible.project_intent}\n`
    : "";
  const styleNote = bible?.style_notes
    ? `STYLE & VOICE:\n${bible.style_notes}\n`
    : "";

  // Use full chapter text if available; otherwise fall back to recent window
  const fullChapterText = chapter?.content
    ? lexicalToText(chapter.content as Record<string, unknown>)
    : "";

  const chapterLabel = chapter?.title
    ? `Chapter ${(chapter.position ?? 0) + 1}: "${chapter.title}"`
    : "current chapter";

  const contextBlock = fullChapterText
    ? `CURRENT CHAPTER — ${chapterLabel} (full text — use this to answer any question about people, places, or details in this chapter):\n${fullChapterText}\n`
    : recentText?.trim()
    ? `CURRENT SCENE (last ~500 words):\n${recentText.trim()}\n`
    : "";

  const personality = coauthorPersonality?.trim()
    ? coauthorPersonality.trim()
    : "Warm, honest, and sharp. Supportive but real — will tell the writer when something isn't working.";

  const systemPrompt = `Your name is ${coauthorName}.
Your personality: ${personality}

You are co-authoring "${project?.title ?? "this story"}" with the writer.
${genreNote}
${synopsisNote}${intentNote}${styleNote}
KEY CHARACTERS:
${characterBlock}
${worldBlock ? `\nWORLD ELEMENTS:\n${worldBlock}\n` : ""}
OPEN PLOT THREADS:
${threadBlock}

${contextBlock}
---
CORE RULES — always follow these, delivered in your personality:
- Speak naturally and casually. No bullet points unless the writer asks for a list.
- Ask more than you tell. A question is often more useful than an answer.
- Be SPECIFIC — every piece of feedback must be grounded in THIS story. No generic advice.
- When something isn't working, be honest but kind. End with "but it's your call."
- Offer to do work actively: "Want me to try a version where...?"
- Celebrate wins only when they're genuinely earned. Be specific about what worked.
- If the writer tells you something important (intent, a character decision, a theme they care about), acknowledge it and confirm you'll remember it.
- You can say no. If the writer asks you to do something that would hurt the story, say so and explain why — gently but clearly.
- Stay quiet when there's nothing worth saying. Not every moment needs a comment.
- Keep your responses concise. This is a conversation, not an essay.
- Never start your response with "I" — vary your openings.`;

  return { systemPrompt, coauthorName };
}

/**
 * Saves a message pair to coauthor_messages, keeping only the last 50 per project.
 */
export async function saveCoauthorMessages(
  supabase: SupabaseClient,
  projectId: string,
  userContent: string,
  assistantContent: string,
  messageType: string = "chat"
) {
  const now = Date.now();
  await supabase.from("coauthor_messages").insert([
    { project_id: projectId, role: "user",      content: userContent,      message_type: "chat",        created_at: new Date(now - 500).toISOString() },
    { project_id: projectId, role: "assistant", content: assistantContent, message_type: messageType,   created_at: new Date(now).toISOString() },
  ]);

  // Trim to last 50 messages
  const { data: oldest } = await supabase
    .from("coauthor_messages")
    .select("id")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (oldest && oldest.length > 50) {
    const toDelete = oldest.slice(0, oldest.length - 50).map((r) => r.id);
    await supabase.from("coauthor_messages").delete().in("id", toDelete);
  }
}
