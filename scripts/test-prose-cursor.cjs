const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const { createEditor, $getRoot, $createParagraphNode, $createTextNode, $setSelection } = require('lexical');
const compiled = ts.transpileModule(fs.readFileSync('src/lib/prose-cursor.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const moduleResult = { exports: {} };
new Function('require', 'module', 'exports', compiled)(require, moduleResult, moduleResult.exports);
const { $readProseCursor, $readProseInsertionCursor, insertProse } = moduleResult.exports;
const editor = createEditor({ onError: error => { throw error; } });
editor.update(() => {
  const root = $getRoot();
  const first = $createTextNode('Arthur waited.');
  const second = $createTextNode('Arthur waited.');
  root.append($createParagraphNode().append(first), $createParagraphNode().append(second));
  second.select(7, 7);
  const context = $readProseCursor();
  assert.equal(context.beforeCursor, 'Arthur waited.\nArthur ');
  assert.equal(context.afterCursor, 'waited.');
  // Moving the cursor must not change the saved insertion bookmark.
  first.select(0, 0);
  $setSelection(context.selection.clone());
  assert.equal($readProseCursor().beforeCursor, context.beforeCursor);
  // Backward selections must have the same before/after boundaries.
  second.select(7, 0);
  const backward = $readProseCursor();
  assert.equal(backward.selectedText, 'Arthur ');
  assert.equal(backward.beforeCursor, 'Arthur waited.\n');
  assert.equal(backward.afterCursor, 'waited.');
  const insertion = $readProseInsertionCursor();
  assert.equal(insertion.selectedText, '');
  assert.equal(insertion.selection.isCollapsed(), true);
  assert.equal(insertion.beforeCursor, 'Arthur waited.\nArthur ');
  assert.equal(insertion.afterCursor, 'waited.');
  // Formatting splits a sentence into nodes, not separate paragraphs.
  const bold = $createTextNode(' Again.').toggleFormat('bold');
  second.getParent().append(bold);
  bold.select(3, 3);
  assert.equal($readProseCursor().beforeCursor, 'Arthur waited.\nArthur waited. Ag');
  const empty = $createParagraphNode();
  root.append(empty);
  empty.selectStart();
  assert.equal($readProseCursor().afterCursor, '');
  // Rewrite across paragraphs and a formatted node, preserving the prefix/suffix.
  const span = first.select(7, 7);
  span.focus.set(bold.getKey(), 3, 'text');
  const bookmark = $readProseCursor().selection.clone();
  empty.selectStart();
  $setSelection(bookmark);
  insertProse(bookmark, 'stopped.\n\nShe listened.');
  assert.equal(root.getTextContent(), 'Arthur stopped.\n\nShe listened.ain.\n\n');
}, { discrete: true });
console.log('Prose cursor checks passed: insertion vs rewrite, repeated text, saved position, backward selection, rich text, empty paragraph.');
