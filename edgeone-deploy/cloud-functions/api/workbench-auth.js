import { wrapUnifiedHandler } from '../_lib/unified-origin-proxy.js';
import nodemailer from 'nodemailer';
import { ApiError, COOKIE, dependencies, getJSON, handleError, hash, payload, publicSession, putJSON, rateSlot, reply, requireSession, sameOrigin, session, sessionCookie, settings, sign, storeFor } from '../_lib/workbench.js';
import { checkPassword, makePassword } from '../_lib/workbench-password.js';

const PASSWORD_KEY = 'credentials/owner.json';
const SHORT_SECONDS = 8 * 3600, TRUSTED_SECONDS = 30 * 86400;
const recentEmail = (current, now) => current.auth_method === 'email' && now.getTime() >= Date.parse(current.created_at) && now.getTime() - Date.parse(current.created_at) <= 10 * 60000;

async function audit(store, deps, now, event) {
  const suffix = deps.randomBytesImpl(12).toString('hex');
  await putJSON(store, `audit/auth/${now.toISOString().slice(0, 10)}/${suffix}.json`, { event, at: now.toISOString() }, true);
}
async function ownerView(current, store, now) {
  return { ...publicSession(current), password_configured: Boolean(await getJSON(store, PASSWORD_KEY)), recent_email_verification: recentEmail(current, now) };
}
async function newSession(store, deps, config, now, method, trusted) {
  const raw = deps.randomBytesImpl(32).toString('hex'), seconds = trusted ? TRUSTED_SECONDS : SHORT_SECONDS;
  const record = { email: config.owner, created_at: now.toISOString(), expires_at: new Date(now.getTime() + seconds * 1000).toISOString(), csrf_token: deps.randomBytesImpl(32).toString('hex'), auth_method: method, trusted_device: trusted };
  await putJSON(store, `sessions/${hash(raw)}.json`, record, true);
  return { record, cookie: sessionCookie(`${raw}.${sign(raw, config.secret)}`, seconds) };
}
async function revokeOtherSessions(store, current, now) {
  let cursor; const seen = new Set();
  do {
    const page = await store.list({ prefix: 'sessions/', limit: 200, ...(cursor ? { cursor } : {}) });
    for (const item of page.blobs || []) {
      const id = /^sessions\/([a-f0-9]{64})\.json$/.exec(item.key)?.[1];
      if (id && id !== current.id) await putJSON(store, `revoked/${id}.json`, { at: now.toISOString() });
    }
    cursor = page.cursor;
    if (cursor && seen.has(cursor)) throw new ApiError(503, '会话列表读取不完整，请稍后重试。');
    if (cursor) seen.add(cursor);
  } while (cursor);
}
async function passwordRate(store, now) {
  await rateSlot(store, `rate/password/minute/${Math.floor(now.getTime() / 60000)}`, 5, now);
  await rateSlot(store, `rate/password/hour/${Math.floor(now.getTime() / 3600000)}`, 30, now);
}
async function reauthenticate(current, body, store, now) {
  if (recentEmail(current, now)) return;
  await passwordRate(store, now);
  if (!await checkPassword(body.current_password, await getJSON(store, PASSWORD_KEY))) throw new ApiError(401, '请先验证当前密码，或重新使用邮箱登录。');
}

