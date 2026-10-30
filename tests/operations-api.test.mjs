import test from 'node:test';
import assert from 'node:assert/strict';
import { createOperationsHandlers } from '../edgeone-deploy/cloud-functions/api/operations.js';
import { COOKIE, STORE_NAME, hash, sign } from '../edgeone-deploy/cloud-functions/_lib/workbench.js';
import { OPS_STORE, sourceHash } from '../edgeone-deploy/cloud-functions/_lib/operations.js';

const ORIGIN = 'https://www.beiqiang.online', REF = 'BQ-20261030-ABC12345';
function fixture() {
  const env = { WORKBENCH_OWNER_EMAIL: 'owner@example.com', WORKBENCH_SESSION_SECRET: 'fixture-secret-over-thirty-two-bytes', WORKBENCH_ORIGIN: ORIGIN };
  const stores = new Map(), writes = [], calls = []; let id = 0;
  function store(name) {
    if (stores.has(name)) return stores.get(name);
    const data = new Map(); const result = {
      data,
      async get(key, options) { assert.equal(options.consistency, 'strong'); return structuredClone(data.get(key) ?? null); },
      async setJSON(key, value, options) {
        if (options.onlyIfNew && data.has(key)) { const e = new Error(); e.code = 'PRECONDITION_FAILED'; throw e; }
        writes.push({ name, key, options }); data.set(key, structuredClone(value));
      },
      async list(options) {
        assert.equal(options.paginate, false); assert.equal(options.consistency, 'strong'); calls.push({ name, ...options });
        const keys = [...data.keys()].filter(key => key.startsWith(options.prefix)).sort(), start = Number(options.cursor || 0), size = Math.min(options.limit, 7);
        return { blobs: keys.slice(start, start + size).map(key => ({ key })), cursor: start + size < keys.length ? String(start + size) : undefined };
      },
    }; stores.set(name, result); return result;
  }
  const token = 'a'.repeat(64), csrf = 'csrf-test', cookie = `${COOKIE}=${token}.${sign(token, env.WORKBENCH_SESSION_SECRET)}`;
  store(STORE_NAME).data.set(`sessions/${hash(token)}.json`, { email: env.WORKBENCH_OWNER_EMAIL, expires_at: '2027-01-01T00:00:00Z', csrf_token: csrf });
  const raw = { reference: REF, receivedAt: '2026-10-30T00:00:00Z', name: 'Buyer', company: 'Company', email: 'buyer@example.com', requirements: 'Need shoes', accessTokenHash: 'SECRET_TOKEN', ipHash: 'SECRET_IP', pendingUploads: [{ key: 'SECRET_PENDING' }], attachments: [{ name: 'brief.pdf', key: 'SECRET_FILE', url: 'SECRET_URL' }], messages: [{ sender: 'buyer', body: 'Hello', sentAt: '2026-10-30T00:00:00Z', key: 'SECRET_MESSAGE' }] };
  const sourceKey = `inquiries/2026-10-30/${REF}.json`; store('beiqiang-inquiries').data.set(sourceKey, structuredClone(raw));
  const api = createOperationsHandlers({ getStoreImpl: options => store(options.name), nowImpl: () => new Date('2026-10-30T12:00:00Z'), randomBytesImpl: () => Buffer.from((++id).toString(16).padStart(32, '0'), 'hex') });
  async function call(body, { query = '', authenticated = true, csrfValue = csrf, origin = ORIGIN } = {}) {
    const headers = {}; if (authenticated) headers.cookie = cookie;
    if (body) Object.assign(headers, { origin, 'content-type': 'application/json', 'x-workbench-token': csrfValue });
    const response = await api[body ? 'onRequestPost' : 'onRequestGet']({ env, request: new Request(`${ORIGIN}/api/operations${query}`, { method: body ? 'POST' : 'GET', headers, ...(body ? { body: JSON.stringify(body) } : {}) }) });
    return { status: response.status, body: await response.json() };
  }
  const prepare = (fields = {}, extras = {}) => call({ action: 'prepare', reference: REF, source_hash: sourceHash(store('beiqiang-inquiries').data.get(sourceKey)), expected_version: 0, method: 'manual', fields: { internal_note: 'Reviewed requirements', next_action: 'Confirm size ratio', handling_status: 'handled', ...fields }, ...extras });
  return { api, call, prepare, store, writes, calls, raw, sourceKey };
}
test('owner session, same origin and session CSRF guard the operations API', async () => {
  const f = fixture(); assert.equal((await f.call(null, { authenticated: false })).status, 401);
  const body = { action: 'prepare', reference: REF };
  assert.equal((await f.call(body, { origin: 'https://evil.example' })).status, 403);
  assert.equal((await f.call(body, { csrfValue: 'wrong' })).status, 403);
  assert.equal(f.writes.length, 0);
});
test('reads all source pages beyond 500 and exposes only safe summary and detail fields', async () => {
  const f = fixture();
  for (let n = 0; n < 510; n++) { const reference = `BQ-20261030-${String(n).padStart(8, '0')}`; f.store('beiqiang-inquiries').data.set(`inquiries/2026-10-30/${reference}.json`, { ...f.raw, reference }); }
  const result = await f.call(null, { query: '?view=all&limit=100&cursor=500' });
  assert.equal(result.status, 200); assert.equal(result.body.total, 511); assert.equal(result.body.items.length, 11); assert.equal(result.body.pagecursor, null);
  assert.ok(f.calls.some(call => call.cursor)); assert.ok(!JSON.stringify(result.body).includes('SECRET_')); assert.ok(!JSON.stringify(result.body).includes('buyer@example.com'));
  const detail = await f.call(null, { query: `?reference=${REF}` }); assert.equal(detail.body.inquiry.email, 'buyer@example.com');
  assert.equal(detail.body.inquiry.messages[0].body, 'Hello'); assert.ok(!JSON.stringify(detail.body).includes('SECRET_'));
  assert.equal(result.body.source.postgres, false);
});
test('prepare is immutable proposal only; accept atomically commits handling plus decision and preserves original', async () => {
  const f = fixture(), prepared = await f.prepare(); assert.equal(prepared.status, 201); assert.equal(prepared.body.proposal.generated_by_ai, false);
  assert.equal((await f.call(null)).body.pending_total, 1);
  const accepted = await f.call({ action: 'review', reference: REF, proposal_id: prepared.body.proposal.id, decision: 'accept' });
  assert.equal(accepted.status, 200); assert.equal(accepted.body.handling.version, 1); assert.equal(accepted.body.handling.pending, false);
  assert.equal((await f.call(null)).body.total, 0); assert.equal((await f.call(null, { query: '?view=all' })).body.total, 1);
  assert.deepEqual(f.store('beiqiang-inquiries').data.get(f.sourceKey), f.raw);
  assert.equal(f.writes.filter(write => write.name === 'beiqiang-inquiries').length, 0);
  const commits = f.writes.filter(write => write.key.startsWith('handling/')); assert.equal(commits.length, 1); assert.equal(commits[0].options.onlyIfNew, true);
  const stored = f.store(OPS_STORE).data.get(commits[0].key); assert.equal(stored.decisions[prepared.body.proposal.id].decision, 'accept'); assert.equal(stored.internal_note, 'Reviewed requirements');
  assert.equal((await f.call({ action: 'review', reference: REF, proposal_id: prepared.body.proposal.id, decision: 'accept' })).status, 409);
});
test('two concurrent accepts cannot overwrite one another', async () => {
  const f = fixture(), a = await f.prepare(), b = await f.prepare({ next_action: 'Other action' });
  const results = await Promise.all([a, b].map(p => f.call({ action: 'review', reference: REF, proposal_id: p.body.proposal.id, decision: 'accept' })));
  assert.deepEqual(results.map(r => r.status).sort(), [200, 409]); assert.equal(f.writes.filter(w => w.key.startsWith('handling/')).length, 1);
});
test('source changes reject stale proposals and buyer new messages reopen handled inquiries', async () => {
  const f = fixture(), proposal = await f.prepare();
  f.store('beiqiang-inquiries').data.get(f.sourceKey).messages.push({ sender: 'buyer', body: 'New sizes' });
  assert.equal((await f.call({ action: 'review', reference: REF, proposal_id: proposal.body.proposal.id, decision: 'accept' })).status, 409);
  const fresh = await f.prepare(); assert.equal((await f.call({ action: 'review', reference: REF, proposal_id: fresh.body.proposal.id, decision: 'accept' })).status, 200);
  f.store('beiqiang-inquiries').data.get(f.sourceKey).messages.push({ sender: 'buyer', body: 'Another message' });
  const list = await f.call(null); assert.equal(list.body.pending_total, 1); assert.equal(list.body.items[0].handling.handling_status, 'handled'); assert.equal(list.body.items[0].handling.effective_status, 'open');
});
test('reject records a decision without applying proposal fields; outdated handling cannot prepare', async () => {
  const f = fixture(), p = await f.prepare();
  const rejected = await f.call({ action: 'review', reference: REF, proposal_id: p.body.proposal.id, decision: 'reject' });
  assert.equal(rejected.status, 200); assert.equal(rejected.body.handling.internal_note, ''); assert.equal(rejected.body.handling.version, 1);
  assert.equal((await f.prepare()).status, 409);
});
test('stale proposals can be rejected after source and handling changes without applying their fields', async () => {
  const f = fixture(), first = await f.prepare(), stale = await f.prepare({ internal_note: 'Never apply this stale note', next_action: 'Never apply stale next action' });
  assert.equal((await f.call({ action: 'review', reference: REF, proposal_id: first.body.proposal.id, decision: 'accept' })).status, 200);
  f.store('beiqiang-inquiries').data.get(f.sourceKey).messages.push({ sender: 'buyer', body: 'Changed requirement' });
  const reject = { action: 'review', reference: REF, proposal_id: stale.body.proposal.id, decision: 'reject' };
  const result = await f.call(reject);
  assert.equal(result.status, 200); assert.equal(result.body.handling.version, 2);
  assert.equal(result.body.handling.internal_note, 'Reviewed requirements'); assert.equal(result.body.handling.next_action, 'Confirm size ratio');
  assert.equal(result.body.handling.handling_status, 'handled'); assert.equal(result.body.handling.pending, true);
  assert.equal(result.body.proposal.decision.decision, 'reject');
  assert.equal(result.body.handling.decisions[first.body.proposal.id].decision, 'accept');
  assert.equal((await f.call(reject)).status, 409);
  assert.ok(f.writes.filter(write => write.key.startsWith('handling/')).every(write => write.options.onlyIfNew));
  assert.equal(f.writes.filter(write => write.name === 'beiqiang-inquiries').length, 0);
});
test('list excludes internal tests by default and explicitly includes them without hiding spam or lost', async () => {
  const f = fixture();
  for (const [suffix, fields] of [
    ['TEST0001', { internalTest: true }], ['TEST0002', { company: 'Deployment test company' }],
    ['SPAM0001', { status: 'spam' }], ['LOST0001', { status: 'lost' }],
  ]) {
    const reference = `BQ-20261030-${suffix}`;
    f.store('beiqiang-inquiries').data.set(`inquiries/2026-10-30/${reference}.json`, { ...f.raw, ...fields, reference });
  }
  const normal = await f.call(null);
  assert.equal(normal.body.source_total, 5); assert.equal(normal.body.test_total, 2); assert.equal(normal.body.total, 3); assert.equal(normal.body.pending_total, 3);
  assert.ok(normal.body.items.every(item => !item.internalTest)); assert.ok(normal.body.items.some(item => item.status === 'spam')); assert.ok(normal.body.items.some(item => item.status === 'lost'));
  const included = await f.call(null, { query: '?include_tests=1&view=all' });
  assert.equal(included.body.total, 5); assert.equal(included.body.pending_total, 5); assert.equal(included.body.test_total, 2);
  const detail = await f.call(null, { query: '?reference=BQ-20261030-TEST0001' });
  assert.equal(detail.status, 200); assert.equal(detail.body.inquiry.internalTest, true);
});
