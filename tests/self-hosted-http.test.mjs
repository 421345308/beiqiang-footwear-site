import assert from 'node:assert/strict';
import test from 'node:test';
import { createApiServer, requestNeedsTransaction } from '../self-hosted/server.mjs';
import { loadRoutes } from '../self-hosted/routes.mjs';
import { getStore } from '../edgeone-deploy/cloud-functions/_lib/platform-store.js';
import { createInquiryHandler } from '../edgeone-deploy/cloud-functions/api/inquiries.js';

function memoryStorage() {
  const values = new Map(); let closed = false, transactions = 0;
  return { values, get closed() { return closed; }, get transactions() { return transactions; },
    getStore({ name }) { return { async get(key) { return values.get(`${name}/${key}`) ?? null; }, async setJSON(key, value) { values.set(`${name}/${key}`, value); }, async list() { return { blobs: [] }; } }; },
    async withTransaction(fn) { transactions++; return fn(); }, async close() { closed = true; }, async query() { return { rows: [{ '?column?': 1 }] }; },
  };
}
async function running(t, options = {}) {
  const storage = memoryStorage(), app = await createApiServer({ storage, publicOrigin: 'https://www.beiqiang.com', ...options });
  await new Promise(resolve => app.server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${app.server.address().port}`;
  t.after(() => app.close()); return { ...app, base, storage };
}

test('manifest includes every existing API handler and actual private auth rejects unauthenticated HTTP', async t => {
  const routes = await loadRoutes();
  assert.ok(routes.size >= 40); assert.ok(routes.get('/api/admin/inquiries').PATCH); assert.ok(routes.get('/api/workbench-auth').POST);
  assert.equal(routes.has('/api/catalog-style-codes'), false);
  const { base } = await running(t, { routes });
  const health = await fetch(`${base}/healthz`); assert.equal(health.status, 200); assert.deepEqual(await health.json(), { ok: true });
  const missing = await fetch(`${base}/api/unknown`); assert.equal(missing.status, 404);
  const method = await fetch(`${base}/api/admin/inquiries`, { method: 'PUT' }); assert.equal(method.status, 405); assert.match(method.headers.get('allow'), /GET/);
  const auth = await fetch(`${base}/api/admin/inquiries`); assert.notEqual(auth.status, 200);
});

test('HTTP binary/multipart bodies, cookies, origin pinning and request-local storage survive adapter', async t => {
  const routes = new Map([['/api/echo', { POST: async ({ request, env }) => {
    const form = await request.formData(); const file = form.get('file');
    await getStore({ name: 'private' }).setJSON('bytes', [...new Uint8Array(await file.arrayBuffer())]);
    const headers = new Headers({ 'content-type': 'application/octet-stream', 'x-url': request.url, 'x-backend': env.WORKBENCH_STORAGE, 'x-seen-hop': request.headers.get('x-remove') || 'absent', connection: 'x-response-hop', 'x-response-hop': 'must-strip' });
    headers.append('set-cookie', 'one=1; HttpOnly'); headers.append('set-cookie', 'two=2; Secure');
    return new Response(await file.arrayBuffer(), { headers });
  } }]]);
  const { base, storage } = await running(t, { routes });
  const form = new FormData(); form.set('file', new Blob([new Uint8Array([0, 255, 13, 10])]), 'proof.bin');
  const response = await fetch(`${base}/api/echo?q=1`, { method: 'POST', headers: { 'x-forwarded-host': 'evil.invalid', 'x-forwarded-proto': 'http', connection: 'x-remove', 'x-remove': 'must-strip' }, body: form });
  assert.equal(response.status, 200); assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [0, 255, 13, 10]);
  assert.equal(response.headers.get('x-url'), 'https://www.beiqiang.com/api/echo?q=1');
  assert.equal(response.headers.has('x-response-hop'), false);
  assert.equal(response.headers.get('x-backend'), 'self_hosted'); assert.equal(response.headers.getSetCookie().length, 2);
  assert.deepEqual(storage.values.get('private/bytes'), [0, 255, 13, 10]); assert.equal(storage.transactions, 1);
});

test('limits request sizes before business execution and validates explicit same-origin proxy', async t => {
  let calls = 0;
  const routes = new Map([['/api/write', { POST: async () => { calls++; return new Response('ok'); } }]]);
  const { base } = await running(t, { routes, maxBodyBytes: 8, proxySecret: 'x'.repeat(32) });
  assert.equal((await fetch(`${base}/api/write`, { method: 'POST', body: '123456789', headers: { 'x-beiqiang-proxy-secret': 'x'.repeat(32), 'x-forwarded-host': 'www.beiqiang.com', 'x-forwarded-proto': 'https' } })).status, 413);
  assert.equal((await fetch(`${base}/api/write`, { method: 'POST', headers: { 'x-beiqiang-proxy-secret': 'wrong' } })).status, 403);
  assert.equal((await fetch(`${base}/api/write`, { method: 'POST', headers: { 'x-beiqiang-proxy-secret': 'x'.repeat(32), 'x-forwarded-host': 'evil.invalid', 'x-forwarded-proto': 'https' } })).status, 403);
  assert.equal((await fetch(`${base}/api/write`, { method: 'POST' })).status, 403);
  assert.equal(calls, 0);
  assert.equal((await fetch(`${base}/api/write`, { method: 'POST', headers: { 'x-beiqiang-proxy-secret': 'x'.repeat(32), 'x-forwarded-host': 'www.beiqiang.com', 'x-forwarded-proto': 'https' } })).status, 200);
});

test('shutdown drains requests then closes storage', async () => {
  const storage = memoryStorage(), app = await createApiServer({ storage, routes: new Map() });
  await new Promise(resolve => app.server.listen(0, '127.0.0.1', resolve));
  await app.close(); assert.equal(storage.closed, true);
});

test('real PostgreSQL HTTP upload lifecycle, quarantine, once-only concurrent buyer/owner login and failure rollback', { skip: !process.env.SELF_HOSTED_TEST_DATABASE_URL }, async t => {
  const { createStorage } = await import('../self-hosted/storage.mjs');
  const { mkdtemp, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os'); const path = await import('node:path');
  const { createHash, randomUUID } = await import('node:crypto');
  const directory = await mkdtemp(path.join(tmpdir(), 'bq-http-files-'));
  const schema = `http_${randomUUID().replaceAll('-', '')}`;
  const storage = createStorage({ connectionString: process.env.SELF_HOSTED_TEST_DATABASE_URL, dataDir: directory, schema, publicOrigin: 'https://www.beiqiang.online', uploadSecret: 'isolated-test-secret-'.repeat(3) });
  await storage.initialize();
  const app = await createApiServer({ storage, publicOrigin: 'https://www.beiqiang.online', env: { INQUIRY_ADMIN_TOKEN: 'isolated-admin-test', WORKBENCH_OWNER_EMAIL: 'owner@example.com', WORKBENCH_SESSION_SECRET: 'isolated-session-secret-'.repeat(3), WORKBENCH_ORIGIN: 'https://www.beiqiang.online', SMTP_PASS: 'isolated-test' } });
  await new Promise(resolve => app.server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${app.server.address().port}`;
  t.after(async () => { await storage.query(`DROP SCHEMA "${schema}" CASCADE`); await app.close(); await rm(directory, { recursive: true, force: true }); });
  const reference = 'BQ-20261031-ABCDEF12', accessCode = 'ABCDEF0123456789ABCD', receivedAt = '2026-10-31T00:00:00.000Z';
  await storage.getStore('beiqiang-inquiries').setJSON(`inquiries/2026-10-31/${reference}.json`, { reference, receivedAt, accessTokenHash: createHash('sha256').update(accessCode).digest('hex'), attachments: [] });
  const json = body => ({ headers: { 'content-type': 'application/json', origin: 'https://www.beiqiang.online' }, body: JSON.stringify(body) });
  const permissionBody = { reference, accessCode, name: 'brief.pdf', contentType: 'application/pdf', size: 4 };
  const denied = await fetch(`${base}/api/inquiry-attachments`, { method: 'POST', ...json({ ...permissionBody, accessCode: 'F'.repeat(20) }) });
  assert.equal(denied.status, 404);
  const permission = await fetch(`${base}/api/inquiry-attachments`, { method: 'POST', ...json(permissionBody) }); assert.equal(permission.status, 201);
  const upload = await permission.json(), uploadPath = new URL(upload.uploadUrl).pathname + new URL(upload.uploadUrl).search;
  const tampered = new URL(upload.uploadUrl); tampered.searchParams.set('token', `${tampered.searchParams.get('token')}x`);
  assert.equal((await fetch(`${base}${tampered.pathname}${tampered.search}`, { method: 'PUT', body: 'file', headers: { 'content-type': 'application/pdf' } })).status, 401);
  assert.equal((await fetch(`${base}${uploadPath}`, { method: 'PUT', body: 'file', headers: { 'content-type': 'text/plain' } })).status, 415);
  assert.equal((await fetch(`${base}${uploadPath}`, { method: 'PUT', body: 'file', headers: { 'content-type': 'application/pdf' } })).status, 201);
  assert.ok([409, 412].includes((await fetch(`${base}${uploadPath}`, { method: 'PUT', body: 'evil', headers: { 'content-type': 'application/pdf' } })).status));
  const finalized = await fetch(`${base}/api/inquiry-attachments`, { method: 'PATCH', ...json({ reference, accessCode, uploadId: upload.uploadId, key: upload.key }) }); assert.equal(finalized.status, 201);
  const downloadPath = `/api/admin/inquiry-attachment?reference=${reference}&receivedAt=${receivedAt}&attachmentId=${upload.uploadId}`;
  assert.equal((await fetch(`${base}${downloadPath}`)).status, 401);
  const authorized = { authorization: 'Bearer isolated-admin-test' };
  assert.equal((await fetch(`${base}${downloadPath}`, { headers: authorized })).status, 409);
  const download = await fetch(`${base}${downloadPath}`, { headers: { ...authorized, 'x-quarantine-acknowledgement': 'download-for-isolated-review' } });
  assert.equal(download.status, 200); assert.equal(download.headers.get('x-beiqiang-file-security'), 'quarantined'); assert.equal(await download.text(), 'file');
  assert.equal((await fetch(`${base}${downloadPath.replace('ABCDEF12', 'ABCDEF13')}`, { headers: authorized })).status, 404);
  // Exercise the real once-only login paths concurrently. Neither flow sends
  // mail: grants are seeded directly into this disposable private database.
  const tokenHash = value => createHash('sha256').update(value).digest('hex');
  const buyerToken = 'b'.repeat(64), buyerStore = storage.getStore('beiqiang-buyer-access');
  await buyerStore.setJSON(`magic/${tokenHash(buyerToken)}.json`, { email: 'buyer@example.com', emailHash: tokenHash('buyer@example.com'), expiresAt: new Date(Date.now() + 60000).toISOString() });
  const buyerRedeems = await Promise.all(Array.from({ length: 6 }, () => fetch(`${base}/api/buyer-workspace-session`, { method: 'POST', ...json({ token: buyerToken }) })));
  assert.equal(buyerRedeems.filter(response => response.status === 201).length, 1);
  assert.equal(buyerRedeems.filter(response => response.status === 410).length, 5);
  const buyerSession = await buyerRedeems.find(response => response.status === 201).json();
  const loaded = await fetch(`${base}/api/buyer-workspace-session`, { headers: { authorization: `Bearer ${buyerSession.sessionToken}` } });
  assert.equal(loaded.status, 200);
  assert.equal((await buyerStore.list({ prefix: 'session/' })).blobs.length, 1);
  const activity = await buyerStore.list({ prefix: 'activity/' });
  assert.ok((await Promise.all(activity.blobs.map(file => buyerStore.get(file.key, { type: 'json' })))).some(record => record.event === 'workspace_loaded'));
  const ownerToken = 'a'.repeat(64), ownerStore = storage.getStore('beiqiang-owner-workbench-v1');
  await ownerStore.setJSON(`magic/${tokenHash(ownerToken)}.json`, { email: 'owner@example.com', expires_at: new Date(Date.now() + 60000).toISOString() });
  const ownerRedeems = await Promise.all(Array.from({ length: 6 }, () => fetch(`${base}/api/workbench-auth`, { method: 'POST', ...json({ action: 'verify', token: ownerToken }) })));
  assert.equal(ownerRedeems.filter(response => response.status === 200).length, 1);
  assert.equal(ownerRedeems.filter(response => response.status === 410).length, 5);
  assert.equal((await ownerStore.list({ prefix: 'sessions/' })).blobs.length, 1);
  const ownerResponse = ownerRedeems.find(response => response.status === 200), ownerBody = await ownerResponse.json();
  const ownerCookie = ownerResponse.headers.get('set-cookie').split(';')[0];
  const setupPayload = json({ action: 'set_password', new_password: 'Synthetic password 47!' });
  const setupPassword = await fetch(`${base}/api/workbench-auth`, { method: 'POST', ...setupPayload, headers: { ...setupPayload.headers, cookie: ownerCookie, 'x-workbench-token': ownerBody.csrf_token } });
  assert.equal(setupPassword.status, 200);
  const loginPayload = json({ action: 'password_login', email: 'owner@example.com', password: 'Synthetic password 47!', trusted_device: true });
  const passwordSession = await fetch(`${base}/api/workbench-auth`, { method: 'POST', ...loginPayload });
  assert.equal(passwordSession.status, 200); assert.match(passwordSession.headers.get('set-cookie'), /Max-Age=2592000/);
  const passwordCookie = passwordSession.headers.get('set-cookie').split(';')[0], passwordBody = await passwordSession.json();
  const refreshed = await fetch(`${base}/api/workbench-auth`, { headers: { cookie: passwordCookie } });
  assert.equal((await refreshed.json()).authenticated, true); assert.match(refreshed.headers.get('set-cookie'), /Max-Age=2592000/);
  const revokePayload = json({ action: 'logout_others', current_password: 'Synthetic password 47!' });
  const revoke = await fetch(`${base}/api/workbench-auth`, { method: 'POST', ...revokePayload, headers: { ...revokePayload.headers, cookie: passwordCookie, 'x-workbench-token': passwordBody.csrf_token } });
  assert.equal(revoke.status, 200);
  assert.equal((await (await fetch(`${base}/api/workbench-auth`, { headers: { cookie: ownerCookie } })).json()).authenticated, false);
  assert.equal((await ownerStore.get('credentials/owner.json', { type: 'json' })).algorithm, 'scrypt');
  const invalidPayload = json({ action: 'password_login', email: 'owner@example.com', password: 'incorrect fixture password' });
  assert.equal((await fetch(`${base}/api/workbench-auth`, { method: 'POST', ...invalidPayload })).status, 401);
  assert.ok((await ownerStore.list({ prefix: 'rate/password/minute/' })).blobs.length >= 3);
  app.routes.set('/api/service-failure', { POST: async () => { await getStore('private-test').setJSON('partial', { shouldNotCommit: true }); return new Response('failed', { status: 503 }); } });
  assert.equal((await fetch(`${base}/api/service-failure`, { method: 'POST' })).status, 503);
  assert.equal(await storage.getStore('private-test').get('partial', { type: 'json' }), null);
  app.routes.set('/api/caught-database-failure', { POST: async () => {
    await getStore('private-test').setJSON('before-error', { shouldNotCommit: true });
    try { await storage.query('SELECT * FROM definitely_missing_table_for_test'); } catch { /* emulate a legacy handler catching a storage exception */ }
    return new Response('must not become success');
  } });
  assert.equal((await fetch(`${base}/api/caught-database-failure`, { method: 'POST' })).status, 500);
  assert.equal(await storage.getStore('private-test').get('before-error', { type: 'json' }), null);

  // A separate pool must see the saved inquiry before mail starts. A sales
  // edit during mail must survive the later notification-status update.
  const observer = createStorage({ connectionString: process.env.SELF_HOSTED_TEST_DATABASE_URL, dataDir: directory, schema });
  let sent = 0, visibleBeforeMail = false, createdKey = '';
  try {
    const post = createInquiryHandler({ createTransportImpl: () => ({ sendMail: async () => {
      sent += 1;
      if (sent !== 1) return;
      const otherStore = observer.getStore('beiqiang-inquiries');
      const files = await otherStore.list({ prefix: `inquiries/${new Date().toISOString().slice(0, 10)}/` });
      createdKey = files.blobs[0]?.key || '';
      visibleBeforeMail = Boolean(createdKey && await otherStore.get(createdKey, { type: 'json' }));
      if (visibleBeforeMail) await observer.withTransaction(async () => {
        const record = await otherStore.get(createdKey, { type: 'json' });
        record.internalNote = 'isolated operator update';
        await otherStore.setJSON(createdKey, record);
      });
    } }) });
    app.routes.set('/api/inquiries', { POST: post });
    const inquiry = { name: 'Fixture Buyer', company: 'Fixture Co', market: 'United States', email: 'buyer@example.invalid', quantity: '10 pairs', requirements: 'Fixture request', consent: true, styleCode: 'BQ001', styleLabel: 'Fixture', formStartedAt: Date.now() - 5000 };
    const saved = await fetch(`${base}/api/inquiries`, { method: 'POST', ...json(inquiry) });
    assert.equal(saved.status, 201); assert.equal(sent, 2); assert.equal(visibleBeforeMail, true);
    const record = await observer.getStore('beiqiang-inquiries').get(createdKey, { type: 'json' });
    assert.equal(record.internalNote, 'isolated operator update');
    assert.equal(record.notificationSent, true); assert.equal(record.buyerConfirmationSent, true);
  } finally { await observer.close(); }


});


