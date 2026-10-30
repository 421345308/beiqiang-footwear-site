import { getJSON, STORE_NAME } from './workbench.js';
import { operationsFor } from './operations-agent.js';
import { handlingView, safeInquiry } from './operations.js';

// A read model over existing business objects, never a second editable task ledger.
export async function unifiedTasks(deps, tasks, runs) {
  const lastRun = filter => runs.filter(filter).sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  const result = tasks.map(task => {
    const run = lastRun(run => run.task_id === task.id);
    return { id: `project:${task.id}`, kind: 'project', task_id: task.id, title: task.title, status: task.status, owner: task.owner, next: task.next, dependency: task.dependency, latest_run_id: run?.id || null, latest_run_status: run?.status || null, updated_at: task.updated_at };
  });
  const ops = operationsFor(deps), handlings = await ops.listHandlings();
  for (const record of await ops.listSources()) {
    if (safeInquiry(record).internalTest) continue;
    const handling = handlings.get(record.reference) || { version: 0, handling_status: 'open', internal_note: '', next_action: '' };
    const run = lastRun(run => run.inquiry_reference === record.reference);
    result.push({ id: `inquiry:${record.reference}`, kind: 'inquiry', reference: record.reference, title: record.company || record.name || record.reference,
      status: handlingView(handling, record).pending ? '待处理' : '本次已处理', owner: '负责人', next: handling.next_action || '查看客户需求，准备内部处理方案', dependency: '', latest_run_id: run?.id || null, latest_run_status: run?.status || null, updated_at: handling.updated_at || record.updatedAt || record.receivedAt });
  }
  return result;
}

export async function dispatchReadiness(deps, env, now) {
  const mode = env.WORKBENCH_RUNNER_MODE === 'manual_cloud' ? 'manual_cloud' : 'self_hosted';
  const runner = await getJSON(deps.getStoreImpl({name: STORE_NAME, consistency: 'strong'}), 'runner/heartbeat.json');
  const enabled = mode === 'self_hosted' && env.WORKBENCH_AUTODISPATCH === 'enabled';
  const fresh = !!runner?.at && now.getTime() - Date.parse(runner.at) < 150000;
  const authenticated = runner?.capabilities?.model === 'gpt-6.1-sol' && runner?.capabilities?.auth === 'chatgpt' && runner?.capabilities?.ready === true;
  const blocking_reasons = [];
  if (mode === 'manual_cloud') blocking_reasons.push('当前为人工启动Cloud；新版环境尚未通过程序化派发验收。');
  else {
    if (!enabled) blocking_reasons.push('自动领取尚未启用。');
    if (!env.WORKBENCH_RUNNER_SECRET) blocking_reasons.push('执行器身份尚未配置。');
    if (!fresh) blocking_reasons.push('未收到近期私有执行器心跳。');
    else if (!authenticated) blocking_reasons.push('执行器尚未报告有效的Codex套餐登录及Sol配置。');
  }
  return { mode, enabled, ready: enabled && blocking_reasons.length === 0, blocking_reasons, last_seen_at: runner?.at || null };
}
