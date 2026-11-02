/**
 * World Board extraction utilities — server-side only.
 *
 * Cost strategy:
 * - Only the delta text (new words since last extraction) is sent to the AI.
 * - Existing entities are summarised in a compact format with prior chapter summaries.
 * - Each extraction chunk counts against the user's AI credit allowance.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ExtractedEntity {
  name: string;
  type: "character" | "location" | "faction" | "item" | "event" | "lore";
  is_update: boolean;
  attributes: Record<string, string>;
  confidence: "explicit" | "inferred";
}

export interface ExtractedRelationship {
  source: string;
  target: string;
  label: string;
}

export interface ExtractedThread {
  description: string;
  status: "open" | "resolved";
  is_new: boolean;
  existing_thread_index?: number | null;
}

export interface ExtractedInconsistency {
  id?: string;
  entity: string;
  attribute: string;
  established: string;
  found: string;
  quote: string;
}

export interface ExtractedContinuityIssue {
  character: string;
  issue: string;
  severity: "notice" | "warning";
  quote?: string;
}

export interface ExtractionResult {
  entities: ExtractedEntity[];
  relationships: ExtractedRelationship[];
  threads: ExtractedThread[];
  inconsistencies: ExtractedInconsistency[];
  continuity_issues?: ExtractedContinuityIssue[];
  coauthor_continuity_note?: string | null;
}

export interface WorldBoardAttributeChange {
  key: string;
  from: string | null;
  to: string;
}

export interface WorldBoardChangeSet {
  addedEntities: Array<{
    id: string;
    name: string;
    type: string;
    attributes: Record<string, string>;
  }>;
  updatedEntities: Array<{
    id: string;
    name: string;
    attributes: WorldBoardAttributeChange[];
  }>;
  addedRelationships: Array<{
    sourceId: string;
    targetId: string;
    source: string;
    target: string;
    label: string;
  }>;
  addedThreads: Array<{ description: string; status: string }>;
  updatedThreads: Array<{ description: string; from: string; to: string }>;
  inconsistencies: ExtractedInconsistency[];
}

export interface WorldBoardMergeResult {
  inconsistencies: ExtractedInconsistency[];
  changes: WorldBoardChangeSet;
}

export function hasWorldBoardChanges(changes: WorldBoardChangeSet): boolean {
  return (
    changes.addedEntities.length > 0 ||
    changes.updatedEntities.length > 0 ||
    changes.addedRelationships.length > 0 ||
    changes.addedThreads.length > 0 ||
    changes.updatedThreads.length > 0 ||
    changes.inconsistencies.length > 0
  );
}

export interface ExistingEntity {
  id: string;
  name: string;
  type: string;
  attributes: Record<string, unknown>;
}

export interface ExistingThread {
  id: string;
  description: string;
  status: string;
  last_seen_chapter_number: number;
}

export interface ExistingRelationship {
  source: string;
  target: string;
  label: string;
}

// ── Typo & Distance Helpers ───────────────────────────────────────────────────

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  const s1 = a.toLowerCase().trim();
  const s2 = b.toLowerCase().trim();

  for (let i = 0; i <= s1.length; i++) matrix[i] = [i];
  for (let j = 0; j <= s2.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }
  return matrix[s1.length][s2.length];
}

export function isLikelyTypo(established: string, found: string): boolean {
  const s1 = established.trim().toLowerCase();
  const s2 = found.trim().toLowerCase();

  if (s1 === s2) return true;

  const dist = levenshteinDistance(s1, s2);
  const minLength = Math.min(s1.length, s2.length);

  if (dist === 1 && minLength >= 4) return true;
  if (dist === 2 && minLength >= 7) return true;

  return false;
}

// ── Compact summary (context sent to AI) ─────────────────────────────────────

export function buildEntitySummary(
  entities: ExistingEntity[],
  threads: ExistingThread[],
  relationships: ExistingRelationship[] = [],
  priorChapterSummaries: string = "",
): string {
  if (entities.length === 0 && threads.length === 0 && !priorChapterSummaries) {
    return "EMPTY — this is the first extraction for this project.";
  }

  const nameRegistry = entities.map((e) => `"${e.name}"`).join(", ");
  const registryLine = `REGISTERED NAMES (copy exactly for is_update=true): ${nameRegistry || "None yet"}`;

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
        `${type.charAt(0).toUpperCase() + type.slice(1)}s: ${items.join(", ")}`,
    ),
  ];

  if (relationships.length > 0) {
    const relStr = relationships
      .slice(0, 20)
      .map((r) => `${r.source} (${r.label}) ${r.target}`)
      .join(" | ");
    lines.push(`KnownRelationships: ${relStr}`);
  }

  if (threads.length > 0) {
    const threadStr = threads
      .map(
        (t, i) =>
          `[${i + 1}]${JSON.stringify(t.description.replace(/\s+/g, " ").slice(0, 160))}(${t.status},ch${t.last_seen_chapter_number})`,
      )
      .join(" ");
    lines.push(`OpenThreads: ${threadStr}`);
  }

  if (priorChapterSummaries.trim()) {
    lines.push(`\nPRIOR ESTABLISHED STORY EVENTS & TIMELINE:\n${priorChapterSummaries.trim()}`);
  }

  return lines.join("\n");
}

// ── Prompt builder ────────────────────────────────────────────────────────────

export function buildExtractionPrompt(
  deltaText: string,
  existingSummary: string,
): string {
  return `EXISTING KNOWLEDGE GRAPH & STORY MEMORY:
${existingSummary}

CURRENT CHAPTER TEXT:
"""
${deltaText.trim().split(/\s+/).slice(0, 5000).join(" ")}
"""

You are Alex, an insightful fiction co-author and manuscript continuity specialist. Read the ENTIRE text above, analyze it against the knowledge graph, prior chapter events, and internal scene logic. Output valid JSON only.

OUTPUT FORMAT:
{
  "entities": [{ "name": "ExactName", "type": "character|location|faction|item|event|lore", "is_update": false, "attributes": { "key": "value" }, "confidence": "explicit|inferred" }],
  "relationships": [{ "source": "Name", "target": "Name", "label": "short verb phrase" }],
  "threads": [{ "description": "one clear sentence", "status": "open|resolved", "is_new": true, "existing_thread_index": null }],
  "inconsistencies": [{ "entity": "Name", "attribute": "key", "established": "old value", "found": "new value", "quote": "exact short quote" }],
  "coauthor_continuity_note": "A natural, conversational critique note from Alex to the author pointing out continuity and blocking breaks, or null if consistent."
}

━━━ 1. HARD INCONSISTENCY RULES (FOR WORLD BOARD AUDIT) ━━━
Flag direct physical or factual attribute contradictions (e.g. eye color was blue, now red; left hand severed, now right hand).
DO NOT flag typos, spelling variants ("greeen" vs "green"), synonyms, or additive details ("captain" vs "captain of the guard").

━━━ 2. DEEP NARRATIVE CONTINUITY AUDIT (FOR ALEX'S CONVERSATION NOTE) ━━━
Carefully review the scene for logical and spatial breaks:
1. SPATIAL & BLOCKING: A character being in two places at once (e.g., standing by the doorway watching the scene, then moments later opening the front door arriving home), or impossible physical positions.
2. AWARENESS & RECOGNITION: A character acting like they don't know someone they have already met or have significant history with in prior chapters.
3. SITUATIONAL DISCONNECT & CONFLICTING ACTIONS: A character talking about someone being gone/upstairs when that person is sitting right next to them holding their hand; emergency panic evaporating into casual chit-chat with no transition.
4. TIMELINE DISRUPTIONS: Events happening out of chronological order without a flashback marker.

HOW TO WRITE "coauthor_continuity_note":
- Speak naturally as 'Alex' — like a trusted, attentive friend and beta reader giving honest feedback.
- Synthesize all continuity/blocking problems into ONE cohesive, friendly, and direct observation.
- Cite the contradictory moments directly.
- Keep it constructive and warm. If there are no narrative continuity errors, output null.

━━━ 3. STANDARD ENTITY EXTRACTION RULES ━━━
- Scan full text for all named characters. Physical appearance traits (hair_color, eye_color, build, height, age) are mandatory if present.
- Relationships: durable, lasting bonds only. Skip one-scene transient actions.
- Threads: significant unresolved plot questions.`;
}

// ── Response parser ───────────────────────────────────────────────────────────

export function parseExtractionResponse(raw: string): ExtractionResult | null {
  try {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");

    if (start === -1 || end === -1 || end <= start) return null;

    const parsed = JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
    const objectArray = (value: unknown): Record<string, unknown>[] =>
      Array.isArray(value)
        ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
        : [];
    const text = (value: unknown, max = 500): string =>
      typeof value === "string" ? value.trim().slice(0, max) : "";
    const entityTypes = new Set(["character", "location", "faction", "item", "event", "lore"]);

    const entities: ExtractedEntity[] = objectArray(parsed.entities)
      .slice(0, 12)
      .flatMap((item) => {
        const name = text(item.name, 120);
        const type = text(item.type, 20);
        if (!name || !entityTypes.has(type)) return [];
        const rawAttributes =
          item.attributes && typeof item.attributes === "object" && !Array.isArray(item.attributes)
            ? (item.attributes as Record<string, unknown>)
            : {};
        const attributeLimit = type === "character" ? 15 : 6;
        const attributes = Object.fromEntries(
          Object.entries(rawAttributes)
            .slice(0, attributeLimit)
            .flatMap(([key, value]) => {
              const cleanKey = key.trim().replace(/[^a-z0-9_]/gi, "_").toLowerCase().slice(0, 50);
              const cleanValue =
                typeof value === "string" || typeof value === "number" || typeof value === "boolean"
                  ? text(String(value), 160)
                  : "";
              return cleanKey && cleanValue ? [[cleanKey, cleanValue]] : [];
            }),
        );
        return [
          {
            name,
            type: type as ExtractedEntity["type"],
            is_update: item.is_update === true,
            attributes,
            confidence: item.confidence === "explicit" ? "explicit" : "inferred",
          },
        ];
      });

    const relationships: ExtractedRelationship[] = objectArray(parsed.relationships)
      .slice(0, 10)
      .flatMap((item) => {
        const source = text(item.source, 120);
        const target = text(item.target, 120);
        const label = text(item.label, 80);
        return source && target && label ? [{ source, target, label }] : [];
      });

    const threads: ExtractedThread[] = objectArray(parsed.threads)
      .slice(0, 4)
      .flatMap((item) => {
        const description = text(item.description, 500);
        if (!description) return [];
        const existingIndex = Number(item.existing_thread_index);
        return [
          {
            description,
            status: item.status === "resolved" ? "resolved" : "open",
            is_new: item.is_new !== false,
            existing_thread_index:
              Number.isInteger(existingIndex) && existingIndex > 0 ? existingIndex : null,
          },
        ];
      });

    const inconsistencies: ExtractedInconsistency[] = objectArray(parsed.inconsistencies)
      .slice(0, 10)
      .flatMap((item) => {
        const entity = text(item.entity, 120);
        const attribute = text(item.attribute, 80);
        const established = text(item.established, 200);
        const found = text(item.found, 200);
        if (!entity || !attribute || !established || !found) return [];
        return [
          {
            entity,
            attribute,
            established,
            found,
            quote: text(item.quote, 300),
          },
        ];
      });

    const coauthor_continuity_note =
      typeof parsed.coauthor_continuity_note === "string" &&
      parsed.coauthor_continuity_note.trim().length > 15
        ? parsed.coauthor_continuity_note.trim()
        : null;

    return {
      entities,
      relationships,
      threads,
      inconsistencies,
      coauthor_continuity_note,
    };
  } catch {
    return null;
  }
}

// ── Diff + merge engine ───────────────────────────────────────────────────────

interface NameEntry {
  name: string;
  id: string;
}

function buildNameEntries(entities: ExistingEntity[]): NameEntry[] {
  const entries: NameEntry[] = [];
  for (const entity of entities) {
    entries.push({ name: entity.name, id: entity.id });
    const aliasRaw = String((entity.attributes as Record<string, unknown>)?.aliases ?? "");
    for (const alias of aliasRaw
      .split(",")
      .map((value) => value.trim())
      .filter((value) => value.length >= 3)) {
      entries.push({ name: alias, id: entity.id });
    }
  }
  return entries;
}

const TITLES = new Set([
  "mr", "mrs", "ms", "miss", "dr", "prof", "professor",
  "lord", "lady", "sir", "dame", "master", "mistress",
  "captain", "general", "colonel", "sergeant", "officer",
  "king", "queen", "emperor", "empress", "prince", "princess",
  "duke", "duchess", "count", "countess", "baron", "baroness",
  "the", "a", "an",
]);

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
  return name
    .toLowerCase()
    .replace(/[’']s\b/gi, "")
    .replace(/[’']/g, "")
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .join(" ");
}

function isCompatibleExpansion(attribute: string, established: string, found: string): boolean {
  const additiveFields = new Set(["role", "aliases"]);
  if (!additiveFields.has(attribute.toLowerCase())) return false;
  const oldValue = normalizedFullName(established);
  const newValue = normalizedFullName(found);
  return Boolean(oldValue && newValue && (newValue.includes(oldValue) || oldValue.includes(newValue)));
}

function isSameFact(established: string, found: string): boolean {
  return normalizedFullName(established) === normalizedFullName(found);
}

function startsWithTitle(name: string): boolean {
  const first = name.toLowerCase().split(/[^a-z0-9]+/).find(Boolean);
  return Boolean(first && TITLES.has(first));
}

function lookupId(name: string, entries: NameEntry[]): string | undefined {
  const fullKey = normalizedFullName(name);
  if (!fullKey) return undefined;

  const exactIds = new Set(
    entries
      .filter((entry) => normalizedFullName(entry.name) === fullKey)
      .map((entry) => entry.id),
  );
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
    if ((oneSideIsSingleToken && shared.length === 1) || strongMultiwordMatch) {
      candidateIds.add(entry.id);
    }
  }
  return candidateIds.size === 1 ? [...candidateIds][0] : undefined;
}

export function resolveEntityId(
  name: string,
  entities: Array<{ id: string; name: string; attributes?: Record<string, unknown> }>,
): string | undefined {
  return lookupId(name, buildNameEntries(entities as ExistingEntity[]));
}

const THREAD_STOP_WORDS = new Set([
  "about", "after", "again", "against", "being", "from", "have", "into", "must", "their",
  "there", "they", "this", "through", "while", "will", "with", "that", "the", "and", "for",
]);

function threadTokens(description: string): Set<string> {
  return new Set(
    significantTokens(description).filter((token) => !THREAD_STOP_WORDS.has(token)),
  );
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

export function findMatchingThreadIndex(
  description: string,
  threads: Array<{ description: string }>,
): number {
  const ranked = threads
    .map((thread, index) => ({
      index,
      score: threadSimilarity(description, thread.description),
    }))
    .sort((a, b) => b.score - a.score);
  if (!ranked.length || ranked[0].score < 0.48) return -1;
  if (ranked[1] && ranked[0].score - ranked[1].score < 0.08) return -1;
  return ranked[0].index;
}

function cleanRelationshipLabel(label: string): string {
  return label.trim().replace(/^(?:is|are|was|were)\s+/i, "").slice(0, 80);
}

const TRANSIENT_RELATIONSHIP =
  /^(?:attacked?|attracted to|captured?|connected by|fought|injured|killed|met|passenger of|resents?|resides? in|visited|entered|left|saw|spoke|talked|gave|handed|inhabits?|inhabited by|contains?|located in|warned|wears?)\b/i;

export function isPersistentRelationshipLabel(label: string): boolean {
  const cleaned = cleanRelationshipLabel(label);
  return Boolean(cleaned) && !TRANSIENT_RELATIONSHIP.test(cleaned);
}

export async function mergeExtractionIntoGraph(
  projectId: string,
  chapterId: string,
  chapterNumber: number,
  result: ExtractionResult,
  existingEntities: ExistingEntity[],
  client: SupabaseClient,
  existingThreads: ExistingThread[] = [],
): Promise<WorldBoardMergeResult> {
  const throwIfError = (error: { message: string } | null, operation: string) => {
    if (error) throw new Error(`${operation}: ${error.message}`);
  };

  const nameEntries = buildNameEntries(existingEntities);
  const changes: WorldBoardChangeSet = {
    addedEntities: [],
    updatedEntities: [],
    addedRelationships: [],
    addedThreads: [],
    updatedThreads: [],
    inconsistencies: [],
  };

  result.inconsistencies = result.inconsistencies.filter(
    (inc) =>
      !isSameFact(inc.established, inc.found) &&
      !isCompatibleExpansion(inc.attribute, inc.established, inc.found) &&
      !isLikelyTypo(inc.established, inc.found),
  );

  const ZONE_ORIGINS: Record<string, { x: number; y: number }> = {
    character: { x: 80, y: 80 },
    location: { x: 960, y: 80 },
    faction: { x: 80, y: 560 },
    item: { x: 960, y: 560 },
    event: { x: 80, y: 1040 },
    lore: { x: 960, y: 1040 },
  };
  const ZONE_COLS = 4;
  const ZONE_COL_GAP = 210;
  const ZONE_ROW_GAP = 170;

  const typeCountForLayout: Record<string, number> = {};
  for (const ex of existingEntities) {
    typeCountForLayout[ex.type] = (typeCountForLayout[ex.type] ?? 0) + 1;
  }

  const getConflictKeysFor = (entityName: string) => {
    return new Set(
      result.inconsistencies
        .filter(
          (inc) =>
            normalizedFullName(inc.entity) === normalizedFullName(entityName) ||
            significantTokens(inc.entity).some((t) =>
              significantTokens(entityName).includes(t),
            ),
        )
        .map((inc) => inc.attribute.toLowerCase()),
    );
  };

  // ── Entities ────────────────────────────────────────────────
  for (const e of result.entities) {
    let existId = lookupId(e.name, nameEntries);
    let existingEntity = existingEntities.find((entity) => entity.id === existId);

    if (!existId) {
      const { data: dbDupe, error: dupeError } = await client
        .from("entities")
        .select("id, name, attributes")
        .eq("project_id", projectId)
        .ilike("name", e.name)
        .maybeSingle();
      throwIfError(dupeError, "Could not check for duplicate entity");

      if (dbDupe) {
        existId = dbDupe.id;
        existingEntity = {
          id: dbDupe.id,
          name: dbDupe.name,
          type: e.type,
          attributes: (dbDupe.attributes as Record<string, unknown>) ?? {},
        };
      }
    }

    if (existId) {
      nameEntries.push({ name: e.name, id: existId });

      const alreadyFlagged = getConflictKeysFor(e.name);
      const physicalColorFields = new Set([
        "eye_color", "eye_colour", "hair_color", "hair_colour", "skin_tone", "hand",
      ]);
      const automaticFlags =
        e.type === "character"
          ? Object.entries(e.attributes).flatMap(([key, value]) => {
              const previous = existingEntity?.attributes?.[key];
              if (
                previous == null ||
                isSameFact(String(previous), value) ||
                isLikelyTypo(String(previous), value) ||
                alreadyFlagged.has(key.toLowerCase()) ||
                isCompatibleExpansion(key, String(previous), value)
              ) {
                return [];
              }
              if (e.confidence !== "explicit" && !physicalColorFields.has(key.toLowerCase())) {
                return [];
              }
              return [
                {
                  entity: e.name,
                  attribute: key,
                  established: String(previous),
                  found: value,
                  quote: "",
                },
              ];
            })
          : [];

      result.inconsistencies.push(...automaticFlags);

      const allFlaggedAttributes = new Set([
        ...alreadyFlagged,
        ...automaticFlags.map((flag) => flag.attribute.toLowerCase()),
      ]);

      const safeAttributes = Object.fromEntries(
        Object.entries(e.attributes).filter(
          ([key]) => !allFlaggedAttributes.has(key.toLowerCase()),
        ),
      );

      const attributeChanges = Object.entries(safeAttributes).flatMap(([key, value]) => {
        const previous = existingEntity?.attributes?.[key];
        return isSameFact(String(previous ?? ""), String(value))
          ? []
          : [
              {
                key,
                from: previous == null ? null : String(previous),
                to: String(value),
              },
            ];
      });

      if (Object.keys(safeAttributes).length > 0) {
        const { error } = await client.rpc("merge_entity_attributes", {
          p_entity_id: existId,
          p_attributes: safeAttributes,
        });
        throwIfError(error, "Could not update entity attributes");
      }

      const { error } = await client
        .from("entities")
        .update({ last_seen_word: chapterNumber, confidence: e.confidence })
        .eq("id", existId);
      throwIfError(error, "Could not update entity");

      if (attributeChanges.length > 0) {
        changes.updatedEntities.push({
          id: existId,
          name: existingEntity?.name ?? e.name,
          attributes: attributeChanges,
        });
      }
    } else {
      const origin = ZONE_ORIGINS[e.type] ?? ZONE_ORIGINS.lore;
      const i = typeCountForLayout[e.type] ?? 0;
      typeCountForLayout[e.type] = i + 1;
      const pos = {
        x: origin.x + (i % ZONE_COLS) * ZONE_COL_GAP,
        y: origin.y + Math.floor(i / ZONE_COLS) * ZONE_ROW_GAP,
      };

      const { data: inserted, error: insertError } = await client
        .from("entities")
        .insert({
          project_id: projectId,
          name: e.name,
          type: e.type,
          attributes: e.attributes,
          confidence: e.confidence,
          position: pos,
          first_seen_chapter_id: chapterId,
          last_seen_word: chapterNumber,
        })
        .select("id")
        .single();
      throwIfError(insertError, `Could not create entity "${e.name}"`);

      if (!inserted) throw new Error(`Could not create entity "${e.name}"`);
      changes.addedEntities.push({
        id: inserted.id,
        name: e.name,
        type: e.type,
        attributes: e.attributes,
      });
      nameEntries.push({ name: e.name, id: inserted.id });
      const aliases = String(e.attributes?.aliases ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      for (const alias of aliases) {
        nameEntries.push({ name: alias, id: inserted.id });
      }
    }
  }

  // ── Relationships ────────────────────────────────────────────
  for (const rel of result.relationships) {
    const sourceId = lookupId(rel.source, nameEntries);
    const targetId = lookupId(rel.target, nameEntries);
    const label = cleanRelationshipLabel(rel.label);
    if (!sourceId || !targetId || sourceId === targetId || !isPersistentRelationshipLabel(label)) {
      continue;
    }

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
        source_id: sourceId,
        target_id: targetId,
        label,
      });
      throwIfError(error, `Could not create relationship "${label}"`);
      changes.addedRelationships.push({
        sourceId,
        targetId,
        source: rel.source,
        target: rel.target,
        label,
      });
    }
  }

  // ── Plot threads ─────────────────────────────────────────────
  const knownThreads = [...existingThreads];
  const insertedThreadDescriptions: string[] = [];
  for (const thread of result.threads) {
    const requestedIndex = Number(thread.existing_thread_index);
    const indexedMatch =
      thread.is_new === false &&
      Number.isInteger(requestedIndex) &&
      requestedIndex >= 1 &&
      requestedIndex <= knownThreads.length &&
      threadSimilarity(thread.description, knownThreads[requestedIndex - 1].description) >= 0.35
        ? requestedIndex - 1
        : -1;
    const similarMatch = findMatchingThreadIndex(thread.description, knownThreads);
    const matchIndex = indexedMatch >= 0 ? indexedMatch : similarMatch;

    if (matchIndex >= 0) {
      const matched = knownThreads[matchIndex];
      const previousStatus = matched.status;
      const { error } = await client
        .from("plot_threads")
        .update({
          last_seen_chapter_id: chapterId,
          last_seen_chapter_number: chapterNumber,
          status: thread.status,
        })
        .eq("id", matched.id)
        .eq("project_id", projectId);
      throwIfError(error, "Could not update plot thread");
      matched.status = thread.status;
      matched.last_seen_chapter_number = chapterNumber;
      if (previousStatus !== thread.status) {
        changes.updatedThreads.push({
          description: matched.description,
          from: previousStatus,
          to: thread.status,
        });
      }
    } else {
      if (
        findMatchingThreadIndex(
          thread.description,
          insertedThreadDescriptions.map((description) => ({ description })),
        ) >= 0
      ) {
        continue;
      }
      const { error } = await client.from("plot_threads").insert({
        project_id: projectId,
        description: thread.description,
        introduced_chapter_id: chapterId,
        introduced_chapter_number: chapterNumber,
        last_seen_chapter_id: chapterId,
        last_seen_chapter_number: chapterNumber,
        status: thread.status,
      });
      throwIfError(error, "Could not create plot thread");
      insertedThreadDescriptions.push(thread.description);
      changes.addedThreads.push({
        description: thread.description,
        status: thread.status,
      });
    }
  }

  // ── Inconsistencies ──────────────────────────────────────────
  const flagsCreated: ExtractedInconsistency[] = [];

  for (const inc of result.inconsistencies) {
    if (
      isSameFact(inc.established, inc.found) ||
      isCompatibleExpansion(inc.attribute, inc.established, inc.found)
    ) {
      continue;
    }

    let entityId = lookupId(inc.entity, nameEntries);
    if (!entityId) {
      const { data: dbEntity } = await client
        .from("entities")
        .select("id")
        .eq("project_id", projectId)
        .ilike("name", `%${inc.entity.trim()}%`)
        .maybeSingle();
      if (dbEntity) entityId = dbEntity.id;
    }

    changes.inconsistencies.push(inc);

    if (entityId) {
      const { data: flag, error } = await client
        .from("inconsistency_flags")
        .insert({
          project_id: projectId,
          entity_id: entityId,
          entity_name: inc.entity,
          attribute: inc.attribute,
          established_value: inc.established,
          found_value: inc.found,
          context_quote: inc.quote,
          chapter_id: chapterId,
          status: "pending",
        })
        .select("id")
        .maybeSingle();

      if (!error && flag) {
        flagsCreated.push({ ...inc, id: flag.id });
      }
    }
  }

  return { inconsistencies: flagsCreated, changes };
}