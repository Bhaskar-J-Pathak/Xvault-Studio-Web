/**
 * POST /api/ai/story-bible/analyze-character
 *
 * Given an entity ID, reads the manuscript and extracts a deep character profile:
 * personality, motivations, character arc, and dialogue style.
 * Results are merged into entities.attributes so they persist.
 *
 * Body: { projectId, entityId }
 */

import { NextRequest } from "next/server";
import { createServerSupabaseClient, createServiceClient } from "@/lib/auth";
import { geminiGenerate } from "@/lib/ai";
import { lexicalToText } from "@/lib/chunking";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: { projectId: string; entityId: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { projectId, entityId } = body;
  if (!projectId || !entityId) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  // Verify ownership
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();
  if (!project) return Response.json({ error: "Not found" }, { status: 404 });

  // Costs 2 credits per character analysis.
  const { block } = await checkRateLimit(user.id, createServiceClient(), 2);
  if (block) return block;

  // Fetch the entity
  const { data: entity } = await supabase
    .from("entities")
    .select("id, name, type, description, attributes")
    .eq("id", entityId)
    .eq("project_id", projectId)
    .single();
  if (!entity) return Response.json({ error: "Entity not found" }, { status: 404 });

  // Fetch all chapters and extract text (cap at 6000 words total for cost)
  const { data: chapters } = await supabase
    .from("chapters")
    .select("title, content, position")
    .eq("project_id", projectId)
    .order("position");

  if (!chapters?.length) {
    return Response.json({ error: "No chapters found" }, { status: 400 });
  }

  const excerpts: string[] = [];
  let totalWords = 0;
  const WORD_CAP = 6000;

  for (const ch of chapters) {
    if (totalWords >= WORD_CAP) break;
    const text = lexicalToText(ch.content);
    if (!text) continue;

    // Only include paragraphs that mention the character
    const name = entity.name.toLowerCase();
    const paragraphs = text.split(/\n+/).filter((p) =>
      p.toLowerCase().includes(name)
    );

    if (!paragraphs.length) continue;

    const excerpt = paragraphs.join(" ");
    const words = excerpt.split(/\s+/).filter(Boolean);
    const allowed = Math.min(words.length, WORD_CAP - totalWords);
    excerpts.push(`[Chapter ${ch.position + 1}: ${ch.title}]\n${words.slice(0, allowed).join(" ")}`);
    totalWords += allowed;
  }

  if (!excerpts.length) {
    // Fall back to first 6000 words of full manuscript
    for (const ch of chapters) {
      if (totalWords >= WORD_CAP) break;
      const text = lexicalToText(ch.content);
      if (!text) continue;
      const words = text.split(/\s+/).filter(Boolean);
      const allowed = Math.min(words.length, WORD_CAP - totalWords);
      excerpts.push(`[Chapter ${ch.position + 1}: ${ch.title}]\n${words.slice(0, allowed).join(" ")}`);
      totalWords += allowed;
    }
  }

  if (!excerpts.length) {
    return Response.json({ error: "No manuscript text found" }, { status: 400 });
  }

  const prompt = `Analyze the character "${entity.name}" from the manuscript excerpts below.

${entity.description ? `Known description: ${entity.description}\n` : ""}
Return ONLY a valid JSON object with exactly these four fields (2-3 sentences each):
{
  "personality": "core traits, quirks, and behavioral patterns that define how they act",
  "motivations": "what drives them — their goals, desires, fears, and needs",
  "character_arc": "how they change or develop through the story so far",
  "dialogue_style": "how they speak: vocabulary level, cadence, speech patterns, tone, what they say vs. leave unsaid"
}

Manuscript excerpts:
---
${excerpts.join("\n\n")}
---

Analyze only from evidence in the text. Be specific and concrete — avoid vague generalities.`;

  let raw: string;
  try {
    raw = await geminiGenerate(
      prompt,
      "You extract precise character profiles from manuscript text. Output only valid JSON.",
      1500,
      true,
      "gemini-2.5-flash"
    );
  } catch (err) {
    console.error("[analyze-character] AI failed:", err);
    return Response.json({ error: "AI failed" }, { status: 502 });
  }

  let profile: {
    personality: string;
    motivations: string;
    character_arc: string;
    dialogue_style: string;
  };
  try {
    profile = JSON.parse(raw.trim());
  } catch {
    // Try to extract JSON from response if wrapped in markdown
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      console.error("[analyze-character] Parse failed. Raw:", raw.slice(0, 200));
      return Response.json({ error: "Parse failed" }, { status: 500 });
    }
    profile = JSON.parse(match[0]);
  }

  // Merge into existing attributes
  const existingAttrs = (entity.attributes as Record<string, unknown>) ?? {};
  const updatedAttrs = {
    ...existingAttrs,
    personality:    profile.personality    ?? "",
    motivations:    profile.motivations    ?? "",
    character_arc:  profile.character_arc  ?? "",
    dialogue_style: profile.dialogue_style ?? "",
  };

  await supabase
    .from("entities")
    .update({ attributes: updatedAttrs })
    .eq("id", entityId);

  return Response.json({ ok: true, profile });
}
