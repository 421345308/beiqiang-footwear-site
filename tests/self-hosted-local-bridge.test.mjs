import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Pool } from 'pg';
import { createApiServer } from '../self-hosted/server.mjs';
import { createStorage } from '../self-hosted/storage.mjs';
import { hash, revision, STORE_NAME, versionKey } from '../edgeone-deploy/cloud-functions/_lib/workbench.js';

const url = process.env.SELF_HOSTED_TEST_DATABASE_URL;
const SOURCE = '00_总控台/当前状态.md';
test('local bridge uses PostgreSQL transactions for concurrent idempotency and rollback', { skip: !url, timeout: 30000 }, async () => {
  const schema = `bq_bridge_${randomUUID().replaceAll('-', '')}`;
  const dataDir = await mkdtemp(path.join(os.tmpdir(), 'bq-bridge-'));
  const storage = createStorage({ connectionString: url, dataDir, schema });
  const localSecret = 'fixture-local-secret-'.repeat(3), sessionSecret = 'fixture-session-secret-'.repeat(3);
  const env = { WORKBENCH_OWNER_EMAIL: 'owner@example.invalid', WORKBENCH_SESSION_SECRET: sessionSecret,
    WORKBENCH_LOCAL_BRIDGE_SECRET: localSecret, WORKBENCH_ORIGIN: 'https://www.beiqiang.online' };
  let app;
  try {
    await storage.initialize();
    const store = storage.getStore(STORE_NAME), taskId = 'a'.repeat(32), docId = hash(SOURCE).slice(0, 32), now = new Date().toISOString();
    await store.setJSON(versionKey('tasks', taskId, 1), { id: taskId, version: 1, title: 'fixture', source: SOURCE, updated_at: now });
    await store.setJSON(versionKey('documents', docId, 1), { id: docId, version: 1, path: SOURCE, content: 'old\n', hash: hash('old\n'), updated_at: now });
    app = await createApiServer({ storage, env, publicOrigin: env.WORKBENCH_ORIGIN });
    await new Promise(resolve => app.server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${app.server.address().port}/api/workbench-local`;
    const call = body => fetch(base, { method: 'POST', signal: AbortSignal.timeout(12000),
      headers: { authorization: `Bearer ${localSecret}`, 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const payload = { action: 'enqueue', request_id: 'b'.repeat(32), task_id: taskId, task_version: 1,
      source_version: 1, source_content: 'new\n', instruction: 'fixture', model: 'gpt-6-luna' };
    const results = await Promise.all([call(payload), call(payload)]);
    assert.deepEqual(results.map(result => result.status).sort(), [200, 201]);
    const bodies = await Promise.all(results.map(result => result.json()));
    assert.equal(bodies[0].run.id, bodies[1].run.id);
    assert.equal((await (await call({ action: 'request_status', request_id: payload.request_id })).json()).run.id, bodies[0].run.id);
    assert.equal((await (await call({ action: 'tasks' })).json()).tasks[0].source_version, 2);
    assert.equal(await store.get('runner/heartbeat.json', { type: 'json' }), null);

    const stale = await call({ ...payload, request_id: 'c'.repeat(32), source_version: 1 });
    assert.equal(stale.status, 409);
    assert.equal((await (await call({ action: 'request_status', request_id: 'c'.repeat(32) })).json()).found, false);

    const queued = await store.get(versionKey('runs', bodies[0].run.id, bodies[0].run.version), { type: 'json' });
    const completed = await revision(store, 'runs', { ...queued, status: 'awaiting_review',
      result: { summary: 'fixture result', changes: [], next_steps: [] }, updated_at: new Date().toISOString() }, queued.version);
    const review = { action: 'review_no_change', run_id: completed.id, expected_version: completed.version };
    const accepted = await call(review); assert.equal(accepted.status, 200); assert.equal((await accepted.json()).run.status, 'accepted');
    const replay = await call(review); assert.equal(replay.status, 200); assert.equal((await replay.json()).replay, true);
  } finally {
    if (app) await app.close(); else await storage.close();
    const cleanup = new Pool({ connectionString: url });
    try { await cleanup.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`); } finally { await cleanup.end(); }
    await rm(dataDir, { recursive: true, force: true });
  }
});
