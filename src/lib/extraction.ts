/**
 * World Board extraction utilities — server-side only.
 *
 * Cost strategy:
 * - Only the delta text (new words since last extraction) is sent to the AI.
 * - Existing entities are summarised in a compact ~200-token format, not full JSON.
 * - Everything runs on free OpenRouter models — zero per-call cost.
 * - Extraction never counts against the user's AI quota.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ExtractedEntity {
  name:       string;
  type:       "character" | "location" | "faction" | "item" | "event" | "lore";
  is_update:  boolean;
  attributes: Record<string, string>;
  confidence: "explicit" | "inferred";
}

export interface ExtractedRelationship {
  source: string;
  target: string;
  label:  string;
}

export interface ExtractedThread {
  description: string;
  status:      "open" | "resolved";
  is_new:      boolean;
}

export interface ExtractedInconsistency {
  entity:      string;
  attribute:   string;
  established: string;
  found:       string;
  quote:       string;
}

export interface ExtractionResult {
  entities:         ExtractedEntity[];
  relationships:    ExtractedRelationship[];
  threads:          ExtractedThread[];
  inconsistencies:  ExtractedInconsistency[];
}

interface ExistingEntity {
  id:         string;
  name:       string;
  type:       string;
  attributes: Record<string, unknown>;
}

interface ExistingThread {
  id:                       string;
  description:              string;
  status:                   string;
  last_seen_chapter_number: number;
}

// ── Compact summary (context sent to AI) ─────────────────────────────────────

/**
 * Converts existing entities + threads into a compact string (~20 tokens/entity).
 * This is the "what we already know" context given to the extraction model.
 *
 * Example output:
 *   Characters: Kira[eye_color=blue,orphan=true], Marcus[rank=guard]
 *   Locations: The_Hollow[type=forest,cursed=true]
 *   Threads: [1]Brass_key_mystery(open,ch3) [2]Kira_father(open,ch1)
 */
export function buildEntitySummary(
  entities: ExistingEntity[],
  threads:  ExistingThread[]
): string {
  if (entities.length === 0 && threads.length === 0) {
    return "EMPTY — this is the first extraction for this project.";
  }

  // ── Name registry (first line — model must copy these exactly) ──────────────
  // Listed prominently so the model uses the canonical name, not a variant.
  const nameRegistry = entities.map((e) => `"${e.name}"`).join(", ");
  const registryLine = `REGISTERED NAMES (copy exactly for is_update=true): ${nameRegistry}`;

  // ── Compact per-type summary ─────────────────────────────────────────────────
  const byType: Record<string, string[]> = {};

  for (const e of entities) {
    const attrs = Object.entries(e.attributes ?? {})
      .slice(0, 10)
      .map(([k, v]) => `${k}=${String(v).slice(0, 30)}`)
      .join(",");
    const entry = `${e.name.replace(/\s+/g, "_")}[${attrs}]`;
    byType[e.type] = [...(byType[e.type] ?? []), entry];
  }

  const lines: string[] = [
    registryLine,
    ...Object.entries(byType).map(
      ([type, items]) =>
        `${type.charAt(0).toUpperCase() + type.slice(1)}s: ${items.join(", ")}`
    ),
  ];

  if (threads.length > 0) {
    const threadStr = threads
      .map(
        (t, i) =>
          `[${i + 1}]${t.description.replace(/\s+/g, "_").slice(0, 40)}(${t.status},ch${t.last_seen_chapter_number})`
      )
      .join(" ");
    lines.push(`OpenThreads: ${threadStr}`);
  }

  return lines.join("\n");
}

// ── Prompt builder ────────────────────────────────────────────────────────────

