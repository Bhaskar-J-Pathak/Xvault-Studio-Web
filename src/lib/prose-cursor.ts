import { $createRangeSelection, $getRoot, $getSelection, $isRangeSelection } from "lexical";
import type { RangeSelection } from "lexical";

export function insertProse(selection: RangeSelection, text: string) {
  const paragraphs = text.replace(/\r\n?/g, "\n").split(/\n+/);
  paragraphs.forEach((paragraph, index) => {
    if (index > 0) selection.insertParagraph();
    selection.insertText(paragraph);
  });
}

export interface ProseCursorContext {
  beforeCursor: string;
  afterCursor: string;
  selectedText: string;
  selection: RangeSelection | null;
  documentText: string;
}

// Read the actual range, including block separators and backward selections.
// Never search for text: the same sentence can occur more than once.
export function $readProseCursor(): ProseCursorContext {
  const root = $getRoot();
  const selection = $getSelection();
  const documentText = root.getTextContent();
  if (!$isRangeSelection(selection)) {
    const end = $createRangeSelection();
    end.anchor.set(root.getKey(), root.getChildrenSize(), "element");
    end.focus.set(root.getKey(), root.getChildrenSize(), "element");
    return { beforeCursor: documentText, afterCursor: "", selectedText: "", selection: end, documentText };
  }
  const [start, end] = selection.isBackward()
    ? [selection.focus, selection.anchor] : [selection.anchor, selection.focus];
  const before = $createRangeSelection();
  before.anchor.set(root.getKey(), 0, "element");
  before.focus.set(start.key, start.offset, start.type);
  const after = $createRangeSelection();
  after.anchor.set(end.key, end.offset, end.type);
  after.focus.set(root.getKey(), root.getChildrenSize(), "element");
  return {
    beforeCursor: before.getTextContent(), afterCursor: after.getTextContent(),
    selectedText: selection.getTextContent(), selection: selection.clone(), documentText,
  };
}

// Header Write is an insertion action, even if the writer happens to have text
// selected. Treat the end of that selection as the cursor and keep Rewrite as a
// separate, explicit passage action.
export function $readProseInsertionCursor(): ProseCursorContext {
  const root = $getRoot();
  const context = $readProseCursor();
  const selection = context.selection;
  if (!selection || selection.isCollapsed()) return context;

  const insertionPoint = selection.isBackward() ? selection.anchor : selection.focus;
  const collapsed = $createRangeSelection();
  collapsed.anchor.set(insertionPoint.key, insertionPoint.offset, insertionPoint.type);
  collapsed.focus.set(insertionPoint.key, insertionPoint.offset, insertionPoint.type);

  const before = $createRangeSelection();
  before.anchor.set(root.getKey(), 0, "element");
  before.focus.set(insertionPoint.key, insertionPoint.offset, insertionPoint.type);
  const after = $createRangeSelection();
  after.anchor.set(insertionPoint.key, insertionPoint.offset, insertionPoint.type);
  after.focus.set(root.getKey(), root.getChildrenSize(), "element");

  return {
    beforeCursor: before.getTextContent(),
    afterCursor: after.getTextContent(),
    selectedText: "",
    selection: collapsed,
    documentText: context.documentText,
  };
}
