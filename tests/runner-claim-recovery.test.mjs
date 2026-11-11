import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorkbenchRunnerHandler } from '../edgeone-deploy/cloud-functions/api/workbench-runner.js';
import { handleError, STORE_NAME, versionKey } from '../edgeone-deploy/cloud-functions/_lib/workbench.js';

const SLOT = 'runner/claim-receipt.json';
const ID = '1'.repeat(32), SECOND = '2'.repeat(32), RUN = 'a'.repeat(32);
function fixture({ transactional = true } = {}) {
  let now = new Date('2026-11-11T06:00:00Z'), failReceipt = false, tail = Promise.resolve();
  const data = new Map(), writes = [];
  const env = { WORKBENCH_OWNER_EMAIL: 'owner@example.invalid', WORKBENCH_SESSION_SECRET: 'fixture-session-secret'.repeat(3),
    WORKBENCH_RUNNER_SECRET: 'fixture-runner-secret'.repeat(3), WORKBENCH_ORIGIN: 'https://example.invalid', WORKBENCH_AUTODISPATCH: 'enabled' };
  const store = {
    async get(key) { return structuredClone(data.get(key) ?? null); },
    async setJSON(key, value, options = {}) {
      if (key === SLOT && failReceipt) { failReceipt = false; throw new Error('injected receipt persistence failure'); }
      if (options.onlyIfNew && data.has(key)) throw Object.assign(new Error('conflict'), { code: 'PRECONDITION_FAILED' });
      writes.push(key); data.set(key, structuredClone(value));
    },
    async delete(key) { data.delete(key); },
    async list({ prefix }) { return { blobs: [...data.keys()].filter(k => k.startsWith(prefix)).map(key => ({ key })) }; },
  };
  const handler = createWorkbenchRunnerHandler({ businessContext: true, transactional, nowImpl: () => now,
    getStoreImpl: ({ name }) => { assert.equal(name, STORE_NAME); return store; } });
  async function call(body, authenticated = true) {
    // Model the existing server transaction: serialization and all-or-nothing
    // persistence, including a receipt failure after a run transition.
    let unlock; const prior = tail; tail = new Promise(resolve => { unlock = resolve; }); await prior;
    const before = structuredClone(data), count = writes.length;
    try {
      let response;
      try { response = await handler({ env, request: new Request('https://example.invalid/api/workbench-runner', { method: 'POST',
        headers: { 'content-type': 'application/json', ...(authenticated ? { authorization: `Bearer ${env.WORKBENCH_RUNNER_SECRET}` } : {}) }, body: JSON.stringify(body) }) }); }
      catch (error) { data.clear(); for (const [k,v] of before) data.set(k,v); writes.splice(count); response = handleError(error); }
      return { status: response.status, body: await response.json() };
    } finally { unlock(); }
  }
  const heartbeat = () => call({ action: 'heartbeat', capabilities: { ready: true, auth: 'api', model: 'gpt-6-luna', models: ['gpt-6-luna'] } });
  function seed(id = RUN) { data.set(versionKey('runs', id, 1), { id, version: 1, kind: 'snapshot_review', task_id: null, source: null,
    status: 'queued', model: 'gpt-6-luna', title: 'Synthetic acceptance', created_at: now.toISOString(), updated_at: now.toISOString() }); }
  return { call, heartbeat, seed, data, writes, failNextReceipt() { failReceipt = true; }, advance() { now = new Date(now.getTime() + 10000); } };
}

test('transactional heartbeat advertises protocol; legacy blob refuses recovery claims', async () => {
  const f = fixture(); assert.equal((await f.heartbeat()).body.claim_protocol, 1);
  const old = fixture({ transactional: false }); assert.equal((await old.heartbeat()).body.claim_protocol, 0);
  assert.equal((await old.call({ action: 'claim', request_id: ID })).status, 503);
  assert.equal((await old.call({ action: 'claim_status', request_id: ID })).status, 503);
  assert.equal((await old.call({ action: 'claim' })).status, 200);
});

test('lost empty reply can be reconciled without heartbeat, lease, or new work', async () => {
  const f = fixture(); await f.heartbeat();
  const empty = await f.call({ action: 'claim', request_id: ID, public_web_research: true });
  assert.equal(empty.status, 200); assert.equal(empty.body.job, null); assert.equal(empty.body.request_id, ID);
  f.seed(); f.advance(); const before = structuredClone(f.data), writes = f.writes.length;
  const status = await f.call({ action: 'claim_status', request_id: ID, public_web_research: true });
  assert.equal(status.body.state, 'empty'); assert.equal(status.body.claim_protocol, 1);
  assert.deepEqual(f.data, before); assert.equal(f.writes.length, writes);
  const replay = await f.call({ action: 'claim', request_id: ID, public_web_research: true });
  assert.equal(replay.body.job, null); assert.equal(replay.body.replayed, true);
  assert.equal(f.data.has(`claims/${RUN}.json`), false);
});

