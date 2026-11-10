import assert from 'node:assert/strict';
import test from 'node:test';
import { isInternalTest } from '../edgeone-deploy/cloud-functions/_lib/inquiry-classification.js';
import { safeInquiry } from '../edgeone-deploy/cloud-functions/_lib/operations.js';
import { isWorkspaceInternalTest } from '../edgeone-deploy/cloud-functions/_lib/workspace-activity.js';

test('ordinary buyer wording and an initial zero quantity do not hide an inquiry', () => {
  for (const inquiry of [
    { name: 'Buyer', company: 'Example Co', requirements: 'Please review internal comfort and fit.' },
    { name: 'Buyer', company: 'Example Co', requirements: 'For test only before bulk production.', quantity: '0 pairs currently' },
    { name: 'Buyer', company: 'Internal Footwear Ltd', requirements: 'Looking for walking shoes.' },
  ]) {
    assert.equal(isInternalTest(inquiry), false);
    assert.equal(safeInquiry(inquiry).internalTest, false);
    assert.equal(isWorkspaceInternalTest(inquiry), false);
  }
});

test('explicit and recognizable legacy internal fixtures remain identifiable', () => {
  for (const inquiry of [
    { internalTest: true },
    { company: 'Beiqiang Internal Test' },
    { company: 'Deployment test company' },
    { name: 'Internal', company: 'Beiqiang', requirements: 'test only' },
  ]) {
    assert.equal(isInternalTest(inquiry), true);
    assert.equal(safeInquiry(inquiry).internalTest, true);
    assert.equal(isWorkspaceInternalTest(inquiry), true);
  }
});