test('transaction classification follows GET side effects while pure views stay unlocked', () => {
  const needs = path => requestNeedsTransaction(new Request(`https://www.beiqiang.online${path}`));
  assert.equal(needs('/api/buyer-workspace-session'), true);
  assert.equal(needs('/api/workbench-auth'), true);
  assert.equal(needs('/api/workbench'), true);
  assert.equal(needs('/api/workbench?run_id=run'), true);
  assert.equal(needs('/api/workbench?run_id=run&document=source'), true);
  assert.equal(needs('/api/operations?reference=BQ-test'), true);
  for (const path of ['/api/workbench?document=source', '/api/workbench?import_versions=1', '/api/operations', '/api/admin/inquiries', '/api/inquiry-status', '/api/admin/analytics', '/api/admin/weekly-review', '/api/admin/reminders', '/api/admin/inquiry-attachment']) assert.equal(needs(path), false, path);
  assert.equal(requestNeedsTransaction(new Request('https://www.beiqiang.online/api/inquiries', { method: 'POST' })), false);
  assert.equal(requestNeedsTransaction(new Request('https://www.beiqiang.online/api/admin/inquiries', { method: 'PATCH' })), true);
});


test('Node request context prevents recursive proxy despite EdgeOne proxy configuration', async t => {
  const { base } = await running(t, { env: { UNIFIED_BACKEND_MODE: 'proxy' } });
  // Missing token is rejected by the original buyer handler, before any store
  // use; a recursive proxy would instead fail absent backend configuration.
  const response = await fetch(`${base}/api/buyer-workspace-session`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  assert.equal(response.status, 400);
});


test('Node adapter strips arbitrary Connection-nominated request headers', async t => {
  const http = await import('node:http');
  const routes = new Map([['/api/headers', { GET: async ({ request }) => new Response(request.headers.get('x-remove') || 'absent') }]]);
  const { base } = await running(t, { routes });
  const body = await new Promise((resolve, reject) => {
    const request = http.request(`${base}/api/headers`, { headers: { connection: 'x-remove', 'x-remove': 'must-strip' } }, response => {
      const chunks = []; response.on('data', chunk => chunks.push(chunk)); response.on('end', () => resolve(Buffer.concat(chunks).toString())); response.on('error', reject);
    });
    request.on('error', reject); request.end();
  });
  assert.equal(body, 'absent');
});
