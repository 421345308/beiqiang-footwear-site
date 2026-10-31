import http from 'node:http';
import { AsyncLocalStorage } from 'node:async_hooks';
import { pathToFileURL } from 'node:url';
import { loadRoutes } from './routes.mjs';
import { PLATFORM_CONTEXT } from '../edgeone-deploy/cloud-functions/_lib/platform-store.js';

const requestContext = globalThis[PLATFORM_CONTEXT] ||= new AsyncLocalStorage();
const HOP_HEADERS = new Set(['connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailer', 'transfer-encoding', 'upgrade']);
function httpError(status, message) { return Object.assign(new Error(message), { status }); }
function canonicalOrigin(value) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('Invalid public origin');
  return url.origin;
}

// GET is not universally read-only: workspace loads persist activity, and run
// views reconcile expired execution leases. Pure projections do not take locks.
export function requestNeedsTransaction(request) {
  const url = new URL(request.url), method = request.method;
  if (url.pathname === '/api/storage-upload') return false;
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) return true;
  if (method !== 'GET') return false;
  const pathname = url.pathname.replace(/\/$/, '');
  if (pathname === '/api/buyer-workspace-session') return true;
  if (pathname === '/api/operations') return url.searchParams.has('reference');
  if (pathname === '/api/workbench') {
    if (url.searchParams.get('import_versions') === '1') return false;
    if (url.searchParams.has('run_id')) return true;
    return !url.searchParams.has('document');
  }
  return false;
}

