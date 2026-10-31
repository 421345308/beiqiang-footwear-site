import { wrapUnifiedHandler } from '../_lib/unified-origin-proxy.js';
import { businessHandlers } from '../_lib/business-storage.js';
import { ApiError, acquireLock, activeLock, dependencies, handleError, latest, payload, releaseLock, reply, requireSession, revision, runFor, sameOrigin, settings, storeFor, text } from '../_lib/workbench.js';
import { OPS_STORE, SOURCE, createOperationsStore, handlingFields, handlingView, reference, safeInquiry, sourceHash } from '../_lib/operations.js';
import { agentProposal, agentRunView, inquiryContext, inquiryRunFor } from '../_lib/operations-agent.js';
import { controlFor, instructionWithControl } from '../_lib/workbench-control.js';

export function createOperationsHandlers(options = {}) {
  if (!options.businessContext) return businessHandlers(options, createOperationsHandlers);
  const deps = dependencies(options);
  const sourceInfo = { ...SOURCE, backend: options.backend?.kind || 'private_blob', postgres: options.backend?.kind === 'postgres' };
  const adapter = () => options.adapter || createOperationsStore({ inquiryStore: deps.getStoreImpl({ name: 'beiqiang-inquiries', consistency: 'strong' }), opsStore: deps.getStoreImpl({ name: OPS_STORE, consistency: 'strong' }) });
  async function authorize(request, env, write = false) {
    const config = settings(env); if (write) sameOrigin(request, config);
    return requireSession(request, config, storeFor(deps), deps.nowImpl(), write);
  }
  async function detail(store, ref) {
    const record = await store.source(ref), handling = await store.handling(ref), proposals = await store.proposals(ref);
    const wb = storeFor(deps), runs = [];
    for (const id of store.runIds ? await store.runIds(ref) : []) {
      if (await inquiryRunFor(wb, id, ref)) runs.push(await runFor(wb, id, deps.nowImpl(), false));
    }
    runs.sort((a, b) => b.created_at.localeCompare(a.created_at));
    // Decisions live in the same versioned object as handling; immutable proposals remain intact.
    const decisions = handling.decisions || {};
    return { inquiry: safeInquiry(record, true), handling: handlingView(handling, record), source_hash: sourceHash(record), proposals: [...proposals.map(p => ({ ...p, decision: decisions[p.id] || null, stale: p.source_hash !== sourceHash(record) || p.handling_version !== handling.version })), ...runs.map(run => agentProposal(run, record, handling)).filter(Boolean)].sort((a, b) => b.created_at.localeCompare(a.created_at)), agent_runs: runs.map(run => agentRunView(run, record, handling)), source: sourceInfo, updated_at: deps.nowImpl().toISOString() };
  }
  async function onRequestGet({ request, env = {} }) {
    try {
      const current = await authorize(request, env), store = adapter(), url = new URL(request.url);
      if (url.searchParams.has('reference')) return reply(200, { ...await detail(store, reference(url.searchParams.get('reference'))), csrf_token: current.csrf_token });
      const limit = Number(url.searchParams.get('limit') || url.searchParams.get('page_size') || 30), cursor = Number(url.searchParams.get('cursor') || ((Number(url.searchParams.get('page') || 1) - 1) * limit));
      if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(cursor) || cursor < 0) throw new ApiError(400, '分页参数无效。');
      const items = []; const records = await store.listSources(), handlings = store.listHandlings ? await store.listHandlings() : null;
      for (const record of records) {
        const ref = reference(record.reference), stored = handlings ? handlings.get(ref) || { reference: ref, version: 0, internal_note: '', next_action: '', handling_status: 'open', updated_at: null } : await store.handling(ref);
        const handling = handlingView(stored, record);
        items.push({ ...safeInquiry(record), handling, pending: handling.pending, source_hash: sourceHash(record) });
      }
      items.sort((a, b) => String(b.updatedAt || b.receivedAt || '').localeCompare(String(a.updatedAt || a.receivedAt || '')) || a.reference.localeCompare(b.reference));
      const includeTests = url.searchParams.get('include_tests') === '1', visible = includeTests ? items : items.filter(item => !item.internalTest);
      const all = url.searchParams.get('view') === 'all' || url.searchParams.get('status') === 'all', filtered = all ? visible : visible.filter(item => item.pending);
      return reply(200, { items: filtered.slice(cursor, cursor + limit), total: filtered.length, source_total: items.length, test_total: items.filter(item => item.internalTest).length, pending_total: visible.filter(item => item.pending).length, pagecursor: cursor + limit < filtered.length ? String(cursor + limit) : null, source: sourceInfo, updated_at: deps.nowImpl().toISOString(), csrf_token: current.csrf_token });
    } catch (error) { if (options.transactional) throw error; return handleError(error); }
  }
  async function onRequestPost({ request, env = {} }) {
    try {
      await authorize(request, env, true); const body = await payload(request, 20000), store = adapter(), ref = reference(body.reference), record = await store.source(ref), handling = await store.handling(ref), stamp = deps.nowImpl().toISOString();
      if (body.action === 'enqueue_agent') {
        if (body.source_hash !== sourceHash(record) || body.expected_version !== handling.version) throw new ApiError(409, '询盘或处理版本已变化，请刷新后重新发起。');
        const wb = storeFor(deps), control = await controlFor(wb), userInstruction = body.instruction === undefined ? '' : text(body.instruction, 12000), instruction = instructionWithControl(userInstruction || '整理已确认需求、待核信息与下一动作，不外发、不承诺未确认价格/材料/交期', control);
        const run = { id: deps.randomBytesImpl(16).toString('hex'), kind: 'inquiry_review', task_id: null, title: `网站询盘处理 · ${ref}`, source: null, inquiry_reference: ref, source_hash: sourceHash(record), source_version: null, handling_version: handling.version, inquiry_context: inquiryContext(record, handling), instruction, control_snapshot: control, model: 'gpt-6.1-sol', status: 'queued', version: 0, created_at: stamp, updated_at: stamp, session_id: null, summary: '', result: null, changes: [], usage: null, error: null };
        const active = await activeLock(wb, run);
        if (active.run_id) {
          const existing = await latest(wb, 'runs', active.run_id);
          if (existing) {
            const checked = await runFor(wb, existing.id, deps.nowImpl(), false);
            if (['queued', 'running'].includes(checked.status)) throw new ApiError(409, '该询盘已有排队或执行中的任务，请先查看或停止。');
            await releaseLock(wb, checked);
          } else throw new ApiError(409, '任务正在创建，请稍后刷新。');
        }
        await acquireLock(wb, run);
        try {
          await store.indexRun(ref, run.id);
          const saved = await revision(wb, 'runs', run, 0);
          return reply(201, { run: agentRunView(saved, record, handling), source: sourceInfo, message: '已排队，等待指定 Sol 执行；尚未生成或发送处理内容。' });
        } catch (error) { await releaseLock(wb, run); throw error; }
      }
      if (body.action === 'prepare') {
        if (body.source_hash !== sourceHash(record) || body.expected_version !== handling.version) throw new ApiError(409, '询盘或处理记录已变化，请刷新后重新准备。');
        if (!['manual', 'rule_assisted'].includes(body.method)) throw new ApiError(400, '请明确选择人工编辑或规则辅助。');
        const proposal = { id: deps.randomBytesImpl(16).toString('hex'), reference: ref, source_hash: sourceHash(record), handling_version: handling.version, fields: handlingFields(body.fields), method: body.method, generated_by_ai: false, created_at: stamp };
        await store.saveProposal(proposal); return reply(201, { proposal, source: sourceInfo });
      }
      if (body.action === 'review') {
        if (typeof body.proposal_id !== 'string' || !/^[a-f0-9]{32}$/.test(body.proposal_id) || !['accept', 'reject'].includes(body.decision)) throw new ApiError(400, '审阅参数无效。');
        let proposal = await store.proposal(ref, body.proposal_id);
        if (!proposal) { const run = await inquiryRunFor(storeFor(deps), body.proposal_id, ref); if (run) proposal = agentProposal(run, record, handling); }
        if (!proposal) throw new ApiError(404, '提案不存在。');
        if (handling.decisions?.[proposal.id]) throw new ApiError(409, '该提案已审阅，请刷新。');
        if (body.decision === 'accept' && (proposal.source_hash !== sourceHash(record) || proposal.handling_version !== handling.version)) throw new ApiError(409, '询盘或处理版本已变化，请重新准备。');
        // Reread immediately before commit. Cross-store writes are not a SQL transaction;
        // a later source change automatically reopens the todo via handled_source_hash.
        if (body.decision === 'accept' && sourceHash(await store.source(ref)) !== proposal.source_hash) throw new ApiError(409, '询盘已有新内容，旧提案不能采纳。');
        const decision = { decision: body.decision, reviewed_at: stamp, method: proposal.method };
        const next = { ...handling, ...(body.decision === 'accept' ? proposal.fields : {}), reference: ref, version: handling.version + 1, updated_at: stamp, decisions: { ...(handling.decisions || {}), [proposal.id]: decision } };
        if (body.decision === 'accept') next.handled_source_hash = proposal.fields.handling_status === 'handled' ? proposal.source_hash : null;
        await store.commit(next);
        return reply(200, { handling: handlingView(next, record), proposal: { ...proposal, decision }, source: sourceInfo, message: body.decision === 'accept' ? '内部处理已保存；未发送消息。' : '已拒绝提案；原询盘未改变。' });
      }
      throw new ApiError(400, '未知运营操作。');
    } catch (error) { if (options.transactional) throw error; return handleError(error); }
  }
  return { onRequestGet, onRequestPost };
}
const handlers = createOperationsHandlers();
export const onRequestGet = wrapUnifiedHandler(handlers.onRequestGet);
export const onRequestPost = wrapUnifiedHandler(handlers.onRequestPost);
