import test from 'node:test';
import assert from 'node:assert/strict';
import { buildProposalExport } from '../app/admin/workbench/proposal-export.ts';

test('v1 export preserves server provenance and the reviewed result without private run fields', () => {
  const change = { path: '00_总控台/当前状态.md', before: '旧文', after: '新文', reason: '依据' };
  const run = { id: 'run-1', task_id: 'task-1', status: 'awaiting_review', created_at: '2026-10-30T00:00:00Z', source: change.path, source_hash: 'server-provided-hash', source_version: 7, summary: 'old', changes: [], result: { summary: '建议结果', changes: [change], next_steps: ['核验'] }, events: [{ text: 'private log' }], lease_token: 'private' };
  const exported = JSON.parse(JSON.stringify(buildProposalExport(run)));
  assert.deepEqual(Object.keys(exported), ['schema_version', 'run_id', 'task_id', 'status', 'created_at', 'source', 'source_hash', 'source_version', 'summary', 'changes', 'next_steps', 'note']);
  assert.deepEqual(exported, { schema_version: 1, run_id: run.id, task_id: run.task_id, status: run.status, created_at: run.created_at, source: run.source, source_hash: run.source_hash, source_version: 7, summary: '建议结果', changes: [change], next_steps: ['核验'], note: exported.note });
  assert.match(exported.note, /项目对话审阅/);
  assert.match(exported.note, /snapshot_review/);
  assert.doesNotMatch(exported.note, /缺少完整来源/);
});

test('source-free and empty proposals stay readable with explicit no-writeback notes', () => {
  const exported = buildProposalExport({ id: 'run-2', task_id: 'task-2', status: 'awaiting_review', result: { summary: '请补充依据', changes: [], next_steps: [] } });
  assert.equal(exported.source, null);
  assert.equal(exported.source_hash, null);
  assert.equal(exported.source_version, null);
  assert.equal(exported.created_at, null);
  assert.equal(exported.summary, '请补充依据');
  assert.match(exported.note, /缺少完整来源凭据，仅供阅读，不可据此回写/);
  assert.match(exported.note, /没有文档修改项/);
});

test('a path alone never creates missing hash or version; empty results override legacy changes', () => {
  const exported = buildProposalExport({ id: 'run-3', task_id: 'task-3', status: 'awaiting_review', source: 'source.md', changes: [{ path: 'source.md', before: 'a', after: 'b' }], result: { summary: '无需修改', changes: [] } });
  assert.equal(exported.source_hash, null);
  assert.equal(exported.source_version, null);
  assert.deepEqual(exported.changes, []);
  assert.match(exported.note, /不可据此回写/);
});
