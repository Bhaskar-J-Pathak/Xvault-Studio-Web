/**
 * Convert plain text to a Lexical editor JSON state.
 * Shared between the server-side import routes and the client-side sidebar
 * import component so both produce identical editor content.
 */
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
            type:    "text",
            text:    p,
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
