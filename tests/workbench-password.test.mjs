import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorkbenchAuthHandlers } from '../edgeone-deploy/cloud-functions/api/workbench-auth.js';

const origin = 'https://workbench.example.com';
const password = 'Long fixture password 42!';
function fixture() {
  let now = new Date('2026-11-10T00:00:00Z');
  const data = new Map(), mail = [];
  const env = { WORKBENCH_OWNER_EMAIL: 'owner@example.com', WORKBENCH_SESSION_SECRET: 'fixture-only-32-byte-session-secret-long', WORKBENCH_ORIGIN: origin, SMTP_PASS: 'synthetic-only' };
  const store = {
    async get(key) { return structuredClone(data.get(key) ?? null); },
    async setJSON(key, value, options = {}) { if (options.onlyIfNew && data.has(key)) throw Object.assign(new Error('conflict'), { code: 'PRECONDITION_FAILED' }); data.set(key, structuredClone(value)); },
    async delete(key) { data.delete(key); },
    async list({ prefix, limit = Infinity, cursor }) {
      const keys = [...data.keys()].filter(key => key.startsWith(prefix) && (!cursor || key > cursor)).sort();
      const page = keys.slice(0, limit); return { blobs: page.map(key => ({ key })), ...(keys.length > limit ? { cursor: page.at(-1) } : {}) };
    },
  };
  const handlers = createWorkbenchAuthHandlers({ getStoreImpl: () => store, nowImpl: () => now, createTransportImpl: () => ({ async sendMail(value) { mail.push(value); }, close() {} }) });
  async function call(action, fields = {}, { cookie, csrf, method = 'POST', requestOrigin = origin } = {}) {
    const headers = { origin: requestOrigin, 'content-type': 'application/json' };
    if (cookie) headers.cookie = cookie;
    if (csrf) headers['x-workbench-token'] = csrf;
    const request = new Request(`${origin}/api/workbench-auth`, { method, headers, ...(method === 'GET' ? {} : { body: JSON.stringify({ action, ...fields }) }) });
    const response = await handlers[method === 'GET' ? 'onRequestGet' : 'onRequestPost']({ request, env });
    return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie') };
  }
  async function emailLogin(trusted = false) {
    assert.equal((await call('request', { email: env.WORKBENCH_OWNER_EMAIL, trusted_device: trusted })).status, 202);
    const token = /#token=([a-f0-9]{64})/.exec(mail.at(-1).text)[1];
    const result = await call('verify', { token }); assert.equal(result.status, 200);
    return { cookie: result.cookie.split(';')[0], csrf: result.body.csrf_token, result };
  }
  async function passwordLogin(value = password, trusted = false) {
    const result = await call('password_login', { email: env.WORKBENCH_OWNER_EMAIL, password: value, trusted_device: trusted });
    return { ...result, auth: result.cookie ? { cookie: result.cookie.split(';')[0], csrf: result.body.csrf_token } : null };
  }
  return { data, mail, call, emailLogin, passwordLogin, advance(ms) { now = new Date(now.getTime() + ms); } };
}

test('password setup requires a fresh email session and CSRF and stores only a salted slow hash', async () => {
  const f = fixture(), session = await f.emailLogin();
  assert.equal((await f.call('set_password', { new_password: password })).status, 401);
  assert.equal((await f.call('set_password', { new_password: password }, { cookie: session.cookie })).status, 403);
  assert.equal((await f.call('set_password', { new_password: 'too short' }, session)).status, 400);
  assert.equal((await f.call('set_password', { new_password: password }, session)).status, 200);
  const credential = f.data.get('credentials/owner.json');
  assert.equal(credential.algorithm, 'scrypt'); assert.equal(credential.cost, 32768); assert.equal(credential.parallel, 3);
  assert.equal(credential.salt.length, 32); assert.equal(credential.digest.length, 64);
  assert.equal(JSON.stringify([...f.data.values()]).includes(password), false);
  const incorrect = await f.passwordLogin('wrong fixture password'); assert.equal(incorrect.status, 401);
  const correct = await f.passwordLogin(); assert.equal(correct.status, 200);
  for (const value of ['HttpOnly', 'Secure', 'SameSite=Strict', 'Max-Age=28800']) assert.ok(correct.cookie.includes(value));
  assert.ok([...f.data.values()].some(value => value.event === 'password_login_failed'));
});

