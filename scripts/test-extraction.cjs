const fs = require('node:fs');
const ts = require('typescript');
const assert = require('node:assert/strict');
const { test } = require('node:test');

const compiled = ts.transpileModule(fs.readFileSync('src/lib/extraction.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const moduleBox = { exports: {} };
new Function('require', 'module', 'exports', compiled)(require, moduleBox, moduleBox.exports);
const { resolveEntityId, findMatchingThreadIndex, parseExtractionResponse, mergeExtractionIntoGraph, buildEntitySummary, isPersistentRelationshipLabel } = moduleBox.exports;

const entities = [
  { id: 'ring', name: 'Black Obsidian Ring', attributes: {} },
  { id: 'elizabeth', name: 'Elizabeth Gray', attributes: {} },
  { id: 'draemon', name: 'Draemon', attributes: {} },
  { id: 'azoth', name: 'Azoth', attributes: {} },
];

test('does not resolve unrelated multi-word names from one shared token', () => {
  assert.equal(resolveEntityId('Black Cloaked Figures', entities), undefined);
});

test('resolves unique short names, expanded names, and titles', () => {
  assert.equal(resolveEntityId('Elizabeth', entities), 'elizabeth');
  assert.equal(resolveEntityId('Empire of Draemon', entities), 'draemon');
  assert.equal(resolveEntityId('Emperor Azoth', entities), 'azoth');
  assert.equal(resolveEntityId("Arthur's Basket", [{ id: 'basket', name: 'Arthur Basket', attributes: {} }]), 'basket');
});

test('refuses an ambiguous one-token name', () => {
  const ambiguous = [
    { id: 'one', name: 'Michael Gray', attributes: {} },
    { id: 'two', name: 'Michael Black', attributes: {} },
  ];
  assert.equal(resolveEntityId('Michael', ambiguous), undefined);
});

test('keeps titled relatives and people sharing a surname separate', () => {
  const bennets = [
    { id: 'mr', name: 'Mr. Bennet', attributes: {} },
    { id: 'mrs', name: 'Mrs. Bennet', attributes: {} },
    { id: 'elizabeth', name: 'Elizabeth Bennet', attributes: {} },
  ];
  assert.equal(resolveEntityId('Mr Bennet', bennets), 'mr');
  assert.equal(resolveEntityId('Mrs. Bennet', bennets), 'mrs');
  assert.equal(resolveEntityId('Elizabeth Bennet', bennets), 'elizabeth');
  assert.equal(resolveEntityId('Bennet', bennets), undefined);
});

test('matches a clear paraphrase of an existing plot thread', () => {
  const threads = [
    { description: 'An unnamed, powerful enemy is hunting Prince Arthur and threatens the Empire of Draemon.' },
    { description: 'Arthur is stranded on an unknown island after the dimensional device malfunctioned.' },
  ];
  assert.equal(findMatchingThreadIndex('A powerful enemy from Draemon is hunting Prince Arthur.', threads), 0);
});

test('does not merge an unrelated plot thread', () => {
  const threads = [{ description: 'Arthur is stranded on an unknown island after the dimensional device malfunctioned.' }];
  assert.equal(findMatchingThreadIndex('Nyx and Azoth hope to reunite with their son.', threads), -1);
});

test('thread context keeps a stable index and readable description', () => {
  const summary = buildEntitySummary([], [{
    id: 'thread',
    description: 'A mysterious enemy is hunting Prince Arthur across several worlds.',
    status: 'open',
    last_seen_chapter_number: 2,
  }]);
  assert.match(summary, /\[1\]"A mysterious enemy is hunting Prince Arthur across several worlds\."\(open,ch2\)/);
  assert.doesNotMatch(summary, /mysterious_enemy/);
});

test('relationship validation rejects scene actions and spatial containment', () => {
  assert.equal(isPersistentRelationshipLabel('attacked'), false);
  assert.equal(isPersistentRelationshipLabel('is inhabited by'), false);
  assert.equal(isPersistentRelationshipLabel('attracted to'), false);
  assert.equal(isPersistentRelationshipLabel('connected by road to'), false);
  assert.equal(isPersistentRelationshipLabel('reside in'), false);
  assert.equal(isPersistentRelationshipLabel('warned'), false);
  assert.equal(isPersistentRelationshipLabel('wears'), false);
  assert.equal(isPersistentRelationshipLabel('passenger of'), false);
  assert.equal(isPersistentRelationshipLabel('guardian of'), true);
  assert.equal(isPersistentRelationshipLabel('are hunting'), true);
});

test('parser rejects malformed records and enforces output budgets', () => {
  const parsed = parseExtractionResponse(JSON.stringify({
    entities: [
      ...Array.from({ length: 14 }, (_, index) => ({ name: `Person ${index}`, type: 'character', attributes: null })),
      { name: 'Bad Type', type: 'room' },
    ],
    relationships: [
      ...Array.from({ length: 12 }, (_, index) => ({ source: `Person ${index}`, target: 'Person 0', label: 'knows' })),
      { source: '', target: 'Person 0', label: 'knows' },
    ],
    threads: [{ description: 'A valid thread', status: 'open', is_new: false, existing_thread_index: 2 }],
    inconsistencies: [{ entity: null, attribute: 'eyes', established: 'blue', found: 'green' }],
  }));
  assert.ok(parsed);
  assert.equal(parsed.entities.length, 12);
  assert.equal(parsed.relationships.length, 10);
  assert.equal(parsed.threads[0].existing_thread_index, 2);
  assert.equal(parsed.inconsistencies.length, 0);
});

test('merge skips an unresolved relationship instead of attaching it to a shared-word entity', async () => {
  let databaseCalls = 0;
  const client = { from() { databaseCalls++; throw new Error('database should not be called'); } };
  const result = {
    entities: [],
    relationships: [{ source: 'Black Cloaked Figures', target: 'Arthur', label: 'are hunting' }],
    threads: [],
    inconsistencies: [],
  };
  const previousWarn = console.warn;
  console.warn = () => {};
  try {
    await mergeExtractionIntoGraph('project', 'chapter', 3, result, [
      { id: 'ring', name: 'Black Obsidian Ring', type: 'item', attributes: {} },
      { id: 'arthur', name: 'Arthur', type: 'character', attributes: {} },
    ], client, []);
  } finally {
    console.warn = previousWarn;
  }
  assert.equal(databaseCalls, 0);
});

test('merge stores relationship predicates without leading is/are wording', async () => {
  const inserts = [];
  const client = {
    from(table) {
      return {
        select() { return this; },
        eq() { return this; },
        maybeSingle: async () => ({ data: null, error: null }),
        insert: async (value) => { inserts.push({ table, value }); return { error: null }; },
      };
    },
  };
  await mergeExtractionIntoGraph('project', 'chapter', 1, {
    entities: [],
    relationships: [{ source: 'Nyx', target: 'Arthur', label: 'is mother of' }],
    threads: [],
    inconsistencies: [],
  }, [
    { id: 'nyx', name: 'Nyx', type: 'character', attributes: {} },
    { id: 'arthur', name: 'Arthur', type: 'character', attributes: {} },
  ], client, []);
  assert.equal(inserts.length, 1);
  assert.equal(inserts[0].value.label, 'mother of');
});

test('merge updates a paraphrased existing thread instead of inserting a duplicate', async () => {
  const updates = [];
  const inserts = [];
  const client = {
    from(table) {
      const query = {
        update(value) { updates.push({ table, value }); return query; },
        insert(value) { inserts.push({ table, value }); return query; },
        eq() { return query; },
        then(resolve) { return Promise.resolve({ error: null }).then(resolve); },
      };
      return query;
    },
  };
  await mergeExtractionIntoGraph('project', 'chapter', 2, {
    entities: [],
    relationships: [],
    threads: [{
      description: 'A powerful enemy from Draemon is hunting Prince Arthur.',
      status: 'open',
      is_new: true,
      existing_thread_index: null,
    }],
    inconsistencies: [],
  }, [], client, [{
    id: 'threat',
    description: 'An unnamed, powerful enemy is hunting Prince Arthur and threatens the Empire of Draemon.',
    status: 'open',
    last_seen_chapter_number: 1,
  }]);
  assert.equal(updates.length, 1);
  assert.equal(inserts.length, 0);
});
