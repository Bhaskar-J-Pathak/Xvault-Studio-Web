/**
 * POST /api/ai/worldboard/dedup
 * Merge duplicate entities within a project using fuzzy name matching.
 * Body: { projectId }
 * Returns: { merged: number, deletedIds: string[] }
 */

import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";

// ── Fuzzy name matching ───────────────────────────────────────────────────────

const TITLES = new Set([
  "mr","mrs","ms","miss","dr","prof","lord","lady","sir","the","a","an",
]);

function significantTokens(name: string): string[] {
  return name
    .toLowerCase().trim().split(/[\s_-]+/)
    .filter((t) => t.length >= 3 && !TITLES.has(t));
}

/**
 * Two names match if they are identical (case-insensitive) OR share the same
 * first significant token — e.g. "Michael" ↔ "Michael Gray", "Keya" ↔ "Keya".
 */
function namesMatch(a: string, b: string): boolean {
  const ka = a.toLowerCase().trim();
  const kb = b.toLowerCase().trim();
  if (ka === kb) return true;
  const tokA = significantTokens(a);
  const tokB = significantTokens(b);
  if (tokA.length === 0 || tokB.length === 0) return false;
  return tokA[0] === tokB[0];
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { projectId?: string };
  const { projectId } = body;
  if (!projectId) return Response.json({ error: "Missing projectId" }, { status: 400 });

  // Verify ownership
  const { data: project } = await supabase
    .from("projects").select("id").eq("id", projectId).eq("user_id", user.id).single();
  if (!project) return Response.json({ error: "Not found" }, { status: 404 });

  // Fetch all entities for this project
  const { data: entities, error: fetchError } = await supabase
    .from("entities")
    .select("id, name, type, attributes")
    .eq("project_id", projectId);

  if (fetchError) {
    console.error("[dedup] fetch error:", fetchError);
    return Response.json({ error: fetchError.message }, { status: 500 });
  }
  if (!entities || entities.length === 0) {
    return Response.json({ merged: 0, deletedIds: [] });
  }

  type Entity = { id: string; name: string; type: string; attributes: Record<string, unknown> };
  const rows = entities as Entity[];

  // Group by fuzzy name match — greedy, first matching group wins
  const groups: Entity[][] = [];
  for (const e of rows) {
    let matched = false;
    for (const group of groups) {
      if (namesMatch(e.name, group[0].name)) {
        group.push(e);
        matched = true;
        break;
      }
    }
    if (!matched) groups.push([e]);
  }

  let merged   = 0;
  const deletedIds: string[] = [];

  for (const group of groups) {
    if (group.length <= 1) continue;

    // Keep the entity with the longest name as primary (e.g. "Michael Gray" > "Michael")
    group.sort((a, b) => b.name.length - a.name.length);
    const primary = group[0];
    const dupes   = group.slice(1);

    // Merge attributes: fill in missing keys from duplicates into primary
    const mergedAttrs = { ...primary.attributes };
    for (const dup of dupes) {
      for (const [k, v] of Object.entries(dup.attributes ?? {})) {
        if (!(k in mergedAttrs)) mergedAttrs[k] = v;
      }
    }

    const { error: attrErr } = await supabase
      .from("entities")
      .update({ attributes: mergedAttrs })
      .eq("id", primary.id);

    if (attrErr) {
      console.error("[dedup] failed to update primary attributes:", attrErr);
      continue;
    }

    for (const dup of dupes) {
      // Redirect relationships: source
      await supabase
        .from("relationships")
        .update({ source_id: primary.id })
        .eq("source_id", dup.id);

      // Redirect relationships: target
      await supabase
        .from("relationships")
        .update({ target_id: primary.id })
        .eq("target_id", dup.id);

      // Remove self-loops created by the redirect
      await supabase
        .from("relationships")
        .delete()
        .eq("source_id", primary.id)
        .eq("target_id", primary.id);

      // Delete the duplicate entity
      const { error: delErr } = await supabase
        .from("entities")
        .delete()
        .eq("id", dup.id);

      if (delErr) {
        console.error(`[dedup] failed to delete entity ${dup.id} (${dup.name}):`, delErr);
      } else {
        deletedIds.push(dup.id);
        merged++;
      }
    }
  }

  console.log(`[dedup] project=${projectId} merged=${merged} deletedIds=${deletedIds.join(",")}`);
  return Response.json({ merged, deletedIds });
}
