/**
 * GET /api/studio/export?projectId=...&format=txt|docx|epub|pdf
 *
 * Exports the full manuscript in the requested format.
 * Defaults to txt if format is omitted.
 */

import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";
import { lexicalToText, lexicalToParagraphs } from "@/lib/chunking";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChapterRow {
  id: string;
  title: string;
  position: number;
  content: Record<string, unknown> | null;
}

interface ChapterData {
  title: string;
  position: number;
  paragraphs: string[];
  text: string;
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const projectId = request.nextUrl.searchParams.get("projectId");
  const format    = (request.nextUrl.searchParams.get("format") ?? "txt").toLowerCase();

  if (!projectId) return Response.json({ error: "Missing projectId" }, { status: 400 });
  if (!["txt", "docx", "epub", "pdf"].includes(format)) {
    return Response.json({ error: "Invalid format" }, { status: 400 });
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id, title")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();
  if (!project) return Response.json({ error: "Not found" }, { status: 404 });

  const { data: raw } = await supabase
    .from("chapters")
    .select("id, title, position, content")
    .eq("project_id", projectId)
    .order("position", { ascending: true });

  const chapters: ChapterData[] = (raw ?? []).map((ch: ChapterRow) => ({
    title:      ch.title,
    position:   ch.position,
    paragraphs: ch.content ? lexicalToParagraphs(ch.content) : [],
    text:       ch.content ? lexicalToText(ch.content) : "",
  }));

  const filename = sanitizeFilename(project.title);

  if (format === "txt") return exportTxt(project.title, chapters, filename);
  if (format === "docx") return exportDocx(project.title, chapters, filename);
  if (format === "epub") return exportEpub(project.title, chapters, filename);
  if (format === "pdf")  return exportPdf(project.title, chapters, filename);

  return Response.json({ error: "Unknown format" }, { status: 400 });
}

// ── TXT ───────────────────────────────────────────────────────────────────────

function exportTxt(title: string, chapters: ChapterData[], filename: string): Response {
  const parts: string[] = [
    title.toUpperCase(),
    "═".repeat(Math.min(title.length, 60)),
    "",
  ];

  for (const ch of chapters) {
    parts.push(`CHAPTER ${ch.position + 1}: ${ch.title}`);
    parts.push("─".repeat(40));
    parts.push("");
    parts.push(ch.text.trim() || "[Empty chapter]");
    parts.push("", "");
  }

  return new Response(parts.join("\n"), {
    headers: {
      "Content-Type":        "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.txt"`,
    },
  });
}

// ── DOCX ──────────────────────────────────────────────────────────────────────

async function exportDocx(title: string, chapters: ChapterData[], filename: string): Promise<Response> {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak } = await import("docx");

  const children: InstanceType<typeof Paragraph>[] = [];

  // Title page
  children.push(
    new Paragraph({
      children: [new TextRun({ text: title, bold: true, size: 56 })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 2400, after: 400 },
    })
  );

  for (let i = 0; i < chapters.length; i++) {
    const ch = chapters[i];

    // Page break before each chapter (except maybe first)
    if (i > 0) {
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }

    // Chapter heading
    children.push(
      new Paragraph({
        text:    `Chapter ${ch.position + 1}: ${ch.title}`,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 480, after: 240 },
      })
    );

    // Body paragraphs
    if (ch.paragraphs.length > 0) {
      for (const para of ch.paragraphs) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: para, size: 24 })],
            spacing:  { after: 160, line: 360 },
            indent:   { firstLine: 720 },
          })
        );
      }
    } else {
      children.push(new Paragraph({ children: [new TextRun({ text: "[Empty chapter]", color: "999999", italics: true })] }));
    }
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run:       { font: "Georgia", size: 24 },
          paragraph: { spacing: { line: 360 } },
        },
      },
    },
    sections: [{ children }],
  });

  const nodeBuffer = await Packer.toBuffer(doc);
  const ab = nodeBuffer.buffer.slice(nodeBuffer.byteOffset, nodeBuffer.byteOffset + nodeBuffer.byteLength);

  return new Response(ab as ArrayBuffer, {
    headers: {
      "Content-Type":        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}.docx"`,
    },
  });
}

// ── EPUB ──────────────────────────────────────────────────────────────────────

async function exportEpub(title: string, chapters: ChapterData[], filename: string): Promise<Response> {
  const JSZip = (await import("jszip")).default;
  const zip   = new JSZip();

  // mimetype MUST be first and uncompressed
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

  // META-INF
  zip.file("META-INF/container.xml", `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`);

  // Manifest items and spine itemrefs
  const manifestItems = [
    `<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`,
    `<item id="styles" href="styles.css" media-type="text/css"/>`,
  ];
  const spineItems: string[] = [];

  const chapterFiles: { id: string; href: string; title: string }[] = [];

  for (let i = 0; i < chapters.length; i++) {
    const ch     = chapters[i];
    const id     = `chapter_${String(i + 1).padStart(3, "0")}`;
    const href   = `${id}.xhtml`;
    const label  = `Chapter ${ch.position + 1}: ${ch.title}`;

    chapterFiles.push({ id, href, title: label });
    manifestItems.push(`<item id="${id}" href="${href}" media-type="application/xhtml+xml"/>`);
    spineItems.push(`<itemref idref="${id}"/>`);

    const bodyParagraphs = ch.paragraphs.length > 0
      ? ch.paragraphs.map((p) => `    <p>${escapeXml(p)}</p>`).join("\n")
      : `    <p><em>[Empty chapter]</em></p>`;

    zip.file(`OEBPS/${href}`, `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${escapeXml(label)}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <h1>${escapeXml(label)}</h1>
${bodyParagraphs}
</body>
</html>`);
  }

  // Navigation
  const navItems = chapterFiles
    .map((c) => `      <li><a href="${c.href}">${escapeXml(c.title)}</a></li>`)
    .join("\n");

  zip.file("OEBPS/nav.xhtml", `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en">
<head><meta charset="utf-8"/><title>Contents</title></head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Contents</h1>
    <ol>
${navItems}
    </ol>
  </nav>
</body>
</html>`);

  // OPF package
  zip.file("OEBPS/content.opf", `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="3.0" xml:lang="en">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${escapeXml(title)}</dc:title>
    <dc:identifier id="bookid">urn:uuid:${randomUuid()}</dc:identifier>
    <dc:language>en</dc:language>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, "Z")}</meta>
  </metadata>
  <manifest>
    ${manifestItems.join("\n    ")}
  </manifest>
  <spine>
    ${spineItems.join("\n    ")}
  </spine>
</package>`);

  // Stylesheet
  zip.file("OEBPS/styles.css", `body { font-family: Georgia, serif; font-size: 1em; line-height: 1.8; margin: 5% 8%; color: #1a1a1a; }
h1 { font-size: 1.4em; margin: 2em 0 1em; page-break-before: always; }
p { text-indent: 1.5em; margin: 0 0 0.4em; }
p:first-of-type { text-indent: 0; }`);

  const buffer = await zip.generateAsync({ type: "arraybuffer", compression: "DEFLATE" });

  return new Response(buffer, {
    headers: {
      "Content-Type":        "application/epub+zip",
      "Content-Disposition": `attachment; filename="${filename}.epub"`,
    },
  });
}

// ── PDF ───────────────────────────────────────────────────────────────────────

async function exportPdf(title: string, chapters: ChapterData[], filename: string): Promise<Response> {
  const { jsPDF } = await import("jspdf");

  const doc        = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const marginL    = 25;
  const marginR    = 25;
  const marginTop  = 30;
  const marginBot  = 25;
  const pageW      = 210;
  const pageH      = 297;
  const maxW       = pageW - marginL - marginR;
  const maxY       = pageH - marginBot;

  let y = marginTop;

  function newPageIfNeeded(needed: number) {
    if (y + needed > maxY) { doc.addPage(); y = marginTop; }
  }

  function writeLine(text: string, size: number, bold: boolean, align: "left" | "center" = "left") {
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    newPageIfNeeded(size * 0.4);
    if (align === "center") {
      doc.text(text, pageW / 2, y, { align: "center" });
    } else {
      doc.text(text, marginL, y);
    }
    y += size * 0.42;
  }

  function writeParagraph(text: string) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(text, maxW) as string[];
    for (const line of lines) {
      newPageIfNeeded(6);
      doc.text(line, marginL, y);
      y += 6;
    }
    y += 2; // paragraph gap
  }

  // Title page
  y = pageH * 0.35;
  writeLine(title, 22, true, "center");
  y += 6;

  for (let i = 0; i < chapters.length; i++) {
    const ch = chapters[i];
    doc.addPage();
    y = marginTop;

    writeLine(`Chapter ${ch.position + 1}`, 10, false);
    y += 2;
    writeLine(ch.title, 16, true);
    y += 8;

    if (ch.paragraphs.length > 0) {
      for (const para of ch.paragraphs) writeParagraph(para);
    } else {
      writeParagraph("[Empty chapter]");
    }
  }

  const buffer = doc.output("arraybuffer") as ArrayBuffer;

  return new Response(buffer, {
    headers: {
      "Content-Type":        "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}.pdf"`,
    },
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9\s\-_]/g, "").trim().replace(/\s+/g, "_") || "manuscript";
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function randomUuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}
