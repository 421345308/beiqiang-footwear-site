import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { rootCertificates } from 'node:tls';
import { createDatabase, databaseConfig, hashDatabaseValue } from '../edgeone-deploy/cloud-functions/_lib/database.js';

const WB = 'beiqiang-owner-workbench-v1', OPS = 'beiqiang-operations-v1';
test('database config requires PostgreSQL and verifies remote TLS; canonical hash survives JSONB key order', () => {
  assert.throws(() => databaseConfig({}), /not configured/);
  assert.throws(() => databaseConfig({ WORKBENCH_DATABASE_URL: 'http://localhost/test' }), /PostgreSQL/);
  assert.throws(() => databaseConfig({ WORKBENCH_DATABASE_URL: 'postgres://user:fixture@remote.invalid/test?sslmode=no-verify' }), /verified TLS/);
  assert.equal(databaseConfig({ WORKBENCH_DATABASE_URL: 'postgres://user:fixture@localhost/test' }).ssl, false);
  assert.deepEqual(databaseConfig({ WORKBENCH_DATABASE_URL: 'postgres://user:fixture@remote.invalid/test?sslmode=require' }).ssl, { rejectUnauthorized: true });
  assert.equal(hashDatabaseValue({ b: [2, { d: 4, c: 3 }], a: 1 }), hashDatabaseValue({ a: 1, b: [2, { c: 3, d: 4 }] }));
});
test('project CA PEM is optional and retains server certificate and hostname verification', () => {
  const certificate = rootCertificates[0].trim(), url = 'postgres://user:fixture@project.supabase.invalid/test?sslmode=verify-full&sslrootcert=untrusted-path';
  const config = databaseConfig({ WORKBENCH_DATABASE_URL: url, WORKBENCH_DATABASE_CA: certificate });
  assert.equal(config.ssl.ca, certificate); assert.equal(config.ssl.rejectUnauthorized, true); assert.equal(config.max, 1);
  assert.equal(new URL(config.connectionString).searchParams.has('sslrootcert'), false);
  assert.equal(new URL(config.connectionString).searchParams.has('sslmode'), false);
  assert.equal(databaseConfig({ WORKBENCH_DATABASE_URL: url, WORKBENCH_DATABASE_CA: certificate.replace(/\n/g, '\\n') }).ssl.ca, certificate);
  assert.throws(() => databaseConfig({ WORKBENCH_DATABASE_URL: url, WORKBENCH_DATABASE_CA: 'not a certificate' }), /valid PEM/);
  assert.throws(() => databaseConfig({ WORKBENCH_DATABASE_URL: url, WORKBENCH_DATABASE_CA: '-----BEGIN CERTIFICATE-----\ninvalid\n-----END CERTIFICATE-----' }), /valid PEM/);
  assert.throws(() => databaseConfig({ WORKBENCH_DATABASE_URL: url, WORKBENCH_DATABASE_CA: certificate + '\nPRIVATE KEY' }), /valid PEM/);
});

