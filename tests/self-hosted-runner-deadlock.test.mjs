import assert from 'node:assert/strict';
import test from 'node:test';
import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Pool } from 'pg';
import { createApiServer } from '../self-hosted/server.mjs';
import { createStorage } from '../self-hosted/storage.mjs';
import { loadRoutes } from '../self-hosted/routes.mjs';
import { getStore } from '../edgeone-deploy/cloud-functions/_lib/platform-store.js';
import { COOKIE, hash, sign, STORE_NAME, versionKey } from '../edgeone-deploy/cloud-functions/_lib/workbench.js';

const url = process.env.SELF_HOSTED_TEST_DATABASE_URL;

test('dashboard refresh and idle claim use compatible locks; an aborted runner transaction persists nothing', { skip: !url, timeout: 20000 }, async () => {
  const schema = `bq_locktest_${randomUUID().replaceAll('-', '')}`;
  const dataDir = await mkdtemp(path.join(os.tmpdir(), 'bq-locktest-'));
  const database = createStorage({ connectionString: url, dataDir, schema });
  const labels = new AsyncLocalStorage();
  let releaseRunner, announceRunner;
  const ownerProbe = new Promise(resolve => { releaseRunner = resolve; });
  const runnerHoldingHeartbeat = new Promise(resolve => { announceRunner = resolve; });
  let ownerProbed = false, runnerPaused = false;
  const storage = { ...database, getStore(options) {
    const store = database.getStore(options);
    return { ...store, async get(key, options) {
      const label = labels.getStore();
      // The fixed dashboard attempts heartbeat before holding a run lock. The
      // old dashboard instead holds a run lock before it attempts heartbeat.
      if (label === 'owner' && key === 'runner/heartbeat.json' && !ownerProbed) {
        ownerProbed = true; releaseRunner();
      }
      const value = await store.get(key, options);
      if (label === 'owner' && key.startsWith('runs/') && !ownerProbed) {
        ownerProbed = true; releaseRunner();
      }
      if (label === 'runner' && key === 'runner/heartbeat.json' && !runnerPaused) {
        runnerPaused = true; announceRunner(); await ownerProbe;
      }
      return value;
    } };
  } };
  const owner = 'owner@example.invalid', secret = 'fixture-session-secret-'.repeat(3), runnerSecret = 'fixture-runner-secret-'.repeat(3);
  const env = { WORKBENCH_OWNER_EMAIL: owner, WORKBENCH_SESSION_SECRET: secret, WORKBENCH_RUNNER_SECRET: runnerSecret,
    WORKBENCH_ORIGIN: 'https://www.beiqiang.online', WORKBENCH_RUNNER_MODE: 'self_hosted', WORKBENCH_AUTODISPATCH: 'enabled' };
  let app;
  try {
    await database.initialize();
    const store = database.getStore(STORE_NAME), token = 'a'.repeat(64), runId = 'b'.repeat(32), now = new Date().toISOString();
    await store.setJSON(`sessions/${hash(token)}.json`, { email: owner, expires_at: new Date(Date.now() + 60000).toISOString(), csrf_token: 'fixture-csrf' });
    await store.setJSON('runner/heartbeat.json', { at: now, capabilities: { ready: true, auth: 'api', model: 'gpt-6-luna', models: ['gpt-6-luna'] } });
    await store.setJSON(versionKey('runs', runId, 1), { id: runId, version: 1, status: 'awaiting_review', title: 'fixture', task_id: null, source: null, created_at: now, updated_at: now });
    const routes = await loadRoutes();
    const ownerRoute = routes.get('/api/workbench'), runnerRoute = routes.get('/api/workbench-runner');
    routes.set('/api/workbench', { ...ownerRoute, GET: context => labels.run('owner', () => ownerRoute.GET(context)) });
    routes.set('/api/workbench-runner', { ...runnerRoute, POST: context => labels.run('runner', () => runnerRoute.POST(context)) });
    app = await createApiServer({ storage, routes, env, publicOrigin: env.WORKBENCH_ORIGIN });
    await new Promise(resolve => app.server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${app.server.address().port}`;
    const claim = fetch(`${base}/api/workbench-runner`, { method: 'POST', signal: AbortSignal.timeout(10000),
      headers: { authorization: `Bearer ${runnerSecret}`, 'content-type': 'application/json' }, body: JSON.stringify({ action: 'claim' }) });
    await runnerHoldingHeartbeat;
    const dashboard = fetch(`${base}/api/workbench`, { signal: AbortSignal.timeout(10000), headers: { cookie: `${COOKIE}=${token}.${sign(token, secret)}` } });
    const [claimResponse, dashboardResponse] = await Promise.all([claim, dashboard]);
    assert.equal(claimResponse.status, 200);
    assert.equal((await claimResponse.json()).job, null);
    assert.equal(dashboardResponse.status, 200);
    assert.equal((await dashboardResponse.json()).runs.length, 1);

    // Exercise the real transaction wrapper: the special signal is emitted
    // only after an aborted transaction has removed the attempted write.
    app.routes.set('/api/workbench-runner', { POST: async () => {
      await getStore({ name: STORE_NAME }).setJSON('fixture/partial.json', { shouldNotPersist: true });
      throw Object.assign(new Error('fixture deadlock'), { code: '40P01' });
    } });
    const rollback = await fetch(`${base}/api/workbench-runner`, { method: 'POST' });
    assert.equal(rollback.status, 409);
    assert.equal((await rollback.json()).code, 'RUNNER_TRANSACTION_ROLLED_BACK');
    assert.equal(await store.get('fixture/partial.json', { type: 'json' }), null);
  } finally {
    if (app) await app.close(); else await database.close();
    const cleanup = new Pool({ connectionString: url });
    try { await cleanup.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`); } finally { await cleanup.end(); }
    await rm(dataDir, { recursive: true, force: true });
  }
});
