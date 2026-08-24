/**
 * Phrase-level text replacement inside Lexical JSON.
 *
 * Walks the node tree and replaces exact phrase matches within text nodes.
 * Bold/italic/other formatting is preserved because we only modify the `text`
 * field — the node attributes remain untouched.
 *
 * Limitation: if a phrase is split across two text nodes with different
 * formatting (e.g. "Arthur's **blue** eyes"), the match will not find it.
 * In practice this is rare because formatters don't break mid-phrase.
 */

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export interface ReplaceResult {
  content: Record<string, unknown>;
  count: number;
}

/**
 * Replace all occurrences of `original` with `replacement` in a Lexical
 * JSON document. Case-insensitive matching; preserves original capitalisation
 * of the first character when the match starts a sentence.
 */
export function lexicalReplace(
  content: Record<string, unknown>,
  original: string,
  replacement: string
): ReplaceResult {
  let count = 0;
  const regex = new RegExp(escapeRegExp(original), "gi");

  function walk(node: Record<string, unknown>) {
    if (node.type === "text" && typeof node.text === "string") {
      const newText = (node.text as string).replace(regex, (match) => {
        count++;
        // Preserve leading capitalisation
        if (
          match.length > 0 &&
          match[0] === match[0].toUpperCase() &&
          match[0] !== match[0].toLowerCase()
        ) {
          return replacement.charAt(0).toUpperCase() + replacement.slice(1);
        }
        return replacement;
      });
      node.text = newText;
    }
    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        walk(child as Record<string, unknown>);
      }
    }
  }

  // Deep-clone so the original is never mutated
  const cloned = JSON.parse(JSON.stringify(content)) as Record<string, unknown>;
  const root = (cloned.root ?? cloned) as Record<string, unknown>;
  walk(root);

  return { content: cloned, count };
}

// ─── Paragraph-level utilities ───────────────────────────────────────────────

/** Extract the concatenated plain text of a single Lexical node and its descendants. */
function extractNodeText(node: Record<string, unknown>): string {
  const parts: string[] = [];
  function walk(n: Record<string, unknown>) {
    if (n.type === "text" && typeof n.text === "string") parts.push(n.text as string);
    if (Array.isArray(n.children)) {
      for (const child of n.children) walk(child as Record<string, unknown>);
    }
  }
  walk(node);
  return parts.join("");
}

export interface ParagraphEntry {
  index: number;  // position in root.children
  text: string;   // concatenated plain text
}

/**
 * Extract all top-level block nodes (paragraphs, headings, quotes) from a
 * Lexical document as plain-text entries with their root-children index.
 *
 * The index is used by lexicalReplaceParagraphByIndex — the AI returns the
 * index it wants to rewrite so we never need fuzzy text matching.
 */
export function lexicalGetParagraphs(
  content: Record<string, unknown>
): ParagraphEntry[] {
  const root = ((content as Record<string, unknown>).root ?? content) as Record<string, unknown>;
  const children = Array.isArray(root.children)
    ? (root.children as Record<string, unknown>[])
    : [];

  return children.map((node, index) => ({
    index,
    text: extractNodeText(node).trim(),
  }));
}

export interface ParagraphReplaceResult {
  content: Record<string, unknown>;
  replaced: boolean;
}

/**
 * Replace the top-level block node at `index` in a Lexical document with a
 * new single-text-node paragraph containing `newText`.
 *
 * Note: inline formatting within the original paragraph is not preserved —
 * the replacement becomes a plain text node. This is acceptable for AI
 * line-edit rewrites where the whole paragraph is being rewritten.
 */
export function lexicalReplaceParagraphByIndex(
  content: Record<string, unknown>,
  index: number,
  newText: string
): ParagraphReplaceResult {
  const cloned = JSON.parse(JSON.stringify(content)) as Record<string, unknown>;
  const root = (cloned.root ?? cloned) as Record<string, unknown>;

  if (!Array.isArray(root.children) || index >= (root.children as unknown[]).length) {
    return { content: cloned, replaced: false };
  }

  const node = (root.children as Record<string, unknown>[])[index];
  // Replace the node's children with a single plain text node
  node.children = [{
    type:    "text",
    text:    newText,
    version: 1,
    format:  0,
    mode:    "normal",
    style:   "",
    detail:  0,
  }];

  return { content: cloned, replaced: true };
}

/**
 * Verify that `phrase` exists verbatim in the plain text extracted from a
 * Lexical document. Used server-side to validate AI-generated change plans
 * before sending them to the client.
 */
export function phraseExistsInLexical(
  content: Record<string, unknown>,
  phrase: string
): boolean {
  const parts: string[] = [];

  function walk(node: Record<string, unknown>) {
    if (node.type === "text" && typeof node.text === "string") {
      parts.push(node.text as string);
    }
    if (Array.isArray(node.children)) {
      for (const child of node.children) walk(child as Record<string, unknown>);
    }
  }

  const root = ((content as Record<string, unknown>).root ?? content) as Record<string, unknown>;
  walk(root);
  const fullText = parts.join(" ");
  return fullText.toLowerCase().includes(phrase.toLowerCase());
}
