import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorkbenchAuthHandlers } from '../edgeone-deploy/cloud-functions/api/workbench-auth.js';
import { createWorkbenchHandlers } from '../edgeone-deploy/cloud-functions/api/workbench.js';
import { createWorkbenchRunnerHandler } from '../edgeone-deploy/cloud-functions/api/workbench-runner.js';
import { COOKIE, hash, STORE_NAME } from '../edgeone-deploy/cloud-functions/_lib/workbench.js';

const ORIGIN = 'https://workbench.example.com';
const SOURCE = '00_总控台/当前状态.md';
function fixture() {
  let date = new Date('2026-10-29T00:00:00Z'); const data = new Map(), writes = [], mail = [];
  const env = { WORKBENCH_OWNER_EMAIL: 'owner@example.com', WORKBENCH_SESSION_SECRET: 'fixture-only-32-byte-session-secret-long', WORKBENCH_RUNNER_SECRET: 'fixture-only-32-byte-runner-secret-long', WORKBENCH_ORIGIN: ORIGIN, SMTP_PASS: 'test-not-a-real-smtp-credential', SMTP_USER: 'sender@example.com' };
  const store = {
    async get(key) { return structuredClone(data.get(key) ?? null); },
    async setJSON(key, value, options) { if (options.onlyIfNew && data.has(key)) { const error = new Error('conditional conflict'); error.code = 'PRECONDITION_FAILED'; throw error; } writes.push({ key, options }); data.set(key, structuredClone(value)); },
    async delete(key) { data.delete(key); },
    async list({ prefix, limit = Infinity }) { return { blobs: [...data.keys()].filter(key => key.startsWith(prefix)).slice(0, limit).map(key => ({ key })) }; },
    createUploadUrl() { assert.fail('Private workbench must never sign a public object URL'); },
  };
  const deps = { getStoreImpl(options) { assert.deepEqual(options, { name: STORE_NAME, consistency: 'strong' }); return store; }, nowImpl: () => date, createTransportImpl: () => ({ async sendMail(message) { mail.push(message); }, close() {} }) };
  const auth = createWorkbenchAuthHandlers(deps), api = createWorkbenchHandlers(deps), runner = createWorkbenchRunnerHandler(deps);
  async function request(handler, body, { cookie, csrf, origin = ORIGIN, method = 'POST', path = '/api/workbench', bearer, customEnv = env } = {}) {
    const headers = { origin, 'content-type': 'application/json' }; if (cookie) headers.cookie = cookie; if (csrf) headers['x-workbench-token'] = csrf; if (bearer) headers.authorization = `Bearer ${bearer}`;
    const response = await handler({ env: customEnv, request: new Request(ORIGIN + path, { method, headers, ...(method === 'GET' ? {} : { body: JSON.stringify(body) }) }) });
    return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie'), response };
  }
  async function login() {
    const sent = await request(auth.onRequestPost, { action: 'request', email: env.WORKBENCH_OWNER_EMAIL }); assert.equal(sent.status, 202);
    const token = /#token=([a-f0-9]{64})/.exec(mail.at(-1).text)[1], verified = await request(auth.onRequestPost, { action: 'verify', token }); assert.equal(verified.status, 200);
    return { cookie: verified.cookie.split(';')[0], csrf: verified.body.csrf_token, token, verified };
  }
  const call = (body, options) => request(api.onRequestPost, body, options);
  const run = body => request(runner, body, { bearer: env.WORKBENCH_RUNNER_SECRET });
  return { env, data, writes, mail, store, auth, api, runner, request, login, call, run, advance(ms) { date = new Date(date.getTime() + ms); } };
}

test('all business reads and writes require real owner session; old admin token is irrelevant', async () => {
  const f = fixture();
  assert.deepEqual((await f.request(f.auth.onRequestGet, null, { method: 'GET' })).body, { authenticated: false });
  assert.equal((await f.request(f.api.onRequestGet, null, { method: 'GET' })).status, 401);
  assert.equal((await f.request(f.api.onRequestGet, null, { method: 'GET', path: `/api/workbench?document=${encodeURIComponent(SOURCE)}` })).status, 401);
  assert.equal((await f.call({ action: 'create', task: { title: 'Unauthorized' } })).status, 401);
  const missing = { INQUIRY_ADMIN_TOKEN: 'old-admin-token' };
  assert.equal((await f.request(f.auth.onRequestGet, null, { method: 'GET', customEnv: missing })).status, 503);
  assert.equal(f.data.size, 0);
});

