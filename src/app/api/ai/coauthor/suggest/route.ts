/**
 * POST /api/ai/coauthor/suggest
 *
 * Ctrl+K ghost writer. Three modes:
 *   "write"   – generate new prose at cursor position from an instruction
 *   "rewrite" – rewrite selected text according to an instruction
 *   "continue"– blind continuation (no instruction, legacy fallback)
 *
 * Body: {
 *   projectId, chapterId?,
 *   mode: "write" | "rewrite" | "continue",
 *   instruction?: string,   // user's prompt (write / rewrite modes)
 *   beforeCursor: string,   // text before the cursor (for context + style)
 *   afterCursor?: string,   // text after cursor (for continuity awareness)
 *   selectedText?: string,  // selected text to rewrite (rewrite mode)
 * }
 * Returns: { suggestion: string }
 */

import { NextRequest } from "next/server";
import { createServerSupabaseClient, createServiceClient } from "@/lib/auth";
import { geminiGenerate } from "@/lib/ai";
import { assembleCoauthorContext } from "@/lib/coauthor-context";
import { checkRateLimit, commitRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    projectId: string;
    chapterId?: string;
    mode?: "write" | "rewrite" | "continue";
    instruction?: string;
    beforeCursor?: string;
    afterCursor?: string;
    selectedText?: string;
    // legacy
    recentText?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    projectId,
    mode = "continue",
    instruction,
    beforeCursor = "",
    afterCursor = "",
    selectedText = "",
    recentText = "",
  } = body;

  if (!projectId) return Response.json({ error: "Missing projectId" }, { status: 400 });

  // Verify ownership + fetch co-author
  const [{ data: project }, { data: coauthor }] = await Promise.all([
    supabase.from("projects").select("id").eq("id", projectId).eq("user_id", user.id).single(),
    supabase.from("coauthors").select("name, personality").eq("project_id", projectId).maybeSingle(),
  ]);
  if (!project) return Response.json({ error: "Not found" }, { status: 404 });

  // Credit cost: long write (2000w) costs 2 credits; everything else costs 1
  const isLongWrite =
    mode === "write" &&
    !!instruction &&
    /\b(chapter|scene|section|2000|full|long|detailed|complete|write the)\b/i.test(instruction);
  const { block, remaining } = await checkRateLimit(user.id, createServiceClient(), isLongWrite ? 2 : 1);
  if (block) return block;

  const contextText = beforeCursor || recentText;

  let systemPrompt: string;
  try {
    ({ systemPrompt } = await assembleCoauthorContext(
      supabase,
      projectId,
      coauthor?.name ?? "Alex",
      coauthor?.personality ?? null,
      contextText,
      body.chapterId
    ));
  } catch (err) {
    console.error("[coauthor/suggest] Context assembly failed:", err);
    return Response.json({ error: "Failed to load story context. Try again." }, { status: 500 });
  }

  // ── Style fingerprint ─────────────────────────────────────────────────────
  // Extract a style analysis from the writer's existing prose so the AI can
  // mirror it exactly. We look at the last ~800 words before the cursor.
  const styleSource = contextText.trim();
  const styleWords = styleSource ? styleSource.split(/\s+/) : [];
  const styleSample = styleWords.slice(Math.max(0, styleWords.length - 800)).join(" ");

  const styleAnalysisBlock = styleSample
    ? `WRITER'S STYLE — study this excerpt and mirror it exactly:
POV, tense, sentence rhythm, paragraph length, vocabulary level, dialogue formatting, use of internal thought, descriptive density — all must match.
---
${styleSample}
---`
    : "";

  // ── After-cursor context ──────────────────────────────────────────────────
  const afterBlock = afterCursor?.trim()
    ? `TEXT THAT FOLLOWS (maintain continuity — do not contradict or repeat):\n---\n${afterCursor.trim().split(/\s+/).slice(0, 200).join(" ")}\n---`
    : "";

  // ── Build prompt by mode ──────────────────────────────────────────────────
  let userPrompt: string;
  let maxTokens: number;

  if (mode === "rewrite") {
    // Rewrite selected text according to instruction
    if (!selectedText?.trim()) {
      return Response.json({ error: "No selected text" }, { status: 400 });
    }
    if (!instruction?.trim()) {
      return Response.json({ error: "No instruction" }, { status: 400 });
    }

    userPrompt = `${styleAnalysisBlock}

TEXT BEFORE THE SELECTION (context only — do not continue it):
---
${beforeCursor.trim().split(/\s+/).slice(-300).join(" ")}
---

SELECTED TEXT TO REWRITE:
---
${selectedText.trim()}
---

${afterBlock}

INSTRUCTION: ${instruction.trim()}

Rewrite ONLY the selected text according to the instruction. Match the writer's voice, POV, tense, and style exactly.
Craft rules: no em-dashes, no AI-cliché phrases (see system rules), no bare emotion labels — show through action or detail, no adverbs on dialogue tags, write specific not vague.
If the passage contains dialogue: every line must sound spoken not written. Characters deflect, trail off, give fragments. Use contractions. No character is too articulate for their situation.
Output ONLY the rewritten passage — no preamble, no labels, no explanation. Aim for roughly the same length as the original unless the instruction asks for more or less.`;

    maxTokens = Math.max(512, Math.ceil(selectedText.split(/\s+/).length * 1.5 * 1.4));

  } else if (mode === "write") {
    // Generate new prose at cursor position from an instruction
    if (!instruction?.trim()) {
      return Response.json({ error: "No instruction" }, { status: 400 });
    }

    // Estimate target length from instruction cues
    const instructionLower = instruction.toLowerCase();
    const wantsLong =
      /\b(chapter|scene|section|2000|full|long|detailed|complete|write the)\b/.test(instructionLower);
    const wordTarget = wantsLong ? "1800-2200" : "300-500";
    maxTokens = wantsLong ? 4096 : 768;

    userPrompt = `${styleAnalysisBlock}

TEXT BEFORE THE CURSOR (this is where your writing will be inserted):
---
${beforeCursor.trim().split(/\s+/).slice(-400).join(" ")}
---

${afterBlock}

INSTRUCTION: ${instruction.trim()}

Write ${wordTarget} words of story prose to be inserted at the cursor. Match the writer's voice, POV, tense, sentence rhythm, and style exactly.
Craft rules: no em-dashes, no AI-cliché phrases (see system rules), no bare emotion labels — ground them in action or sensation, no adverbs on dialogue tags, write specific and concrete not vague. Vary sentence length and structure.
If the passage includes dialogue: make every line sound spoken not written. Characters deflect, trail off, give non-answers, use fragments and contractions. No one is too eloquent for their situation. Use "said" or "asked" for tags, and action beats over adverbs.
Output ONLY the story text — no preamble, no labels, no commentary. Do not repeat the text before the cursor. Pick up naturally from it.`;

  } else {
    // "continue" — blind continuation (Ctrl+K with no instruction, legacy)
    const continueText = beforeCursor || recentText;
    if (!continueText?.trim()) {
      return Response.json({ error: "No context text" }, { status: 400 });
    }

    userPrompt = `${styleAnalysisBlock}

${afterBlock}

Continue the story exactly where it left off. Write 150-250 words.

Rules:
- Match voice, pacing, and style of the existing text exactly
- Do not introduce new plot elements — continue the current scene
- Never use em-dashes (—) — restructure the sentence or use a comma/period instead
- Keep prose lean — no stacked adjectives, no excessive sensory detail, no purple prose
- No AI-cliché phrases (see system rules): no "washed over," no "found herself," no "heart raced," no "in that moment," no bare emotion labels — show through action or sensation
- Write specific and concrete — "the smell of diesel and wet asphalt" beats "the smell of the city"
- Vary sentence length — avoid three consecutive sentences starting with the same subject
- No adverbs on dialogue tags — use action beats or just "said"
- Output ONLY the continuation. No preamble, no labels.

The manuscript so far ends with:
---
${continueText.trim().split(/\s+/).slice(-400).join(" ")}
---
Continue:`;

    maxTokens = 512;
  }

  const suggestionSystem = `${systemPrompt}

PROSE RULES (always enforced):
- Never use em-dashes (—). Restructure the sentence, use a comma, or use a period instead.
- Keep prose lean. Include only what moves the scene forward. No stacked adjectives, no excessive sensory detail, no purple prose.

ANTI-CLICHÉ RULES (strictly enforced — these are the marks of AI-generated slop):
- Never open a sentence with "Suddenly," "In that moment," "It was as if," or "Needless to say."
- Never use these overworked phrases: "a tapestry of", "a dance of", "a symphony of", "a sea of", "a cascade of", "a mosaic of", "a labyrinth of", "bathed in light", "hung in the air", "washed over", "a wave of [emotion]", "heart of stone", "heart raced", "butterflies in her stomach", "eyes like the ocean", "the weight of the world."
- Never use "found herself/himself [verb]ing" (e.g., "she found herself wondering") — just write the action directly.
- Never use "couldn't help but" — cut it.
- Never use "It was then that" or "With that in mind" as transitions.
- No redundant body language: never "nodded his head," "shrugged her shoulders," "blinked her eyes."
- Avoid bare emotion labels: don't write "she felt sad" — show it through action, dialogue, or physical detail.
- Avoid adverbs on dialogue tags: never "she said softly," "he replied warmly," "she whispered quietly." Use action beats or just "said."
- Do not overuse "suddenly" — use it at most once per scene, and only when the surprise is genuine.
- Avoid starting consecutive sentences with the same subject pronoun (He/She/They three times in a row is flat).
- No filler intensifiers: "truly," "deeply," "utterly," "profoundly," "incredibly" — cut them.
- Write specific and concrete, never vague: "the smell of diesel and wet asphalt" beats "the smell of the city."

DIALOGUE RULES (enforced whenever dialogue appears):
- Read every line of dialogue aloud in your head. If it sounds like someone writing, rewrite it until it sounds like someone speaking.
- Real people do not finish their thoughts in neat complete sentences. They trail off with ellipses, get interrupted, change direction mid-sentence.
- Characters almost never directly answer the question they were asked. They deflect, pivot, answer a different question, or go quiet.
- Subtext over text. Anger is not "I'm angry." It's "Fine." followed by silence, or a suddenly very careful choice of words.
- Every character must sound different: their vocabulary, rhythm, and sentence length should reflect their age, education, mood, and relationship to the person they are speaking to.
- Contractions are mandatory in casual speech. "Don't" not "do not." "It's" not "it is." Only use full forms for deliberate emphasis.
- Fragments are good dialogue. "Yeah." "No." "Tomorrow, maybe." "Forget it." These are natural.
- Use "said" or "asked" for dialogue tags 90% of the time. Reserve other tags (whispered, snapped, called) only when the manner of delivery is genuinely surprising and cannot be shown another way.
- Never use these hollow dialogue openers repeatedly: "Well," "Look," "Listen," "So," "Anyway," "I mean" — vary them or cut them entirely.
- No "As you know, Bob" exposition. Characters do not explain facts to each other that both of them already know. Find another way to get information to the reader.
- Silence is dialogue. A beat too long before answering says more than most lines.
- Interruptions: instead of an em-dash mid-sentence, use an action beat. Show the interruption through the other character's movement or speech, then continue.
- Avoid characters who are too eloquent under pressure. Someone terrified, furious, or grieving does not speak in well-constructed paragraphs.
- No mirroring: if Character A says "I love you," Character B does not immediately say "I love you too" unless that irony or echo is the point.

OUTPUT RULE: Output ONLY the story prose — zero preamble, zero labels, zero meta-commentary. The output will be inserted directly into the manuscript.`;

  let suggestion: string;
  try {
    suggestion = await geminiGenerate(
      userPrompt,
      suggestionSystem,
      maxTokens,
      false,
      "gemini-2.5-flash"
    );
  } catch (err) {
    console.error("[coauthor/suggest] AI failed:", err);
    return Response.json({ error: "AI failed" }, { status: 502 });
  }

  await commitRateLimit(user.id, createServiceClient(), isLongWrite ? 2 : 1);

  suggestion = suggestion.trim();
  if (!suggestion) return Response.json({ error: "Empty suggestion" }, { status: 500 });

  // Strip any em-dashes that slipped through despite the prompt rule
  suggestion = suggestion.replace(/ — /g, ", ").replace(/—/g, ", ");

  return Response.json({ ok: true, suggestion, remaining });
}
