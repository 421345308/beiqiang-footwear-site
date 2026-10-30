import { CONTROL_ID, controlFor, importStatus, instructionWithControl, saveControl } from '../_lib/workbench-control.js';
import { ApiError, SOURCE_PATHS, allLatest, dependencies, documentFor, getJSON, handleError, hash, identifier, latest, lockKey, normalize, payload, putJSON, releaseLock, reply, requireSession, revision, runFor, sameOrigin, settings, storeFor, text, validateProposal, versionKey } from '../_lib/workbench.js';

// Owner attestation plus imported-snapshot equality, never a local filesystem check.
export async function confirmLocalApplication(store, run, now) {
  if (run.status !== 'awaiting_review' || !SOURCE_PATHS.has(run.source) || !Number.isInteger(run.source_version) || run.source_version < 1) throw new ApiError(409, '该提案没有可确认的原文修改。');
  const oldDoc = await getJSON(store, versionKey('documents', hash(run.source).slice(0, 32), run.source_version));
  if (!oldDoc || oldDoc.path !== run.source || oldDoc.version !== run.source_version || oldDoc.hash !== run.source_hash || hash(normalize(oldDoc.content)) !== run.source_hash) throw new ApiError(409, '原始历史快照缺失或不一致，无法确认本地回写。');
  const checked = validateProposal(run, run.result, oldDoc);
  if (!checked.result.changes.length) throw new ApiError(409, '该提案没有原文修改，请使用结论审阅流程。');
  const expectedHash = hash(checked.content), imported = await documentFor(store, run.source);
  if (!imported || imported.version <= run.source_version || imported.hash !== expectedHash || hash(normalize(imported.content)) !== expectedHash) throw new ApiError(409, '请先在项目中审阅回写，再导入与提案结果一致的新快照。');
  const stamp = now.toISOString();
  return revision(store, 'runs', { ...run, status: 'accepted', review_origin: 'local', reviewed_at: stamp, updated_at: stamp, local_application: { source: run.source, source_hash: run.source_hash, applied_hash: expectedHash, source_version: run.source_version, imported_version: imported.version } }, run.version);
}

