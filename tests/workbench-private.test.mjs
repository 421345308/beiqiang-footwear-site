import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorkbenchAuthHandlers } from '../edgeone-deploy/cloud-functions/api/workbench-auth.js';
import { createWorkbenchHandlers } from '../edgeone-deploy/cloud-functions/api/workbench.js';
import { createWorkbenchRunnerHandler } from '../edgeone-deploy/cloud-functions/api/workbench-runner.js';
import { COOKIE, hash, STORE_NAME, versionKey } from '../edgeone-deploy/cloud-functions/_lib/workbench.js';

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
  async function request(handler, body, { cookie, csrf, origin = ORIGIN, requestOrigin = ORIGIN, fetchSite, contentType = 'application/json', forwardedHost, method = 'POST', path = '/api/workbench', bearer, customEnv = env } = {}) {
    const headers = { 'content-type': contentType }; if (origin !== null) headers.origin = origin; if (cookie) headers.cookie = cookie; if (csrf) headers['x-workbench-token'] = csrf; if (bearer) headers.authorization = `Bearer ${bearer}`; if (fetchSite) headers['sec-fetch-site'] = fetchSite; if (forwardedHost) headers['x-forwarded-host'] = forwardedHost;
    const response = await handler({ env: customEnv, request: new Request(requestOrigin + path, { method, headers, ...(method === 'GET' ? {} : { body: JSON.stringify(body) }) }) });
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

test('configured public Origin works behind an internal proxy while all CSRF checks remain enforced', async () => {
  const f = fixture(), s = await f.login();
  const proxy = { ...s, requestOrigin: 'http://internal-edge-proxy:9000', fetchSite: 'same-origin' };
  assert.equal((await f.call({ action: 'create', task: { title: 'Proxy request' } }, proxy)).status, 201);
  assert.equal((await f.request(f.auth.onRequestPost, { action: 'request', email: 'other@example.com' }, proxy)).status, 202);
  assert.equal((await f.call({ action: 'create', task: { title: 'Evil origin' } }, { ...proxy, origin: 'https://evil.example', forwardedHost: 'workbench.example.com' })).status, 403);
  assert.equal((await f.call({ action: 'create', task: { title: 'Missing origin' } }, { ...proxy, origin: null, forwardedHost: 'workbench.example.com' })).status, 403);
  assert.equal((await f.call({ action: 'create', task: { title: 'Cross-site' } }, { ...proxy, fetchSite: 'cross-site' })).status, 403);
  assert.equal((await f.call({ action: 'create', task: { title: 'Wrong CSRF' } }, { ...proxy, csrf: 'wrong' })).status, 403);
  assert.equal((await f.call({ action: 'create', task: { title: 'Wrong content type' } }, { ...proxy, contentType: 'text/plain' })).status, 415);
  assert.equal((await f.call({ action: 'create', task: { title: 'Missing session' } }, { ...proxy, cookie: undefined })).status, 401);
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

async function queuedTask(f, s, title) {
  const task = (await f.call({ action: 'create', task: { title } }, s)).body.task;
  const queued = await f.call({ action: 'enqueue', task_id: task.id, instruction: '仅完成这个有界任务' }, s);
  assert.equal(queued.status, 201); return queued.body.run;
}

test('targeted claim selects exactly the requested run and leaves other queued work untouched', async () => {
  const f = fixture(), s = await f.login();
  const first = await queuedTask(f, s, '先排队任务'), target = await queuedTask(f, s, '指定任务');
  const responses = await Promise.all([f.run({ action: 'claim', run_id: target.id }), f.run({ action: 'claim', run_id: target.id })]);
  assert.deepEqual(responses.map(r => r.status).sort(), [200, 409]);
  assert.equal(responses.find(r => r.status === 200).body.job.id, target.id);
  const untouched = await f.request(f.api.onRequestGet, null, { ...s, method: 'GET', path: `/api/workbench?run_id=${first.id}` });
  assert.equal(untouched.body.run.status, 'queued'); assert.equal(f.data.has(`claims/${first.id}.json`), false);
  assert.equal((await f.run({ action: 'claim', run_id: 'f'.repeat(32) })).status, 404);
  assert.equal((await f.run({ action: 'claim', run_id: 'invalid' })).status, 400);
  assert.equal((await f.run({ action: 'claim', run_id: target.id })).status, 409);
  assert.equal((await f.run({ action: 'claim' })).body.job.id, first.id);
});

test('manual cloud reports bounded active leases, never an always-on executor, and requires a target', async () => {
  const f = fixture(), s = await f.login(); f.env.WORKBENCH_RUNNER_MODE = 'manual_cloud';
  const run = await queuedTask(f, s, '单次云任务');
  const bootstrap = async () => (await f.request(f.api.onRequestGet, null, { ...s, method: 'GET' })).body;
  assert.equal((await f.run({ action: 'claim' })).status, 400);
  await f.run({ action: 'heartbeat' });
  let state = await bootstrap(); assert.equal(state.capabilities.runner_mode, 'manual_cloud'); assert.equal(state.capabilities.runner_connected, false); assert.equal(state.capabilities.runner_status, 'manual_cloud_idle'); assert.ok(state.capabilities.runner_last_seen); assert.deepEqual(state.capabilities.runner_active_sessions, []);
  const job = (await f.run({ action: 'claim', run_id: run.id })).body.job;
  state = await bootstrap(); assert.equal(state.capabilities.runner_status, 'manual_cloud_active'); assert.equal(state.capabilities.runner_connected, false); assert.equal(state.capabilities.runner_active_sessions[0].run_id, run.id);
  assert.deepEqual(Object.keys(state.capabilities.runner_active_sessions[0]).sort(), ['last_seen_at', 'lease_expires_at', 'run_id', 'started_at']);
  f.advance(60000); await f.run({ action: 'heartbeat', run_id: run.id, lease_token: job.lease_token });
  state = await bootstrap(); assert.ok(Date.parse(state.capabilities.runner_active_sessions[0].last_seen_at) > Date.parse(job.created_at));
  f.advance(10 * 60000 + 1);
  for (const action of ['heartbeat', 'event', 'complete', 'fail']) {
    const expired = await f.run({ action, run_id: run.id, lease_token: job.lease_token, event: { type: 'late' }, result: { summary: 'late', changes: [], next_steps: [] }, error: 'late' }); assert.equal(expired.status, 409);
  }
  state = await bootstrap(); assert.equal(state.capabilities.runner_status, 'manual_cloud_idle'); assert.deepEqual(state.capabilities.runner_active_sessions, []); assert.equal(state.runs[0].status, 'interrupted');
  f.env.WORKBENCH_RUNNER_MODE = ''; await f.run({ action: 'heartbeat' }); state = await bootstrap(); assert.equal(state.capabilities.runner_mode, 'self_hosted'); assert.equal(state.capabilities.runner_connected, true); assert.equal(state.capabilities.runner_status, 'online');
});

test('cancelled session and wrong lease cannot return results to a replacement run', async () => {
  const f = fixture(), s = await f.login(), original = await queuedTask(f, s, '可重排任务');
  const oldJob = (await f.run({ action: 'claim', run_id: original.id })).body.job;
  assert.equal((await f.call({ action: 'cancel', run_id: original.id }, s)).status, 200);
  const replacement = (await f.call({ action: 'enqueue', task_id: original.task_id, instruction: '重新核验' }, s)).body.run;
  const newJob = (await f.run({ action: 'claim', run_id: replacement.id })).body.job;
  const result = { summary: '旧会话结果', changes: [], next_steps: [] };
  assert.equal((await f.run({ action: 'complete', run_id: original.id, lease_token: oldJob.lease_token, result })).status, 409);
  assert.equal((await f.run({ action: 'complete', run_id: replacement.id, lease_token: oldJob.lease_token, result })).status, 409);
  const detail = await f.request(f.api.onRequestGet, null, { ...s, method: 'GET', path: `/api/workbench?run_id=${replacement.id}` }); assert.equal(detail.body.run.status, 'running'); assert.equal(detail.body.run.result, null);
  assert.equal((await f.run({ action: 'complete', run_id: replacement.id, lease_token: newJob.lease_token, result: { summary: '新会话有效结果', changes: [], next_steps: [] } })).status, 200);
});


test('local application confirmation requires owner, exact run version and matching newer imported snapshot', async () => {
  const f = fixture(), s = await f.login(), task = await imported(f, s);
  await f.call({ action: 'enqueue', task_id: task.id, instruction: '修订结果' }, s);
  const job = (await f.run({ action: 'claim' })).body.job;
  const result = { summary: '建议修订', changes: [{ path: SOURCE, before: '原结果', after: '已核验结果', reason: '测试依据' }], next_steps: [] };
  const complete = await f.run({ action: 'complete', run_id: job.id, lease_token: job.lease_token, result });
  const body = { action: 'confirm_local_application', run_id: job.id, expected_version: complete.body.run.version };
  assert.equal((await f.call(body)).status, 401);
  assert.equal((await f.call(body, { ...s, csrf: 'wrong' })).status, 403);
  assert.equal((await f.call({ ...body, expected_version: body.expected_version - 1 }, s)).status, 409);
  assert.equal((await f.call(body, s)).status, 409);
  const oldKey = versionKey('documents', hash(SOURCE).slice(0, 32), 1), old = f.data.get(oldKey);
  f.data.delete(oldKey);
  assert.match((await f.call(body, s)).body.error, /历史快照/);
  f.data.set(oldKey, old);
  assert.equal((await f.call({ action: 'import', documents: [{ path: SOURCE, content: '其他修订', expected_version: 1 }], tasks: [] }, s)).status, 201);
  assert.equal((await f.call(body, s)).status, 409);
  const content = '第一行\n已核验结果\n';
  assert.equal((await f.call({ action: 'import', documents: [{ path: SOURCE, content, expected_version: 2 }], tasks: [] }, s)).status, 201);
  const beforeWrites = f.writes.length, confirmed = await f.call(body, s);
  assert.equal(confirmed.status, 200);
  assert.equal(confirmed.body.run.status, 'accepted');
  assert.equal(confirmed.body.run.version, body.expected_version + 1);
  assert.equal(confirmed.body.run.review_origin, 'local');
  assert.equal(confirmed.body.run.reviewed_at, '2026-10-29T00:00:00.000Z');
  assert.deepEqual(confirmed.body.run.local_application, { source: SOURCE, source_hash: old.hash, applied_hash: hash(content), source_version: 1, imported_version: 3 });
  assert.deepEqual(f.writes.slice(beforeWrites).map(x => x.key), [versionKey('runs', job.id, body.expected_version + 1)]);
  assert.equal((await f.call(body, s)).status, 409);
  assert.equal((await f.call({ ...body, expected_version: confirmed.body.run.version }, s)).status, 409);
});
