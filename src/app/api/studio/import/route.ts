/**
 * POST /api/studio/import
 * Parses an uploaded .txt or .docx file and returns detected chapters as a preview.
 * Does NOT save anything to the database.
 *
 * Body: FormData — field "file" (.txt or .docx)
 * Returns: { title: string; chapters: { title: string; wordCount: number }[] }
 */

import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";

// ── Chapter pattern for .txt ──────────────────────────────────────────────────

const CHAPTER_LINE = /^(chapter\s+[\w\d]+|part\s+[\w\d]+|book\s+[\w\d]+|prologue|epilogue|interlude|preface|foreword|afterword|appendix)(\s*[:\-–—]?\s*.*)?$/i;

export interface ParsedChapter {
  title:   string;
  body:    string; // plain text
  words:   number;
}

// ── Text → Lexical JSON ───────────────────────────────────────────────────────

export function textToLexical(text: string): Record<string, unknown> {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.replace(/\n/g, " ").trim())
    .filter((p) => p.length > 0);

  if (paragraphs.length === 0) paragraphs.push("");

  return {
    root: {
      type:      "root",
      version:   1,
      format:    "",
      indent:    0,
      direction: "ltr",
      children:  paragraphs.map((p) => ({
        type:      "paragraph",
        version:   1,
        format:    "",
        indent:    0,
        direction: "ltr",
        children:  [
          {
            type:   "text",
            text:   p,
            version: 1,
            format:  0,
            mode:    "normal",
            style:   "",
            detail:  0,
          },
        ],
      })),
    },
  };
}

// ── Detect chapters from plain text ──────────────────────────────────────────

function detectChapters(text: string): ParsedChapter[] {
  const lines   = text.split("\n");
  const results: ParsedChapter[] = [];

  let currentTitle   = "";
  let currentLines:  string[] = [];

  function flush() {
    const body = currentLines.join("\n").trim();
    if (!body) return;
    results.push({
      title: currentTitle || `Chapter ${results.length + 1}`,
      body,
      words: body.split(/\s+/).filter(Boolean).length,
    });
    currentLines = [];
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (CHAPTER_LINE.test(trimmed) && trimmed.length <= 120) {
      flush();
      currentTitle = trimmed || `Chapter ${results.length + 1}`;
    } else {
      currentLines.push(line);
    }
  }
  flush();

  // If nothing was detected, treat the whole file as one chapter
  if (results.length === 0) {
    const body = text.trim();
    if (body) {
      results.push({
        title: "Chapter 1",
        body,
        words: body.split(/\s+/).filter(Boolean).length,
      });
    }
  }

  return results;
}

// ── Parse .docx via HTML (handles Heading 1/2 as chapter breaks) ──────────────

async function parseDocx(buffer: Buffer): Promise<string> {
  // Dynamic import to keep bundle size manageable
  const mammoth = (await import("mammoth")).default;

  // Use HTML conversion so we can detect headings
  const { value: html } = await mammoth.convertToHtml({ buffer });

  // Split on <h1> and <h2> tags — use them as chapter headings
  // Then strip all remaining HTML tags from body text
  const normalized = html
    // Replace block-level elements with newlines
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<h[1-6][^>]*>/gi, "\n__HEADING__")
    .replace(/<br\s*\/?>/gi, "\n")
    // Strip remaining tags
    .replace(/<[^>]+>/g, "")
    // Decode basic HTML entities
    .replace(/&amp;/g,  "&")
    .replace(/&lt;/g,   "<")
    .replace(/&gt;/g,   ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g,  "'")
    .replace(/&nbsp;/g, " ")
    .trim();

  // Re-assemble: convert __HEADING__ markers back to chapter-detectable lines
  return normalized.replace(/__HEADING__/g, "");
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext || !["txt", "docx"].includes(ext)) {
    return Response.json({ error: "Only .txt and .docx files are supported" }, { status: 400 });
  }

  // Size guard: 10 MB max
  if (file.size > 10 * 1024 * 1024) {
    return Response.json({ error: "File too large (max 10 MB)" }, { status: 400 });
  }

  let plainText: string;

  try {
    if (ext === "txt") {
      plainText = await file.text();
    } else {
      const buffer = Buffer.from(await file.arrayBuffer());
      plainText = await parseDocx(buffer);
    }
  } catch (err) {
    console.error("Import parse error:", err);
    return Response.json({ error: "Failed to read file. Make sure it is a valid .txt or .docx." }, { status: 422 });
  }

  const chapters = detectChapters(plainText);

  if (chapters.length === 0) {
    return Response.json({ error: "The file appears to be empty." }, { status: 422 });
  }

  // Derive a suggested project title from filename (strip extension)
  const suggestedTitle = file.name
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim() || "Imported Manuscript";

  return Response.json({
    suggestedTitle,
    chapters: chapters.map((c) => ({ title: c.title, words: c.words, body: c.body })),
  });
}