export function buildExtractionPrompt(
  deltaText:       string,
  existingSummary: string
): string {
  return `EXISTING KNOWLEDGE GRAPH:
${existingSummary}

MANUSCRIPT TEXT:
"""
${deltaText.trim().split(/\s+/).slice(0, 5000).join(" ")}
"""

You are building a knowledge graph for a long-running fiction story. Read the ENTIRE text above, then output ONLY valid JSON — no markdown, no explanation.

OUTPUT FORMAT:
{
  "entities": [{ "name": "ExactName", "type": "character|location|faction|item|event|lore", "is_update": false, "attributes": { "key": "value" }, "confidence": "explicit|inferred" }],
  "relationships": [{ "source": "Name", "target": "Name", "label": "short verb phrase" }],
  "threads": [{ "description": "one clear sentence", "status": "open|resolved", "is_new": true }],
  "inconsistencies": [{ "entity": "Name", "attribute": "key", "established": "old value", "found": "new value", "quote": "exact short quote" }]
}

━━━ STEP 1: NAMED CHARACTERS (mandatory — do this first) ━━━
Scan the full text. Every person referred to by a proper name MUST become a character entity.
Not finding a named character is the worst possible error — it is always better to include a minor character than to skip them.

PHYSICAL APPEARANCE — capture ALL of these that are mentioned (these are REQUIRED if present in the text):
  hair_color, eye_color, skin_tone, build, height, distinctive_features, age

CHARACTER PROFILE — capture if significant:
  abilities, aliases, role, origin (2-3 words)

MAX 15 attributes per character. Physical appearance attributes are NEVER optional — if the text mentions a hair colour, eye colour, or any physical trait, it MUST be captured.
DO NOT capture: emotions, expressions, reactions, mood, what they said or did in this scene.

BODY-SWAP / TRANSMIGRATION / POSSESSION: If a character's soul, mind, or consciousness has entered another person's body, they are ONE entity — not two. Use the name that other characters call them (the body's name). Store the original identity as an alias attribute. Example: a soul named "[Soul]" waking in "[Body]"s body → one entity named "[Body]" with aliases="[Soul]".

━━━ STEP 2: NAMED LOCATIONS (only these — not rooms) ━━━
Named estates, cities, towns, schools, regions, or significant magical places only.
NEVER extract individual rooms (bedroom, wardrobe, kitchen, balcony) — they are part of a location, not separate entities.
Attributes: type (manor/city/school), region, notable_feature.

━━━ STEP 3: PLOT-CRITICAL ITEMS ONLY ━━━
Only unique magical artifacts, weapons, or objects that are central to the plot and will recur.
NEVER extract: furniture (beds, tables, chairs), mirrors, clothing, glasses, everyday objects, room contents.

━━━ ENTITY RULES ━━━
- MAX 8 entities total. Fill slots: characters first → locations → items → other.
- is_update: Set to true ONLY if that exact name already appears in EXISTING KNOWLEDGE GRAPH above.
  If EXISTING KNOWLEDGE GRAPH says "EMPTY" → every entity gets is_update=false, no exceptions.
  Common mistake to avoid: if you are extracting a character for the first time, is_update MUST be false even if they are a main character.
- ALIAS DEDUPLICATION: Same person with different names = one entity using the primary name with others as aliases attribute.
- MAX 15 attributes per character entity. MAX 6 attributes for non-character entities. Attribute values MAX 6 words. Keys in snake_case.

━━━ RELATIONSHIP RULES (MAX 6) ━━━
CAPTURE permanent bonds: family ties (aunt of, younger sister of, adoptive father of), social roles (best friend of, mentor of, arch-enemy of), power dynamics (guardian of, leader of).
SKIP: spatial relations (room contains table, estate has balcony), single-scene actions, emotional reactions, anything not true 50 chapters later.

━━━ THREAD RULES (MAX 4) ━━━
One sentence per unresolved plot element that will drive future chapters. Skip scene-level observations.

━━━ INCONSISTENCY RULES ━━━
Only flag direct contradictions of established facts from the knowledge graph that appear to be author errors. Never flag intentional character changes.`;
}

// ── Response parser ───────────────────────────────────────────────────────────