const connection = process.env.WORKBENCH_TEST_DATABASE_URL;
test('real PostgreSQL: current/history, CAS, transactions, migration gate and private access', { skip: !connection }, async t => {
  const url = new URL(connection);
  assert.match(url.pathname, /^\/beiqiang_test_[a-z0-9_]+$/); assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname), 'Integration tests require a dedicated local test database');
  const db = createDatabase({ WORKBENCH_DATABASE_URL: connection });
  try {
    await db.query(await readFile(new URL('../db/operations/001_private_backend.sql', import.meta.url), 'utf8'));
    await db.query('TRUNCATE beiqiang_private.controls_current,beiqiang_private.documents_current,beiqiang_private.tasks_current,beiqiang_private.runs_current,beiqiang_private.status_snapshots_current,beiqiang_private.object_locks_current,beiqiang_private.inquiry_handling_current,beiqiang_private.business_records,beiqiang_private.migration_batches CASCADE');
    const wb = db.storeFactory({ name: WB }), ops = db.storeFactory({ name: OPS });
    await t.test('preserves historical keys while current queries read specialized rows', async () => {
      await wb.setJSON('controls/owner/00000001.json', { id: 'owner', version: 1, focus: 'first' }, { onlyIfNew: true });
      await wb.setJSON('controls/owner/00000002.json', { id: 'owner', version: 2, focus: 'current' }, { onlyIfNew: true });
      assert.equal((await wb.get('controls/owner/00000001.json', { type: 'json' })).focus, 'first'); assert.equal((await wb.latest('controls', 'owner')).focus, 'current');
      assert.equal((await wb.allLatest('controls')).length, 1);
      await assert.rejects(wb.setJSON('controls/owner/00000001.json', { id: 'owner', version: 1, focus: 'old overwritten' }), error => error.code === 'PRECONDITION_FAILED');
      await wb.setJSON('controls/owner/00000001.json', { id: 'owner', version: 1, focus: 'first' });
      assert.equal((await wb.latest('controls', 'owner')).version, 2);
      const generated = (await db.query('SELECT kind,object_id,version FROM beiqiang_private.business_records WHERE namespace=$1 AND record_key=$2', [WB, 'controls/owner/00000002.json'])).rows[0]; assert.deepEqual(generated, { kind: 'controls', object_id: 'owner', version: '2' });
    });
    await t.test('onlyIfNew and concurrent revision protect current identity', async () => {
      const peer = createDatabase({ WORKBENCH_DATABASE_URL: connection });
      let writes;
      try { writes = await Promise.allSettled([wb.revision('tasks', { id: 'task1', title: 'first' }, 0), peer.storeFactory({ name: WB }).revision('tasks', { id: 'task1', title: 'second' }, 0)]); }
      finally { await peer.close(); }
      assert.equal(writes.filter(value => value.status === 'fulfilled').length, 1); assert.equal(writes.find(value => value.status === 'rejected').reason.code, 'PRECONDITION_FAILED');
      await assert.rejects(wb.setJSON('tasks/task1/00000001.json', { id: 'task1', version: 1 }, { onlyIfNew: true }), error => error.code === 'PRECONDITION_FAILED');
      await assert.rejects(wb.setJSON('tasks/task1/00000002.json', { id: 'other', version: 2 }), /identity/);
    });
    await t.test('request transaction rolls back across workbench and OPS stores', async () => {
      await assert.rejects(db.withTransaction(async tx => {
        await tx.storeFactory({ name: WB }).setJSON('events/test/rollback.json', { message: 'not committed' });
        await tx.storeFactory({ name: OPS }).setJSON('proposals/BQ-20261030-TEST/abc.json', { id: 'abc' });
        throw new Error('rollback fixture');
      }), /rollback fixture/);
      assert.equal(await wb.get('events/test/rollback.json'), null); assert.equal(await ops.get('proposals/BQ-20261030-TEST/abc.json'), null);
      await db.withTransaction(async tx => {
        const store = tx.storeFactory({ name: WB });
        await assert.rejects(store.setJSON('tasks/task1/00000001.json', { id: 'task1', version: 1 }, { onlyIfNew: true }), error => error.code === 'PRECONDITION_FAILED');
        await store.setJSON('events/test/after-conflict.json', { survived: true });
      });
      assert.equal((await wb.get('events/test/after-conflict.json')).survived, true);
    });
    await t.test('paginated exact prefixes and immutable versions do not leak other namespaces', async () => {
      for (let i = 0; i < 5; i++) await wb.setJSON(`events/page_/item${i}.json`, { i });
      await wb.setJSON('events/pageX/other.json', { excluded: true });
      let cursor, keys = []; do { const page = await wb.list({ prefix: 'events/page_/', limit: 2, paginate: false, cursor }); keys.push(...page.blobs.map(row => row.key)); cursor = page.cursor; } while (cursor);
      assert.equal(keys.length, 5); assert.equal(new Set(keys).size, 5); assert.equal((await ops.list({ prefix: 'events/' })).blobs.length, 0);
      await assert.rejects(wb.get('sessions/secret.json'), /outside PostgreSQL/); await assert.rejects(wb.delete('controls/owner/00000001.json'), /cannot be deleted/);
    });
    await t.test('manifest verifies exact namespace count and hashes before activation', async () => {
      const records = (await db.query('SELECT namespace,record_key,value FROM beiqiang_private.business_records ORDER BY namespace,record_key')).rows;
      const manifest = { schema_version: 1, namespaces: [WB, OPS], entries: records.map(row => ({ namespace: row.namespace, key: row.record_key, sha256: hashDatabaseValue(row.value) })) };
      await db.prepareMigration({ id: 'integration_fixture', manifest }); await assert.rejects(db.assertVerified('integration_fixture'), /activation is blocked/);
      assert.equal((await db.verifyMigration('integration_fixture')).state, 'verified'); assert.equal((await db.assertVerified('integration_fixture')).state, 'verified');
      await db.query('DELETE FROM beiqiang_private.controls_current WHERE namespace=$1', [WB]);
      await assert.rejects(db.verifyMigration('integration_fixture'), /current rows/);
      await wb.setJSON('controls/owner/00000002.json', { id: 'owner', version: 2, focus: 'current' });
      assert.equal((await db.activateMigration('integration_fixture')).state, 'active');
      await db.prepareMigration({ id: 'bad_fixture', manifest: { ...manifest, entries: manifest.entries.slice(1) } }); await assert.rejects(db.verifyMigration('bad_fixture'), /checksum mismatch/);
      await assert.rejects(db.prepareMigration({ id: 'integration_fixture', manifest: { ...manifest, entries: [] } }), error => error.code === 'PRECONDITION_FAILED');
      const access = (await db.query("SELECT has_schema_privilege('public','beiqiang_private','USAGE') AS exposed")).rows[0]; assert.equal(access.exposed, false);
    });
  } finally { await db.close(); }
});
