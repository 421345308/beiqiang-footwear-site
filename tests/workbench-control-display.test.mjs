import test from 'node:test';
import assert from 'node:assert/strict';
import { activeLeases, runDisplayStatus, quotaRemaining, windowDuration, visibleControl } from '../app/admin/workbench/control-display.ts';

test('running count requires matching running record and live lease, excludes desktop and expired leases', () => {
  const future = new Date(Date.now() + 60_000).toISOString();
  const past = new Date(Date.now() - 60_000).toISOString();
  const lease = (run_id, lease_expires_at = future) => ({ run_id, lease_expires_at, started_at: past, last_seen_at: past });
  const runs = [{ id: 'live', status: 'running' }, { id: 'expired', status: 'running' }, { id: 'queued', status: 'queued' }, { id: 'desktop', status: 'running' }];
  const active = activeLeases(runs, [lease('live'), lease('expired', past), lease('queued'), lease('unknown'), lease('live')]);
  assert.deepEqual(active.map(item => item.run_id), ['live']);
  assert.equal(runDisplayStatus(runs[0], active), 'running');
  assert.equal(runDisplayStatus(runs[1], active), 'unconfirmed');
  assert.equal(runDisplayStatus(runs[3], active), 'unconfirmed');
  assert.equal(runDisplayStatus(runs[2], active), 'queued');
});
test('quota remaining and labels use the actual supplied window', () => {
  assert.equal(quotaRemaining(17.3), 82.7);
  assert.equal(quotaRemaining(0), 100);
  assert.equal(quotaRemaining(100), 0);
  assert.equal(windowDuration(300), '5 小时');
  assert.equal(windowDuration(10080), '7 天');
  assert.equal(windowDuration(95), '95 分钟');
});

test('polling preserves unsaved input and save response until cloud catches up', () => {
  const empty = {version: 0, focus: ''};
  const edited = {version: 2, focus: 'local unsaved'};
  const newer = {version: 3, focus: 'other editor'};
  assert.equal(visibleControl(edited, newer, true, empty), edited);
  assert.equal(visibleControl(edited, newer, false, empty), newer);
  const saved = {version: 4, focus: 'saved response'};
  assert.equal(visibleControl(saved, newer, false, empty), saved);
  assert.equal(visibleControl(empty, undefined, false, empty), empty);
});