test('email identity stays server-side; unknown addresses receive generic response and no mail', async () => {
  const f = fixture(); const unknown = await f.request(f.auth.onRequestPost, { action: 'request', email: 'other@example.com' });
  assert.equal(unknown.status, 202); assert.equal(f.mail.length, 0); assert.equal(f.data.size, 0);
  const owner = await f.request(f.auth.onRequestPost, { action: 'request', email: ' OWNER@example.com ' });
  assert.deepEqual(owner.body, unknown.body); assert.equal(f.mail.length, 1); assert.equal(f.mail[0].to, 'owner@example.com'); assert.ok(!JSON.stringify(owner.body).includes('owner@example.com'));
  assert.match(f.mail[0].text, /https:\/\/workbench.example.com\/admin\/workbench\/#token=[a-f0-9]{64}/);
  assert.equal((await f.request(f.auth.onRequestPost, { action: 'request', email: 'owner@example.com' })).status, 429);
});

test('one-time link is atomically consumed, expires, and only sets secure server session cookie', async () => {
  const f = fixture(); const s = await f.login();
  assert.match(s.verified.cookie, new RegExp(`^${COOKIE}=`)); for (const value of ['HttpOnly', 'Secure', 'SameSite=Strict', 'Path=/', 'Max-Age=28800']) assert.ok(s.verified.cookie.includes(value));
  assert.equal((await f.request(f.auth.onRequestPost, { action: 'verify', token: s.token })).status, 410);
  assert.equal((await f.request(f.auth.onRequestPost, { action: 'verify', token: 'expired' })).status, 410);
  assert.equal((await f.request(f.auth.onRequestGet, null, { method: 'GET', cookie: s.cookie })).body.authenticated, true);
  assert.equal((await f.request(f.auth.onRequestGet, null, { method: 'GET', cookie: s.cookie.slice(0, -1) + 'z' })).body.authenticated, false);
  f.advance(8 * 3600000 + 1); assert.equal((await f.request(f.api.onRequestGet, null, { method: 'GET', cookie: s.cookie })).status, 401);
  const g = fixture(); await g.request(g.auth.onRequestPost, { action: 'request', email: 'owner@example.com' }); const token = /#token=([a-f0-9]{64})/.exec(g.mail[0].text)[1]; g.advance(15 * 60000 + 1);
  assert.equal((await g.request(g.auth.onRequestPost, { action: 'verify', token })).status, 410);
});

test('concurrent redemption grants exactly one session', async () => {
  const f = fixture(); await f.request(f.auth.onRequestPost, { action: 'request', email: 'owner@example.com' }); const token = /#token=([a-f0-9]{64})/.exec(f.mail[0].text)[1];
  const results = await Promise.all([f.request(f.auth.onRequestPost, { action: 'verify', token }), f.request(f.auth.onRequestPost, { action: 'verify', token })]);
  assert.deepEqual(results.map(x => x.status).sort(), [200, 410]);
});

test('same-origin JSON and per-session CSRF are required; logout revokes on server', async () => {
  const f = fixture(), s = await f.login();
  assert.equal((await f.call({ action: 'create', task: { title: 'Example' } }, { ...s, origin: 'https://evil.example' })).status, 403);
  assert.equal((await f.call({ action: 'create', task: { title: 'Example' } }, { cookie: s.cookie })).status, 403);
  assert.equal((await f.request(f.auth.onRequestPost, { action: 'logout' }, s)).status, 200);
  assert.equal((await f.request(f.api.onRequestGet, null, { method: 'GET', cookie: s.cookie })).status, 401);
});

async function imported(f, s, content = '第一行\r\n原结果\r\n') {
  const response = await f.call({ action: 'import', goals: { long_term: '示例目标', phase: '测试' }, documents: [{ path: SOURCE, content }], tasks: [{ title: '测试任务', source: SOURCE, status: '待开始', result: '旧任务结果' }] }, s);
  assert.equal(response.status, 201); return response.body.tasks[0];
}

test('explicit imports are private, allowlisted and versioned; runner absent stays truly queued', async () => {
  const f = fixture(), s = await f.login(), task = await imported(f, s);
  const invalid = await f.call({ action: 'import', tasks: [], documents: [{ path: '.local/customer.md', content: 'private customer' }] }, s); assert.equal(invalid.status, 400);
  const queued = await f.call({ action: 'enqueue', task_id: task.id, instruction: '核验原文' }, s); assert.equal(queued.status, 201); assert.equal(queued.body.run.status, 'queued');
  const bootstrap = await f.request(f.api.onRequestGet, null, { ...s, method: 'GET' }); assert.equal(bootstrap.body.capabilities.runner_connected, false); assert.equal(bootstrap.body.runs[0].status, 'queued'); assert.equal(bootstrap.body.tasks[0].status, '待开始');
  assert.equal((await f.call({ action: 'enqueue', task_id: task.id, instruction: '重复' }, s)).status, 409);
  const doc = await f.request(f.api.onRequestGet, null, { ...s, method: 'GET', path: `/api/workbench?document=${encodeURIComponent(SOURCE)}` }); assert.equal(doc.body.document.content, '第一行\n原结果\n'); assert.equal(doc.body.document.hash, hash(doc.body.document.content));
  assert.ok(f.writes.every(write => write.options.cacheControl === 'private, no-store'));
  assert.ok(!JSON.stringify(bootstrap.body).includes('fixture-only'));
});

test('malformed and duplicate import bundles cannot partly write documents', async () => {
  const f = fixture(), s = await f.login();
  const duplicate = await f.call({ action: 'import', documents: [{ path: SOURCE, content: 'one' }, { path: SOURCE, content: 'two' }], tasks: [] }, s);
  assert.equal(duplicate.status, 400); assert.equal([...f.data.keys()].filter(key => key.startsWith('documents/')).length, 0);
  const malformed = await f.call({ action: 'import', documents: [{ path: SOURCE, content: 'one' }], tasks: [], goals: { long_term: 'goal' } }, s);
  assert.equal(malformed.status, 400); assert.equal([...f.data.keys()].filter(key => key.startsWith('documents/')).length, 0);
});

test('runner authenticates, atomically claims, persists result; snapshot review never creates second business truth', async () => {
  const f = fixture(), s = await f.login(), task = await imported(f, s); await f.call({ action: 'enqueue', task_id: task.id, instruction: '修订结果' }, s);
  assert.equal((await f.request(f.runner, { action: 'claim' })).status, 401);
  const claims = await Promise.all([f.run({ action: 'claim' }), f.run({ action: 'claim' })]); assert.equal(claims.filter(r => r.body.job).length, 1);
  const job = claims.find(r => r.body.job).body.job; assert.equal(job.status, 'running'); assert.equal(job.document.hash, hash(job.document.content));
  const lease = { run_id: job.id, lease_token: job.lease_token };
  assert.equal((await f.run({ action: 'event', ...lease, event: { type: 'progress', message: '模型正在核验' } })).status, 201);
  const result = { summary: '建议修订', changes: [{ path: SOURCE, before: '第一行\n原结果', after: '第一行\n已核验结果', reason: '测试依据' }], next_steps: ['继续核验'] };
  const complete = await f.run({ action: 'complete', ...lease, result, session_id: 'fixture-session', usage: { input_tokens: 1 } }); assert.equal(complete.status, 200); assert.equal(complete.body.run.status, 'awaiting_review');
  const detail = await f.request(f.api.onRequestGet, null, { ...s, method: 'GET', path: `/api/workbench?run_id=${job.id}` }); assert.equal(detail.body.run.events.length, 1);
  assert.equal((await f.call({ action: 'review', run_id: job.id, decision: 'accept', expected_version: 1 }, s)).status, 409);
  const accepted = await f.call({ action: 'review', run_id: job.id, decision: 'accept', expected_version: complete.body.run.version }, s); assert.equal(accepted.status, 409); assert.match(accepted.body.error, /本地为准/);
  const doc = await f.request(f.api.onRequestGet, null, { ...s, method: 'GET', path: `/api/workbench?document=${encodeURIComponent(SOURCE)}` }); assert.equal(doc.body.document.version, 1); assert.ok(doc.body.document.content.includes('原结果'));
  const afterAttempt = await f.request(f.api.onRequestGet, null, { ...s, method: 'GET', path: `/api/workbench?run_id=${job.id}` }); assert.equal(afterAttempt.body.run.status, 'awaiting_review');
  const reviews = await Promise.all([f.call({ action: 'review', run_id: job.id, decision: 'reject', expected_version: complete.body.run.version }, s), f.call({ action: 'review', run_id: job.id, decision: 'reject', expected_version: complete.body.run.version }, s)]);
  assert.deepEqual(reviews.map(r => r.status).sort(), [200, 409]);
  assert.equal((await f.run({ action: 'complete', ...lease, result })).status, 409);
});

test('no-change conclusions can be confirmed once while unsupported source modes fail closed', async () => {
  const f = fixture(), s = await f.login(), task = (await f.call({ action: 'create', task: { title: '无原文任务' } }, s)).body.task;
  await f.call({ action: 'enqueue', task_id: task.id, instruction: '只分析下一步' }, s); const job = (await f.run({ action: 'claim' })).body.job;
  const complete = await f.run({ action: 'complete', run_id: job.id, lease_token: job.lease_token, result: { summary: '需要实际证据', changes: [], next_steps: ['提供证据'] } });
  assert.equal((await f.call({ action: 'review', run_id: job.id, decision: 'accept', expected_version: complete.body.run.version }, s)).body.run.status, 'accepted');
  assert.equal((await f.request(f.api.onRequestGet, null, { ...s, method: 'GET', customEnv: { ...f.env, WORKBENCH_SOURCE_MODE: 'pretend_sync' } })).status, 503);
});

test('expired lease and cancellation stop result acceptance; unconnected runner configuration is explicit', async () => {
  const f = fixture(), s = await f.login(), task = await imported(f, s); await f.call({ action: 'enqueue', task_id: task.id, instruction: '核验' }, s);
  const job = (await f.run({ action: 'claim' })).body.job; f.advance(10 * 60000 + 1);
  assert.equal((await f.run({ action: 'heartbeat', run_id: job.id, lease_token: job.lease_token })).status, 409);
  const detail = await f.request(f.api.onRequestGet, null, { ...s, method: 'GET', path: `/api/workbench?run_id=${job.id}` }); assert.equal(detail.body.run.status, 'interrupted');
  assert.equal((await f.call({ action: 'cancel', run_id: job.id }, s)).status, 200);
  assert.equal((await f.run({ action: 'claim' })).body.job, null);
  assert.equal((await f.request(f.runner, { action: 'claim' }, { bearer: f.env.WORKBENCH_RUNNER_SECRET, customEnv: { ...f.env, WORKBENCH_RUNNER_SECRET: '' } })).status, 503);
});

test('stale source and cross-source changes cannot be accepted', async () => {
  const f = fixture(), s = await f.login(), task = await imported(f, s); await f.call({ action: 'enqueue', task_id: task.id, instruction: '核验' }, s);
  const job = (await f.run({ action: 'claim' })).body.job, lease = { run_id: job.id, lease_token: job.lease_token };
  const wrong = { summary: 'x', changes: [{ path: 'other.md', before: '原结果', after: '改结果', reason: 'x' }], next_steps: [] };
  assert.equal((await f.run({ action: 'complete', ...lease, result: wrong })).status, 400);
  const proper = { ...wrong, changes: [{ ...wrong.changes[0], path: SOURCE }] };
  const complete = await f.run({ action: 'complete', ...lease, result: proper }); assert.equal(complete.status, 200);
  assert.equal((await f.call({ action: 'import', documents: [{ path: SOURCE, content: '后来新增的事实', expected_version: 1 }], tasks: [] }, s)).status, 201);
  assert.equal((await f.call({ action: 'review', run_id: job.id, decision: 'accept', expected_version: complete.body.run.version }, s)).status, 409);
  assert.equal((await f.call({ action: 'review', run_id: job.id, decision: 'reject', expected_version: complete.body.run.version }, s)).body.run.status, 'rejected');
});
