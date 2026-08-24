/**
 * POST /api/ai/coauthor/whatif
 *
 * Explores 2–3 short alternative branches from a highlighted passage.
 * The original text is untouched — branches are presented for the user to
 * insert or discard.
 *
 * Body: {
 *   projectId: string,
 *   chapterId?: string,
 *   selectedText: string,   // the highlighted passage
 *   contextBefore: string,  // prose before the selection (style fingerprint)
 *   whatIf: string,         // e.g. "she doesn't go to the diner"
 * }
 * Returns: { branches: [{ label: string, text: string }], remaining: number }
 */

import { NextRequest } from "next/server";
import { createServerSupabaseClient, createServiceClient } from "@/lib/auth";
import { geminiGenerate } from "@/lib/ai";
import { checkRateLimit, commitRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    projectId: string;
    chapterId?: string;
    selectedText: string;
    contextBefore: string;
    whatIf: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { projectId, selectedText, contextBefore, whatIf } = body;
  if (!projectId) return Response.json({ error: "Missing projectId" }, { status: 400 });
  if (!selectedText?.trim()) return Response.json({ error: "Missing selectedText" }, { status: 400 });
  if (!whatIf?.trim()) return Response.json({ error: "Missing whatIf" }, { status: 400 });

  // Verify project ownership
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();
  if (!project) return Response.json({ error: "Not found" }, { status: 404 });

  const { block, remaining } = await checkRateLimit(user.id, createServiceClient(), 1);
  if (block) return block;

  // Style fingerprint from the writer's prose immediately before the selection
  const styleWords = (contextBefore ?? "").trim().split(/\s+/);
  const styleSample = styleWords.slice(Math.max(0, styleWords.length - 500)).join(" ");
  const styleBlock = styleSample
    ? `WRITER'S STYLE — study this and mirror it exactly (POV, tense, voice, sentence rhythm, paragraph length):
---
${styleSample}
---

`
    : "";

  const systemPrompt = `You are a creative writing assistant helping a writer explore "what if" forks in their manuscript.

RULES:
- Write in the writer's exact voice, POV, and tense — mirror their style precisely
- Each branch is ≤150 words
- Show the scene — do not summarize or tell
- No em-dashes; use commas or full stops instead
- Concrete and specific, never vague
- Label each option on its own line: "Option A:", "Option B:", "Option C:"
- Leave a blank line between each option
- Do not start two options with the same opening word
- Output ONLY the labeled options — no preamble, no closing commentary`;

  const userPrompt = `${styleBlock}THE HIGHLIGHTED PASSAGE:
---
${selectedText.trim()}
---

WHAT IF: "${whatIf.trim()}"

Write 2–3 short branches exploring this scenario. Each branch shows what happens next or instead — do not rewrite the highlighted passage, write the scene that follows from this alternate path.`;

  let raw: string;
  try {
    raw = await geminiGenerate(userPrompt, systemPrompt, 900, false, "gemini-2.5-flash");
  } catch (err) {
    console.error("[whatif] AI failed:", err);
    return Response.json({ error: "AI failed" }, { status: 502 });
  }

  await commitRateLimit(user.id, createServiceClient(), 1);

  // Parse "Option A:\n...\n\nOption B:\n..." format
  const branches: Array<{ label: string; text: string }> = [];
  const blocks = raw.trim().split(/\n{2,}/);

  for (const block of blocks) {
    const trimmed = block.trim();
    const match = trimmed.match(/^(Option\s+[A-C]):?\s*\n([\s\S]+)$/i);
    if (match) {
      branches.push({
        label: match[1].trim(),
        text:  match[2].trim().replace(/ — /g, ", ").replace(/—/g, ", "),
      });
    }
  }

  // Fallback: single-label format "Option A: text on same line"
  if (branches.length === 0) {
    const inlineMatches = [...raw.matchAll(/\b(Option\s+[A-C]):?\s*([^\n]{20,})/gi)];
    for (const m of inlineMatches) {
      branches.push({
        label: m[1].trim(),
        text:  m[2].trim().replace(/ — /g, ", ").replace(/—/g, ", "),
      });
    }
  }

  // Final fallback
  if (branches.length === 0) {
    branches.push({
      label: "Option A",
      text:  raw.trim().replace(/ — /g, ", ").replace(/—/g, ", "),
    });
  }

  return Response.json({ ok: true, branches: branches.slice(0, 3), remaining });
}
