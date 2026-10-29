import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { getStore } from '@edgeone/pages-blob';

// Server-only SDK access. Never issue Blob upload/download URLs or expose store credentials.
export const STORE_NAME = 'beiqiang-owner-workbench-v1';
export const COOKIE = '__Host-beiqiang_workbench';
export const SOURCE_PATHS = new Set([
  '00_总控台/当前状态.md', '00_总控台/全渠道增长总控.md',
  '04_客户开发/获客研究与送达率治理.md',
  '02_Alibaba运营/02_单品优化记录/BQ系列持续优化_2026-09-14/主推采购承接.md',
]);
export const hash = value => createHash('sha256').update(value).digest('hex');
export const normalize = value => String(value).replace(/\r\n?/g, '\n');
export class ApiError extends Error { constructor(status, message) { super(message); this.status = status; } }
export function reply(status, body, headers = {}) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', ...headers } });
}
export function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || !a || a.length !== b.length) return false;
  const left = Buffer.from(a), right = Buffer.from(b); return left.length === right.length && timingSafeEqual(left, right);
}
export function settings(env = {}) {
  const owner = String(env.WORKBENCH_OWNER_EMAIL || '').trim().toLowerCase();
  const secret = String(env.WORKBENCH_SESSION_SECRET || '');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(owner) || Buffer.byteLength(secret) < 32) throw new ApiError(503, '私有工作台尚未配置登录。');
  let origin; try { origin = new URL(env.WORKBENCH_ORIGIN || 'https://www.beiqiang.online').origin; } catch { throw new ApiError(503, '工作台域名配置无效。'); }
  if (!origin.startsWith('https://')) throw new ApiError(503, '工作台必须使用HTTPS。');
  if (env.WORKBENCH_SOURCE_MODE && env.WORKBENCH_SOURCE_MODE !== 'snapshot_review') throw new ApiError(503, '本版仅支持原资料快照审阅；源同步尚未接通。');
  return { owner, secret, origin };
}
export function sameOrigin(request, config) {
  if (new URL(request.url).origin !== config.origin || request.headers.get('origin') !== config.origin || (request.headers.get('sec-fetch-site') && request.headers.get('sec-fetch-site') !== 'same-origin')) throw new ApiError(403, '请从当前工作台页面提交。');
  if ((request.headers.get('content-type') || '').split(';')[0] !== 'application/json') throw new ApiError(415, '请求必须使用JSON。');
}
export async function payload(request, max = 128000) {
  if (Number(request.headers.get('content-length') || 0) > max) throw new ApiError(413, '请求内容过大。');
  const raw = await request.text(); if (Buffer.byteLength(raw) > max) throw new ApiError(413, '请求内容过大。');
  let body; try { body = JSON.parse(raw); } catch { throw new ApiError(400, 'JSON内容无效。'); }
  if (!body || Array.isArray(body) || typeof body !== 'object') throw new ApiError(400, '请求必须是对象。'); return body;
}
export const getJSON = (store, key) => store.get(key, { type: 'json', consistency: 'strong' });
export async function putJSON(store, key, value, fresh = false) {
  try { await store.setJSON(key, value, { onlyIfNew: fresh, cacheControl: 'private, no-store' }); }
  catch (error) { if (error?.code === 'PRECONDITION_FAILED' || error?.name === 'PreconditionFailedError') throw new ApiError(409, '资料或执行状态已变化，请刷新。'); throw error; }
}
export async function records(store, prefix, max = 500) {
  const result = await store.list({ prefix, limit: max + 1, consistency: 'strong' });
  const blobs = result?.blobs || []; if (blobs.length > max || result?.cursor) throw new ApiError(503, '工作台记录超过本版读取范围，请维护后重试。');
  return (await Promise.all(blobs.map(({ key }) => getJSON(store, key)))).filter(Boolean);
}
export function text(value, max, required = false) {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw new ApiError(400, '字段内容无效或过长。'); return value.trim();
}
export function identifier(value) { if (typeof value !== 'string' || !/^[a-f0-9]{32}$/.test(value)) throw new ApiError(400, '记录编号无效。'); return value; }
export function versionKey(kind, id, version) { return `${kind}/${id}/${String(version).padStart(8, '0')}.json`; }
export async function latest(store, kind, id) {
  const all = await records(store, `${kind}/${id}/`, 1000); return all.sort((a, b) => b.version - a.version)[0] || null;
}
export async function allLatest(store, kind) {
  const all = await records(store, `${kind}/`, 3000), map = new Map();
  for (const item of all) if (!map.has(item.id) || map.get(item.id).version < item.version) map.set(item.id, item);
  return [...map.values()].sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));
}
export async function revision(store, kind, item, expected) {
  const current = await latest(store, kind, item.id);
  if ((current?.version || 0) !== expected) throw new ApiError(409, '资料版本已变化，请刷新。');
  const next = { ...item, version: expected + 1 }; await putJSON(store, versionKey(kind, item.id, next.version), next, true); return next;
}
export function sessionCookie(value, seconds = 28800) { return `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${seconds}`; }
export function sign(value, secret) { return createHmac('sha256', secret).update(`workbench-session-v1:${value}`).digest('hex'); }
export async function session(request, config, store, now) {
  const entry = (request.headers.get('cookie') || '').split(';').map(x => x.trim()).find(x => x.startsWith(`${COOKIE}=`));
  const value = entry?.slice(COOKIE.length + 1) || '', match = /^([a-f0-9]{64})\.([a-f0-9]{64})$/.exec(value);
  if (!match || !safeEqual(sign(match[1], config.secret), match[2])) return null;
  const id = hash(match[1]), record = await getJSON(store, `sessions/${id}.json`);
  if (!record || record.email !== config.owner || !(Date.parse(record.expires_at) > now.getTime()) || await getJSON(store, `revoked/${id}.json`)) return null;
  return { ...record, id };
}
export async function requireSession(request, config, store, now, write = false) {
  const current = await session(request, config, store, now); if (!current) throw new ApiError(401, '请先通过管理员邮箱登录。');
  if (write && !safeEqual(request.headers.get('x-workbench-token'), current.csrf_token)) throw new ApiError(403, '页面令牌已失效，请刷新。'); return current;
}
export function dependencies(options = {}) { return { getStoreImpl: getStore, randomBytesImpl: randomBytes, nowImpl: () => new Date(), ...options }; }
export function storeFor(deps) { return deps.getStoreImpl({ name: STORE_NAME, consistency: 'strong' }); }
export function publicSession(current) { return { authenticated: true, email: current.email, expires_at: current.expires_at, csrf_token: current.csrf_token }; }
export function handleError(error) { return reply(error instanceof ApiError ? error.status : 503, { error: error instanceof ApiError ? error.message : '工作台服务暂不可用，请稍后重试。' }); }
export async function rateSlot(store, prefix, slots, date) {
  for (let i = 0; i < slots; i++) {
    try { await putJSON(store, `${prefix}/${i}.json`, { at: date.toISOString() }, true); return; }
    catch (error) { if (error.status !== 409) throw error; }
  }
  throw new ApiError(429, '请求过于频繁，请稍后再试。');
}
export async function documentFor(store, path) { return latest(store, 'documents', hash(path).slice(0, 32)); }
export const lockKey = run => `active/${hash(run.source || `task:${run.task_id}`)}.json`;
export async function releaseLock(store, run) { const key = lockKey(run), active = await getJSON(store, key); if (active?.run_id === run.id) await store.delete(key); }
export async function runFor(store, id, now, events = true) {
  const run = await latest(store, 'runs', identifier(id)); if (!run) throw new ApiError(404, '运行记录不存在。');
  const claim = await getJSON(store, `claims/${id}.json`);
  if (['queued', 'running'].includes(run.status) && claim && Date.parse(claim.lease_expires_at) <= now.getTime()) run.status = 'interrupted';
  if (events) run.events = (await records(store, `events/${id}/`, 1000)).sort((a, b) => a.at.localeCompare(b.at));
  return run;
}
export function validateProposal(run, result, doc) {
  if (!result || typeof result.summary !== 'string' || result.summary.length > 12000 || !Array.isArray(result.changes) || result.changes.length > 30 || !Array.isArray(result.next_steps) || result.next_steps.some(x => typeof x !== 'string' || x.length > 4000)) throw new ApiError(400, '执行结果不符合修订提案格式。');
  if (run.source && (!doc || doc.hash !== run.source_hash || doc.version !== run.source_version)) throw new ApiError(409, '业务源已更新，请重新排队取得新提案。');
  let content = normalize(doc?.content || ''); const original = content, changes = [];
  for (const raw of result.changes) {
    if (!raw || raw.path !== run.source || !doc || typeof raw.before !== 'string' || !raw.before || raw.before.length > 12000 || typeof raw.after !== 'string' || raw.after.length > 16000 || typeof raw.reason !== 'string' || raw.reason.length > 4000) throw new ApiError(400, '仅允许对选中原业务源做小片段精确修订。');
    const change = { path: raw.path, before: normalize(raw.before), after: normalize(raw.after), reason: raw.reason };
    if (original.split(change.before).length !== 2 || content.split(change.before).length !== 2) throw new ApiError(409, '替换原文不存在、重复或互相覆盖。');
    content = content.replace(change.before, () => change.after); changes.push(change);
  }
  return { result: { summary: result.summary, changes, next_steps: result.next_steps }, content };
}
