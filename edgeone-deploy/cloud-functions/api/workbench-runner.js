import { ApiError, allLatest, dependencies, documentFor, getJSON, handleError, hash, identifier, latest, payload, putJSON, releaseLock, reply, revision, runFor, safeEqual, settings, storeFor, text, validateProposal, versionKey } from '../_lib/workbench.js';

const LEASE_MS = 10 * 60000;
export function createWorkbenchRunnerHandler(options = {}) {
  const deps = dependencies(options);
  return async function onRequestPost({ request, env = {} }) {
    try {
      settings(env);
      if (Buffer.byteLength(String(env.WORKBENCH_RUNNER_SECRET || '')) < 32) throw new ApiError(503, '执行器尚未连接。');
      const authorization = request.headers.get('authorization') || '';
      if (!safeEqual(authorization, `Bearer ${env.WORKBENCH_RUNNER_SECRET}`)) throw new ApiError(401, '执行器身份无效。');
      if ((request.headers.get('content-type') || '').split(';')[0] !== 'application/json') throw new ApiError(415, '请求必须使用JSON。');
      const body = await payload(request, 150000), store = storeFor(deps), now = deps.nowImpl(), stamp = now.toISOString();
      await putJSON(store, 'runner/heartbeat.json', { at: stamp });
      if (body.action === 'heartbeat' && !body.run_id) return reply(200, { ok: true, at: stamp });
      if (body.action === 'claim') {
        const queued = (await allLatest(store, 'runs')).filter(run => run.status === 'queued').sort((a, b) => a.created_at.localeCompare(b.created_at));
        for (const run of queued) {
          const token = deps.randomBytesImpl(32).toString('hex'), claim = { token_hash: hash(token), created_at: stamp, lease_expires_at: new Date(now.getTime() + LEASE_MS).toISOString() };
          try { await putJSON(store, `claims/${run.id}.json`, claim, true); } catch (error) { if (error.status === 409) continue; throw error; }
          const current = await latest(store, 'runs', run.id);
          if (current.status !== 'queued') continue;
          const updated = await revision(store, 'runs', { ...current, status: 'running', updated_at: stamp }, current.version);
          const document = run.source ? await getJSON(store, versionKey('documents', hash(run.source).slice(0, 32), run.source_version)) : null;
          return reply(200, { job: { ...updated, lease_token: token, lease_expires_at: claim.lease_expires_at, document } });
        }
        return reply(200, { job: null });
      }
      const id = identifier(body.run_id), run = await runFor(store, id, now, false), claim = await getJSON(store, `claims/${id}.json`);
      if (!claim || typeof body.lease_token !== 'string' || !safeEqual(hash(body.lease_token), claim.token_hash) || Date.parse(claim.lease_expires_at) <= now.getTime() || run.status !== 'running') throw new ApiError(409, '执行租约已到期、已停止或已完成；不得重复执行。');
      if (body.action === 'heartbeat') {
        claim.lease_expires_at = new Date(now.getTime() + LEASE_MS).toISOString(); await putJSON(store, `claims/${id}.json`, claim); return reply(200, { ok: true, lease_expires_at: claim.lease_expires_at });
      }
      if (body.action === 'event') {
        if (!body.event || typeof body.event !== 'object' || Array.isArray(body.event) || JSON.stringify(body.event).length > 12000) throw new ApiError(400, '事件内容无效或过长。');
        await putJSON(store, `events/${id}/${now.getTime()}-${deps.randomBytesImpl(8).toString('hex')}.json`, { ...body.event, at: stamp }, true); return reply(201, { ok: true });
      }
      if (body.action === 'complete') {
        const checked = validateProposal(run, body.result, run.source ? await documentFor(store, run.source) : null);
        const updated = await revision(store, 'runs', { ...run, result: checked.result, changes: checked.result.changes, summary: checked.result.summary, status: 'awaiting_review', updated_at: stamp, session_id: typeof body.session_id === 'string' ? text(body.session_id, 160) : null, usage: body.usage && typeof body.usage === 'object' ? body.usage : null }, run.version);
        await releaseLock(store, run); return reply(200, { run: updated });
      }
      if (body.action === 'fail') {
        const updated = await revision(store, 'runs', { ...run, status: 'failed', error: text(body.error, 4000, true), updated_at: stamp }, run.version); await releaseLock(store, run); return reply(200, { run: updated });
      }
      throw new ApiError(400, '未知执行器操作。');
    } catch (error) { return handleError(error); }
  };
}
export const onRequestPost = createWorkbenchRunnerHandler();
