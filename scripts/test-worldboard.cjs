// Exercise the actual route with isolated database/provider doubles. No live writes.
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const routePath = 'src/app/api/ai/worldboard/reextract/route.ts';

async function run({ failAI = false, invalid = false, failMerge = false, blocked = false, words = 80, count = 3 } = {}) {
  const charges = []; const updates = []; const prompts = [];
  const chapters = Array.from({ length: count }, (_, i) => ({ id: String(i), title: `Chapter ${i}`, position: i,
    content: { root: { children: [{ children: [{ type: 'text', text: Array(words).fill('Elizabeth').join(' ') }] }] } } }));
  const db = { auth: { getUser: async () => ({ data: { user: { id: 'owner' } } }) }, from(table) {
    const q = { select() { return q; }, eq() { return q; }, neq() { return q; }, order() { return q; },
      update(value) { updates.push(value); return q; }, single: async () => ({ data: { id: 'project' } }),
      then(resolve) { return Promise.resolve({ data: table === 'chapters' ? chapters : [], error: null }).then(resolve); } };
    return q;
  } };
  const deps = {
    'next/server': {},
    '@/lib/auth': { createServerSupabaseClient: async () => db, createServiceClient: () => db },
    '@/lib/ai': { geminiGenerate: async (prompt) => { prompts.push(prompt); if (failAI) throw Error('provider'); return invalid ? 'bad' : 'valid'; } },
    '@/lib/extraction': { buildEntitySummary: () => '', buildExtractionPrompt: text => text,
      parseExtractionResponse: raw => raw === 'valid' ? { entities: [{ name: 'Elizabeth' }], relationships: [] } : null,
      mergeExtractionIntoGraph: async () => { if (failMerge) throw Error('database'); return []; } },
    '@/lib/rate-limit': { checkRateLimit: async () => ({ block: blocked ? Response.json({ error: 'quota' }, { status: 429 }) : null, remaining: 488 }),
      commitRateLimit: async (_, __, credits) => charges.push(credits) },
  };
  const ctx = { exports: {}, require: name => { if (!(name in deps)) throw Error(name); return deps[name]; }, Response, console: { error() {} } };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(routePath, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, ctx);
  const response = await ctx.exports.POST({ json: async () => ({ projectId: 'project' }) });
  return { status: response.status, body: await response.json(), charges, updates, prompts };
}
test('three saved chapters reach AI, persist, and charge 12 credits', async () => {
  const r = await run(); assert.equal(r.status, 200); assert.equal(r.body.chaptersProcessed, 3);
  assert.equal(r.prompts.length, 3); assert.ok(r.prompts.every(p => p.includes('Elizabeth')));
  assert.deepEqual(r.charges, [4, 4, 4]); assert.equal(r.updates.length, 3);
});
for (const failure of ['failAI', 'invalid', 'failMerge', 'blocked']) {
  test(`${failure} returns failure without charging or advancing extraction`, async () => {
    const r = await run({ [failure]: true }); assert.ok(r.status >= 400);
    assert.deepEqual(r.charges, []); assert.deepEqual(r.updates, []);
  });
}
test('short chapters do not silently succeed or charge', async () => {
  const r = await run({ words: 10 }); assert.equal(r.status, 400); assert.equal(r.prompts.length, 0); assert.deepEqual(r.charges, []);
});
test('long chapter processes every chunk', async () => {
  const r = await run({ count: 1, words: 5010 }); assert.equal(r.status, 200); assert.equal(r.prompts.length, 2); assert.deepEqual(r.charges, [4, 4]);
});
