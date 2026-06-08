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