test('claimed receipt cannot reveal or reissue a lease after a lost response', async () => {
  const f = fixture(); await f.heartbeat(); f.seed();
  const first = await f.call({ action: 'claim', request_id: ID });
  assert.equal(first.status, 200); assert.equal(first.body.job.id, RUN); assert.ok(first.body.job.lease_token);
  const before = structuredClone(f.data), writes = f.writes.length;
  const status = await f.call({ action: 'claim_status', request_id: ID });
  assert.equal(status.body.state, 'claimed'); assert.equal(status.body.run_id, RUN);
  assert.ok(!JSON.stringify(status).includes(first.body.job.lease_token));
  assert.ok(!JSON.stringify(f.data.get(SLOT)).includes(first.body.job.lease_token));
  assert.deepEqual(f.data, before); assert.equal(f.writes.length, writes);
  assert.equal((await f.call({ action: 'claim', request_id: ID })).status, 409);
  assert.deepEqual(f.data, before);
});

test('request scope mismatch, malformed IDs, and unauthenticated status fail closed', async () => {
  const f = fixture(); await f.heartbeat(); await f.call({ action: 'claim', request_id: ID });
  assert.equal((await f.call({ action: 'claim_status', request_id: ID, public_web_research: true })).status, 409);
  assert.equal((await f.call({ action: 'claim_status', request_id: ID, run_id: RUN })).status, 409);
  assert.equal((await f.call({ action: 'claim', request_id: ID, public_web_research: true })).status, 409);
  assert.equal((await f.call({ action: 'claim_status', request_id: 'wrong' })).status, 400);
  assert.equal((await f.call({ action: 'claim_status', request_id: ID }, false)).status, 401);
  assert.equal((await f.call({ action: 'claim_status', request_id: ID, public_web_research: 'true' })).status, 400);
});

test('missing and superseded receipts remain unknown; idle polling uses one bounded slot', async () => {
  const f = fixture(); await f.heartbeat();
  assert.equal((await f.call({ action: 'claim_status', request_id: ID })).body.state, 'unknown');
  for (let i=1;i<=20;i++) assert.equal((await f.call({ action: 'claim', request_id: i.toString(16).padStart(32,'0') })).body.job, null);
  assert.equal([...f.data.keys()].filter(k => k === SLOT).length, 1);
  assert.equal(f.data.size, 2); // heartbeat plus last receipt, no per-poll ledger
  assert.equal((await f.call({ action: 'claim_status', request_id: '1'.padStart(32,'0') })).body.state, 'unknown');
});

test('receipt write failure rolls back run and lease; status cannot claim safe empty', async () => {
  const f = fixture(); await f.heartbeat(); await f.call({ action: 'claim', request_id: SECOND }); f.seed(); const before = structuredClone(f.data);
  f.failNextReceipt(); assert.equal((await f.call({ action: 'claim', request_id: ID })).status, 503);
  assert.deepEqual(f.data, before);
  assert.equal((await f.call({ action: 'claim_status', request_id: SECOND })).body.state, 'empty');
  assert.equal((await f.call({ action: 'claim_status', request_id: ID })).body.state, 'unknown');
});

test('concurrent duplicate requests cannot issue two leases', async () => {
  const f = fixture(); await f.heartbeat(); f.seed();
  const result = await Promise.all([f.call({ action: 'claim', request_id: ID }), f.call({ action: 'claim', request_id: ID })]);
  assert.deepEqual(result.map(r=>r.status).sort(), [200,409]);
  assert.equal([...f.data.keys()].filter(k=>k.startsWith('claims/')).length, 1);
});

test('targeted claims bind the exact target and old no-ID clients stay compatible', async () => {
  const f = fixture(); await f.heartbeat(); f.seed();
  const first = await f.call({ action: 'claim', request_id: ID, run_id: RUN });
  assert.equal(first.body.job.id, RUN);
  assert.equal((await f.call({ action: 'claim_status', request_id: ID, run_id: RUN })).body.state, 'claimed');
  assert.equal((await f.call({ action: 'claim_status', request_id: ID })).status, 409);
  f.seed('b'.repeat(32)); const legacy = await f.call({ action: 'claim', run_id: 'b'.repeat(32) });
  assert.equal(legacy.status, 200); assert.ok(legacy.body.job.lease_token); assert.equal(legacy.body.request_id, undefined);
});

