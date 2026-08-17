/**
 * POST /api/studio/share
 *
 * Creates a public share link for a chapter excerpt.
 * Reads the saved chapter content from DB, converts to plain text,
 * and generates a unique token.
 *
 * Body: { projectId, chapterId, excerptTitle?, authorDisplayName? }
 * Returns: { token, url }
 */

import { NextRequest } from "next/server";
import { createServerSupabaseClient, createServiceClient } from "@/lib/auth";
import { lexicalToText } from "@/lib/chunking";

function generateToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes).map((b) => chars[b % chars.length]).join("");
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    projectId: string;
    chapterId: string;
    excerptTitle?: string;
    authorDisplayName?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { projectId, chapterId, excerptTitle, authorDisplayName } = body;
  if (!projectId || !chapterId) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  // Verify ownership and fetch chapter + project in parallel
  const [{ data: chapter }, { data: project }] = await Promise.all([
    supabase
      .from("chapters")
      .select("id, title, content, word_count, position, project_id")
      .eq("id", chapterId)
      .eq("project_id", projectId)
      .single(),
    supabase
      .from("projects")
      .select("id, title, user_id")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single(),
  ]);

  if (!project) return Response.json({ error: "Not found" }, { status: 404 });
  if (!chapter) return Response.json({ error: "Chapter not found" }, { status: 404 });

  // Convert Lexical JSON to plain text
  const plainText = lexicalToText(chapter.content as Record<string, unknown>);
  if (!plainText.trim()) {
    return Response.json({ error: "Chapter has no content to share" }, { status: 400 });
  }

  const token = generateToken();
  const title = excerptTitle?.trim() ||
    `Chapter ${(chapter.position ?? 0) + 1} · ${chapter.title}`;

  const service = createServiceClient();
  const { error } = await service.from("shared_excerpts").insert({
    token,
    project_id:          projectId,
    chapter_id:          chapterId,
    excerpt_title:       title,
    novel_title:         project.title,
    author_display_name: authorDisplayName?.trim() || null,
    content:             plainText,
    word_count:          chapter.word_count ?? plainText.split(/\s+/).length,
    created_by:          user.id,
  });

  if (error) {
    console.error("[share] Insert failed:", error);
    return Response.json({ error: "Failed to create share" }, { status: 500 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://xvault.dev";
  const url = `${baseUrl}/share/${token}`;

  return Response.json({ ok: true, token, url });
}
