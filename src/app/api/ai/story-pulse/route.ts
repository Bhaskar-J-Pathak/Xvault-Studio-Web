import { NextRequest } from "next/server";
import { createServerSupabaseClient, createServiceClient } from "@/lib/auth";
import { geminiGenerate } from "@/lib/ai";
import { checkRateLimit, commitRateLimit } from "@/lib/rate-limit";

export const maxDuration = 300;

interface PulseObservation {
  character_name: string;
  emotional_state: string;
  desire?: string;
  fear?: string;
  change_summary?: string;
  evidence_quote: string;
  continuity_note?: string;
  severity?: "none" | "notice" | "warning";
  confidence?: "explicit" | "inferred";
}

function lexicalToText(content: unknown): string {
  const parts: string[] = [];
  function walk(node: unknown) {
    if (!node || typeof node !== "object") return;
    const value = node as Record<string, unknown>;
    if (value.type === "text" && typeof value.text === "string") parts.push(value.text);
    if (Array.isArray(value.children)) value.children.forEach(walk);
  }
  if (content && typeof content === "object") {
    const state = content as Record<string, unknown>;
    walk(state.root ?? content);
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function parseObservations(raw: string): PulseObservation[] | null {
  try {
    const parsed = JSON.parse(raw) as { observations?: unknown };
    if (!Array.isArray(parsed.observations)) return null;
    return parsed.observations.filter((item): item is PulseObservation => {
      if (!item || typeof item !== "object") return false;
      const row = item as Record<string, unknown>;
      return typeof row.character_name === "string"
        && typeof row.emotional_state === "string"
        && typeof row.evidence_quote === "string";
    }).slice(0, 8);
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null) as { projectId?: string } | null;
  if (!body?.projectId) return Response.json({ error: "Missing projectId" }, { status: 400 });

  const { data: project } = await supabase.from("projects").select("id")
    .eq("id", body.projectId).eq("user_id", user.id).single();
  if (!project) return Response.json({ error: "Not found" }, { status: 404 });

  const { data: chapters, error: chapterError } = await supabase.from("chapters")
    .select("id, title, position, content").eq("project_id", body.projectId).order("position");
  if (chapterError) return Response.json({ error: "Could not load chapters." }, { status: 500 });

  const usable = (chapters ?? []).map((chapter) => ({ ...chapter, text: lexicalToText(chapter.content) }))
    .filter((chapter) => chapter.text.split(/\s+/).length >= 100);
  if (!usable.length) return Response.json({ error: "Story Pulse needs a saved chapter with at least 100 words." }, { status: 400 });

  const service = createServiceClient();
  const { block, remaining } = await checkRateLimit(user.id, service, usable.length);
  if (block) return block;

  const history: PulseObservation[] = [];
  let saved = 0;

  for (const chapter of usable) {
    const prior = history.slice(-16).map((row) => ({
      character_name: row.character_name,
      emotional_state: row.emotional_state,
      desire: row.desire,
      fear: row.fear,
      change_summary: row.change_summary,
    }));

    const prompt = `Analyze the emotional continuity of the major characters in this fiction chapter.

PRIOR CHRONOLOGICAL OBSERVATIONS:
${prior.length ? JSON.stringify(prior) : "None. This is the first analyzed chapter."}

CHAPTER ${chapter.position + 1}: ${chapter.title}
"""
${chapter.text.slice(0, 30000)}
"""

Return JSON only:
{"observations":[{"character_name":"Exact name","emotional_state":"specific current emotional posture, max 16 words","desire":"what they want now, max 14 words","fear":"active fear or vulnerability, max 14 words","change_summary":"what emotionally changed in this chapter, max 20 words","evidence_quote":"exact supporting quote from this chapter, max 28 words","continuity_note":"only if the shift from prior observations lacks an evident cause, max 28 words","severity":"none|notice|warning","confidence":"explicit|inferred"}]}

Rules:
- Include only characters with meaningful emotional evidence in this chapter; maximum 8.
- Do not diagnose mental illness or present interpretation as objective fact.
- A changed mood is not automatically a continuity problem.
- Use warning only for a strong unexplained contradiction; notice for a possible jump worth reviewing.
- If the chapter supplies a cause for the change, severity must be none.
- evidence_quote must be copied from this chapter and must genuinely support the observation.`;

    let raw: string;
    try {
      raw = await geminiGenerate(prompt, "You are a careful fiction continuity analyst. Output valid JSON only.", 4096, true, "gemini-2.5-flash");
    } catch (error) {
      console.error(`[story-pulse] AI failed for ${chapter.title}:`, error);
      return Response.json({ error: `Story Pulse could not analyze “${chapter.title}”. No credit was charged for that chapter.` }, { status: 502 });
    }

    const observations = parseObservations(raw);
    if (!observations) return Response.json({ error: `Story Pulse returned an invalid analysis for “${chapter.title}”.` }, { status: 502 });

    const rows = observations.map((row) => ({
      project_id: body.projectId,
      chapter_id: chapter.id,
      character_name: row.character_name.trim(),
      emotional_state: row.emotional_state.trim(),
      desire: row.desire?.trim() || null,
      fear: row.fear?.trim() || null,
      change_summary: row.change_summary?.trim() || null,
      evidence_quote: row.evidence_quote.trim(),
      continuity_note: row.continuity_note?.trim() || null,
      severity: row.severity === "warning" || row.severity === "notice" ? row.severity : "none",
      confidence: row.confidence === "explicit" ? "explicit" : "inferred",
      updated_at: new Date().toISOString(),
    }));

    const { error: deleteError } = await supabase.from("story_pulse_observations").delete()
      .eq("project_id", body.projectId).eq("chapter_id", chapter.id);
    if (deleteError) return Response.json({ error: "Apply migration 0023_story_pulse.sql before running Story Pulse." }, { status: 500 });
    if (rows.length) {
      const { error: insertError } = await supabase.from("story_pulse_observations").insert(rows);
      if (insertError) return Response.json({ error: "Could not save Story Pulse observations." }, { status: 500 });
    }

    history.push(...observations);
    saved += rows.length;
    await commitRateLimit(user.id, service, 1);
  }

  return Response.json({ ok: true, chaptersAnalyzed: usable.length, observations: saved, remaining });
}