test('real PostgreSQL atomically rolls back the claim when its receipt fails', { skip: !process.env.SELF_HOSTED_TEST_DATABASE_URL, timeout: 20000 }, async () => {
  const { createStorage } = await import('../self-hosted/storage.mjs');
  const { createApiServer } = await import('../self-hosted/server.mjs');
  const { Pool } = await import('pg');
  const { randomUUID } = await import('node:crypto');
  const { mkdtemp, rm } = await import('node:fs/promises');
  const os = await import('node:os'), path = await import('node:path');
  const url = process.env.SELF_HOSTED_TEST_DATABASE_URL, schema = 'bq_claimtest_' + randomUUID().replaceAll('-', '');
  const dir = await mkdtemp(path.join(os.tmpdir(), 'bq-claimtest-'));
  const db = createStorage({ connectionString: url, dataDir: dir, schema });
  let failReceipt = true, pauseReceipt = false, app, staged, release;
  const receiptStaged = new Promise(resolve => { staged = resolve; });
  const releaseReceipt = new Promise(resolve => { release = resolve; });
  const storage = { ...db, getStore(options) { const s = db.getStore(options); return { ...s,
    async setJSON(key, value, settings) { if (key === SLOT && failReceipt) { failReceipt = false; throw new Error('injected receipt failure'); } const result = await s.setJSON(key, value, settings); if (key === SLOT && pauseReceipt) { pauseReceipt = false; staged(); await releaseReceipt; } return result; }
  }; } };
  const secret = 'fixture-only-runner-secret'.repeat(3);
  const env = { WORKBENCH_STORAGE: 'self_hosted', WORKBENCH_OWNER_EMAIL: 'owner@example.invalid', WORKBENCH_SESSION_SECRET: 'fixture-session-secret'.repeat(3), WORKBENCH_RUNNER_SECRET: secret, WORKBENCH_AUTODISPATCH: 'enabled', WORKBENCH_ORIGIN: 'https://example.invalid' };
  try {
    await db.initialize(); const store = db.getStore(STORE_NAME), stamp = new Date().toISOString();
    await store.setJSON('runner/heartbeat.json', { at: stamp, capabilities: { ready: true, auth: 'api', model: 'gpt-6-luna', models: ['gpt-6-luna'] } });
    await store.setJSON(SLOT, {request_id: '9'.repeat(32), scope_hash:'fixture-old-scope', state:'empty', at:stamp});
    const oldReceipt = await store.get(SLOT,{type:'json'});
    await store.setJSON(versionKey('runs',RUN,1), { id: RUN, version: 1, status: 'queued', source: null, model: 'gpt-6-luna', created_at: stamp, updated_at: stamp });
    app = await createApiServer({ storage, env, publicOrigin: env.WORKBENCH_ORIGIN, routes: new Map([['/api/workbench-runner', { POST: createWorkbenchRunnerHandler() }]]) });
    await new Promise(resolve => app.server.listen(0,'127.0.0.1',resolve));
    const call = async body => { const r = await fetch(`http://127.0.0.1:${app.server.address().port}/api/workbench-runner`, { method:'POST', headers:{'content-type':'application/json',authorization:`Bearer ${secret}`}, body:JSON.stringify(body) }); return {status:r.status,body:await r.json()}; };
    assert.ok((await call({action:'claim',request_id:ID})).status >= 500);
    assert.equal(await store.get(`claims/${RUN}.json`,{type:'json'}),null);
    assert.equal(await store.get(versionKey('runs',RUN,2),{type:'json'}),null);
    assert.equal((await call({action:'claim_status',request_id:ID})).body.state,'unknown');
    assert.deepEqual(await store.get(SLOT,{type:'json'}), oldReceipt);
    pauseReceipt = true;
    const first = call({action:'claim',request_id:SECOND});
    await receiptStaged;
    let statusSettled = false;
    const statusRead = call({action:'claim_status',request_id:SECOND}).then(value => {statusSettled = true; return value;});
    await new Promise(resolve => setTimeout(resolve,100));
    assert.equal(statusSettled,false,'status must wait for the in-flight receipt transaction');
    release();
    assert.equal((await statusRead).body.state,'claimed');
    const results = await Promise.all([first,call({action:'claim',request_id:SECOND})]);
    assert.deepEqual(results.map(x=>x.status).sort(),[200,409]);
    const view = await call({action:'claim_status',request_id:SECOND});
    assert.equal(view.body.state,'claimed'); assert.equal(view.body.run_id,RUN);
    assert.equal(Object.hasOwn(view.body,'lease_token'),false);
  } finally {
    release();
    if(app)await app.close(); else await db.close();
    const cleanup = new Pool({connectionString:url});
    try {await cleanup.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);} finally {await cleanup.end();}
    await rm(dir,{recursive:true,force:true});
  }
});
