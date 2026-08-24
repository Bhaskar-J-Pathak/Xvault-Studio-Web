/**
 * POST /api/ai/coauthor/edit/analyze
 *
 * Phase 1 — Line-edit analysis for a single chapter.
 * Scans the chapter paragraph by paragraph and returns a plan of
 * suggested prose rewrites: tighter sentences, stronger verbs, cut filler.
 *
 * Body:    { projectId, chapterId }
 * Returns: { plan: EditPlan, remaining: number }
 * Cost:    3 credits
 */

import { NextRequest } from "next/server";
import { createServerSupabaseClient, createServiceClient } from "@/lib/auth";
import { geminiGenerate } from "@/lib/ai";
import { lexicalGetParagraphs } from "@/lib/lexical-replace";
import { checkRateLimit, commitRateLimit } from "@/lib/rate-limit";

export interface ParagraphEdit {
  index:     number;   // root.children index — used by apply route
  original:  string;   // verbatim paragraph text (for display + verification)
  rewritten: string;   // AI's tightened version
  reason:    string;   // brief explanation of what was wrong
}

export interface EditPlan {
  chapterId:    string;
  chapterTitle: string;
  edits:        ParagraphEdit[];
  summary:      string;
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: { projectId: string; chapterId: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { projectId, chapterId } = body;
  if (!projectId || !chapterId) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  // Verify ownership via project
  const { data: project } = await supabase
    .from("projects")
    .select("id, title")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();
  if (!project) return Response.json({ error: "Not found" }, { status: 404 });

  // Fetch the chapter
  const { data: chapter } = await supabase
    .from("chapters")
    .select("id, title, content")
    .eq("id", chapterId)
    .eq("project_id", projectId)
    .single();
  if (!chapter) return Response.json({ error: "Chapter not found" }, { status: 404 });

  const serviceClient = createServiceClient();
  const { block, remaining } = await checkRateLimit(user.id, serviceClient, 3);
  if (block) return block;

  // Extract paragraphs with their indices
  const allParagraphs = lexicalGetParagraphs(
    chapter.content as Record<string, unknown>
  ).filter((p) => p.text.length > 0);

  if (!allParagraphs.length) {
    return Response.json({ error: "Chapter has no written content" }, { status: 400 });
  }

  // Cap at 60 paragraphs to prevent token-limit truncation of the JSON response
  const paragraphs = allParagraphs.slice(0, 60);

  // Build numbered paragraph block for the AI
  const paragraphBlock = paragraphs
    .map((p) => `[P${p.index}] ${p.text}`)
    .join("\n\n");

  const prompt = `You are a professional line editor helping a novelist tighten their prose.

CHAPTER: "${chapter.title}"

${paragraphBlock}

LINE EDIT RULES — only flag a paragraph if it has one of these real problems:
- Overwritten: unnecessary words, weak verbs, stacked adjectives, filler phrases
- Telling instead of showing emotion through action (e.g. "he felt sad" instead of showing it)
- Adverbs on dialogue tags ("she said softly" → use an action beat or just "said")
- Hedging verbs: "seemed to", "appeared to", "began to", "started to"
- Redundant body language: "nodded his head", "shrugged her shoulders", "blinked his eyes"
- Consecutive sentences starting with the same subject (He/She three times in a row)

HARD RULES:
- Do NOT change meaning, plot events, character details, or dialogue content
- Do NOT rewrite a paragraph that is already tight — only flag real problems
- Copy the "original" field verbatim, character for character, from the [P{n}] line above
- Use the exact [P{n}] number as the "index" value (as an integer, not a string)
- Target 3 to 8 paragraphs. If the prose is clean, return fewer or none.

Return ONLY valid JSON:
{
  "edits": [
    {
      "index": 3,
      "original": "exact verbatim text from the [P3] line above",
      "rewritten": "tightened version preserving voice and meaning",
      "reason": "specific, brief reason (e.g. \\"hedging verb + overwritten middle sentence\\")"
    }
  ],
  "summary": "e.g. Found 5 paragraphs to tighten in \\"${chapter.title}\\""
}

If nothing genuinely needs editing, return { "edits": [], "summary": "Prose is already tight — no changes needed." }`;

  let raw: string;
  try {
    raw = await geminiGenerate(
      prompt,
      "You are a precise line editor. You only quote paragraph text verbatim. You never change meaning. You return valid JSON only.",
      16000,
      true,
      "gemini-2.5-flash"
    );
  } catch (err) {
    console.error("[edit/analyze] AI failed:", err);
    return Response.json({ error: "AI analysis failed" }, { status: 502 });
  }

  await commitRateLimit(user.id, serviceClient, 3);

  // Strip markdown code fences (```json … ```) that Gemini sometimes adds
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  let parsed: { edits: ParagraphEdit[]; summary: string };
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Fallback: find the outermost { … } block by tracking brace depth
    let start = -1, depth = 0, extracted = "";
    for (let i = 0; i < cleaned.length; i++) {
      if (cleaned[i] === "{") { if (depth === 0) start = i; depth++; }
      else if (cleaned[i] === "}") {
        depth--;
        if (depth === 0 && start !== -1) { extracted = cleaned.slice(start, i + 1); break; }
      }
    }
    if (!extracted) {
      console.error("[edit/analyze] Parse failed, raw:", raw.slice(0, 500));
      return Response.json({ error: "AI returned invalid JSON" }, { status: 500 });
    }
    try {
      parsed = JSON.parse(extracted);
    } catch {
      console.error("[edit/analyze] Parse failed after extraction, raw:", raw.slice(0, 500));
      return Response.json({ error: "AI returned invalid JSON" }, { status: 500 });
    }
  }

  // Build a quick-lookup map: index → paragraph text
  const paragraphMap = new Map(paragraphs.map((p) => [p.index, p.text]));

  // Verify each edit: the original must match the paragraph at that index
  const verifiedEdits = (parsed.edits ?? []).filter((edit) => {
    const expected = paragraphMap.get(edit.index);
    if (!expected) return false;
    // Normalise whitespace for comparison — AI may collapse spaces
    const norm = (s: string) => s.replace(/\s+/g, " ").trim();
    return norm(expected) === norm(edit.original);
  });

  const plan: EditPlan = {
    chapterId:    chapter.id,
    chapterTitle: chapter.title,
    edits:        verifiedEdits,
    summary:      parsed.summary ?? `${verifiedEdits.length} suggestion${verifiedEdits.length !== 1 ? "s" : ""} found`,
  };

  return Response.json({ ok: true, plan, remaining });
}
