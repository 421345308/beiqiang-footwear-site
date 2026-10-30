import { createDatabaseStore, checkNamespace, canonicalDatabaseJSON, hashDatabaseValue, databaseConflict, verifyDatabaseCurrent } from './database-store.js';
import { X509Certificate } from 'node:crypto';

export { hashDatabaseValue, canonicalDatabaseJSON } from './database-store.js';
export function databaseConfig(env = {}) {
  const connectionString = String(env.WORKBENCH_DATABASE_URL || '');
  let url; try { url = new URL(connectionString); } catch { throw new Error('Private business database is not configured'); }
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('Private business database requires PostgreSQL');
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (!local && ['disable', 'allow', 'prefer', 'no-verify'].includes(url.searchParams.get('sslmode'))) throw new Error('Remote business database requires verified TLS');
  const ca = String(env.WORKBENCH_DATABASE_CA || '').replace(/\\n/g, '\n').trim();
  if (ca) {
    try {
      const pattern = /-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g, certificates = ca.match(pattern);
      if (ca.length > 65536 || !certificates?.length || ca.replace(pattern, '').trim()) throw new Error();
      for (const certificate of certificates) new X509Certificate(certificate);
    } catch { throw new Error('Business database CA must contain valid PEM certificates'); }
  }
  // pg URL ssl options must not override certificate verification.
  for (const key of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert']) url.searchParams.delete(key);
  return { connectionString: url.toString(), max: 1, idleTimeoutMillis: 10000, connectionTimeoutMillis: 10000, ssl: local ? false : { rejectUnauthorized: true, ...(ca ? { ca } : {}) } };
}
function manifestValue(input) {
  if (input?.schema_version !== 1 || !Array.isArray(input.namespaces) || !input.namespaces.length || !Array.isArray(input.entries)) throw new Error('Invalid migration manifest');
  const namespaces = [...new Set(input.namespaces.map(checkNamespace))].sort(), keys = new Set();
  const entries = input.entries.map(entry => {
    if (!namespaces.includes(entry.namespace) || typeof entry.key !== 'string' || !/^[a-f0-9]{64}$/.test(entry.sha256)) throw new Error('Invalid migration manifest entry');
    const identity = entry.namespace + '\0' + entry.key; if (keys.has(identity)) throw new Error('Duplicate migration manifest key'); keys.add(identity);
    return { namespace: entry.namespace, key: entry.key, sha256: entry.sha256 };
  }).sort((a, b) => a.namespace.localeCompare(b.namespace) || a.key.localeCompare(b.key));
  return { schema_version: 1, namespaces, entries };
}
function migrationId(id) { if (typeof id !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(id)) throw new Error('Invalid migration identifier'); return id; }
export function createDatabase(env = {}, { PoolImpl } = {}) {
  const config = databaseConfig(env);
  let poolPromise;
  const pool = () => poolPromise ||= (PoolImpl ? Promise.resolve(new PoolImpl(config)) : import('pg').then(module => new module.Pool(config)));
  const query = async (...args) => (await pool()).query(...args);
  const factory = (queryImpl, transaction) => ({ name }) => createDatabaseStore({ namespace: checkNamespace(name), query: queryImpl, transaction });
  async function withTransaction(callback) {
    const client = await (await pool()).connect();
    try {
      await client.query('BEGIN');
      let pending = Promise.resolve(), serial = 0;
      // Handlers may intentionally catch a CAS conflict. A savepoint keeps that
      // expected conflict from aborting unrelated work in the request transaction.
      const nested = fn => {
        const result = pending.then(async () => {
          const savepoint = `business_write_${++serial}`;
          await client.query(`SAVEPOINT ${savepoint}`);
          try { const value = await fn(client); await client.query(`RELEASE SAVEPOINT ${savepoint}`); return value; }
          catch (error) { await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`); await client.query(`RELEASE SAVEPOINT ${savepoint}`); throw error; }
        });
        pending = result.catch(() => {}); return result;
      };
      const tx = { query: client.query.bind(client), storeFactory: factory(client.query.bind(client), nested) };
      const result = await callback(tx); await client.query('COMMIT'); return result;
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  }
  const storeFactory = factory(query, fn => withTransaction(tx => fn({ query: tx.query })));
  async function prepareMigration({ id, manifest }) {
    migrationId(id); const normalized = manifestValue(manifest), digest = hashDatabaseValue(normalized);
    const inserted = await query(`INSERT INTO beiqiang_private.migration_batches(id,state,manifest,manifest_sha256,record_count) VALUES($1,'prepared',$2::jsonb,$3,$4) ON CONFLICT(id) DO UPDATE SET id=EXCLUDED.id WHERE beiqiang_private.migration_batches.manifest_sha256=EXCLUDED.manifest_sha256 RETURNING id,state,manifest_sha256,record_count`, [id, canonicalDatabaseJSON(normalized), digest, normalized.entries.length]);
    if (!inserted.rows.length) throw databaseConflict(); return inserted.rows[0];
  }
  async function verifyMigration(id) {
    migrationId(id);
    return withTransaction(async tx => {
      const batch = (await tx.query('SELECT * FROM beiqiang_private.migration_batches WHERE id=$1 FOR UPDATE', [id])).rows[0];
      if (!batch) throw new Error('Migration manifest has not been prepared');
      // Verification is performed while business writes are frozen. The table
      // lock also prevents a concurrent importer from racing the final checks.
      await tx.query('LOCK TABLE beiqiang_private.business_records IN SHARE MODE');
      const manifest = manifestValue(batch.manifest);
      if (hashDatabaseValue(manifest) !== batch.manifest_sha256) throw new Error('Migration manifest checksum mismatch');
      const rows = (await tx.query('SELECT namespace,record_key,value FROM beiqiang_private.business_records WHERE namespace=ANY($1::text[]) ORDER BY namespace,record_key', [manifest.namespaces])).rows;
      const actual = new Map(rows.map(row => [row.namespace + '\0' + row.record_key, hashDatabaseValue(row.value)]));
      if (actual.size !== manifest.entries.length || manifest.entries.some(entry => actual.get(entry.namespace + '\0' + entry.key) !== entry.sha256)) throw new Error('Migration record count or checksum mismatch; activation is blocked');
      await verifyDatabaseCurrent(tx.query, manifest.namespaces);
      const result = await tx.query(`UPDATE beiqiang_private.migration_batches SET state='verified',verified_at=clock_timestamp() WHERE id=$1 RETURNING id,state,record_count,manifest_sha256,verified_at`, [id]); return result.rows[0];
    });
  }
  async function assertVerified(id) {
    migrationId(id);
    const batch = (await query("SELECT id,state,record_count,manifest_sha256,verified_at FROM beiqiang_private.migration_batches WHERE id=$1 AND state IN ('verified','active')", [id])).rows[0];
    if (!batch) throw new Error('Business database migration has not been verified; activation is blocked'); return batch;
  }
  async function activateMigration(id) { const checked = await assertVerified(id); if (checked.state === 'active') return checked; await verifyMigration(id); return (await query("UPDATE beiqiang_private.migration_batches SET state='active',activated_at=clock_timestamp() WHERE id=$1 RETURNING id,state,manifest_sha256", [id])).rows[0]; }
  return { backend: 'postgres', storeFactory, withTransaction, prepareMigration, verifyMigration, assertVerified, activateMigration, query, async health() { return (await query('SELECT current_database() AS database,current_schema() AS schema')).rows[0]; }, async close() { if (poolPromise) await (await poolPromise).end(); } };
}
