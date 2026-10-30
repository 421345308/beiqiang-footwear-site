import test from 'node:test';
import assert from 'node:assert/strict';
import { validateStatusSnapshot } from '../edgeone-deploy/cloud-functions/_lib/workbench-control.js';
import { createWorkbenchAuthHandlers } from '../edgeone-deploy/cloud-functions/api/workbench-auth.js';
import { createWorkbenchHandlers } from '../edgeone-deploy/cloud-functions/api/workbench.js';
import { createWorkbenchRunnerHandler } from '../edgeone-deploy/cloud-functions/api/workbench-runner.js';
import { STORE_NAME } from '../edgeone-deploy/cloud-functions/_lib/workbench.js';

const ORIGIN = 'https://workbench.example.com';

const snapshot = () => ({ schema_version: 1, observed_at: '2026-10-30T00:00:00Z', channels: [], codex: { observed_at: null, source: '未采集', windows: [], reset_credits: null, available: null, limitations: ['未知额度'] } });
test('owner control and status require session, CSRF and optimistic versions; imports preserve control', async () => {
  const f = fixture(), s = await f.login();
  const control = { focus: '共同能力', priorities: '先验证\n再执行', notes: '' };
  const body = { action: 'save_control', control, expected_version: 0 };
  assert.equal((await f.call(body)).status, 401);
  assert.equal((await f.call(body, { cookie: s.cookie })).status, 403);
  assert.equal((await f.call({ ...body, secret: 'hidden' }, s)).status, 400);
  assert.equal((await f.call({ ...body, expected_version: '0' }, s)).status, 400);
  assert.equal((await f.call(body, s)).body.control.version, 1);
  assert.equal((await f.call(body, s)).status, 409);
  const status = { action: 'import_status', snapshot: snapshot(), expected_version: 0 };
  assert.equal((await f.call(status)).status, 401);
  assert.equal((await f.call(status, { cookie: s.cookie })).status, 403);
  assert.equal((await f.call(status, s)).status, 201);
  assert.equal((await f.call(status, s)).status, 409);
  await f.call({ action: 'import', documents: [], tasks: [], goals: { long_term: '旧资料', phase: '阶段' } }, s);
  const read = await f.request(f.api.onRequestGet, null, { ...s, method: 'GET' });
  assert.equal(read.body.control.focus, control.focus);
  assert.equal(read.body.status_snapshot.codex.reset_credits, null);
  assert.equal(read.body.status_snapshot.codex.available, null);
});
test('empty snapshots stay unknown; enqueue freezes control and forwards it on claim', async () => {
  const f = fixture(), s = await f.login();
  const read = await f.request(f.api.onRequestGet, null, { ...s, method: 'GET' });
  assert.equal(read.body.control.version, 0);
  assert.equal(read.body.status_snapshot, null);
  const control = { focus: '共同能力', priorities: '渠道状态', notes: '' };
  await f.call({ action: 'save_control', control, expected_version: 0 }, s);
  const created = await f.call({ action: 'create', task: { title: '内部任务' } }, s);
  const queued = await f.call({ action: 'enqueue', task_id: created.body.task.id, instruction: '保留用户要求' }, s);
  assert.equal(queued.status, 201);
  await f.call({ action: 'save_control', control: { ...control, focus: '新重点' }, expected_version: 1 }, s);
  const claim = await f.run({ action: 'claim', run_id: queued.body.run.id });
  assert.equal(claim.body.job.control_snapshot.version, 1);
  assert.equal(claim.body.job.control_snapshot.focus, control.focus);
  assert.ok(claim.body.job.instruction.startsWith('保留用户要求'));
  assert.ok(claim.body.job.instruction.includes(control.focus));
  assert.equal(read.body.capabilities.external_actions, false);
});
test('status validation rejects unrecognized payloads and invalid quota', () => {
  assert.throws(() => validateStatusSnapshot({ ...snapshot(), token: 'private' }));
  for (const value of [-1, 101, '12']) {
    const input = snapshot(); input.codex.windows = [{ label: '5h', used_percent: value, window_minutes: 300, resets_at: null }];
    assert.throws(() => validateStatusSnapshot(input));
  }
  assert.equal(validateStatusSnapshot(snapshot()).codex.reset_credits, null);
  for (const reset_credits of [-1, 0.5, Number.MAX_SAFE_INTEGER + 1, '1']) {
    const input = snapshot(); input.codex.reset_credits = reset_credits;
    assert.throws(() => validateStatusSnapshot(input));
  }
});
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

