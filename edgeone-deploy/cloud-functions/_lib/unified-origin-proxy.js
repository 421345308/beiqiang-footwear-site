import https from 'node:https';
import { checkServerIdentity } from 'node:tls';
import { platformContext } from './platform-store.js';

const HOP = new Set(['connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailer', 'transfer-encoding', 'upgrade']);
const WRAPPED = Symbol.for('beiqiang.unified-origin-wrapper');
function failure(status, error, headers = {}) { return new Response(JSON.stringify({ error }), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...headers } }); }

export function createUnifiedOriginProxy({ requestImpl = https.request, timeoutMs = 30000, maxBodyBytes = 25 * 1024 * 1024, maxResponseBytes = 32 * 1024 * 1024 } = {}) {
  return async function proxy(context) {
    const { request, env = {} } = context;
    let target, origin;
    try {
      target = new URL(env.UNIFIED_BACKEND_URL);
      origin = new URL(request.url);
      const canonical = new URL(env.WORKBENCH_ORIGIN || 'https://www.beiqiang.online');
      const allowed = new Set([canonical.hostname, 'www.beiqiang.online', 'beiqiang.online']);
      if (target.protocol !== 'https:' || target.username || target.password || target.pathname !== '/' || target.search || target.hash || !env.UNIFIED_BACKEND_CA || Buffer.byteLength(String(env.SELF_HOSTED_PROXY_SECRET || '')) < 32) throw new Error();
      if (origin.protocol !== 'https:' || !allowed.has(origin.hostname) || origin.port) {
        let eoPagesHostAllowed = false;
        try {
          const pagesHost = request.headers.get('eo-pages-host');
          const pagesUrl = new URL(`https://${pagesHost || ''}`);
          eoPagesHostAllowed = !!pagesHost && allowed.has(pagesUrl.hostname) && !pagesUrl.port && !pagesUrl.username && !pagesUrl.password && pagesUrl.pathname === '/' && !pagesUrl.search && !pagesUrl.hash;
        } catch { /* Diagnostic only: this header never grants access. */ }
        return failure(403, 'Frontend origin is not allowed', { 'x-beiqiang-origin-check': JSON.stringify({ schemeHttp: origin.protocol === 'http:', schemeHttps: origin.protocol === 'https:', publicHostMatch: allowed.has(origin.hostname), loopbackHost: ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname), hasPort: !!origin.port, eoPagesHostAllowed }) });
      }
      target.pathname = origin.pathname; target.search = origin.search;
      // The public request URL is the only host source. Forwarded headers sent
      // by a browser are never accepted as authority.
      origin = canonical;
    } catch { return failure(503, 'Unified backend proxy is not configured'); }
    const headers = {};
    const connectionHeaders = new Set(String(request.headers.get('connection') || '').toLowerCase().split(',').map(s => s.trim()));
    for (const [key, value] of request.headers) {
      if (HOP.has(key) || connectionHeaders.has(key) || ['host', 'content-length', 'forwarded', 'x-beiqiang-proxy-secret'].includes(key) || key.startsWith('x-forwarded-')) continue;
      headers[key] = value;
    }
    headers['x-forwarded-host'] = origin.host;
    headers['x-forwarded-proto'] = origin.protocol.slice(0, -1);
    headers['x-beiqiang-proxy-secret'] = env.SELF_HOSTED_PROXY_SECRET;
    const chunks = []; let size = 0;
    if (Number(request.headers.get('content-length')) > maxBodyBytes) return failure(413, 'Request too large');
    try {
      if (request.body) for await (const chunk of request.body) { size += chunk.byteLength; if (size > maxBodyBytes) return failure(413, 'Request too large'); chunks.push(Buffer.from(chunk)); }
    } catch { return failure(400, 'Invalid request body'); }
    const body = Buffer.concat(chunks); if (body.length) headers['content-length'] = String(body.length);
    return new Promise(resolve => {
      let settled = false;
      const complete = response => { if (!settled) { settled = true; clearTimeout(deadline); resolve(response); } };
      let upstream;
      const deadline = setTimeout(() => { upstream?.destroy(); complete(failure(504, 'Unified backend request timed out')); }, timeoutMs);
      try {
        upstream = requestImpl(target, { method: request.method, headers, ca: env.UNIFIED_BACKEND_CA.replace(/\\n/g, '\n'), rejectUnauthorized: true, checkServerIdentity, agent: false }, incoming => {
          const responseChunks = []; let responseSize = 0;
          incoming.on('data', chunk => { responseSize += chunk.length; if (responseSize > maxResponseBytes) { incoming.destroy(); complete(failure(502, 'Unified backend response too large')); } else responseChunks.push(chunk); });
          incoming.on('error', () => complete(failure(502, 'Unified backend response failed')));
          incoming.on('aborted', () => complete(failure(502, 'Unified backend response interrupted')));
          incoming.on('end', () => {
            try {
              const resultHeaders = new Headers();
              const connection = new Set(String(incoming.headers.connection || '').toLowerCase().split(',').map(s => s.trim()));
              for (const [key, value] of Object.entries(incoming.headers)) {
                if (HOP.has(key) || connection.has(key) || value === undefined) continue;
                for (const item of Array.isArray(value) ? value : [value]) resultHeaders.append(key, item);
              }
              const status = incoming.statusCode || 502;
              complete(new Response(request.method === 'HEAD' || [204, 205, 304].includes(status) ? null : Buffer.concat(responseChunks), { status, headers: resultHeaders }));
            } catch { complete(failure(502, 'Invalid unified backend response')); }
          });
        });
        upstream.on('error', () => complete(failure(502, 'Unified backend connection failed')));
        upstream.end(body);
      } catch { complete(failure(502, 'Unified backend connection failed')); }
    });
  };
}
const proxy = createUnifiedOriginProxy();
export function wrapUnifiedHandler(handler, { proxyImpl = proxy } = {}) {
  const wrapped = async context => {
    // Node already is the unified backend; never proxy a request back to itself.
    if (platformContext()) return handler(context);
    const mode = context.env?.UNIFIED_BACKEND_MODE;
    if (!mode) return handler(context);
    if (mode === 'maintenance') return failure(503, 'Unified backend migration in progress', { 'X-Beiqiang-Maintenance': 'unified-migration', 'retry-after': '60' });
    if (mode === 'proxy') return proxyImpl(context);
    return failure(503, 'Unified backend mode is invalid');
  };
  Object.defineProperty(wrapped, WRAPPED, { value: true });
  return wrapped;
}
export function isUnifiedHandler(handler) { return Boolean(handler?.[WRAPPED]); }
