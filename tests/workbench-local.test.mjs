import test from 'node:test';
import assert from 'node:assert/strict';
import { createLocalBridgeHandler } from '../edgeone-deploy/cloud-functions/api/workbench-local.js';
import { hash, revision } from '../edgeone-deploy/cloud-functions/_lib/workbench.js';

const SOURCE = '00_总控台/当前状态.md';
const SECRET = 'fixture-local-bridge-secret-32-bytes-long';
function fixture() {
  const data = new Map();
  const store = {
    async get(key) { return structuredClone(data.get(key) ?? null); },
    async setJSON(key, value, options) { if (options?.onlyIfNew && data.has(key)) { const e = new Error('conflict'); e.code = 'PRECONDITION_FAILED'; throw e; } data.set(key, structuredClone(value)); },
    async delete(key) { data.delete(key); },
    async list({ prefix, limit = Infinity }) { return { blobs: [...data.keys()].filter(key => key.startsWith(prefix)).slice(0, limit).map(key => ({ key })) }; },
  };
  const handler = createLocalBridgeHandler({ businessContext: true, transactional: true, getStoreImpl: () => store,
    nowImpl: () => new Date('2026-11-10T00:00:00Z') });
  const env = { WORKBENCH_OWNER_EMAIL: 'owner@example.test', WORKBENCH_SESSION_SECRET: 'fixture-session-secret-32-bytes-long',
    WORKBENCH_LOCAL_BRIDGE_SECRET: SECRET, WORKBENCH_RUNNER_SECRET: 'fixture-runner-secret-32-bytes-long', WORKBENCH_ORIGIN: 'https://example.test' };
  async function call(body, secret = SECRET) {
    try {
      const response = await handler({ env, request: new Request('https://example.test/api/workbench-local', { method: 'POST',
        headers: { authorization: `Bearer ${secret}`, 'content-type': 'application/json' }, body: JSON.stringify(body) }) });
      return { status: response.status, body: await response.json() };
    } catch (error) { return { status: error.status || 500, body: { error: error.message } }; }
  }
  async function seed() {
    const task = await revision(store, 'tasks', { id: 'a'.repeat(32), title: '已有任务', source: SOURCE, updated_at: '2026-11-10' }, 0);
    const document = await revision(store, 'documents', { id: hash(SOURCE).slice(0, 32), path: SOURCE, content: '原文\n', hash: hash('原文\n'), updated_at: '2026-11-10' }, 0);
    return { task, document };
  }
  return { data, store, call, seed };
}

test('local bridge is separately authenticated and lists only task metadata', async () => {
  const f = fixture(); await f.seed();
  assert.equal((await f.call({ action: 'tasks' }, 'fixture-runner-secret-32-bytes-long')).status, 401);
  const result = await f.call({ action: 'tasks' });
  assert.equal(result.status, 200); assert.equal(result.body.tasks[0].source, SOURCE);
  assert.equal(result.body.tasks[0].source_version, 1); assert.ok(!JSON.stringify(result.body).includes('原文'));
  await revision(f.store, 'runs', { id: 'e'.repeat(32), kind: 'inquiry_review', inquiry_reference: 'fixture', status: 'awaiting_review', updated_at: '2026-11-10' }, 0);
  assert.equal((await f.call({ action: 'status', run_id: 'e'.repeat(32) })).status, 403);
  assert.deepEqual((await f.call({ action: 'pending_reviews' })).body.runs, []);
  assert.equal(f.data.has('runner/heartbeat.json'), false);
});

test('local snapshot and queued run use exact versions and a replay-safe request ID', async () => {
  const f = fixture(), { task, document } = await f.seed();
  const body = { action: 'enqueue', request_id: 'b'.repeat(32), task_id: task.id, task_version: task.version,
    source_version: document.version, source_content: '新原文\n', instruction: '只生成内部建议', model: 'gpt-6-luna' };
  const created = await f.call(body); assert.equal(created.status, 201); assert.equal(created.body.run.status, 'queued');
  assert.equal(created.body.run.source_hash, hash('新原文\n')); assert.equal(created.body.run.source_version, 2);
  const repeated = await f.call(body); assert.equal(repeated.status, 200); assert.equal(repeated.body.replay, true);
  assert.equal(repeated.body.run.id, created.body.run.id);
  assert.equal((await f.call({ action: 'request_status', request_id: body.request_id })).body.run.id, created.body.run.id);
  assert.equal((await f.call({ ...body, instruction: 'different' })).status, 409);
});

test('new local snapshot is rejected while an older proposal for that source awaits review', async () => {
  const f = fixture(), { task, document } = await f.seed();
  await revision(f.store, 'runs', { id: 'c'.repeat(32), task_id: task.id, source: SOURCE, status: 'awaiting_review', updated_at: '2026-11-10', summary: 'pending' }, 0);
  const body = { action: 'enqueue', request_id: 'd'.repeat(32), task_id: task.id, task_version: task.version,
    source_version: document.version, source_content: '变更原文', instruction: '测试', model: 'gpt-6-luna' };
  assert.equal((await f.call(body)).status, 409);
  assert.equal((await f.call({ action: 'request_status', request_id: body.request_id })).body.found, false);
  assert.equal((await f.call({ action: 'tasks' })).body.tasks[0].source_version, 1);
});