export function parseExtractionResponse(raw: string): ExtractionResult | null {
  try {
    // Extract the JSON object between the first { and last }
    // This handles markdown fences, preamble text, and trailing commentary
    const start = raw.indexOf("{");
    const end   = raw.lastIndexOf("}");

    if (start === -1 || end === -1 || end <= start) return null;

    const parsed = JSON.parse(raw.slice(start, end + 1));

    return {
      entities:        Array.isArray(parsed.entities)        ? parsed.entities        : [],
      relationships:   Array.isArray(parsed.relationships)   ? parsed.relationships   : [],
      threads:         Array.isArray(parsed.threads)         ? parsed.threads         : [],
      inconsistencies: Array.isArray(parsed.inconsistencies) ? parsed.inconsistencies : [],
    };
  } catch {
    return null;
  }
}

// ── Diff + merge engine ───────────────────────────────────────────────────────

/**
 * Merges extraction results into the Supabase knowledge graph.
 * - New entities → INSERT
 * - Updated entities → PATCH attributes (merge, not replace)
 * - New relationships → UPSERT
 * - New threads → INSERT; existing threads → UPDATE last_seen
 * - Inconsistencies → INSERT into inconsistency_flags
 *
 * Returns the list of inconsistency flags created (for the co-author queue).
 */
// ── Name lookup helpers ───────────────────────────────────────────────────────

/**
 * Build the name→id map including registered aliases so that
 * "Petunia Dursley" resolves to the same entity as "Petunia".
 */
function buildNameMap(entities: ExistingEntity[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const e of entities) {
    map.set(e.name.toLowerCase().trim(), e.id);

    // Also register any aliases stored in attributes
    const aliasRaw = String((e.attributes as Record<string, unknown>)?.aliases ?? "");
    for (const alias of aliasRaw.split(",").map((a) => a.trim().toLowerCase()).filter((a) => a.length >= 3)) {
      map.set(alias, e.id);
    }
  }
  return map;
}

// Common honorifics/titles to strip before name comparison — generic across all fiction genres
const TITLES = new Set([
  "mr", "mrs", "ms", "miss", "dr", "prof", "professor",
  "lord", "lady", "sir", "dame", "master", "mistress",
  "captain", "general", "colonel", "sergeant", "officer",
  "king", "queen", "prince", "princess", "duke", "duchess",
  "elder", "healer", "auror", "wizard", "witch",
  "the", "a", "an",
]);

/** Strip titles and return significant tokens (4+ chars, not a title). */
function significantTokens(name: string): string[] {
  return name
    .toLowerCase()
    .trim()
    .split(/[\s_-]+/)
    .filter((t) => t.length >= 4 && !TITLES.has(t));
}

/**
 * Look up an entity ID with a three-step fuzzy fallback:
 * 1. Exact match (case-insensitive, after normalising underscores/hyphens to spaces)
 * 2. First-significant-token match — "Petunia Dursley" ↔ "Petunia"
 * 3. Any shared significant token — catches "Dumbledore" ↔ "Albus Dumbledore"
 * All steps are story-agnostic string operations.
 */
function lookupId(name: string, map: Map<string, string>): string | undefined {
  const key = name.toLowerCase().trim().replace(/[_-]/g, " ");

  // 1. Exact
  if (map.has(key)) return map.get(key)!;

  const incomingTokens = significantTokens(name);
  if (incomingTokens.length === 0) return undefined;

  const firstToken = incomingTokens[0];

  let firstTokenMatch: string | undefined;
  let sharedTokenMatch: string | undefined;

  for (const [existing, id] of map) {
    const existingTokens = significantTokens(existing);
    if (existingTokens.length === 0) continue;

    // 2. First-significant-token match (highest confidence fuzzy match)
    if (!firstTokenMatch && existingTokens[0] === firstToken) {
      firstTokenMatch = id;
    }

    // 3. Any shared significant token (lower confidence — only use if nothing better found)
    if (!sharedTokenMatch && existingTokens.some((t) => incomingTokens.includes(t))) {
      sharedTokenMatch = id;
    }
  }

  return firstTokenMatch ?? sharedTokenMatch;
}

