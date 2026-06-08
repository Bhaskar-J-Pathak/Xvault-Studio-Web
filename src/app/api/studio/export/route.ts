/**
 * GET /api/studio/export?projectId=...
 * Returns the full manuscript as a plain-text (.txt) file download.
 */

import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";
import { lexicalToText } from "@/lib/chunking";

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const projectId = request.nextUrl.searchParams.get("projectId");
  if (!projectId) return Response.json({ error: "Missing projectId" }, { status: 400 });

  // Verify ownership
  const { data: project } = await supabase
    .from("projects")
    .select("id, title")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();
  if (!project) return Response.json({ error: "Not found" }, { status: 404 });

  // Fetch all chapters ordered by position
  const { data: chapters } = await supabase
    .from("chapters")
    .select("id, title, position, content")
    .eq("project_id", projectId)
    .order("position", { ascending: true });

  if (!chapters || chapters.length === 0) {
    return new Response("No content yet.", {
      headers: {
        "Content-Type":        "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${sanitizeFilename(project.title)}.txt"`,
      },
    });
  }

  const parts: string[] = [];

  // Title header
  parts.push(project.title.toUpperCase());
  parts.push("═".repeat(Math.min(project.title.length, 60)));
  parts.push("");

  for (const chapter of chapters) {
    const text = chapter.content
      ? lexicalToText(chapter.content as Record<string, unknown>)
      : "";

    parts.push(`CHAPTER ${chapter.position + 1}: ${chapter.title}`);
    parts.push("─".repeat(40));
    parts.push("");
    if (text.trim()) {
      parts.push(text.trim());
    } else {
      parts.push("[Empty chapter]");
    }
    parts.push("");
    parts.push("");
  }

  const body = parts.join("\n");
  const filename = sanitizeFilename(project.title);

  return new Response(body, {
    headers: {
      "Content-Type":        "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.txt"`,
    },
  });
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9\s\-_]/g, "").trim().replace(/\s+/g, "_") || "manuscript";
}
