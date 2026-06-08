/**
 * POST /api/ai/coauthor/global-change
 *
 * Phase 1 — Analysis.
 * Scans the full manuscript and returns a change plan:
 *   - clear: AI is confident this passage refers to the right subject
 *   - flagged: ambiguous — could be another character/subject, writer decides
 *
 * Body: { projectId, instruction }
 * Returns: { subject, changes[], flagged[], summary }
 */

import { NextRequest } from "next/server";
import { createServerSupabaseClient, createServiceClient } from "@/lib/auth";
import { geminiGenerate } from "@/lib/ai";
import { lexicalToText } from "@/lib/chunking";
import { phraseExistsInLexical } from "@/lib/lexical-replace";
import { checkRateLimit } from "@/lib/rate-limit";

export interface ChangeItem {
  chapterId: string;
  chapterTitle: string;
  original: string;
  replacement: string;
  context: string;
  confidence: "clear" | "flagged";
  verified: boolean; // server-verified the original phrase exists in that chapter
}

export interface FlaggedItem {
  chapterId: string;
  chapterTitle: string;
  passage: string;
  reason: string;
}

export interface ChangePlan {
  subject: string;
  instruction: string;
  changes: ChangeItem[];
  flagged: FlaggedItem[];
  summary: string;
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: { projectId: string; instruction: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { projectId, instruction } = body;
  if (!projectId || !instruction?.trim()) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  // Verify ownership
  const { data: project } = await supabase
    .from("projects")
    .select("id, title")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();
  if (!project) return Response.json({ error: "Not found" }, { status: 404 });

  const { block, remaining } = await checkRateLimit(user.id, createServiceClient(), 3);
  if (block) return block;

  // Fetch all chapters with content
  const { data: chapters } = await supabase
    .from("chapters")
    .select("id, title, position, content")
    .eq("project_id", projectId)
    .order("position");

  if (!chapters?.length) {
    return Response.json({ error: "No chapters found" }, { status: 400 });
  }

  // Build the manuscript block for the AI, chapter by chapter
  const manuscriptBlock = chapters
    .map((ch) => {
      const text = lexicalToText(ch.content);
      if (!text.trim()) return null;
      return `=== Chapter ${ch.position + 1}: "${ch.title}" (id: ${ch.id}) ===\n${text}`;
    })
    .filter(Boolean)
    .join("\n\n");

  if (!manuscriptBlock) {
    return Response.json({ error: "No written content found" }, { status: 400 });
  }

  const prompt = `You are helping a writer make a specific change throughout their manuscript.

Instruction from the writer: "${instruction.trim()}"

CRITICAL RULES:
1. The "original" string MUST be a verbatim excerpt from the manuscript text — copy it exactly as it appears, character for character.
2. Make "original" long enough to be SPECIFIC — it must include the character name or enough context to make clear WHICH character/subject it refers to. Never use a generic phrase that could match multiple characters.
3. The "replacement" should ONLY change what was instructed. Preserve all other wording exactly.
4. If a passage could refer to more than one character or subject, put it in "flagged" — never guess.
5. If a description of a trait (e.g. eye color) appears WITHOUT a clear reference to the specific subject being changed, it goes in "flagged".
6. For "context", copy the full sentence containing the change so the writer can see it in context.
7. Each chapter's id is listed in its header — use it exactly in your response.

Manuscript:
${manuscriptBlock}

Return ONLY a valid JSON object:
{
  "subject": "who or what is being changed",
  "changes": [
    {
      "chapterId": "exact-uuid-from-header",
      "chapterTitle": "chapter title",
      "original": "verbatim phrase from manuscript",
      "replacement": "corrected phrase",
      "context": "full sentence containing the phrase"
    }
  ],
  "flagged": [
    {
      "chapterId": "exact-uuid-from-header",
      "chapterTitle": "chapter title",
      "passage": "the ambiguous passage",
      "reason": "why it is unclear which character/subject this refers to"
    }
  ],
  "summary": "e.g. Found 6 clear matches across 3 chapters, 2 flagged passages"
}

If nothing needs changing, return empty arrays and explain in summary.`;

  let raw: string;
  try {
    raw = await geminiGenerate(
      prompt,
      "You analyze manuscripts and return precise, structured change plans as valid JSON. Never hallucinate text — only quote verbatim passages.",
      4096,
      true,
      "gemini-2.5-flash"
    );
  } catch (err) {
    console.error("[global-change] AI failed:", err);
    return Response.json({ error: "AI analysis failed" }, { status: 502 });
  }

  let plan: {
    subject: string;
    changes: Array<{
      chapterId: string;
      chapterTitle: string;
      original: string;
      replacement: string;
      context: string;
    }>;
    flagged: FlaggedItem[];
    summary: string;
  };

  try {
    plan = JSON.parse(raw.trim());
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      console.error("[global-change] Parse failed:", raw.slice(0, 300));
      return Response.json({ error: "AI returned invalid JSON" }, { status: 500 });
    }
    plan = JSON.parse(match[0]);
  }

  // Build a lookup map for fast chapter content access
  const chapterMap = new Map(
    chapters.map((ch) => [ch.id, { title: ch.title, content: ch.content }])
  );

  // Server-verify each change: confirm the original phrase actually exists in that chapter
  const verifiedChanges: ChangeItem[] = (plan.changes ?? []).map((c) => {
    const chapter = chapterMap.get(c.chapterId);
    const verified = chapter
      ? phraseExistsInLexical(
          chapter.content as Record<string, unknown>,
          c.original
        )
      : false;

    return {
      chapterId: c.chapterId,
      chapterTitle: c.chapterTitle,
      original: c.original,
      replacement: c.replacement,
      context: c.context,
      confidence: "clear",
      verified,
    };
  });

  // Unverified ones move to flagged automatically
  const unverified = verifiedChanges.filter((c) => !c.verified);
  const confirmed = verifiedChanges.filter((c) => c.verified);

  const flaggedItems: FlaggedItem[] = [
    ...(plan.flagged ?? []),
    ...unverified.map((c) => ({
      chapterId: c.chapterId,
      chapterTitle: c.chapterTitle,
      passage: c.original,
      reason: "Phrase could not be verified verbatim in the manuscript — may contain slight wording differences",
    })),
  ];

  const result: ChangePlan = {
    subject: plan.subject ?? "",
    instruction: instruction.trim(),
    changes: confirmed,
    flagged: flaggedItems,
    summary: plan.summary ?? `${confirmed.length} changes found`,
  };

  return Response.json({ ok: true, plan: result, remaining });
}