export async function mergeExtractionIntoGraph(
  projectId:       string,
  chapterId:       string,
  chapterNumber:   number,
  result:          ExtractionResult,
  existingEntities: ExistingEntity[],
  client:          SupabaseClient
): Promise<ExtractedInconsistency[]> {
  // Use existId as the sole authority — model's is_update flag is unreliable
  const nameToId      = buildNameMap(existingEntities);
  const existingCount = existingEntities.length;

  // ── Entities ────────────────────────────────────────────────
  for (let i = 0; i < result.entities.length; i++) {
    const e       = result.entities[i];
    const existId = lookupId(e.name, nameToId);

    if (existId) {
      // Entity already exists — always merge new attributes, never duplicate
      if (Object.keys(e.attributes).length > 0) {
        await client.rpc("merge_entity_attributes", {
          p_entity_id: existId,
          p_attributes: e.attributes,
        });
      }
      await client
        .from("entities")
        .update({ last_seen_word: chapterNumber, confidence: e.confidence })
        .eq("id", existId);
    } else {
      // New entity — assign a reasonable initial canvas position
      const angle  = (i / Math.max(result.entities.length, 1)) * 2 * Math.PI;
      const radius = 220 + Math.floor((existingCount + i) / 8) * 160;
      const pos    = {
        x: Math.round(500 + radius * Math.cos(angle)),
        y: Math.round(400 + radius * Math.sin(angle)),
      };

      const { data: inserted } = await client
        .from("entities")
        .insert({
          project_id:             projectId,
          name:                   e.name,
          type:                   e.type,
          attributes:             e.attributes,
          confidence:             e.confidence,
          position:               pos,
          first_seen_chapter_id:  chapterId,
          last_seen_word:         chapterNumber,
        })
        .select("id")
        .single();

      if (inserted) nameToId.set(e.name.toLowerCase(), inserted.id);
    }
  }

  // ── Relationships ────────────────────────────────────────────
  for (const rel of result.relationships) {
    const sourceId = lookupId(rel.source, nameToId);
    const targetId = lookupId(rel.target, nameToId);
    if (!sourceId || !targetId || sourceId === targetId) continue;

    // Avoid duplicates — check if this relationship already exists
    const { data: existing } = await client
      .from("relationships")
      .select("id")
      .eq("project_id", projectId)
      .eq("source_id", sourceId)
      .eq("target_id", targetId)
      .maybeSingle();

    if (!existing) {
      await client.from("relationships").insert({
        project_id: projectId,
        source_id:  sourceId,
        target_id:  targetId,
        label:      rel.label,
      });
    }
  }

  // ── Plot threads ─────────────────────────────────────────────
  for (const thread of result.threads) {
    if (thread.is_new) {
      await client.from("plot_threads").insert({
        project_id:                  projectId,
        description:                 thread.description,
        introduced_chapter_id:       chapterId,
        introduced_chapter_number:   chapterNumber,
        last_seen_chapter_id:        chapterId,
        last_seen_chapter_number:    chapterNumber,
        status:                      thread.status,
      });
    } else {
      // Update last_seen on existing thread (fuzzy match by partial description)
      await client
        .from("plot_threads")
        .update({
          last_seen_chapter_id:     chapterId,
          last_seen_chapter_number: chapterNumber,
          status:                   thread.status,
        })
        .eq("project_id", projectId)
        .ilike("description", `%${thread.description.slice(0, 20)}%`);
    }
  }

  // ── Inconsistencies ──────────────────────────────────────────
  const flagsCreated: ExtractedInconsistency[] = [];

  for (const inc of result.inconsistencies) {
    const entityId = nameToId.get(inc.entity.toLowerCase());

    await client.from("inconsistency_flags").insert({
      project_id:        projectId,
      entity_id:         entityId ?? null,
      entity_name:       inc.entity,
      attribute:         inc.attribute,
      established_value: inc.established,
      found_value:       inc.found,
      context_quote:     inc.quote,
      chapter_id:        chapterId,
      status:            "pending",
    });

    flagsCreated.push(inc);
  }

  return flagsCreated;
}
