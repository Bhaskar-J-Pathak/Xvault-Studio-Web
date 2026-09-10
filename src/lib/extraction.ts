/**
 * World Board extraction utilities — server-side only.
 *
 * Cost strategy:
 * - Only the delta text (new words since last extraction) is sent to the AI.
 * - Existing entities are summarised in a compact ~200-token format, not full JSON.
 * - Production extraction currently uses Gemini 2.5 Pro through Vertex AI.
 * - Each extraction chunk counts against the user's AI credit allowance.
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
  description:           string;
  status:                "open" | "resolved";
  is_new:                boolean;
  existing_thread_index?: number | null;
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
          `[${i + 1}]${JSON.stringify(t.description.replace(/\s+/g, " ").slice(0, 160))}(${t.status},ch${t.last_seen_chapter_number})`
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
  "threads": [{ "description": "one clear sentence", "status": "open|resolved", "is_new": true, "existing_thread_index": null }],
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
NEVER extract: vehicles, watches, luxury brands, furniture (beds, tables, chairs), mirrors, clothing, glasses, everyday objects, room contents, or possessions mentioned only to characterize wealth/status.

━━━ ENTITY RULES ━━━
- MAX 12 entities total. Fill slots: characters first → locations → factions → plot-critical items → other.
- is_update: Set to true ONLY if that exact name already appears in EXISTING KNOWLEDGE GRAPH above.
  If EXISTING KNOWLEDGE GRAPH says "EMPTY" → every entity gets is_update=false, no exceptions.
  Common mistake to avoid: if you are extracting a character for the first time, is_update MUST be false even if they are a main character.
- ALIAS DEDUPLICATION: Same person with different names = one entity using the primary name with others as aliases attribute.
- MAX 15 attributes per character entity. MAX 6 attributes for non-character entities. Attribute values MAX 6 words. Keys in snake_case.

━━━ RELATIONSHIP RULES (MAX 10) ━━━
CAPTURE permanent bonds: family ties (aunt of, younger sister of, adoptive father of), social roles (best friend of, mentor of, arch-enemy of), power dynamics (guardian of, leader of).
Labels are predicates placed between source and target. Write "mother of", not "is mother of"; "guardian of", not "is guardian of".
Every source and target MUST use the exact name of an entity in the entity list above or the REGISTERED NAMES list. Never invent a relationship endpoint that is absent from both lists.
Do not emit both directions of the same bond. For example, choose either "Azoth | husband of | Nyx" or "Nyx | wife of | Azoth", never both.
SKIP: spatial relations (room contains table, estate has balcony), single-scene actions, emotional reactions, anything not true 50 chapters later.

━━━ THREAD RULES (MAX 4) ━━━
One sentence per unresolved plot element that will drive future chapters. Skip scene-level observations.
Compare every thread against OpenThreads in the existing graph. If it continues or resolves an existing thread, copy that existing description exactly, set is_new=false, and set existing_thread_index to its [number]. For a genuinely new thread, set is_new=true and existing_thread_index=null.

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

    const parsed = JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
    const objectArray = (value: unknown): Record<string, unknown>[] =>
      Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object") : [];
    const text = (value: unknown, max = 500): string => typeof value === "string" ? value.trim().slice(0, max) : "";
    const entityTypes = new Set(["character", "location", "faction", "item", "event", "lore"]);

    const entities: ExtractedEntity[] = objectArray(parsed.entities).slice(0, 12).flatMap((item) => {
      const name = text(item.name, 120);
      const type = text(item.type, 20);
      if (!name || !entityTypes.has(type)) return [];
      const rawAttributes = item.attributes && typeof item.attributes === "object" && !Array.isArray(item.attributes)
        ? item.attributes as Record<string, unknown>
        : {};
      const attributeLimit = type === "character" ? 15 : 6;
      const attributes = Object.fromEntries(Object.entries(rawAttributes).slice(0, attributeLimit).flatMap(([key, value]) => {
        const cleanKey = key.trim().replace(/[^a-z0-9_]/gi, "_").toLowerCase().slice(0, 50);
        const cleanValue = typeof value === "string" || typeof value === "number" || typeof value === "boolean"
          ? text(String(value), 160)
          : "";
        return cleanKey && cleanValue ? [[cleanKey, cleanValue]] : [];
      }));
      return [{
        name,
        type: type as ExtractedEntity["type"],
        is_update: item.is_update === true,
        attributes,
        confidence: item.confidence === "explicit" ? "explicit" : "inferred",
      }];
    });

    const relationships: ExtractedRelationship[] = objectArray(parsed.relationships).slice(0, 10).flatMap((item) => {
      const source = text(item.source, 120);
      const target = text(item.target, 120);
      const label = text(item.label, 80);
      return source && target && label ? [{ source, target, label }] : [];
    });

    const threads: ExtractedThread[] = objectArray(parsed.threads).slice(0, 4).flatMap((item) => {
      const description = text(item.description, 500);
      if (!description) return [];
      const existingIndex = Number(item.existing_thread_index);
      return [{
        description,
        status: item.status === "resolved" ? "resolved" : "open",
        is_new: item.is_new !== false,
        existing_thread_index: Number.isInteger(existingIndex) && existingIndex > 0 ? existingIndex : null,
      }];
    });

    const inconsistencies: ExtractedInconsistency[] = objectArray(parsed.inconsistencies).slice(0, 10).flatMap((item) => {
      const entity = text(item.entity, 120);
      const attribute = text(item.attribute, 80);
      const established = text(item.established, 200);
      const found = text(item.found, 200);
      if (!entity || !attribute || !established || !found) return [];
      return [{ entity, attribute, established, found, quote: text(item.quote, 300) }];
    });

    return {
      entities,
      relationships,
      threads,
      inconsistencies,
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

interface NameEntry { name: string; id: string }

/** Build canonical-name and alias entries without collapsing ambiguous names. */
function buildNameEntries(entities: ExistingEntity[]): NameEntry[] {
  const entries: NameEntry[] = [];
  for (const entity of entities) {
    entries.push({ name: entity.name, id: entity.id });
    const aliasRaw = String((entity.attributes as Record<string, unknown>)?.aliases ?? "");
    for (const alias of aliasRaw.split(",").map((value) => value.trim()).filter((value) => value.length >= 3)) {
      entries.push({ name: alias, id: entity.id });
    }
  }
  return entries;
}

