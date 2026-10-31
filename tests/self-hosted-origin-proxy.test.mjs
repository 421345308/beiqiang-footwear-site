import assert from 'node:assert/strict';
import test from 'node:test';
import https from 'node:https';
import { checkServerIdentity } from 'node:tls';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { EventEmitter } from 'node:events';
import { loadRoutes } from '../self-hosted/routes.mjs';
import { createUnifiedOriginProxy, wrapUnifiedHandler, isUnifiedHandler } from '../edgeone-deploy/cloud-functions/_lib/unified-origin-proxy.js';
const execute = promisify(execFile);
const publicUrl = 'https://www.beiqiang.online';
const environment = { UNIFIED_BACKEND_MODE: 'proxy', UNIFIED_BACKEND_URL: 'https://127.0.0.1:8443', UNIFIED_BACKEND_CA: 'test-ca', SELF_HOSTED_PROXY_SECRET: 'test-proxy-secret-'.repeat(3), WORKBENCH_ORIGIN: publicUrl };

test('every API export including owner/buyer auth, events and uploads is wrapped and maintenance performs no writes', async () => {
  const routes = await loadRoutes(); let count = 0;
  for (const [route, methods] of routes) for (const [method, handler] of Object.entries(methods)) {
    count++; assert.equal(isUnifiedHandler(handler), true, `${method} ${route}`);
    const response = await handler({ request: new Request(`${publicUrl}${route}`, { method }), env: { UNIFIED_BACKEND_MODE: 'maintenance' } });
    assert.equal(response.status, 503); assert.equal(response.headers.get('x-beiqiang-maintenance'), 'unified-migration');
  }
  assert.ok(count > 50);
});

test('unset selects legacy, proxy selects only injected upstream, invalid mode fails closed', async () => {
  let legacy = 0, proxied = 0;
  const handler = wrapUnifiedHandler(() => { legacy++; return new Response('legacy'); }, { proxyImpl: () => { proxied++; return new Response('proxy'); } });
  assert.equal(await (await handler({ env: {} })).text(), 'legacy');
  assert.equal(await (await handler({ env: { UNIFIED_BACKEND_MODE: 'proxy' } })).text(), 'proxy');
  assert.equal((await handler({ env: { UNIFIED_BACKEND_MODE: 'invalid' } })).status, 503);
  assert.equal(legacy, 1); assert.equal(proxied, 1);
});

test('HTTPS transport verifies certificates, strips spoofed forwarding/hop headers and preserves binary/cookies/status', async () => {
  let received;
  const proxy = createUnifiedOriginProxy({ requestImpl: (target, options, callback) => {
    const request = new EventEmitter(); request.destroy = () => {};
    request.end = body => {
      received = { target, options, body };
      const incoming = new EventEmitter(); incoming.headers = { 'set-cookie': ['first=1; HttpOnly', 'second=2; Secure'], 'content-type': 'application/octet-stream', connection: 'x-private', 'x-private': 'remove' }; incoming.statusCode = 201;
      callback(incoming); incoming.emit('data', Buffer.from([0, 255, 12])); incoming.emit('end');
    }; return request;
  } });
  const response = await proxy({ env: environment, request: new Request(`${publicUrl}/api/inquiry-attachments?value=1`, { method: 'PUT', headers: { 'content-type': 'multipart/form-data; boundary=proof', 'x-forwarded-host': 'evil.invalid', 'x-forwarded-proto': 'http', 'x-beiqiang-proxy-secret': 'attacker', connection: 'x-remove', 'x-remove': 'private' }, body: new Uint8Array([0, 1, 255]) }) });
  assert.equal(response.status, 201); assert.equal(response.headers.getSetCookie().length, 2); assert.equal(response.headers.has('x-private'), false); assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [0, 255, 12]);
  assert.equal(received.options.rejectUnauthorized, true); assert.equal(received.options.checkServerIdentity, checkServerIdentity); assert.equal(received.options.ca, 'test-ca');
  assert.equal(received.options.headers['x-forwarded-host'], 'www.beiqiang.online'); assert.equal(received.options.headers['x-forwarded-proto'], 'https'); assert.equal(received.options.headers['x-beiqiang-proxy-secret'], environment.SELF_HOSTED_PROXY_SECRET);
  assert.equal(received.options.headers['x-remove'], undefined); assert.equal(received.options.headers.connection, undefined); assert.deepEqual([...received.body], [0, 1, 255]);
  assert.equal(received.target.pathname, '/api/inquiry-attachments'); assert.equal(received.target.search, '?value=1');
});

test('bounds body/response/time and never retries a failed write', async () => {
  let calls = 0;
  const proxy = createUnifiedOriginProxy({ maxBodyBytes: 3, timeoutMs: 20, requestImpl: () => { calls++; const request = new EventEmitter(); request.destroy = () => {}; request.end = () => {}; return request; } });
  assert.equal((await proxy({ env: environment, request: new Request(`${publicUrl}/api/events`, { method: 'POST', body: '1234' }) })).status, 413); assert.equal(calls, 0);
  assert.equal((await proxy({ env: environment, request: new Request(`${publicUrl}/api/events`, { method: 'POST', body: '123' }) })).status, 504); assert.equal(calls, 1);
  assert.equal((await proxy({ env: environment, request: new Request('https://attacker.invalid/api/events') })).status, 403);
  assert.equal((await proxy({ env: { ...environment, UNIFIED_BACKEND_URL: 'http://127.0.0.1' }, request: new Request(`${publicUrl}/api/events`) })).status, 503);
});

