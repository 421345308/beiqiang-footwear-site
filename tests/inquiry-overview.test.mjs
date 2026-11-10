import assert from 'node:assert/strict';
import test from 'node:test';
import { inquiryOverview } from '../app/admin/workbench/inquiry-overview.ts';

test('overview selects pending inquiries from the shared task view', () => {
  const items = [
    { kind: 'project', title: 'Project', status: '待处理' },
    { kind: 'inquiry', title: 'Handled', status: '本次已处理', reference: 'a', notification_state: 'not_confirmed' },
    { kind: 'inquiry', title: 'Older', status: '待处理', reference: 'b', updated_at: '2026-11-01', notification_state: 'accepted' },
    { kind: 'inquiry', title: 'Newer', status: '待处理', reference: 'c', updated_at: '2026-11-02' },
  ];
  const result = inquiryOverview(items, true);
  assert.equal(result.state, 'ready');
  assert.equal(result.total, 3);
  assert.equal(result.pending, 2);
  assert.equal(result.notificationNotConfirmed, 1);
  assert.equal(result.notificationUnknown, 1);
  assert.deepEqual(result.items.map(item => item.reference), ['c', 'b']);
});

test('a failed or missing read never appears as zero inquiries', () => {
  assert.equal(inquiryOverview([], false).state, 'unavailable');
  assert.equal(inquiryOverview(undefined, true).state, 'unavailable');
  assert.deepEqual(inquiryOverview([], true), { state: 'ready', total: 0, pending: 0, items: [], notificationNotConfirmed: 0, notificationUnknown: 0 });
});