export async function createApiServer({ storage, env = {}, routes, publicOrigin = env.WORKBENCH_ORIGIN || 'http://127.0.0.1', maxBodyBytes = 25 * 1024 * 1024, proxySecret = env.SELF_HOSTED_PROXY_SECRET } = {}) {
  if (!storage?.getStore || !storage?.withTransaction) throw new Error('Private storage is required');
  const origin = canonicalOrigin(publicOrigin);
  routes = new Map(routes || await loadRoutes());
  if (storage.acceptUpload) routes.set('/api/storage-upload', { PUT: async ({ request }) => {
    const token = new URL(request.url).searchParams.get('token');
    await storage.acceptUpload({ token, body: request.body, contentType: request.headers.get('content-type') });
    return new Response(null, { status: 201, headers: { 'cache-control': 'no-store' } });
  } });
  let closing = false;
  const server = http.createServer(async (incoming, outgoing) => {
    try {
      if (closing) throw httpError(503, 'Service stopping');
      const rawPath = (incoming.url || '/').split('?')[0];
      if (rawPath === '/healthz' && incoming.method === 'GET') {
        await storage.query?.('SELECT 1');
        outgoing.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' }); outgoing.end('{"ok":true}'); return;
      }
      const methods = routes.get(rawPath.replace(/\/$/, ''));
      if (!methods) throw httpError(404, 'Not found');
      const handler = methods[incoming.method];
      if (!handler) { outgoing.setHeader('allow', Object.keys(methods).join(', ')); throw httpError(405, 'Method not allowed'); }
      // Public traffic has one configured canonical origin. Forwarded headers
      // are discarded: an untrusted caller cannot impersonate an HTTPS gateway.
      // A same-origin EdgeOne bridge must authenticate with an explicit secret.
      let requestOrigin = origin;
      if (proxySecret || incoming.headers['x-beiqiang-proxy-secret']) {
        const { timingSafeEqual } = await import('node:crypto');
        const supplied = Buffer.from(String(incoming.headers['x-beiqiang-proxy-secret']));
        const expected = Buffer.from(String(proxySecret || ''));
        if (expected.length < 32 || supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) throw httpError(403, 'Invalid frontend proxy');
        const forwarded = canonicalOrigin(`${incoming.headers['x-forwarded-proto']}://${incoming.headers['x-forwarded-host']}`);
        if (forwarded !== origin) throw httpError(403, 'Invalid frontend origin');
        requestOrigin = forwarded;
      }
      const declared = Number(incoming.headers['content-length']);
      if (Number.isFinite(declared) && declared > maxBodyBytes) throw httpError(413, 'Request too large');
      const chunks = []; let size = 0;
      for await (const chunk of incoming) { size += chunk.length; if (size > maxBodyBytes) throw httpError(413, 'Request too large'); chunks.push(chunk); }
      const headers = new Headers();
      const connectionHeaders = new Set(String(incoming.headers.connection || '').toLowerCase().split(',').map(value => value.trim()));
      for (const [key, value] of Object.entries(incoming.headers)) {
        if (HOP_HEADERS.has(key) || connectionHeaders.has(key) || key === 'host' || key === 'forwarded' || key.startsWith('x-forwarded-') || key === 'x-beiqiang-proxy-secret') continue;
        if (Array.isArray(value)) for (const item of value) headers.append(key, item); else if (value !== undefined) headers.set(key, value);
      }
      headers.set('host', new URL(requestOrigin).host);
      const url = new URL(incoming.url || '/', requestOrigin);
      if (url.origin !== requestOrigin) throw httpError(400, 'Invalid request target');
      const request = new Request(url, { method: incoming.method, headers, ...(!['GET', 'HEAD'].includes(incoming.method) ? { body: Buffer.concat(chunks) } : {}) });
      const invoke = () => requestContext.run({ storage }, () => handler({ request, env: { ...env, WORKBENCH_STORAGE: 'self_hosted' }, params: {}, waitUntil: promise => { Promise.resolve(promise).catch(() => {}); } }));
      const response = requestNeedsTransaction(request) ? await storage.withTransaction(async () => {
        const result = await invoke();
        // Existing handlers convert business failures into HTTP responses. A
        // failed service response must not commit partially persisted work.
        if (result instanceof Response && result.status >= 500) throw result;
        return result;
      }).catch(error => { if (error instanceof Response) return error; throw error; }) : await invoke();
      if (!(response instanceof Response)) throw new Error('Invalid API response');
      const responseHeaders = {};
      const responseConnectionHeaders = new Set(String(response.headers.get('connection') || '').toLowerCase().split(',').map(value => value.trim()));
      for (const [key, value] of response.headers) if (!HOP_HEADERS.has(key) && !responseConnectionHeaders.has(key) && key !== 'set-cookie') responseHeaders[key] = value;
      const cookies = response.headers.getSetCookie(); if (cookies.length) responseHeaders['set-cookie'] = cookies;
      outgoing.writeHead(response.status, responseHeaders);
      if (incoming.method === 'HEAD' || !response.body) outgoing.end();
      else { for await (const chunk of response.body) { if (!outgoing.write(chunk)) await new Promise(resolve => outgoing.once('drain', resolve)); } outgoing.end(); }
    } catch (error) {
      if (outgoing.headersSent) { outgoing.destroy(); return; }
      outgoing.writeHead(error.status || (error.code === '40P01' ? 409 : 500), { 'content-type': 'application/json', 'cache-control': 'no-store' });
      outgoing.end(JSON.stringify({ error: error.status ? error.message : 'Private service unavailable' }));
    }
  });
  server.requestTimeout = 60_000;
  server.headersTimeout = 15_000;
  server.maxHeadersCount = 100;
  return { server, routes, async close() { closing = true; await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())); await storage.close(); } };
}

export async function startApiServer(env = process.env) {
  if (!env.WORKBENCH_ORIGIN || Buffer.byteLength(String(env.SELF_HOSTED_UPLOAD_SECRET || '')) < 32 || Buffer.byteLength(String(env.SELF_HOSTED_PROXY_SECRET || '')) < 32) throw new Error('Public origin and private upload/proxy secrets are required');
  const { databaseConfig } = await import('../edgeone-deploy/cloud-functions/_lib/database.js');
  const { createStorage } = await import('./storage.mjs');
  const storage = await createStorage({ connectionString: env.WORKBENCH_DATABASE_URL, dataDir: env.SELF_HOSTED_DATA_DIR, publicOrigin: env.WORKBENCH_ORIGIN, uploadSecret: env.SELF_HOSTED_UPLOAD_SECRET, ssl: databaseConfig(env).ssl, max: 3 });
  let app;
  try {
  await storage.initialize();
  app = await createApiServer({ storage, env, publicOrigin: env.WORKBENCH_ORIGIN });
  const port = Number(env.PORT || 3100);
  await new Promise((resolve, reject) => { app.server.once('error', reject); app.server.listen(port, '127.0.0.1', resolve); });
  } catch (error) { await storage.close(); throw error; }
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => app.close().then(() => { process.exitCode = 0; }, () => { process.exitCode = 1; }));
  return app;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await startApiServer();
