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
  const {
    Document, Packer, Paragraph, TextRun, HeadingLevel,
    AlignmentType, PageBreak, Footer, PageNumber,
  } = await import("docx");

  const children: InstanceType<typeof Paragraph>[] = [];

  // Title page — centered, vertically positioned via large top spacing
  children.push(
    new Paragraph({
      children: [new TextRun({ text: title, bold: true, size: 52, font: "Georgia" })],
      alignment: AlignmentType.CENTER,
      spacing:   { before: 3600, after: 0 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "\n", size: 24 })],
      spacing:  { before: 0, after: 0 },
    })
  );

  for (let i = 0; i < chapters.length; i++) {
    const ch = chapters[i];

    // Page break before each chapter
    children.push(new Paragraph({ children: [new PageBreak()] }));

    // "Chapter N" label — centered, small caps feel
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `Chapter ${ch.position + 1}`, size: 20, font: "Georgia", color: "888888" })],
        alignment: AlignmentType.CENTER,
        spacing:   { before: 1440, after: 120 },
      })
    );

    // Chapter title — centered heading
    children.push(
      new Paragraph({
        children: [new TextRun({ text: ch.title, bold: true, size: 36, font: "Georgia" })],
        alignment: AlignmentType.CENTER,
        spacing:   { before: 0, after: 960 },
      })
    );

    // Body paragraphs — first-line indent, no extra space between, double-spaced
    if (ch.paragraphs.length > 0) {
      for (const para of ch.paragraphs) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: para, size: 24, font: "Georgia" })],
            spacing:  { line: 480, after: 0 },   // double spacing (480 = 2× 240 baseline)
            indent:   { firstLine: 720 },          // 0.5 inch first-line indent
          })
        );
      }
    } else {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "[Empty chapter]", color: "999999", italics: true, size: 24 })],
        })
      );
    }
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run:       { font: "Georgia", size: 24 },
          paragraph: { spacing: { line: 480 } },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          margin: {
            top:    1440, // 1 inch
            bottom: 1440,
            left:   1800, // 1.25 inch
            right:  1800,
          },
        },
      },
      // Page number footer — centred
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children:  [new TextRun({ children: [PageNumber.CURRENT], font: "Georgia", size: 20, color: "888888" })],
            }),
          ],
        }),
      },
      children,
    }],
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
      ? ch.paragraphs.map((p, pi) => `    <p${pi === 0 ? ' class="first"' : ""}>${escapeXml(p)}</p>`).join("\n")
      : `    <p class="first"><em>[Empty chapter]</em></p>`;

    zip.file(`OEBPS/${href}`, `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${escapeXml(label)}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <p class="chnum">Chapter ${ch.position + 1}</p>
  <h1>${escapeXml(ch.title)}</h1>
  <hr/>
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

  // Stylesheet — book-style typography
  zip.file("OEBPS/styles.css", `
body  { font-family: Georgia, "Times New Roman", serif; font-size: 1em; line-height: 1.9; margin: 6% 10%; color: #1a1a1a; }
h1   { font-size: 1.5em; font-weight: bold; text-align: center; margin: 3em 0 0.3em; page-break-before: always; }
.chnum { font-size: 0.75em; text-align: center; color: #888; letter-spacing: 0.15em; text-transform: uppercase; margin: 3em 0 0.5em; page-break-before: always; }
hr   { width: 2em; border: none; border-top: 1px solid #ccc; margin: 1.2em auto 2em; }
p    { text-indent: 1.6em; margin: 0; }
p.first { text-indent: 0; }
`);

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

  const doc       = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const marginL   = 31.75; // 1.25 inch
  const marginR   = 31.75;
  const marginTop = 25.4;  // 1 inch
  const marginBot = 25.4;
  const pageW     = 210;
  const pageH     = 297;
  const textW     = pageW - marginL - marginR;
  const maxY      = pageH - marginBot - 8; // leave room for page number

  let y = marginTop;

  function addPageNumber() {
    const n = doc.getNumberOfPages();
    for (let p = 1; p <= n; p++) {
      doc.setPage(p);
      doc.setFont("times", "normal");
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text(String(p), pageW / 2, pageH - 12, { align: "center" });
    }
    doc.setTextColor(0, 0, 0);
  }

  function newPage() {
    doc.addPage();
    y = marginTop;
  }

  function newPageIfNeeded(needed: number) {
    if (y + needed > maxY) newPage();
  }

  const LINE_H   = 7.5;  // ~double-spaced 11pt in mm
  const INDENT   = 8;    // first-line indent in mm

  function writeParagraph(text: string, opts: { center?: boolean; size?: number; bold?: boolean; muted?: boolean; indent?: boolean } = {}) {
    const size = opts.size ?? 11;
    doc.setFontSize(size);
    doc.setFont("times", opts.bold ? "bold" : "normal");
    if (opts.muted) doc.setTextColor(130, 130, 130); else doc.setTextColor(30, 30, 30);

    if (opts.center) {
      newPageIfNeeded(size * 0.45);
      doc.text(text, pageW / 2, y, { align: "center" });
      y += size * 0.47;
      return;
    }

    // Left-aligned with optional first-line indent
    const indentX = opts.indent ? marginL + INDENT : marginL;
    const wrapW   = opts.indent ? textW - INDENT : textW;
    const lines   = doc.splitTextToSize(text, wrapW) as string[];

    for (let li = 0; li < lines.length; li++) {
      newPageIfNeeded(LINE_H);
      const x = (li === 0 && opts.indent) ? indentX : marginL;
      doc.text(lines[li], x, y);
      y += LINE_H;
    }
  }

  // ── Title page ─────────────────────────────────────────────
  y = pageH * 0.38;
  writeParagraph(title, { center: true, size: 22, bold: true });
  y += 5;

  // ── Chapters ───────────────────────────────────────────────
  for (const ch of chapters) {
    newPage();

    // "Chapter N" label
    y += 18;
    writeParagraph(`Chapter ${ch.position + 1}`, { center: true, size: 10, muted: true });
    y += 4;

    // Chapter title
    writeParagraph(ch.title, { center: true, size: 18, bold: true });
    y += 14;

    // Thin rule
    doc.setDrawColor(180, 180, 180);
    doc.line(pageW / 2 - 12, y, pageW / 2 + 12, y);
    y += 12;
    doc.setDrawColor(0, 0, 0);

    // Body
    if (ch.paragraphs.length > 0) {
      for (const para of ch.paragraphs) {
        writeParagraph(para, { indent: true });
      }
    } else {
      writeParagraph("[Empty chapter]", { muted: true });
    }
  }

  // Stamp page numbers on every page
  addPageNumber();

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
