import { ApiError, identifier, latest, text } from './workbench.js';
import { OPS_STORE, createOperationsStore, handlingFields, safeInquiry, sourceHash } from './operations.js';

export const isInquiryRun = run => run?.kind === 'inquiry_review';
export function operationsFor(deps) {
  return createOperationsStore({ inquiryStore: deps.getStoreImpl({ name: 'beiqiang-inquiries', consistency: 'strong' }), opsStore: deps.getStoreImpl({ name: OPS_STORE, consistency: 'strong' }) });
}
export function inquiryContext(record, handling) {
  return { inquiry: safeInquiry(record, true), handling: { ...handlingFields(handling), version: handling.version }, source_hash: sourceHash(record), handling_version: handling.version };
}
export async function validateInquiryBinding(deps, run) {
  const ops = operationsFor(deps), record = await ops.source(run.inquiry_reference), handling = await ops.handling(run.inquiry_reference);
  if (sourceHash(record) !== run.source_hash || handling.version !== run.handling_version) throw new ApiError(409, '询盘或处理版本已变化，请重新发起任务。');
  return { record, handling };
}
export function validateInquiryResult(result) {
  if (!result || typeof result !== 'object' || Array.isArray(result) || Object.keys(result).some(key => !['summary', 'changes', 'next_steps', 'fields'].includes(key))) throw new ApiError(400, '询盘处理结果格式无效。');
  if (!Array.isArray(result.changes) || result.changes.length || !Array.isArray(result.next_steps) || result.next_steps.length > 30) throw new ApiError(400, '询盘任务只可提出内部处理意见，不可修改项目文档。');
  if (!result.fields || typeof result.fields !== 'object' || Array.isArray(result.fields) || Object.keys(result.fields).some(key => !['internal_note', 'next_action', 'handling_status'].includes(key))) throw new ApiError(400, '询盘处理字段范围无效。');
  return { summary: text(result.summary, 12000, true), changes: [], next_steps: result.next_steps.map(item => text(item, 4000, true)), fields: handlingFields(result.fields) };
}
export function agentProposal(run, record, handling) {
  if (!isInquiryRun(run) || run.status !== 'awaiting_review' || !run.result) return null;
  return { id: run.id, run_id: run.id, reference: run.inquiry_reference, source_hash: run.source_hash, handling_version: run.handling_version, fields: run.result.fields, summary: run.result.summary, method: 'agent', model: run.model, generated_by_ai: true, created_at: run.updated_at, decision: handling.decisions?.[run.id] || null, stale: run.source_hash !== sourceHash(record) || run.handling_version !== handling.version };
}
export function agentRunView(run, record, handling) {
  const decision = handling.decisions?.[run.id], fields = ['id', 'kind', 'inquiry_reference', 'source_hash', 'handling_version', 'version', 'title', 'instruction', 'summary', 'error', 'created_at', 'updated_at', 'model', 'session_id'];
  return { ...Object.fromEntries(fields.map(key => [key, run[key] ?? null])), status: decision ? decision.decision === 'accept' ? 'accepted' : 'rejected' : run.status, proposal_id: run.status === 'awaiting_review' ? run.id : null, stale: run.source_hash !== sourceHash(record) || run.handling_version !== handling.version };
}
export async function inquiryRunFor(store, id, ref) {
  const run = await latest(store, 'runs', identifier(id));
  if (!isInquiryRun(run) || run.inquiry_reference !== ref) return null;
  return run;
}
export async function ownerRunView(deps, run) {
  if (!isInquiryRun(run)) return run;
  const handling = await operationsFor(deps).handling(run.inquiry_reference), decision = handling.decisions?.[run.id];
  const safe = { ...run }; delete safe.inquiry_context;
  return { ...safe, ...(decision ? { status: decision.decision === 'accept' ? 'accepted' : 'rejected', reviewed_at: decision.reviewed_at } : {}) };
}
