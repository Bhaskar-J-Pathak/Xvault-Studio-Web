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
import { checkRateLimit } from "@/lib/rate-limit";

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

  const { systemPrompt } = await assembleCoauthorContext(
    supabase,
    projectId,
    coauthor?.name ?? "Alex",
    coauthor?.personality ?? null,
    contextText,
    body.chapterId
  );

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

Rewrite ONLY the selected text according to the instruction. Match the writer's voice, POV, tense, and style exactly. Output ONLY the rewritten passage — no preamble, no labels, no explanation. Aim for roughly the same length as the original unless the instruction asks for more or less.`;

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

Write ${wordTarget} words of story prose to be inserted at the cursor. Match the writer's voice, POV, tense, sentence rhythm, and style exactly. Output ONLY the story text — no preamble, no labels, no commentary. Do not repeat the text before the cursor. Pick up naturally from it.`;

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
- Do not over-describe. Keep prose lean — include only what moves the scene forward. Avoid stacking adjectives, excessive sensory detail, or purple prose.

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

  suggestion = suggestion.trim();
  if (!suggestion) return Response.json({ error: "Empty suggestion" }, { status: 500 });

  return Response.json({ ok: true, suggestion, remaining });
}
