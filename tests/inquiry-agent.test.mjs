import test from 'node:test';
import assert from 'node:assert/strict';
import { createOperationsHandlers } from '../edgeone-deploy/cloud-functions/api/operations.js';
import { createWorkbenchRunnerHandler } from '../edgeone-deploy/cloud-functions/api/workbench-runner.js';
import { createWorkbenchHandlers } from '../edgeone-deploy/cloud-functions/api/workbench.js';
import { COOKIE, STORE_NAME, acquireLock, activeLock, hash, sign, lockKey, latest, releaseLock } from '../edgeone-deploy/cloud-functions/_lib/workbench.js';
import { OPS_STORE, sourceHash } from '../edgeone-deploy/cloud-functions/_lib/operations.js';

const ORIGIN = 'https://workbench.example.com', REF = 'BQ-20261030-AGENT001';
const result = { summary: 'Need size and delivery confirmation', changes: [], next_steps: ['Confirm requirements'], fields: { internal_note: 'Buyer asks for casual shoes; material is unconfirmed.', next_action: 'Confirm size ratio', handling_status: 'handled' } };
function fixture() {
  let now = new Date('2026-10-30T10:00:00Z'), count = 0, rejectNextRunWrite = false;
  const env = { WORKBENCH_OWNER_EMAIL: 'fixture@example.com', WORKBENCH_SESSION_SECRET: 'session-secret-test-more-than-32-bytes', WORKBENCH_RUNNER_SECRET: 'runner-secret-test-more-than-32-bytes', WORKBENCH_ORIGIN: ORIGIN, WORKBENCH_RUNNER_MODE: 'manual_cloud' };
  const stores = new Map(), writes = [];
  function store(name) {
    if (stores.has(name)) return stores.get(name);
    const data = new Map(), item = {
      data,
      async get(key) { return structuredClone(data.get(key) ?? null); },
      async delete(key) { data.delete(key); },
      async list({ prefix, limit = Infinity }) { return { blobs: [...data.keys()].filter(k => k.startsWith(prefix)).slice(0, limit).map(key => ({ key })) }; },
      async setJSON(key, value, options) {
        if (rejectNextRunWrite && key.startsWith('runs/') && value.status === 'running') { rejectNextRunWrite = false; throw new Error('fixture write failed'); }
        if (options.onlyIfNew && data.has(key)) { const e = new Error(); e.code = 'PRECONDITION_FAILED'; throw e; }
        writes.push({ name, key, value: structuredClone(value), options }); data.set(key, structuredClone(value));
      },
    }; stores.set(name, item); return item;
  }
  const token = 'a'.repeat(64), csrf = 'fixture-csrf', cookie = `${COOKIE}=${token}.${sign(token, env.WORKBENCH_SESSION_SECRET)}`;
  store(STORE_NAME).data.set(`sessions/${hash(token)}.json`, { email: env.WORKBENCH_OWNER_EMAIL, csrf_token: csrf, expires_at: '2027-01-01T00:00:00Z' });
  const raw = { reference: REF, name: 'Internal test', company: 'Internal test only', requirements: 'Need casual shoes', receivedAt: '2026-10-30T09:00:00Z', accessTokenHash: 'SECRET_SOURCE_TOKEN', ipHash: 'SECRET_IP', attachments: [{ name: 'test.pdf', key: 'SECRET_ATTACHMENT_KEY' }], messages: [{ sender: 'buyer', body: 'What sizes?', sentAt: '2026-10-30T09:01:00Z' }] };
  const sourceKey = `inquiries/2026-10-30/${REF}.json`; store('beiqiang-inquiries').data.set(sourceKey, structuredClone(raw));
  const deps = { getStoreImpl: options => store(options.name), nowImpl: () => now, randomBytesImpl: n => Buffer.from((++count).toString(16).padStart(n * 2, '0'), 'hex') };
  const ops = createOperationsHandlers(deps), runner = createWorkbenchRunnerHandler(deps), wb = createWorkbenchHandlers(deps);
  async function call(handler, body, { query = '', owner = true, csrfValue = csrf, bearer = env.WORKBENCH_RUNNER_SECRET } = {}) {
    const machine = handler === runner, headers = { 'content-type': 'application/json', origin: ORIGIN };
    if (owner) headers.cookie = cookie; headers['x-workbench-token'] = csrfValue;
    if (machine) headers.authorization = `Bearer ${bearer}`;
    const response = await handler({ env, request: new Request(ORIGIN + '/api/test' + query, { method: body ? 'POST' : 'GET', headers, ...(body ? { body: JSON.stringify(body) } : {}) }) });
    return { status: response.status, body: await response.json() };
  }
  const detail = () => call(ops.onRequestGet, null, { query: `?reference=${REF}` });
  const enqueue = async (extra = {}) => call(ops.onRequestPost, { action: 'enqueue_agent', reference: REF, source_hash: sourceHash(store('beiqiang-inquiries').data.get(sourceKey)), expected_version: (await detail()).body.handling.version, instruction: 'Analyze only; do not contact anyone', ...extra });
  const machine = body => call(runner, body);
  const review = (id, decision = 'accept') => call(ops.onRequestPost, { action: 'review', reference: REF, proposal_id: id, decision });
  async function completeRun() {
    const run = (await enqueue()).body.run, claimed = await machine({ action: 'claim', run_id: run.id }); assert.equal(claimed.status, 200);
    const lease_token = claimed.body.job.lease_token, completed = await machine({ action: 'complete', run_id: run.id, lease_token, result, session_id: 'test-sol-session' }); assert.equal(completed.status, 200);
    return { run, lease_token, completed };
  }
  return { store, writes, ops, wb, runner, call, detail, enqueue, machine, review, completeRun, raw, sourceKey, changeSource() { store('beiqiang-inquiries').data.get(sourceKey).messages.push({ sender: 'buyer', body: 'New requirement', sentAt: now.toISOString() }); }, advance(ms) { now = new Date(now.getTime() + ms); }, failClaimWrite() { rejectNextRunWrite = true; } };
}
test('enqueue requires owner/CSRF/current versions and forces a safe Sol context', async () => {
  const f = fixture();
  assert.equal((await f.call(f.ops.onRequestPost, { action: 'enqueue_agent', reference: REF }, { owner: false })).status, 401);
  assert.equal((await f.call(f.ops.onRequestPost, { action: 'enqueue_agent', reference: REF }, { csrfValue: 'wrong' })).status, 403);
  assert.equal((await f.enqueue({ source_hash: 'stale' })).status, 409);
  const response = await f.enqueue({ model: 'other-model' }); assert.equal(response.status, 201); assert.equal(response.body.run.model, 'gpt-6.1-sol'); assert.ok(!('inquiry_context' in response.body.run));
  const run = await latest(f.store(STORE_NAME), 'runs', response.body.run.id); assert.equal(run.kind, 'inquiry_review'); assert.equal(run.source, null); assert.equal(run.inquiry_context.inquiry.reference, REF); assert.equal(run.control_snapshot.version, 0);
  assert.ok(!JSON.stringify(run).includes('SECRET_')); assert.equal(f.writes.some(w => w.name === 'beiqiang-inquiries'), false);
});
test('concurrent enqueue and claim allow one active run and one claimant per inquiry', async () => {
  const f = fixture(), queued = await Promise.all([f.enqueue(), f.enqueue()]); assert.deepEqual(queued.map(r => r.status).sort(), [201, 409]);
  const run = queued.find(r => r.status === 201).body.run, claims = await Promise.all([f.machine({ action: 'claim', run_id: run.id }), f.machine({ action: 'claim', run_id: run.id })]);
  assert.deepEqual(claims.map(r => r.status).sort(), [200, 409]); assert.equal((await f.enqueue()).status, 409);
});
test('real runner result projects a proposal, operations acceptance is sole decision and old review is blocked', async () => {
  const f = fixture(), { run } = await f.completeRun(), detail = await f.detail(), proposal = detail.body.proposals[0];
  assert.equal(proposal.id, run.id); assert.equal(proposal.generated_by_ai, true); assert.equal(proposal.method, 'agent'); assert.equal(proposal.stale, false); assert.equal(detail.body.agent_runs[0].status, 'awaiting_review');
  assert.equal((await f.call(f.wb.onRequestPost, { action: 'review', run_id: run.id, expected_version: 3, decision: 'accept' })).status, 409);
  const accepted = await f.review(run.id); assert.equal(accepted.status, 200); assert.equal(accepted.body.handling.internal_note, result.fields.internal_note);
  const final = await f.detail(); assert.equal(final.body.agent_runs[0].status, 'accepted'); assert.equal(final.body.proposals[0].decision.decision, 'accept');
  assert.equal((await latest(f.store(STORE_NAME), 'runs', run.id)).status, 'awaiting_review');
  const workbenchView = await f.call(f.wb.onRequestGet, null, { query: `?run_id=${run.id}` }); assert.equal(workbenchView.body.run.status, 'accepted'); assert.equal(workbenchView.body.run.inquiry_context, undefined);
  assert.equal([...f.store(OPS_STORE).data.keys()].filter(key => key.startsWith('proposals/')).length, 0);
  assert.deepEqual(f.store('beiqiang-inquiries').data.get(f.sourceKey), f.raw);
});
test('complete rejects document changes, unknown fields and invalid fields without altering handling', async () => {
  const f = fixture(), run = (await f.enqueue()).body.run, claim = (await f.machine({ action: 'claim', run_id: run.id })).body.job;
  for (const invalid of [{ ...result, changes: [{ path: 'other', before: 'x', after: 'y' }] }, { ...result, fields: { ...result.fields, email: 'x' } }, { ...result, fields: { ...result.fields, handling_status: 'sold' } }, { ...result, summary: '' }, { ...result, fields: null }]) {
    assert.equal((await f.machine({ action: 'complete', run_id: run.id, lease_token: claim.lease_token, result: invalid })).status, 400);
  }
  assert.equal((await f.detail()).body.handling.version, 0); assert.equal((await latest(f.store(STORE_NAME), 'runs', run.id)).status, 'running');
});
test('source changes before claim fail run without orphan claim and permit a replacement', async () => {
  const f = fixture(), run = (await f.enqueue()).body.run; f.changeSource();
  assert.equal((await f.machine({ action: 'claim', run_id: run.id })).status, 409);
  assert.equal(f.store(STORE_NAME).data.has(`claims/${run.id}.json`), false); assert.equal((await latest(f.store(STORE_NAME), 'runs', run.id)).status, 'failed');
  assert.equal((await activeLock(f.store(STORE_NAME), run)).run_id, null); assert.equal((await f.enqueue()).status, 201);
});
test('failed running transition clears own orphan claim and permits explicit retry', async () => {
  const f = fixture(), run = (await f.enqueue()).body.run; f.failClaimWrite();
  assert.equal((await f.machine({ action: 'claim', run_id: run.id })).status, 503); assert.equal(f.store(STORE_NAME).data.has(`claims/${run.id}.json`), false);
  assert.equal((await f.machine({ action: 'claim', run_id: run.id })).status, 200);
});
test('expired lease is persisted interrupted, releases lock, and old worker cannot complete', async () => {
  const f = fixture(), run = (await f.enqueue()).body.run, job = (await f.machine({ action: 'claim', run_id: run.id })).body.job;
  f.advance(11 * 60000); const detail = await f.detail(); assert.equal(detail.body.agent_runs[0].status, 'interrupted');
  assert.equal((await latest(f.store(STORE_NAME), 'runs', run.id)).status, 'interrupted'); assert.equal((await activeLock(f.store(STORE_NAME), run)).run_id, null);
  assert.equal((await f.machine({ action: 'complete', run_id: run.id, lease_token: job.lease_token, result })).status, 409);
  assert.equal((await f.enqueue()).status, 201);
});
test('owner cancellation frees object and rejects an old lease', async () => {
  const f = fixture(), run = (await f.enqueue()).body.run, job = (await f.machine({ action: 'claim', run_id: run.id })).body.job;
  assert.equal((await f.call(f.wb.onRequestPost, { action: 'cancel', run_id: run.id })).status, 200);
  assert.equal((await f.machine({ action: 'heartbeat', run_id: run.id, lease_token: job.lease_token })).status, 409); assert.equal((await f.enqueue()).status, 201);
});
test('changed source after generation makes AI proposal stale; stale rejection is retained', async () => {
  const f = fixture(), { run } = await f.completeRun(); f.changeSource();
  const detail = await f.detail(); assert.equal(detail.body.proposals[0].stale, true); assert.equal(detail.body.agent_runs[0].stale, true);
  assert.equal((await f.review(run.id)).status, 409); assert.equal((await f.review(run.id, 'reject')).status, 200);
  assert.equal((await f.detail()).body.agent_runs[0].status, 'rejected'); assert.equal((await f.detail()).body.handling.internal_note, '');
});
test('machine status recovers uncertain complete without lease and omits context/credentials', async () => {
  const f = fixture(), { run, lease_token } = await f.completeRun();
  const recovered = await f.machine({ action: 'status', run_id: run.id }); assert.equal(recovered.status, 200); assert.equal(recovered.body.run.status, 'awaiting_review'); assert.deepEqual(recovered.body.run.result, result);
  for (const key of ['lease_token', 'token_hash', 'inquiry_context', 'control_snapshot', 'document']) assert.ok(!JSON.stringify(recovered.body).includes(`"${key}"`));
  assert.equal((await f.machine({ action: 'complete', run_id: run.id, lease_token, result })).status, 409);
  assert.equal((await f.call(f.runner, { action: 'status', run_id: run.id }, { bearer: 'wrong' })).status, 401);
});
test('handling changes invalidate AI acceptance and two simultaneous decisions cannot overwrite', async () => {
  const f = fixture(), { run } = await f.completeRun();
  const manual = await f.call(f.ops.onRequestPost, { action: 'prepare', reference: REF, source_hash: sourceHash(f.store('beiqiang-inquiries').data.get(f.sourceKey)), expected_version: 0, method: 'manual', fields: { internal_note: 'Owner newer judgment', next_action: 'Get original evidence', handling_status: 'open' } });
  assert.equal((await f.review(manual.body.proposal.id)).status, 200); assert.equal((await f.review(run.id)).status, 409);
  assert.equal((await f.review(run.id, 'reject')).status, 200); assert.equal((await f.detail()).body.handling.internal_note, 'Owner newer judgment');
  const fresh = await f.completeRun(), decisions = await Promise.all([f.review(fresh.run.id), f.review(fresh.run.id)]);
  assert.deepEqual(decisions.map(value => value.status).sort(), [200, 409]);
});
test('late release cannot clear a newer owner, including first legacy lock migration', async () => {
  for (const legacy of [false, true]) {
    const f = fixture(), store = f.store(STORE_NAME), old = { id: 'a'.repeat(32), kind: 'inquiry_review', inquiry_reference: REF }, next = { ...old, id: 'b'.repeat(32) };
    if (legacy) store.data.set(lockKey(old), { run_id: old.id, at: 'legacy-original' }); else await acquireLock(store, old);
    let resume, paused; const reached = new Promise(resolve => { paused = resolve; }), gate = new Promise(resolve => { resume = resolve; });
    const originalSet = store.setJSON; let held = false;
    store.setJSON = async (key, value, options) => {
      if (key.startsWith('object_locks/') && value.run_id === null && !held) { held = true; paused(); await gate; }
      return originalSet(key, value, options);
    };
    const lateRelease = releaseLock(store, old); await reached;
    await releaseLock(store, old); await acquireLock(store, next);
    resume(); await lateRelease;
    assert.equal((await activeLock(store, old)).run_id, next.id);
    await assert.rejects(acquireLock(store, { ...old, id: 'c'.repeat(32) }), error => error.status === 409);
    if (legacy) assert.deepEqual(store.data.get(lockKey(old)), { run_id: old.id, at: 'legacy-original' });
    assert.ok(f.writes.filter(write => write.key.startsWith('object_locks/')).every(write => write.options.onlyIfNew));
  }
});
test('document and generic task queues use append-only locks and optional inquiry instruction gets server default', async () => {
  const f = fixture(), response = await f.enqueue({ instruction: '' }); assert.equal(response.status, 201);
  assert.match(response.body.run.instruction, /不承诺未确认价格\/材料\/交期/);
  const store = f.store(STORE_NAME), docA = { id: 'd'.repeat(32), source: 'source.md', task_id: '1' }, docB = { ...docA, id: 'e'.repeat(32), task_id: '2' };
  await acquireLock(store, docA); await assert.rejects(acquireLock(store, docB), error => error.status === 409); await releaseLock(store, docA); await acquireLock(store, docB);
  assert.equal((await activeLock(store, docA)).run_id, docB.id); assert.equal(f.writes.some(write => write.key.startsWith('active/')), false);
});
