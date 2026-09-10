/**
 * POST /api/ai/coauthor/suggest
 *
 * Cursor-aware prose writer. Three modes:
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

/**
 * Suggestions are inserted directly into a manuscript, not rendered as Markdown.
 * Gemini occasionally uses asterisks for action beats or emphasis despite the
 * prompt, so remove Markdown emphasis before it reaches the editor.
 */
function normalizeProse(text: string): string {
  return text
    .replace(/\*{1,3}([^*\n]+?)\*{1,3}/g, "$1")
    .replace(/^\s*[-•]\s+/gm, "")
    .replace(/[—―]/g, ", ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// A prose instruction sometimes contains shorthand such as "Arthur: ask where
// Nyx went". Models can copy that shape even when told to write fiction. Catch
// speaker labels before the result reaches the manuscript.
const SCRIPT_DIALOGUE_LINE = /^\s*([A-Z][\p{L}'’-]*(?:\s+[A-Z][\p{L}'’-]*){0,3})\s*:\s*(\S.*)$/gmu;

function hasScriptStyleDialogue(text: string): boolean {
  SCRIPT_DIALOGUE_LINE.lastIndex = 0;
  return SCRIPT_DIALOGUE_LINE.test(text);
}

function takeWordsPreservingLayout(text: string, count: number, fromEnd = false): string {
  const matches = [...text.matchAll(/\S+/g)];
  if (matches.length <= count) return text.trim();
  if (fromEnd) {
    return text.slice(matches[matches.length - count].index).trim();
  }
  const last = matches[count - 1];
  return text.slice(0, (last.index ?? 0) + last[0].length).trim();
}

type ProseLength = "short" | "medium" | "long";

const PROSE_LENGTHS: Record<ProseLength, { words: string; maxTokens: number }> = {
  short: { words: "100-200", maxTokens: 1280 },
  medium: { words: "250-450", maxTokens: 1792 },
  long: { words: "500-800", maxTokens: 2816 },
};

function getSceneOpening(text: string): string {
  const scenes = text.split(/\n\s*(?:\*{3}|#{3}|~{3})\s*\n/g);
  return takeWordsPreservingLayout(scenes.at(-1) ?? text, 350);
}

function hasCollapsedParagraphs(text: string): boolean {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const dialogueMarks = (text.match(/[“”"]/g) ?? []).length;
  return wordCount > 120 && dialogueMarks >= 4 && !/\n\s*\n/.test(text);
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    projectId: string;
    chapterId?: string;
    mode?: "write" | "rewrite" | "continue";
    instruction?: string;
    draft?: string;
    beforeCursor?: string;
    afterCursor?: string;
    selectedText?: string;
    length?: ProseLength;
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
    draft,
    beforeCursor = "",
    afterCursor = "",
    selectedText = "",
    recentText = "",
  } = body;

  const proseLength: ProseLength = body.length && Object.hasOwn(PROSE_LENGTHS, body.length)
    ? body.length
    : "medium";
  const lengthSpec = PROSE_LENGTHS[proseLength];

  if (!projectId) return Response.json({ error: "Missing projectId" }, { status: 400 });
  if (draft !== undefined && (typeof draft !== "string" || !draft.trim() || draft.length > 50000 || !instruction?.trim())) {
    return Response.json({ error: "Refine needs a draft and instructions (maximum 50,000 characters)." }, { status: 400 });
  }

  // Verify ownership + fetch co-author
  const [{ data: project }, { data: coauthor }] = await Promise.all([
    supabase.from("projects").select("id").eq("id", projectId).eq("user_id", user.id).single(),
    supabase.from("coauthors").select("name, personality").eq("project_id", projectId).maybeSingle(),
  ]);
  if (!project) return Response.json({ error: "Not found" }, { status: 404 });

  // Length is an explicit user choice. Every prose generation costs one credit.
  const { block, remaining } = await checkRateLimit(user.id, createServiceClient(), 1);
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
      body.chapterId,
      "prose"
    ));
  } catch (err) {
    console.error("[coauthor/suggest] Context assembly failed:", err);
    return Response.json({ error: "Failed to load story context. Try again." }, { status: 500 });
  }

  // ── Style fingerprint ─────────────────────────────────────────────────────
  // Extract a style analysis from the writer's existing prose so the AI can
  // mirror it exactly. For rewrites, the surrounding manuscript is the voice
  // authority, not the selected passage the writer is trying to fix.
  const styleSource = contextText.trim();
  const styleWords = [...styleSource.matchAll(/\S+/g)];
  // Slice the original prose so the model can see paragraph and dialogue breaks.
  const styleSample = styleSource.slice(styleWords[Math.max(0, styleWords.length - 600)]?.index ?? 0);
  const sceneOpening = getSceneOpening(contextText);

  const styleAnalysisBlock = styleSample
    ? `WRITER'S VOICE IS THE SOURCE OF TRUTH — imitate this excerpt, do not "improve" it or substitute generic AI prose:
Match its POV, tense, sentence rhythm, paragraph length, vocabulary, dialogue punctuation, interiority, descriptive density, and level of formality. Keep its quirks and restraint. If it is plain, write plainly; if it is fragmented, use fragments; if it is lyrical, remain lyrical without adding purple prose. Do not introduce stock phrases, a more polished narrator, or your own signature voice.
---
${styleSample}
---`
    : "";

  // ── After-cursor context ──────────────────────────────────────────────────
  const afterBlock = afterCursor?.trim()
    ? `TEXT THAT FOLLOWS (maintain continuity — do not contradict or repeat):\n---\n${takeWordsPreservingLayout(afterCursor, 350)}\n---`
    : "";

  // ── Build prompt by mode ──────────────────────────────────────────────────
  let userPrompt: string;
  let maxTokens: number;

  if (draft) {
    userPrompt = `${styleAnalysisBlock}

TEXT BEFORE THE INSERTION:
${takeWordsPreservingLayout(beforeCursor, 1000, true)}

${afterBlock}

${mode === "rewrite" ? `ORIGINAL MANUSCRIPT SELECTION TO REPLACE:\n${selectedText}` : ""}

UNACCEPTED DRAFT TO REFINE (not established story facts):
---
${draft}
---

REQUESTED CHANGES: ${instruction!.trim()}

Revise this draft according to the requested changes. Preserve the parts that still work and the author's voice. Return the entire revised draft for the SAME insertion point, not a continuation after the draft. Do not repeat surrounding manuscript text. Keep roughly the same length unless asked otherwise. Output only novel prose, with quoted dialogue and normal paragraph breaks, no em dashes or Markdown.`;
    maxTokens = Math.min(8192, 1536 + Math.ceil(draft.split(/\s+/).length * 2.5));
  } else if (mode === "rewrite") {
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
${takeWordsPreservingLayout(beforeCursor, 500, true)}
---

SELECTED TEXT TO REWRITE:
---
${selectedText.trim()}
---

${afterBlock}

INSTRUCTION: ${instruction.trim()}

Rewrite ONLY the selected text according to the instruction. Match the writer's voice, POV, tense, and style exactly.
Craft rules: no em-dashes, no AI-cliché phrases (see system rules), no bare emotion labels — show through action or detail, no adverbs on dialogue tags, write specific not vague.
If the passage contains dialogue: every line must sound spoken not written. Match each character’s established speech and the writer’s dialogue style. Use double quotation marks for spoken dialogue.
Output ONLY the rewritten passage — no preamble, no labels, no explanation, no Markdown, and never use asterisks for action beats or emphasis. Aim for roughly the same length as the original unless the instruction asks for more or less.`;

    maxTokens = Math.min(8192, 1536 + Math.ceil(selectedText.split(/\s+/).length * 2.5));

  } else if (mode === "write") {
    // Generate new prose at cursor position from an instruction
    if (!instruction?.trim()) {
      return Response.json({ error: "No instruction" }, { status: 400 });
    }

    maxTokens = lengthSpec.maxTokens;

    userPrompt = `${styleAnalysisBlock}

OPENING OF THE CURRENT SCENE (orientation only — do not repeat it):
---
${sceneOpening}
---

TEXT BEFORE THE CURSOR (this is where your writing will be inserted):
---
${takeWordsPreservingLayout(beforeCursor, 1600, true)}
---

${afterBlock}

INSTRUCTION: ${instruction.trim()}

Write ${lengthSpec.words} words of story prose to be inserted at the cursor. The range is binding: plan a natural story beat that begins and ends inside it, without padding. The writer's excerpt is binding: match its voice, POV, tense, sentence rhythm, diction, paragraph shape, dialogue punctuation, and degree of detail exactly. Do not make it sound more polished, more dramatic, or more literary than the writer's own text.
Craft rules: no em-dashes, no AI-cliché phrases (see system rules), no bare emotion labels — ground them in action or sensation, no adverbs on dialogue tags, write specific and concrete not vague. Vary sentence length and structure.
If the passage includes dialogue: make every line sound spoken not written. Match each character’s established speech and the writer’s dialogue style. Put every spoken line in double quotation marks. Use "said" or "asked" for tags, and action beats over adverbs.
The instruction may use shorthand such as "Arthur: ask Nyx a question." Treat that only as a description of what should happen. Never copy speaker labels or write "Character: dialogue". Convert every such exchange into normal novel narration, quoted speech, dialogue tags, and action beats.
Output ONLY the story text — no preamble, no labels, no commentary, no Markdown, and no asterisks for action beats or emphasis. Do not repeat the text before the cursor. Pick up naturally from it.`;

  } else {
    // "continue" — blind continuation (no instruction, legacy)
    const continueText = beforeCursor || recentText;
    if (!continueText?.trim()) {
      return Response.json({ error: "No context text" }, { status: 400 });
    }

    userPrompt = `${styleAnalysisBlock}

OPENING OF THE CURRENT SCENE (orientation only — do not repeat it):
---
${sceneOpening}
---

${afterBlock}

Continue the story exactly where it left off. Write ${lengthSpec.words} words and complete the next meaningful story beat. The range is binding: choose a beat that reaches a natural turn inside it, without padding.

Rules:
- The writer's existing text is binding. Match its voice, pacing, diction, POV, tense, paragraph shape, and dialogue punctuation exactly. Never substitute generic AI prose or your own preferred style.
- Do not introduce new plot elements — continue the current scene
- Do not recap what just happened or restate the character's current fear. Begin with the immediate consequence of the final manuscript line and make the situation materially progress.
- Do not invent a new ability, rescue, object, attacker, revelation, or solution unless the manuscript context has already established it.
- Never use em-dashes (— or ―) — restructure the sentence with a comma, period, colon, semicolon, parentheses, or a new sentence instead
- Keep prose lean — no stacked adjectives, no excessive sensory detail, no purple prose
- No AI-cliché phrases (see system rules): no "washed over," no "found herself," no "heart raced," no "in that moment," no bare emotion labels — show through action or sensation
- Write specific and concrete — "the smell of diesel and wet asphalt" beats "the smell of the city"
- Vary sentence length — avoid three consecutive sentences starting with the same subject
- No adverbs on dialogue tags — use action beats or just "said"
- Use double quotation marks for every line of spoken dialogue; never use asterisks to describe an action or emotion
- Preserve the writer's paragraph rhythm. This is a continuation, not one large paragraph. Use multiple paragraphs when action, focus, time, or speaker changes.
- Output ONLY the continuation. No preamble, no labels.

The manuscript so far ends with:
---
${takeWordsPreservingLayout(continueText, 1600, true)}
---
Continue:`;

    maxTokens = lengthSpec.maxTokens;
  }

  const suggestionSystem = `${systemPrompt}

PROSE RULES (always enforced):
- Preserve normal novel paragraphing. Separate paragraphs with a blank line. Start a new paragraph when the speaker changes. Keep a speaker's dialogue and related action together; separate another character's response or action into its own paragraph. Never flatten a scene into one block of text.
- Advance through cause and effect. Each paragraph must react to, complicate, or change what came immediately before it. Do not produce a static block of description or repeated emotional reaction.
- Never use em-dashes (— or ―). Restructure the sentence with a comma, period, colon, semicolon, parentheses, or a new sentence instead.
- Keep prose lean. Include only what moves the scene forward. No stacked adjectives, no excessive sensory detail, no purple prose.
- Output plain manuscript prose, never Markdown. Do not use asterisks for emphasis, action beats, thoughts, or scene description.
- The manuscript excerpt is the authority on voice. Match its exact tense, POV, diction, punctuation, sentence length, paragraph rhythm, and amount of description. Never add a generic AI voice, stock dramatic phrasing, or polish the prose beyond the writer's established style.

VOICE AND SCENE:
- Match the author's observed rhythm, vocabulary, interiority, dialogue balance, and degree of formality. Story Bible style notes and explicit instructions take priority over generic craft preferences.
- Let characters answer directly, hesitate, explain, or remain silent when their personality and situation call for it. Do not force contractions, fragments, deflection, or a fixed dialogue-tag ratio.
- Use fresh details that belong to this scene. Avoid repeating the same fear, injury, metaphor, or physical reaction in successive paragraphs.
- Develop small actions and consequences naturally. Follow explicit requested events. Do not resolve the scene through an unestablished power or convenient rescue.
- Write quoted dialogue within narrative paragraphs. Never use speaker labels, screenplay directions, Markdown, or asterisks.

BEFORE WRITING (internal reasoning only):
Identify the cursor's exact sentence or paragraph boundary, the viewpoint, tense, who is present, what each person knows and wants, physical constraints, and the writer's requested events. Choose the next small causal beat. If text follows the cursor, bridge into it without repeating it or jumping past it.
AFTER DRAFTING (internal check only):
Read the join between the existing text and your first sentence. Complete an unfinished sentence naturally. Check the ending against the following text, preserve injuries and established limits, and remove recaps. Use paragraph breaks for changes in speaker, focus, or action. Never output this plan or review.

OUTPUT RULE: Output ONLY the story prose — zero preamble, zero labels, zero meta-commentary. The output will be inserted directly into the manuscript.`;

  const proseModel = process.env.PROSE_MODEL ?? "gemini-2.5-flash";
  const thinkingBudget = proseModel.startsWith("gemini-3") ? undefined : 768;
  const thinkingLevel = proseModel.startsWith("gemini-3") ? "low" as const : undefined;

  let suggestion: string;
  try {
    suggestion = await geminiGenerate(
      userPrompt,
      suggestionSystem,
      maxTokens,
      false,
      proseModel,
      thinkingBudget,
      thinkingLevel
    );
  } catch (err) {
    console.error("[coauthor/suggest] AI failed:", err);
    return Response.json({ error: "AI failed" }, { status: 502 });
  }

  if (hasScriptStyleDialogue(suggestion) || hasCollapsedParagraphs(suggestion)) {
    try {
      suggestion = await geminiGenerate(
        `Convert the draft below from screenplay or transcript formatting into normal novel prose.

Requirements:
- Preserve every story event, meaning, character, POV, tense, and the writer's established voice.
- Put spoken words in double quotation marks.
- Use natural dialogue tags and action beats.
- Start a new paragraph whenever the speaker changes.
- Preserve normal paragraph breaks for changes in action, focus, time, or speaker. Never return the scene as one large paragraph.
- Never output speaker labels such as "Arthur:" or "Nyx:".
- Do not add, remove, summarize, or explain anything.
- Output only the repaired manuscript prose.

WRITER'S STYLE SAMPLE:
---
${styleSample}
---

DRAFT TO REPAIR:
---
${suggestion}
---`,
        suggestionSystem,
        maxTokens,
        false,
        proseModel,
        thinkingBudget,
        thinkingLevel
      );
    } catch (err) {
      console.error("[coauthor/suggest] Script-format repair failed:", err);
    }
  }

  suggestion = normalizeProse(suggestion);
  if (hasScriptStyleDialogue(suggestion)) {
    return Response.json({ error: "The draft could not be formatted as novel prose. Please try again. No credits were deducted." }, { status: 502 });
  }
  if (!suggestion) return Response.json({ error: "Empty suggestion" }, { status: 500 });

  await commitRateLimit(user.id, createServiceClient(), 1);
  return Response.json({ ok: true, suggestion, remaining, length: proseLength });
}