test('trusted password session rolls thirty days and server revocation overrides its cookie', async () => {
  const f = fixture(), initial = await f.emailLogin();
  assert.equal((await f.call('set_password', { new_password: password }, initial)).status, 200);
  const trusted = await f.passwordLogin(password, true); assert.equal(trusted.status, 200);
  assert.match(trusted.cookie, /Max-Age=2592000/);
  const firstExpiry = Date.parse(trusted.body.expires_at);
  f.advance(29 * 86400000);
  const renewed = await f.call('', {}, { ...trusted.auth, method: 'GET' });
  assert.equal(renewed.body.authenticated, true); assert.ok(Date.parse(renewed.body.expires_at) > firstExpiry);
  assert.match(renewed.cookie, /Max-Age=2592000/);
  f.advance(29 * 86400000);
  assert.equal((await f.call('', {}, { ...trusted.auth, method: 'GET' })).body.authenticated, true);
  assert.equal((await f.call('logout', {}, trusted.auth)).status, 200);
  assert.deepEqual((await f.call('', {}, { ...trusted.auth, method: 'GET' })).body, { authenticated: false });
});

test('trusted email login expires after thirty days without a visit', async () => {
  const f = fixture(), trusted = await f.emailLogin(true);
  assert.match(trusted.result.cookie, /Max-Age=2592000/);
  f.advance(30 * 86400000 + 1);
  assert.deepEqual((await f.call('', {}, { ...trusted, method: 'GET' })).body, { authenticated: false });
});

test('password change requires reauthentication and revokes other sessions', async () => {
  const f = fixture(), owner = await f.emailLogin();
  assert.equal((await f.call('set_password', { new_password: password }, owner)).status, 200);
  const other = await f.passwordLogin(); assert.equal(other.status, 200);
  f.advance(11 * 60000);
  assert.equal((await f.call('set_password', { current_password: 'wrong', new_password: 'Another long password 57!' }, owner)).status, 401);
  assert.equal((await f.call('set_password', { current_password: password, new_password: 'Another long password 57!' }, owner)).status, 200);
  assert.equal((await f.call('', {}, { ...other.auth, method: 'GET' })).body.authenticated, false);
  assert.equal((await f.call('', {}, { ...owner, method: 'GET' })).body.authenticated, true);
  assert.equal((await f.passwordLogin(password)).status, 401);
  assert.equal((await f.passwordLogin('Another long password 57!')).status, 200);
});

test('password changes invalidate previously issued email links', async () => {
  const f = fixture(), owner = await f.emailLogin();
  assert.equal((await f.call('set_password', { new_password: password }, owner)).status, 200);
  f.advance(60000);
  assert.equal((await f.call('request', { email: 'owner@example.com' })).status, 202);
  const oldLink = /#token=([a-f0-9]{64})/.exec(f.mail.at(-1).text)[1];
  assert.equal((await f.call('set_password', { new_password: 'Another long password 57!' }, owner)).status, 200);
  assert.equal((await f.call('verify', { token: oldLink })).status, 410);
});

test('password attempts are globally limited and unknown accounts do not create sessions', async () => {
  const f = fixture(), owner = await f.emailLogin();
  assert.equal((await f.call('set_password', { new_password: password }, owner)).status, 200);
  for (let i = 0; i < 5; i++) assert.equal((await f.call('password_login', { email: 'other@example.com', password })).status, 401);
  assert.equal((await f.passwordLogin()).status, 429);
  assert.equal([...f.data.keys()].filter(key => key.startsWith('sessions/')).length, 1);
});

test('concurrent password checks are bounded for the small server', async () => {
  const f = fixture(), owner = await f.emailLogin();
  assert.equal((await f.call('set_password', { new_password: password }, owner)).status, 200);
  const results = await Promise.all([f.passwordLogin(), f.passwordLogin()]);
  assert.deepEqual(results.map(result => result.status).sort(), [200, 503]);
});
