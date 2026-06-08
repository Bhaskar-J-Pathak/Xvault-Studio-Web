/**
 * Text chunking utilities — used by Story Bible embedding.
 * Safe to import on both server and client (no server-only imports).
 */

/** Recursively extract plain text from a Lexical editor state JSON.
 *
 *  Lexical serialises state as { root: { children: [...] } }.
 *  We must start the walk from `state.root`, not the wrapper object —
 *  otherwise the walker sees no `children` array at the top level and
 *  returns an empty string.
 */
export function lexicalToText(content: unknown): string {
  if (!content || typeof content !== "object") return "";
  const parts: string[] = [];

  function walk(node: unknown) {
    if (!node || typeof node !== "object") return;
    const n = node as Record<string, unknown>;
    if (n.type === "text" && typeof n.text === "string") parts.push(n.text);
    if (Array.isArray(n.children)) for (const child of n.children) walk(child);
  }

  // Unwrap the Lexical state wrapper { root: {...} } before walking
  const state = content as Record<string, unknown>;
  walk(typeof state.root === "object" && state.root !== null ? state.root : content);
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

/**
 * Split plain text into overlapping word-chunks for embedding.
 * Default: 200 words per chunk, 40-word overlap to preserve context at boundaries.
 */
export function chunkText(
  text: string,
  chunkWords = 200,
  overlapWords = 40
): Array<{ content: string; wordStart: number }> {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const chunks: Array<{ content: string; wordStart: number }> = [];

  let i = 0;
  while (i < words.length) {
    const slice = words.slice(i, i + chunkWords);
    if (slice.length >= 20) {
      chunks.push({ content: slice.join(" "), wordStart: i });
    }
    if (i + chunkWords >= words.length) break;
    i += chunkWords - overlapWords;
  }

  return chunks;
}
