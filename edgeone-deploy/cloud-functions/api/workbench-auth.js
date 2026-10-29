import nodemailer from 'nodemailer';
import { ApiError, dependencies, getJSON, handleError, hash, payload, publicSession, putJSON, rateSlot, reply, requireSession, sameOrigin, session, sessionCookie, settings, sign, storeFor } from '../_lib/workbench.js';

export function createWorkbenchAuthHandlers(options = {}) {
  const deps = dependencies({ createTransportImpl: nodemailer.createTransport, ...options });
  async function onRequestGet({ request, env }) {
    try { const config = settings(env), store = storeFor(deps), current = await session(request, config, store, deps.nowImpl()); return reply(200, current ? publicSession(current) : { authenticated: false }); }
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
        await putJSON(store, key, { email: config.owner, expires_at: new Date(now.getTime() + 15 * 60000).toISOString() }, true);
        const transport = deps.createTransportImpl({ host: env.SMTP_HOST || 'smtp.qq.com', port: Number(env.SMTP_PORT || 465), secure: String(env.SMTP_SECURE || 'true') !== 'false', auth: { user: env.SMTP_USER || config.owner, pass: env.SMTP_PASS } });
        try { await transport.sendMail({ from: env.SMTP_FROM || env.SMTP_USER || config.owner, to: config.owner, subject: '贝强私有经营工作台登录', text: `使用以下一次性链接登录私有经营工作台：\n${config.origin}/admin/workbench/#token=${token}\n\n链接15分钟有效，只能使用一次。登录会话8小时后到期。如果不是你申请，请忽略本邮件。` }); }
        catch { await store.delete(key); throw new ApiError(503, '登录邮件暂未送达，请稍后重新申请。'); }
        finally { transport.close?.(); }
        return reply(202, generic);
      }
      if (body.action === 'verify') {
        await rateSlot(store, `rate/verify/${hash(request.headers.get('eo-connecting-ip') || request.headers.get('cf-connecting-ip') || 'unknown').slice(0, 24)}/${Math.floor(now.getTime() / 60000)}`, 20, now);
        if (typeof body.token !== 'string' || !/^[a-f0-9]{64}$/.test(body.token)) throw new ApiError(410, '登录链接无效或已过期。');
        const id = hash(body.token), grant = await getJSON(store, `magic/${id}.json`);
        if (!grant || grant.email !== config.owner || !(Date.parse(grant.expires_at) > now.getTime())) throw new ApiError(410, '登录链接无效或已过期。');
        try { await putJSON(store, `consumed/${id}.json`, { at: now.toISOString() }, true); }
        catch (error) { if (error.status === 409) throw new ApiError(410, '登录链接已使用，请重新申请。'); throw error; }
        const raw = deps.randomBytesImpl(32).toString('hex'), current = { email: config.owner, created_at: now.toISOString(), expires_at: new Date(now.getTime() + 8 * 3600000).toISOString(), csrf_token: deps.randomBytesImpl(32).toString('hex') };
        await putJSON(store, `sessions/${hash(raw)}.json`, current, true);
        return reply(200, publicSession(current), { 'Set-Cookie': sessionCookie(`${raw}.${sign(raw, config.secret)}`) });
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
export const onRequestGet = workbenchAuthHandlers.onRequestGet;
export const onRequestPost = workbenchAuthHandlers.onRequestPost;
