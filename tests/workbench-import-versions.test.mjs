import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareImportVersions } from '../app/admin/workbench/import-versions.ts';

const current = { documents: [{ path: 'source.md', version: 4 }], tasks: [{ source: 'source.md', title: '任务', version: 3 }] };
test('import preparation fills versions once, matches trimmed task identity and drops uploaded ids', () => {
  const pack = { documents: [{ path: 'source.md', content: 'new' }, { path: 'new.md', content: 'first' }], tasks: [{ id: 'untrusted', source: ' source.md ', title: ' 任务 ' }, { title: '新任务' }] };
  const prepared = prepareImportVersions(pack, current);
  assert.deepEqual(prepared.documents.map(doc => doc.expected_version), [4, 0]);
  assert.deepEqual(prepared.tasks.map(task => task.expected_version), [3, 0]);
  assert.equal('id' in prepared.tasks[0], false);
  assert.equal('expected_version' in pack.documents[0], false);
});
test('explicit versions must match and cannot be silently rebased', () => {
  assert.throws(() => prepareImportVersions({ documents: [{ path: 'source.md', expected_version: 2 }], tasks: [] }, current), /冲突/);
  assert.throws(() => prepareImportVersions({ documents: [], tasks: [{ source: 'source.md', title: '任务', expected_version: 1 }] }, current), /冲突/);
  assert.throws(() => prepareImportVersions({ documents: [{ path: 'source.md', expected_version: '4' }], tasks: [] }, current), /冲突/);
  assert.equal(prepareImportVersions({ documents: [{ path: 'source.md', expected_version: 4 }], tasks: [] }, current).documents[0].expected_version, 4);
});
