/**
 * POST /api/studio/import/confirm
 * Creates a new project and its chapters from the parsed import data.
 *
 * Body: { title, genre?, chapters: { title, body }[] }
 * Returns: { projectId: string }
 */

import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";
import { textToLexical } from "../route";

interface ChapterInput {
  title: string;
  body:  string;
}

export async function POST(request: NextRequest) {
  if (process.env.BETA_MODE === "true") {
    return Response.json({ error: "Import is not available during the beta." }, { status: 403 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: { title: string; genre?: string; chapters: ChapterInput[] };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { title, genre, chapters } = body;
  if (!title?.trim() || !chapters?.length) {
    return Response.json({ error: "Missing title or chapters" }, { status: 400 });
  }

  // Create the project
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      title:   title.trim(),
      genre:   genre ?? null,
    })
    .select("id")
    .single();

  if (projectError || !project) {
    return Response.json({ error: projectError?.message ?? "Failed to create project" }, { status: 500 });
  }

  // Create chapters
  const chapterRows = chapters.map((ch, i) => ({
    project_id: project.id,
    title:      ch.title,
    position:   i,
    content:    textToLexical(ch.body),
    word_count: ch.body.split(/\s+/).filter(Boolean).length,
  }));

  const { error: chapError } = await supabase.from("chapters").insert(chapterRows);
  if (chapError) {
    // Clean up the created project if chapters fail
    await supabase.from("projects").delete().eq("id", project.id);
    return Response.json({ error: chapError.message }, { status: 500 });
  }

  return Response.json({ projectId: project.id });
}