function taskFields(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ApiError(400, '任务内容必须是对象。');
  return { title: text(input.title, 240, true), status: typeof input.status === 'string' ? text(input.status, 80) : '待开始', owner: typeof input.owner === 'string' ? text(input.owner, 240) : '管理员', result: typeof input.result === 'string' ? text(input.result, 12000) : '', next: typeof input.next === 'string' ? text(input.next, 12000) : '', dependency: typeof input.dependency === 'string' ? text(input.dependency, 4000) : '', source: typeof input.source === 'string' ? text(input.source, 500) : '', evidence: [] };
}
export function createWorkbenchHandlers(options = {}) {
  const deps = dependencies(options);
  async function onRequestGet({ request, env = {} }) {
    try {
      const config = settings(env), store = storeFor(deps), now = deps.nowImpl(), current = await requireSession(request, config, store, now);
      const url = new URL(request.url);
      if (url.searchParams.get('import_versions') === '1') {
        const documents = await allLatest(store, 'documents'), tasks = await allLatest(store, 'tasks');
        return reply(200, {
          documents: [...SOURCE_PATHS].map(path => ({ path, version: documents.find(doc => doc.path === path)?.version || 0 })),
          tasks: tasks.filter(task => (!task.source || SOURCE_PATHS.has(task.source)) && task.id === hash(task.source + '\n' + task.title).slice(0, 32)).map(task => ({ source: task.source, title: task.title, version: task.version })),
        });
      }
      if (url.searchParams.has('run_id')) return reply(200, { run: await runFor(store, url.searchParams.get('run_id'), now) });
      if (url.searchParams.has('document')) { const doc = await documentFor(store, url.searchParams.get('document')); if (!doc) throw new ApiError(404, '该资料尚未迁移到私有云工作台。'); return reply(200, { document: doc }); }
      const tasks = await allLatest(store, 'tasks'), rawRuns = await allLatest(store, 'runs'), runs = await Promise.all(rawRuns.map(run => runFor(store, run.id, now, false)));
      const runner = env.WORKBENCH_RUNNER_SECRET ? await getJSON(store, 'runner/heartbeat.json') : null;
      const mode = env.WORKBENCH_RUNNER_MODE === 'manual_cloud' ? 'manual_cloud' : 'self_hosted';
      const configured = Buffer.byteLength(String(env.WORKBENCH_RUNNER_SECRET || '')) >= 32;
      const activeSessions = (await Promise.all(runs.filter(run => run.status === 'running').map(async run => {
        const claim = await getJSON(store, `claims/${run.id}.json`);
        return claim && Date.parse(claim.lease_expires_at) > now.getTime() ? { run_id: run.id, started_at: claim.created_at, last_seen_at: claim.last_seen_at || claim.created_at, lease_expires_at: claim.lease_expires_at } : null;
      }))).filter(Boolean);
      const connected = mode === 'self_hosted' && Boolean(configured && runner && now.getTime() - Date.parse(runner.at) < 150000);
      const runnerStatus = mode === 'manual_cloud' ? (activeSessions.length ? 'manual_cloud_active' : 'manual_cloud_idle') : (connected ? 'online' : 'offline');
      return reply(200, { control: await controlFor(store), status_snapshot: await latest(store, 'status_snapshots', CONTROL_ID), goals: await getJSON(store, 'goals/current.json') || { long_term: '', phase: '' }, tasks, runs, capabilities: { model: 'gpt-6.1-sol', local_edit: false, external_actions: false, runner_mode: mode, runner_configured: configured, runner_connected: connected, runner_status: runnerStatus, runner_last_seen: runner?.at || null, runner_active_sessions: activeSessions, storage: 'private_blob', can_accept_proposals: false, source_sync: { mode: 'snapshot_review', connected: false, local_authoritative: true, can_accept_changes: false } }, csrf_token: current.csrf_token });
    } catch (error) { return handleError(error); }
  }
  async function onRequestPost({ request, env = {} }) {
    try {
      const config = settings(env); sameOrigin(request, config); const store = storeFor(deps), now = deps.nowImpl(); await requireSession(request, config, store, now, true);
      const body = await payload(request, 350000), stamp = now.toISOString();
      if (body.action === 'save_control') return reply(200, { control: await saveControl(store, body, stamp) });
      if (body.action === 'import_status') return reply(201, { status_snapshot: await importStatus(store, body, stamp) });
      if (body.action === 'create') {
        const fields = taskFields(body.task);
        if (fields.source && !SOURCE_PATHS.has(fields.source)) throw new ApiError(400, '此资料不在本次工作台迁移范围内。');
        const task = await revision(store, 'tasks', { ...fields, id: deps.randomBytesImpl(16).toString('hex'), created_at: stamp, updated_at: stamp }, 0); return reply(201, { task });
      }
      if (body.action === 'import') {
        if (!Array.isArray(body.documents) || body.documents.length > 4 || !Array.isArray(body.tasks) || body.tasks.length > 30) throw new ApiError(400, '导入范围无效。');
        const goals = body.goals ? { long_term: text(body.goals.long_term, 12000), phase: text(body.goals.phase, 12000), updated_at: stamp } : null;
        // Explicit owner import only; no filesystem reads, repository scans or public seed assets.
        const preparedDocs = body.documents.map(doc => {
          if (!SOURCE_PATHS.has(doc?.path) || typeof doc.content !== 'string' || doc.content.length > 100000) throw new ApiError(400, '只可导入本次明确准备的四份业务文档。');
          const content = normalize(doc.content); return { id: hash(doc.path).slice(0, 32), path: doc.path, content, hash: hash(content), updated_at: stamp, expected: Number(doc.expected_version || 0) };
        });
        const preparedTasks = body.tasks.map(input => { const fields = taskFields(input); if (fields.source && !SOURCE_PATHS.has(fields.source)) throw new ApiError(400, '任务来源不在迁移范围。'); return { ...fields, id: input.id ? identifier(input.id) : hash(fields.source + '\n' + fields.title).slice(0, 32), created_at: stamp, updated_at: stamp, expected: Number(input.expected_version || 0) }; });
        if (new Set(preparedDocs.map(x => x.id)).size !== preparedDocs.length || new Set(preparedTasks.map(x => x.id)).size !== preparedTasks.length) throw new ApiError(400, '导入包中存在重复文档或任务。');
        for (const doc of preparedDocs) if (((await latest(store, 'documents', doc.id))?.version || 0) !== doc.expected) throw new ApiError(409, '原文云版本已变化，导入未开始。');
        for (const task of preparedTasks) if (((await latest(store, 'tasks', task.id))?.version || 0) !== task.expected) throw new ApiError(409, '任务云版本已变化，导入未开始。');
        const documents = [], tasks = [];
        for (const { expected, ...doc } of preparedDocs) documents.push(await revision(store, 'documents', doc, expected));
        for (const { expected, ...task } of preparedTasks) tasks.push(await revision(store, 'tasks', task, expected));
        if (goals) await putJSON(store, 'goals/current.json', goals);
        return reply(201, { tasks, documents: documents.map(doc => ({ id: doc.id, path: doc.path, hash: doc.hash, version: doc.version, updated_at: doc.updated_at })), message: '已导入私有云审阅快照；原业务资料仍以本地为准，同步未接通。' });
      }
      if (body.action === 'enqueue') {
        const task = await latest(store, 'tasks', identifier(body.task_id)); if (!task) throw new ApiError(404, '任务不存在。');
        const control = await controlFor(store);
        const instruction = instructionWithControl(text(body.instruction, 12000, true), control), doc = task.source ? await documentFor(store, task.source) : null;
        if (task.source && !doc) throw new ApiError(409, '原业务资料尚未迁移，请先导入选中来源。');
        const run = { id: deps.randomBytesImpl(16).toString('hex'), task_id: task.id, title: task.title, source: task.source, source_hash: doc?.hash || null, source_version: doc?.version || null, instruction, control_snapshot: control, model: 'gpt-6.1-sol', status: 'queued', created_at: stamp, updated_at: stamp, session_id: null, summary: '', result: null, changes: [], usage: null, error: null };
        const key = lockKey(run); await putJSON(store, key, { run_id: run.id, at: stamp }, true);
        try { return reply(201, { run: await revision(store, 'runs', run, 0), message: '已持久排队；只有执行器领取后才会运行。' }); }
        catch (error) { await releaseLock(store, run); throw error; }
      }
      if (body.action === 'cancel') {
        const run = await runFor(store, body.run_id, now, false); if (!['queued', 'running', 'interrupted'].includes(run.status)) throw new ApiError(409, '该运行当前不可停止。');
        const updated = await revision(store, 'runs', { ...run, status: 'cancelled', updated_at: stamp }, run.version); await releaseLock(store, run); return reply(200, { run: updated, message: '已停止队列/接收结果；已领取的执行器在下一次续租时停止。' });
      }
      if (body.action === 'confirm_local_application') {
        const run = await runFor(store, body.run_id, now, false);
        if (body.expected_version !== run.version) throw new ApiError(409, '提案版本或审核状态已变化。');
        return reply(200, { run: await confirmLocalApplication(store, run, now), message: '已确认本地回写：管理员确认且新导入快照与提案一致；服务器未直接读取本地磁盘。' });
      }
      if (body.action === 'review') {
        const run = await runFor(store, body.run_id, now, false);
        if (run.status !== 'awaiting_review' || body.expected_version !== run.version || !['accept', 'reject'].includes(body.decision)) throw new ApiError(409, '提案版本或审核状态已变化。');
        if (body.decision === 'accept') {
          const doc = run.source ? await documentFor(store, run.source) : null, checked = validateProposal(run, run.result, doc);
          if (checked.result.changes.length) throw new ApiError(409, '原资料仍以本地为准，云端提案可查看/下载；同步接通后才能采纳。');
        }
        const updated = await revision(store, 'runs', { ...run, status: body.decision === 'accept' ? 'accepted' : 'rejected', reviewed_at: stamp, updated_at: stamp }, run.version);
        return reply(200, { run: updated, message: body.decision === 'accept' ? '已确认无需原文修改的结论；本地原资料未改变。' : '已拒绝，提案和证据保留。' });
      }
      throw new ApiError(400, '未知工作台操作。');
    } catch (error) { return handleError(error); }
  }
  return { onRequestGet, onRequestPost };
}
const workbenchBusinessHandlers = createWorkbenchHandlers();
export const onRequestGet = workbenchBusinessHandlers.onRequestGet;
export const onRequestPost = workbenchBusinessHandlers.onRequestPost;