test('real private-CA TLS validates SAN and trusted CA, rejects wrong CA without a request reaching backend', async t => {
  const directory = await mkdtemp(path.join(tmpdir(), 'bq-proxy-ca-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await writeFile(path.join(directory, 'openssl.cnf'), '[req]\ndistinguished_name=dn\n[dn]\n');
  async function certificate(name, cn, extra = []) {
    await execute('openssl', ['req', '-config', 'openssl.cnf', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', `${name}.key`, '-out', `${name}.pem`, '-days', '2', '-subj', `/CN=${cn}`, ...extra], { cwd: directory, windowsHide: true });
  }
  await certificate('ca', 'Beiqiang isolated proxy CA', ['-addext', 'basicConstraints=critical,CA:TRUE']);
  await certificate('wrong', 'Other isolated CA', ['-addext', 'basicConstraints=critical,CA:TRUE']);
  await execute('openssl', ['req', '-config', 'openssl.cnf', '-newkey', 'rsa:2048', '-nodes', '-keyout', 'server.key', '-out', 'server.csr', '-subj', '/CN=127.0.0.1', '-addext', 'subjectAltName=IP:127.0.0.1'], { cwd: directory, windowsHide: true });
  await execute('openssl', ['x509', '-req', '-in', 'server.csr', '-CA', 'ca.pem', '-CAkey', 'ca.key', '-CAcreateserial', '-out', 'server.pem', '-days', '2', '-copy_extensions', 'copy'], { cwd: directory, windowsHide: true });
  const ca = await readFile(path.join(directory, 'ca.pem'), 'utf8');
  let hits = 0;
  const server = https.createServer({ key: await readFile(path.join(directory, 'server.key')), cert: await readFile(path.join(directory, 'server.pem')) }, (req, res) => {
    hits++; assert.equal(req.headers['x-forwarded-host'], 'www.beiqiang.online'); assert.equal(req.headers['x-beiqiang-proxy-secret'], environment.SELF_HOSTED_PROXY_SECRET);
    const chunks = []; req.on('data', chunk => chunks.push(chunk)); req.on('end', () => { res.writeHead(202, { 'set-cookie': ['one=1; HttpOnly', 'two=2; Secure'], 'content-type': 'application/octet-stream' }); res.end(Buffer.concat(chunks)); });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const env = { ...environment, UNIFIED_BACKEND_URL: `https://127.0.0.1:${server.address().port}`, UNIFIED_BACKEND_CA: ca };
  const proxy = createUnifiedOriginProxy();
  const good = await proxy({ env, request: new Request(`${publicUrl}/api/storage-upload?token=test`, { method: 'PUT', headers: { 'content-type': 'application/pdf' }, body: new Uint8Array([0, 255, 3]) }) });
  assert.equal(good.status, 202); assert.deepEqual([...new Uint8Array(await good.arrayBuffer())], [0, 255, 3]); assert.equal(good.headers.getSetCookie().length, 2);
  const bad = await proxy({ env: { ...env, UNIFIED_BACKEND_CA: await readFile(path.join(directory, 'wrong.pem'), 'utf8') }, request: new Request(`${publicUrl}/api/events`, { method: 'POST', body: 'must not arrive' }) });
  assert.equal(bad.status, 502); assert.equal(hits, 1);
  const mismatchProxy = createUnifiedOriginProxy({ requestImpl: (url, options, callback) => https.request(url, { ...options, autoSelectFamily: false, lookup: (_hostname, _options, done) => done(null, '127.0.0.1', 4) }, callback) });
  const mismatch = await mismatchProxy({ env: { ...env, UNIFIED_BACKEND_URL: `https://localhost:${server.address().port}` }, request: new Request(`${publicUrl}/api/events`) });
  assert.equal(mismatch.status, 502); assert.equal(hits, 1);
});


test('origin rejection diagnoses runtime hostname without query/cookies and never trusts spoofed forwarding headers', async () => {
  let calls = 0;
  const proxy = createUnifiedOriginProxy({ requestImpl: () => { calls++; throw new Error('must not reach backend'); } });
  const request = new Request('http://localhost:9000/api/workbench?token=private-query', { headers: { 'eo-pages-host': 'www.beiqiang.online', 'x-forwarded-host': 'www.beiqiang.online', 'x-forwarded-proto': 'https', cookie: 'private-cookie=value' } });
  const response = await proxy({ env: environment, request });
  assert.equal(response.status, 403); assert.equal(calls, 0);
  const diagnostic = response.headers.get('x-beiqiang-origin-check');
  assert.deepEqual(JSON.parse(diagnostic), { schemeHttp: true, schemeHttps: false, publicHostMatch: false, loopbackHost: true, hasPort: true, eoPagesHostAllowed: true, runtimeHostname: 'localhost', scfRuntime: process.env.TENCENTCLOUD_RUNENV === 'SCF', scfFunctionPresent: !!process.env.SCF_FUNCTIONNAME });
  assert.ok(Object.entries(JSON.parse(diagnostic)).filter(([key]) => key !== 'runtimeHostname').every(([, value]) => typeof value === 'boolean'));
  assert.doesNotMatch(diagnostic, /private-query|private-cookie|www|9000/);
  const unknown = await proxy({ env: environment, request: new Request('https://untrusted.invalid/api/workbench', { headers: { 'eo-pages-host': 'untrusted.invalid' } }) });
  assert.equal(JSON.parse(unknown.headers.get('x-beiqiang-origin-check')).eoPagesHostAllowed, false);
});