// Common honorifics/titles to strip before name comparison — generic across all fiction genres
const TITLES = new Set([
  "mr", "mrs", "ms", "miss", "dr", "prof", "professor",
  "lord", "lady", "sir", "dame", "master", "mistress",
  "captain", "general", "colonel", "sergeant", "officer",
  "king", "queen", "emperor", "empress", "prince", "princess", "duke", "duchess",
  "count", "countess", "baron", "baroness",
  "elder", "healer", "auror", "wizard", "witch",
  "the", "a", "an",
]);

/** Strip titles and return significant tokens (3+ chars, not a title). */
function significantTokens(name: string): string[] {
  return name
    .toLowerCase()
    .trim()
    .replace(/[’']s\b/gi, "")
    .replace(/[’']/g, "")
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3 && !TITLES.has(t));
}

function normalizedFullName(name: string): string {
  return name.toLowerCase().replace(/[’']s\b/gi, "").replace(/[’']/g, "").split(/[^a-z0-9]+/).filter(Boolean).join(" ");
}

function startsWithTitle(name: string): boolean {
  const first = name.toLowerCase().split(/[^a-z0-9]+/).find(Boolean);
  return Boolean(first && TITLES.has(first));
}

/**
 * Resolve an entity without ever guessing from one shared word between two
 * multi-word names. That old fallback turned "Black Cloaked Figures" into
 * "Black Obsidian Ring" and persisted a corrupt relationship.
 */
function lookupId(name: string, entries: NameEntry[]): string | undefined {
  const fullKey = normalizedFullName(name);
  if (!fullKey) return undefined;

  const exactIds = new Set(entries
    .filter((entry) => normalizedFullName(entry.name) === fullKey)
    .map((entry) => entry.id));
  if (exactIds.size === 1) return [...exactIds][0];
  if (exactIds.size > 1) return undefined;

  const incomingTokens = significantTokens(name);
  if (incomingTokens.length === 0) return undefined;
  const incomingIsBareSingle = incomingTokens.length === 1 && !startsWithTitle(name);
  const candidateIds = new Set<string>();
  for (const entry of entries) {
    const existingTokens = significantTokens(entry.name);
    if (existingTokens.length === 0) continue;
    const shared = existingTokens.filter((token) => incomingTokens.includes(token));
    const existingIsBareSingle = existingTokens.length === 1 && !startsWithTitle(entry.name);
    const oneSideIsSingleToken = incomingIsBareSingle || existingIsBareSingle;
    const strongMultiwordMatch = shared.length >= 2;
    if ((oneSideIsSingleToken && shared.length === 1) || strongMultiwordMatch) candidateIds.add(entry.id);
  }
  return candidateIds.size === 1 ? [...candidateIds][0] : undefined;
}

/** Pure wrapper used by regression tests and diagnostics. */
export function resolveEntityId(
  name: string,
  entities: Array<{ id: string; name: string; attributes?: Record<string, unknown> }>
): string | undefined {
  return lookupId(name, buildNameEntries(entities as ExistingEntity[]));
}

const THREAD_STOP_WORDS = new Set([
  "about", "after", "again", "against", "being", "from", "have", "into", "must", "their",
  "there", "they", "this", "through", "while", "will", "with", "that", "the", "and", "for",
]);

function threadTokens(description: string): Set<string> {
  return new Set(significantTokens(description).filter((token) => !THREAD_STOP_WORDS.has(token)));
}

function threadSimilarity(left: string, right: string): number {
  const a = threadTokens(left);
  const b = threadTokens(right);
  if (a.size === 0 || b.size === 0) return 0;
  const shared = [...a].filter((token) => b.has(token)).length;
  const union = new Set([...a, ...b]).size;
  const jaccard = shared / union;
  const containment = shared / Math.min(a.size, b.size);
  return Math.max(jaccard, containment * 0.8);
}

/** Return a unique, high-confidence matching thread index, or -1. */
export function findMatchingThreadIndex(
  description: string,
  threads: Array<{ description: string }>
): number {
  const ranked = threads
    .map((thread, index) => ({ index, score: threadSimilarity(description, thread.description) }))
    .sort((a, b) => b.score - a.score);
  if (!ranked.length || ranked[0].score < 0.48) return -1;
  if (ranked[1] && ranked[0].score - ranked[1].score < 0.08) return -1;
  return ranked[0].index;
}

function cleanRelationshipLabel(label: string): string {
  return label.trim().replace(/^(?:is|are|was|were)\s+/i, "").slice(0, 80);
}

const TRANSIENT_RELATIONSHIP = /^(?:attacked?|attracted to|captured?|connected by|fought|injured|killed|met|passenger of|resents?|resides? in|visited|entered|left|saw|spoke|talked|gave|handed|inhabits?|inhabited by|contains?|located in|warned|wears?)\b/i;

/** World Board edges describe durable bonds, not scene actions or containment. */
export function isPersistentRelationshipLabel(label: string): boolean {
  const cleaned = cleanRelationshipLabel(label);
  return Boolean(cleaned) && !TRANSIENT_RELATIONSHIP.test(cleaned);
}

export async function mergeExtractionIntoGraph(
  projectId:       string,
  chapterId:       string,
  chapterNumber:   number,
  result:          ExtractionResult,
  existingEntities: ExistingEntity[],
  client:          SupabaseClient,
  existingThreads: ExistingThread[] = []
): Promise<ExtractedInconsistency[]> {
  const throwIfError = (error: { message: string } | null, operation: string) => {
    if (error) throw new Error(`${operation}: ${error.message}`);
  };
  // Use existId as the sole authority — model's is_update flag is unreliable
  const nameEntries = buildNameEntries(existingEntities);

  // ── Layout tracking: 2×3 zone grid matching world-board-canvas.tsx ──────────
  const ZONE_ORIGINS: Record<string, { x: number; y: number }> = {
    character: { x:  80, y:   80 },
    location:  { x: 960, y:   80 },
    faction:   { x:  80, y:  560 },
    item:      { x: 960, y:  560 },
    event:     { x:  80, y: 1040 },
    lore:      { x: 960, y: 1040 },
  };
  const ZONE_COLS    = 4;
  const ZONE_COL_GAP = 210;
  const ZONE_ROW_GAP = 170;

  const typeCountForLayout: Record<string, number> = {};
  for (const ex of existingEntities) {
    typeCountForLayout[ex.type] = (typeCountForLayout[ex.type] ?? 0) + 1;
  }

  // ── Entities ────────────────────────────────────────────────
  for (const e of result.entities) {
    const existId = lookupId(e.name, nameEntries);

    if (existId) {
      nameEntries.push({ name: e.name, id: existId });
      // Entity already exists — always merge new attributes, never duplicate
      if (Object.keys(e.attributes).length > 0) {
        const { error } = await client.rpc("merge_entity_attributes", {
          p_entity_id: existId,
          p_attributes: e.attributes,
        });
        throwIfError(error, "Could not update entity attributes");
      }
      const { error } = await client
        .from("entities")
        .update({ last_seen_word: chapterNumber, confidence: e.confidence })
        .eq("id", existId);
      throwIfError(error, "Could not update entity");
    } else {
      // DB safety check: prevent concurrent-extraction duplicates
      const { data: dbDupe, error: dupeError } = await client
        .from("entities")
        .select("id")
        .eq("project_id", projectId)
        .ilike("name", e.name)
        .maybeSingle();
      throwIfError(dupeError, "Could not check for duplicate entity");

      if (dbDupe) {
        if (Object.keys(e.attributes).length > 0) {
          const { error } = await client.rpc("merge_entity_attributes", {
            p_entity_id: dbDupe.id,
            p_attributes: e.attributes,
          });
          throwIfError(error, "Could not update duplicate entity attributes");
        }
        nameEntries.push({ name: e.name, id: dbDupe.id });
        continue;
      }

      // New entity — place in type's canvas zone (matches world-board-canvas layout)
      const origin = ZONE_ORIGINS[e.type] ?? ZONE_ORIGINS.lore;
      const i      = typeCountForLayout[e.type] ?? 0;
      typeCountForLayout[e.type] = i + 1;
      const pos = {
        x: origin.x + (i % ZONE_COLS) * ZONE_COL_GAP,
        y: origin.y + Math.floor(i / ZONE_COLS) * ZONE_ROW_GAP,
      };

      const { data: inserted, error: insertError } = await client
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
      throwIfError(insertError, `Could not create entity "${e.name}"`);

      if (!inserted) throw new Error(`Could not create entity "${e.name}"`);
      nameEntries.push({ name: e.name, id: inserted.id });
      const aliases = String(e.attributes?.aliases ?? "").split(",").map((value) => value.trim()).filter(Boolean);
      for (const alias of aliases) nameEntries.push({ name: alias, id: inserted.id });
    }
  }

  // ── Relationships ────────────────────────────────────────────
  for (const rel of result.relationships) {
    const sourceId = lookupId(rel.source, nameEntries);
    const targetId = lookupId(rel.target, nameEntries);
    const label = cleanRelationshipLabel(rel.label);
    if (!sourceId || !targetId || sourceId === targetId || !isPersistentRelationshipLabel(label)) {
      console.warn(`[worldboard] Skipped unresolved relationship: ${rel.source} | ${rel.label} | ${rel.target}`);
      continue;
    }

    // Avoid duplicates — check if this relationship already exists
    const { data: existing, error: relationshipLookupError } = await client
      .from("relationships")
      .select("id")
      .eq("project_id", projectId)
      .eq("source_id", sourceId)
      .eq("target_id", targetId)
      .maybeSingle();
    throwIfError(relationshipLookupError, "Could not check for duplicate relationship");

    if (!existing) {
      const { error } = await client.from("relationships").insert({
        project_id: projectId,
        source_id:  sourceId,
        target_id:  targetId,
        label,
      });
      throwIfError(error, `Could not create relationship "${label}"`);
    }
  }

  // ── Plot threads ─────────────────────────────────────────────
  const knownThreads = [...existingThreads];
  const insertedThreadDescriptions: string[] = [];
  for (const thread of result.threads) {
    const requestedIndex = Number(thread.existing_thread_index);
    const indexedMatch = thread.is_new === false && Number.isInteger(requestedIndex) &&
      requestedIndex >= 1 &&
      requestedIndex <= knownThreads.length &&
      threadSimilarity(thread.description, knownThreads[requestedIndex - 1].description) >= 0.35
      ? requestedIndex - 1
      : -1;
    const similarMatch = findMatchingThreadIndex(thread.description, knownThreads);
    const matchIndex = indexedMatch >= 0 ? indexedMatch : similarMatch;

    if (matchIndex >= 0) {
      const matched = knownThreads[matchIndex];
      const { error } = await client
        .from("plot_threads")
        .update({
          last_seen_chapter_id:     chapterId,
          last_seen_chapter_number: chapterNumber,
          status:                   thread.status,
        })
        .eq("id", matched.id)
        .eq("project_id", projectId);
      throwIfError(error, "Could not update plot thread");
      matched.status = thread.status;
      matched.last_seen_chapter_number = chapterNumber;
    } else {
      if (findMatchingThreadIndex(thread.description, insertedThreadDescriptions.map((description) => ({ description }))) >= 0) {
        continue;
      }
      const { error } = await client.from("plot_threads").insert({
        project_id:                  projectId,
        description:                 thread.description,
        introduced_chapter_id:       chapterId,
        introduced_chapter_number:   chapterNumber,
        last_seen_chapter_id:        chapterId,
        last_seen_chapter_number:    chapterNumber,
        status:                      thread.status,
      });
      throwIfError(error, "Could not create plot thread");
      insertedThreadDescriptions.push(thread.description);
    }
  }

  // ── Inconsistencies ──────────────────────────────────────────
  const flagsCreated: ExtractedInconsistency[] = [];

  for (const inc of result.inconsistencies) {
    // A first extraction has no established facts to contradict. Also refuse
    // to attach a flag to an entity the existing graph cannot identify.
    if (existingEntities.length === 0) continue;
    const entityId = lookupId(inc.entity, buildNameEntries(existingEntities));
    if (!entityId) continue;

    const { error } = await client.from("inconsistency_flags").insert({
      project_id:        projectId,
      entity_id:         entityId,
      entity_name:       inc.entity,
      attribute:         inc.attribute,
      established_value: inc.established,
      found_value:       inc.found,
      context_quote:     inc.quote,
      chapter_id:        chapterId,
      status:            "pending",
    });
    throwIfError(error, "Could not create inconsistency flag");

    flagsCreated.push(inc);
  }

  return flagsCreated;
}
