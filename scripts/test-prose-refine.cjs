const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
let charged = 0;
let prompt = '';
let maxTokens = 0;
let fail = false;
let queuedOutputs = [];
let generationCalls = 0;
const query = { select() { return this; }, eq() { return this; },
  single: async () => ({ data: { id: 'project' } }),
  maybeSingle: async () => ({ data: { name: 'Alex' } }) };
const supabase = { auth: { getUser: async () => ({ data: { user: { id: 'user' } } }) }, from: () => query };
const mocks = {
  'next/server': {},
  '@/lib/auth': { createServerSupabaseClient: async () => supabase, createServiceClient: () => ({}) },
  '@/lib/coauthor-context': { assembleCoauthorContext: async () => ({ systemPrompt: 'Context' }) },
  '@/lib/rate-limit': { checkRateLimit: async () => ({ remaining: 42 }), commitRateLimit: async (_u, _s, cost) => { charged += cost; } },
  '@/lib/ai': { geminiGenerate: async (p, _system, tokens) => { generationCalls++; prompt = p; maxTokens = tokens; if (fail) throw new Error('Expected test failure'); return queuedOutputs.shift() || 'Arthur reached for the loose stone.\n\nIt shifted beneath his hand.'; } },
};
const compiled = ts.transpileModule(fs.readFileSync('src/app/api/ai/coauthor/suggest/route.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const result = { exports: {} };
new Function('require', 'module', 'exports', compiled)(name => {
  if (!(name in mocks)) throw new Error(`Unexpected dependency ${name}`);
  return mocks[name];
}, result, result.exports);
const request = body => ({ json: async () => body });
(async () => {
  const base = { projectId: 'project', mode: 'continue', beforeCursor: 'The beast held him.', afterCursor: 'He crawled away.', draft: 'A new power woke inside him.', instruction: 'Remove the new power. Use the loose stone.' };
  let response = await result.exports.POST(request(base));
  assert.equal(response.status, 200);
  assert.match(prompt, /UNACCEPTED DRAFT/);
  assert.match(prompt, /A new power woke inside him/);
  assert.match(prompt, /Remove the new power/);
  assert.match(prompt, /He crawled away/);
  assert.match(prompt, /SAME insertion point/);
  assert.equal(charged, 1);
  response = await result.exports.POST(request({ ...base, mode: 'rewrite', selectedText: 'Original selection.' }));
  assert.equal(response.status, 200);
  assert.match(prompt, /Original selection/);
  assert.equal(charged, 2);
  response = await result.exports.POST(request({ ...base, instruction: '' }));
  assert.equal(response.status, 400);
  assert.equal(charged, 2);
  fail = true;
  response = await result.exports.POST(request(base));
  assert.equal(response.status, 502);
  assert.equal(charged, 2);
  fail = false;
  const writeBase = { projectId: 'project', mode: 'write', beforeCursor: 'The beast held him.', instruction: 'Write a full, detailed chapter scene.' };
  response = await result.exports.POST(request({ ...writeBase, length: 'short' }));
  assert.equal(response.status, 200);
  assert.match(prompt, /Write 100-200 words/);
  assert.equal(maxTokens, 1280);
  assert.equal(charged, 3);
  response = await result.exports.POST(request({ ...writeBase, length: 'long' }));
  assert.equal(response.status, 200);
  assert.match(prompt, /Write 500-800 words/);
  assert.equal(maxTokens, 2816);
  assert.equal(charged, 4, 'Long must still cost exactly one credit');
  response = await result.exports.POST(request({ projectId: 'project', mode: 'continue', beforeCursor: 'The beast held him.' }));
  assert.equal(response.status, 200);
  assert.match(prompt, /Write 250-450 words/);
  assert.equal(maxTokens, 1792);
  assert.equal(charged, 5);
  const callsBeforeRepair = generationCalls;
  queuedOutputs = [
    `\"Where are you going?\" Arthur asked. \"Home,\" Nyx said. ${'They stood in the rain and watched the empty road. '.repeat(25)}`,
    '\"Where are you going?\" Arthur asked.\n\n\"Home,\" Nyx said.',
  ];
  response = await result.exports.POST(request({ projectId: 'project', mode: 'continue', beforeCursor: 'Rain crossed the road.' }));
  assert.equal(response.status, 200);
  assert.equal(generationCalls, callsBeforeRepair + 2, 'Collapsed dialogue should trigger one repair call');
  assert.equal(charged, 6, 'A format repair must not consume a second app credit');
  console.log('Prose route checks passed: refine, rewrite, validation, failure safety, explicit lengths, medium default, one-credit charging, and collapsed-paragraph repair.');
})().catch(error => { console.error(error); process.exitCode = 1; });
