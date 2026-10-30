import { ApiError, allLatest, dependencies, documentFor, getJSON, handleError, hash, identifier, latest, payload, putJSON, releaseLock, reply, revision, runFor, safeEqual, settings, storeFor, text, validateProposal, versionKey } from '../_lib/workbench.js';
import { isInquiryRun, validateInquiryBinding, validateInquiryResult } from '../_lib/operations-agent.js';

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
      if (body.action === 'status') {
        const run = await runFor(store, identifier(body.run_id), now, false);
        const fields = ['id', 'kind', 'inquiry_reference', 'source_hash', 'handling_version', 'status', 'version', 'title', 'summary', 'result', 'changes', 'error', 'created_at', 'updated_at', 'session_id', 'model', 'usage'];
        return reply(200, { run: Object.fromEntries(fields.filter(key => run[key] !== undefined).map(key => [key, run[key]])) });
      }
      if (body.action === 'claim') {
        const targeted = Object.hasOwn(body, 'run_id');
        if (env.WORKBENCH_RUNNER_MODE === 'manual_cloud' && !targeted) throw new ApiError(400, '手动云任务必须指定run_id，不能领取其他排队任务。');
        let queued;
        if (targeted) {
          const selected = await latest(store, 'runs', identifier(body.run_id));
          if (!selected) throw new ApiError(404, '指定运行记录不存在。');
          if (selected.status !== 'queued') throw new ApiError(409, '指定运行未在排队，不能重复领取。');
          queued = [selected];
        } else queued = (await allLatest(store, 'runs')).filter(run => run.status === 'queued').sort((a, b) => a.created_at.localeCompare(b.created_at));
        for (const run of queued) {
          // Load and verify context before consuming the one-use claim key.
          let document = null;
          try {
            if (isInquiryRun(run)) await validateInquiryBinding(deps, run);
            else if (run.source) {
              document = await getJSON(store, versionKey('documents', hash(run.source).slice(0, 32), run.source_version));
              if (!document || document.hash !== run.source_hash || document.version !== run.source_version) throw new ApiError(409, '原资料快照缺失或已变化。');
            }
          } catch (error) {
            if (error instanceof ApiError && [404, 409].includes(error.status)) {
              const failed = await revision(store, 'runs', { ...run, status: 'failed', error: '任务来源或处理版本已变化，请重新发起。', updated_at: stamp }, run.version);
              await releaseLock(store, failed); if (!targeted) continue;
            }
            throw error;
          }
          const token = deps.randomBytesImpl(32).toString('hex'), claim = { token_hash: hash(token), created_at: stamp, last_seen_at: stamp, lease_expires_at: new Date(now.getTime() + LEASE_MS).toISOString() };
          try { await putJSON(store, `claims/${run.id}.json`, claim, true); } catch (error) { if (error.status === 409 && !targeted) continue; throw error; }
          try {
            const current = await latest(store, 'runs', run.id);
            if (current.status !== 'queued') throw new ApiError(409, '指定运行状态已变化，未领取。');
            const updated = await revision(store, 'runs', { ...current, status: 'running', updated_at: stamp }, current.version);
            return reply(200, { job: { ...updated, lease_token: token, lease_expires_at: claim.lease_expires_at, document } });
          } catch (error) {
            // If another writer transitioned successfully, preserve its lease.
            const current = await latest(store, 'runs', run.id), own = await getJSON(store, `claims/${run.id}.json`);
            if (current?.status !== 'running' && own?.token_hash === claim.token_hash) await store.delete(`claims/${run.id}.json`);
            throw error;
          }
        }
        return reply(200, { job: null });
      }
      const id = identifier(body.run_id), run = await runFor(store, id, now, false), claim = await getJSON(store, `claims/${id}.json`);
      if (!claim || typeof body.lease_token !== 'string' || !safeEqual(hash(body.lease_token), claim.token_hash) || Date.parse(claim.lease_expires_at) <= now.getTime() || run.status !== 'running') throw new ApiError(409, '执行租约已到期、已停止或已完成；不得重复执行。');
      if (body.action === 'heartbeat') {
        claim.last_seen_at = stamp; claim.lease_expires_at = new Date(now.getTime() + LEASE_MS).toISOString(); await putJSON(store, `claims/${id}.json`, claim); return reply(200, { ok: true, lease_expires_at: claim.lease_expires_at });
      }
      if (body.action === 'event') {
        if (!body.event || typeof body.event !== 'object' || Array.isArray(body.event) || JSON.stringify(body.event).length > 12000) throw new ApiError(400, '事件内容无效或过长。');
        await putJSON(store, `events/${id}/${now.getTime()}-${deps.randomBytesImpl(8).toString('hex')}.json`, { ...body.event, at: stamp }, true); return reply(201, { ok: true });
      }
      if (body.action === 'complete') {
        const checked = isInquiryRun(run) ? { result: validateInquiryResult(body.result) } : validateProposal(run, body.result, run.source ? await documentFor(store, run.source) : null);
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