export function createWorkbenchAuthHandlers(options = {}) {
  const deps = dependencies({ createTransportImpl: nodemailer.createTransport, ...options });
  async function onRequestGet({ request, env }) {
    try {
      const config = settings(env), store = storeFor(deps), now = deps.nowImpl(), current = await session(request, config, store, now);
      if (!current) return reply(200, { authenticated: false });
      if (current.trusted_device === true) {
        const { id, ...record } = current; record.expires_at = new Date(now.getTime() + TRUSTED_SECONDS * 1000).toISOString();
        await putJSON(store, `sessions/${id}.json`, record);
        const value = (request.headers.get('cookie') || '').split(';').map(part => part.trim()).find(part => part.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1) || '';
        return reply(200, await ownerView(record, store, now), { 'Set-Cookie': sessionCookie(value, TRUSTED_SECONDS) });
      }
      return reply(200, await ownerView(current, store, now));
    }
    catch (error) { return handleError(error); }
  }
  async function onRequestPost({ request, env = {} }) {
    try {
      const config = settings(env); sameOrigin(request, config); const body = await payload(request, 4000), store = storeFor(deps), now = deps.nowImpl();
      if (body.action === 'request') {
        const generic = { ok: true, message: '如邮箱符合管理员身份，登录链接将发送至该邮箱；请检查收件箱。' };
        if (String(body.email || '').trim().toLowerCase() !== config.owner) return reply(202, generic);
        if (!env.SMTP_PASS) throw new ApiError(503, '登录邮件服务尚未配置。');
        await rateSlot(store, `rate/request/minute/${Math.floor(now.getTime() / 60000)}`, 1, now);
        await rateSlot(store, `rate/request/hour/${Math.floor(now.getTime() / 3600000)}`, 5, now);
        const token = deps.randomBytesImpl(32).toString('hex'), key = `magic/${hash(token)}.json`;
        const credentialVersion = (await getJSON(store, PASSWORD_KEY))?.version || null;
        await putJSON(store, key, { email: config.owner, expires_at: new Date(now.getTime() + 15 * 60000).toISOString(), trusted_device: body.trusted_device === true, credential_version: credentialVersion }, true);
        const transport = deps.createTransportImpl({ host: env.SMTP_HOST || 'smtp.qq.com', port: Number(env.SMTP_PORT || 465), secure: String(env.SMTP_SECURE || 'true') !== 'false', auth: { user: env.SMTP_USER || config.owner, pass: env.SMTP_PASS } });
        try { await transport.sendMail({ from: env.SMTP_FROM || env.SMTP_USER || config.owner, to: config.owner, subject: '贝强私有经营工作台登录', text: `使用以下一次性链接登录私有经营工作台：\n${config.origin}/admin/workbench/#token=${token}\n\n链接15分钟有效，只能使用一次。${body.trusted_device === true ? '本次申请选择了可信设备，登录可保持30天。' : '登录会话8小时后到期。'}如果不是你申请，请忽略本邮件。` }); }
        catch { await store.delete(key); throw new ApiError(503, '登录邮件暂未送达，请稍后重新申请。'); }
        finally { transport.close?.(); }
        return reply(202, generic);
      }
      if (body.action === 'verify') {
        await rateSlot(store, `rate/verify/${hash(request.headers.get('eo-connecting-ip') || request.headers.get('cf-connecting-ip') || 'unknown').slice(0, 24)}/${Math.floor(now.getTime() / 60000)}`, 20, now);
        if (typeof body.token !== 'string' || !/^[a-f0-9]{64}$/.test(body.token)) throw new ApiError(410, '登录链接无效或已过期。');
        const id = hash(body.token), grant = await getJSON(store, `magic/${id}.json`);
        if (!grant || grant.email !== config.owner || !(Date.parse(grant.expires_at) > now.getTime())) throw new ApiError(410, '登录链接无效或已过期。');
        if ((grant.credential_version || null) !== ((await getJSON(store, PASSWORD_KEY))?.version || null)) throw new ApiError(410, '密码已更新，请重新申请登录链接。');
        try { await putJSON(store, `consumed/${id}.json`, { at: now.toISOString() }, true); }
        catch (error) { if (error.status === 409) throw new ApiError(410, '登录链接已使用，请重新申请。'); throw error; }
        const created = await newSession(store, deps, config, now, 'email', grant.trusted_device === true);
        await audit(store, deps, now, 'email_login');
        return reply(200, await ownerView(created.record, store, now), { 'Set-Cookie': created.cookie });
      }
      if (body.action === 'password_login') {
        await passwordRate(store, now);
        const matches = await checkPassword(body.password, await getJSON(store, PASSWORD_KEY));
        const identity = String(body.email || '').trim().toLowerCase() === config.owner;
        await audit(store, deps, now, matches && identity ? 'password_login' : 'password_login_failed');
        if (!matches || !identity) throw new ApiError(401, '邮箱或密码不正确。');
        const created = await newSession(store, deps, config, now, 'password', body.trusted_device === true);
        return reply(200, await ownerView(created.record, store, now), { 'Set-Cookie': created.cookie });
      }
      if (body.action === 'set_password') {
        const current = await requireSession(request, config, store, now, true);
        await reauthenticate(current, body, store, now);
        const credential = await makePassword(body.new_password);
        await putJSON(store, PASSWORD_KEY, { ...credential, version: deps.randomBytesImpl(16).toString('hex'), changed_at: now.toISOString() });
        await revokeOtherSessions(store, current, now); await audit(store, deps, now, 'password_changed');
        return reply(200, { ok: true, message: '密码已更新，其他设备的会话已撤销。' });
      }
      if (body.action === 'logout_others') {
        const current = await requireSession(request, config, store, now, true);
        await reauthenticate(current, body, store, now);
        await revokeOtherSessions(store, current, now); await audit(store, deps, now, 'other_sessions_revoked');
        return reply(200, { ok: true, message: '其他设备的会话已撤销。' });
      }
      if (body.action === 'logout') {
        const current = await requireSession(request, config, store, now, true); await putJSON(store, `revoked/${current.id}.json`, { at: now.toISOString() });
        return reply(200, { authenticated: false }, { 'Set-Cookie': sessionCookie('', 0) });
      }
      throw new ApiError(400, '未知登录操作。');
    } catch (error) { return handleError(error); }
  }
  return { onRequestGet, onRequestPost };
}
const workbenchAuthHandlers = createWorkbenchAuthHandlers();
export const onRequestGet = wrapUnifiedHandler(workbenchAuthHandlers.onRequestGet);
export const onRequestPost = wrapUnifiedHandler(workbenchAuthHandlers.onRequestPost);
