import { wrapUnifiedHandler } from '../_lib/unified-origin-proxy.js';
import { businessRequest } from '../_lib/business-storage.js';
import { controlFor, instructionWithControl } from '../_lib/workbench-control.js';
import { dispatchReadiness } from '../_lib/task-service.js';
import { isInquiryRun } from '../_lib/operations-agent.js';
import { requestedModel } from '../_lib/model-policy.js';
import { ApiError, SOURCE_PATHS, acquireLock, allLatest, dependencies, documentFor, getJSON, handleError, hash, identifier, latest, normalize, payload, putJSON, releaseLock, reply, revision, runFor, safeEqual, settings, storeFor, text, validateProposal } from '../_lib/workbench.js';

const fields = ['id', 'kind', 'task_id', 'source', 'source_version', 'source_hash', 'status', 'version', 'title', 'summary', 'result', 'changes', 'error', 'created_at', 'updated_at', 'session_id', 'model', 'usage'];
const projectRun = run => Object.fromEntries(fields.filter(key => run[key] !== undefined).map(key => [key, run[key]]));

export function createLocalBridgeHandler(options = {}) {
  if (!options.businessContext) return context => businessRequest(context, options, scoped => ({ onRequestPost: createLocalBridgeHandler(scoped) }), 'onRequestPost', 'local');
  const deps = dependencies(options);
  return async function onRequestPost({ request, env = {} }) {
    try {
      settings(env);
      const secret = String(env.WORKBENCH_LOCAL_BRIDGE_SECRET || '');
      if (Buffer.byteLength(secret) < 32 || !safeEqual(request.headers.get('authorization') || '', `Bearer ${secret}`)) throw new ApiError(401, '本机连接身份无效。');
      if ((request.headers.get('content-type') || '').split(';')[0] !== 'application/json') throw new ApiError(415, '请求必须使用JSON。');
      if (!options.transactional) throw new ApiError(503, '本机任务接续需要事务型私有存储。');
      const body = await payload(request, 350000), store = storeFor(deps), now = deps.nowImpl(), stamp = now.toISOString();
      if (body.action === 'workspace_status') {
        // Read heartbeat before queue records, matching the runner's lock order.
        const dispatch = await dispatchReadiness(deps, env, now);
        const age = now.getTime() - Date.parse(dispatch.last_seen_at);
        if (!Number.isFinite(age) || age < 0) {
          dispatch.ready = false; dispatch.auth = null; dispatch.models = [];
          dispatch.blocking_reasons.push('执行器心跳时间无效，需重新核验。');
        }
        const records = (await allLatest(store, 'runs')).filter(run => !isInquiryRun(run))
          .sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)));
        const runs = [];
        for (const record of records.slice(0, 100)) {
          const view = projectRun(await runFor(store, record.id, now, false));
          delete view.result; delete view.changes;
          runs.push({ ...view, next_action: view.status === 'awaiting_review' ? 'review' :
            ['interrupted', 'failed'].includes(view.status) ? 'reconcile' : null });
        }
        return reply(200, { observed_at: stamp, runs, dispatch,
          counts: { returned: runs.length, total: records.length }, truncated: records.length > runs.length,
          scope: 'project_runs_only' });
      }
      if (body.action === 'tasks') {
        const tasks = (await allLatest(store, 'tasks')).filter(task => !task.source || SOURCE_PATHS.has(task.source));
        const result = [];
        for (const task of tasks.slice(0, 100)) {
          const doc = task.source ? await documentFor(store, task.source) : null;
          result.push({ id: task.id, title: task.title, source: task.source || null, version: task.version,
                        source_version: task.source ? doc?.version || 0 : null, source_hash: doc?.hash || null });
        }
        return reply(200, { tasks: result });
      }
      if (body.action === 'pending_reviews') {
        const runs = (await allLatest(store, 'runs')).filter(run => run.status === 'awaiting_review' && !isInquiryRun(run))
          .sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at))).slice(0, 100)
          .map(run => { const view = projectRun(run); delete view.result; delete view.changes; return view; });
        return reply(200, { runs });
      }
      if (body.action === 'status') {
        const run = await runFor(store, identifier(body.run_id), now, false);
        if (isInquiryRun(run)) throw new ApiError(403, '网站询盘请在原后台审阅。');
        return reply(200, { run: projectRun(run) });
      }
      if (body.action === 'request_status') {
        const record = await getJSON(store, `local_requests/${identifier(body.request_id)}.json`);
        return reply(200, record ? { found: true, run: projectRun(await runFor(store, record.run_id, now, false)) } : { found: false });
      }
      if (body.action === 'review_no_change') {
        if (Object.keys(body).sort().join(',') !== 'action,expected_version,run_id' || !Number.isInteger(body.expected_version) || body.expected_version < 1) throw new ApiError(400, '审阅字段无效。');
        const run = await runFor(store, identifier(body.run_id), now, false);
        if (isInquiryRun(run)) throw new ApiError(403, '网站询盘请在原后台审阅。');
        if (run.status === 'accepted' && run.review_origin === 'local_no_change' && run.reviewed_version === body.expected_version) return reply(200, { run: projectRun(run), replay: true });
        if (run.status !== 'awaiting_review' || run.version !== body.expected_version) throw new ApiError(409, '成果版本或审阅状态已变化。');
        const doc = run.source ? await documentFor(store, run.source) : null;
        if (validateProposal(run, run.result, doc).result.changes.length) throw new ApiError(409, '涉及原资料修改的成果请先按原流程审阅。');
        const updated = await revision(store, 'runs', { ...run, status: 'accepted', reviewed_at: stamp, updated_at: stamp,
          review_origin: 'local_no_change', reviewed_version: run.version }, run.version);
        return reply(200, { run: projectRun(updated) });
      }
      if (body.action !== 'enqueue') throw new ApiError(400, '未知本机连接操作。');
      const keys = ['action', 'request_id', 'task_id', 'instruction', 'model', 'task_version', 'source_version', 'source_content'];
      if (Object.keys(body).some(key => !keys.includes(key))) throw new ApiError(400, '任务字段无效。');
      const requestId = identifier(body.request_id), taskId = identifier(body.task_id), model = requestedModel(body.model);
      const instruction = text(body.instruction, 12000, true);
      if (!Number.isInteger(body.task_version) || body.task_version < 1) throw new ApiError(400, '任务版本无效。');
      const fingerprint = hash(JSON.stringify([taskId, instruction, model, body.task_version, body.source_version, body.source_content]));
      const marker = `local_requests/${requestId}.json`, prior = await getJSON(store, marker);
      if (prior) {
        if (prior.fingerprint !== fingerprint) throw new ApiError(409, '请求编号已用于其他任务。');
        return reply(200, { run: projectRun(await runFor(store, prior.run_id, now, false)), replay: true });
      }
      const task = await latest(store, 'tasks', taskId);
      if (!task || task.version !== body.task_version) throw new ApiError(409, '任务版本已变化，请重新读取。');
      if (task.source && !SOURCE_PATHS.has(task.source)) throw new ApiError(400, '任务来源不在允许范围。');
      // Match the owner enqueue route: task, owner control, then document.
      const control = await controlFor(store);
      let doc = task.source ? await documentFor(store, task.source) : null;
      if (task.source) {
        if (!Number.isInteger(body.source_version) || body.source_version < 0 || (doc?.version || 0) !== body.source_version) throw new ApiError(409, '云端资料版本已变化，请重新读取。');
        if (typeof body.source_content !== 'string' || body.source_content.length > 100000) throw new ApiError(400, '本地资料内容无效或过长。');
      } else if (body.source_version !== null || body.source_content !== null) throw new ApiError(400, '此任务没有本地资料来源。');
      const run = { id: deps.randomBytesImpl(16).toString('hex'), task_id: task.id, title: task.title, source: task.source || null,
        source_hash: null, source_version: null, instruction: '', model, status: 'queued', created_at: stamp, updated_at: stamp,
        session_id: null, summary: '', result: null, changes: [], usage: null, error: null };
      await acquireLock(store, run);
      try {
        if (task.source) {
          const content = normalize(body.source_content), contentHash = hash(content);
          if (!doc || doc.hash !== contentHash) {
            const pending = (await allLatest(store, 'runs')).some(item => item.source === task.source && ['queued', 'running', 'awaiting_review'].includes(item.status));
            if (pending) throw new ApiError(409, '该资料仍有未完成或待审成果，请先处理后再同步新版本。');
            doc = await revision(store, 'documents', { id: hash(task.source).slice(0, 32), path: task.source, content, hash: contentHash, updated_at: stamp }, body.source_version);
          }
          run.source_hash = doc.hash; run.source_version = doc.version;
        }
        run.instruction = instructionWithControl(instruction, control); run.control_snapshot = control;
        const saved = await revision(store, 'runs', run, 0);
        await putJSON(store, marker, { fingerprint, run_id: saved.id, created_at: stamp }, true);
        return reply(201, { run: projectRun(saved), replay: false });
      } catch (error) { await releaseLock(store, run); throw error; }
    } catch (error) { if (options.transactional) throw error; return handleError(error); }
  };
}
export const onRequestPost = wrapUnifiedHandler(createLocalBridgeHandler());
