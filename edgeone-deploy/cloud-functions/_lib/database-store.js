import { createHash } from 'node:crypto';

export const DATABASE_NAMESPACES = new Set(['beiqiang-owner-workbench-v1', 'beiqiang-operations-v1']);
const CURRENT = Object.freeze({ controls: 'controls_current', documents: 'documents_current', tasks: 'tasks_current', runs: 'runs_current', status_snapshots: 'status_snapshots_current', object_locks: 'object_locks_current', handling: 'inquiry_handling_current' });
const WORKBENCH_KINDS = new Set([...Object.keys(CURRENT).filter(kind => kind !== 'handling'), 'goals', 'active', 'claims', 'events', 'runner']);
const OPS_KINDS = new Set(['handling', 'proposals', 'inquiry_runs']);
export const canonicalDatabaseJSON = value => {
  function sorted(item) {
    if (Array.isArray(item)) return item.map(sorted);
    if (item && typeof item === 'object') return Object.fromEntries(Object.keys(item).sort().map(key => [key, sorted(item[key])]));
    return item;
  }
  return JSON.stringify(sorted(value));
};
export const hashDatabaseValue = value => createHash('sha256').update(canonicalDatabaseJSON(value)).digest('hex');
export function databaseConflict() { const error = new Error('Business record version conflict'); error.code = 'PRECONDITION_FAILED'; return error; }
export function checkNamespace(namespace) { if (!DATABASE_NAMESPACES.has(namespace)) throw new Error('Database namespace is outside the migration scope'); return namespace; }
function keyParts(namespace, key) {
  checkNamespace(namespace);
  if (typeof key !== 'string' || !key || key.length > 2048 || /[\0\r\n]/.test(key)) throw new Error('Invalid database record key');
  const parts = key.split('/'), kind = parts[0], allowed = namespace === 'beiqiang-operations-v1' ? OPS_KINDS : WORKBENCH_KINDS;
  if (!allowed.has(kind)) throw new Error('Authentication, credentials and unrelated Blob records must remain outside PostgreSQL migration');
  const numeric = Boolean(CURRENT[kind]) && parts.length === 3 && /^\d+\.json$/.test(parts[2]), version = numeric ? Number(parts[2].slice(0, -5)) : null;
  if (numeric && (!Number.isSafeInteger(version) || version < 1 || version > 999999999999999)) throw new Error('Invalid database record version');
  return { kind, id: parts[1], version, table: numeric ? CURRENT[kind] : null };
}
const sqlTable = name => `beiqiang_private.${name}`;
export async function verifyDatabaseCurrent(query, namespaces) {
  for (const [kind, table] of Object.entries(CURRENT)) {
    const mismatch = await query(`WITH expected AS (SELECT DISTINCT ON(namespace,object_id) namespace,object_id,version,record_key,value FROM beiqiang_private.business_records WHERE namespace=ANY($1::text[]) AND kind=$2 AND version IS NOT NULL ORDER BY namespace,object_id,version DESC) SELECT 1 FROM expected e FULL JOIN ${sqlTable(table)} c ON c.namespace=e.namespace AND c.object_id=e.object_id WHERE (COALESCE(e.namespace,c.namespace)=ANY($1::text[])) AND (e.record_key IS NULL OR c.record_key IS NULL OR e.record_key<>c.record_key OR e.version<>c.version OR e.value<>c.value) LIMIT 1`, [namespaces, kind]);
    if (mismatch.rows.length) throw new Error('Migration current rows do not match historical records; activation is blocked');
  }
}
function prefixPattern(prefix) { return prefix.replace(/[\\%_]/g, '\\$&') + '%'; }

export function createDatabaseStore({ namespace, query, transaction }) {
  checkNamespace(namespace);
  async function get(key, options = {}) {
    keyParts(namespace, key); if (options.type && options.type !== 'json') throw new Error('Business database supports JSON only');
    return (await query('SELECT value FROM beiqiang_private.business_records WHERE namespace=$1 AND record_key=$2', [namespace, key])).rows[0]?.value ?? null;
  }
  async function setJSON(key, value, options = {}) {
    const parts = keyParts(namespace, key);
    if (parts.table && (value?.version !== parts.version || (value.id !== undefined && value.id !== parts.id) || (parts.kind === 'handling' && value.reference !== parts.id))) throw new Error('Business version identity does not match its historical key');
    const checksum = hashDatabaseValue(value), serialized = canonicalDatabaseJSON(value);
    return transaction(async client => {
      try {
        const inserted = await client.query(`INSERT INTO beiqiang_private.business_records(namespace,record_key,value,checksum) VALUES($1,$2,$3::jsonb,$4) ${options.onlyIfNew ? '' : parts.table ? 'ON CONFLICT(namespace,record_key) DO UPDATE SET record_key=EXCLUDED.record_key WHERE beiqiang_private.business_records.checksum=EXCLUDED.checksum' : 'ON CONFLICT(namespace,record_key) DO UPDATE SET value=EXCLUDED.value,checksum=EXCLUDED.checksum,stored_at=clock_timestamp()'}`, [namespace, key, serialized, checksum]);
        if (!inserted.rowCount) throw databaseConflict();
        if (parts.table) await client.query(`INSERT INTO ${sqlTable(parts.table)}(namespace,object_id,version,record_key,value) VALUES($1,$2,$3,$4,$5::jsonb) ON CONFLICT(namespace,object_id) DO UPDATE SET version=EXCLUDED.version,record_key=EXCLUDED.record_key,value=EXCLUDED.value WHERE ${sqlTable(parts.table)}.version<=EXCLUDED.version`, [namespace, parts.id, parts.version, key, serialized]);
      } catch (error) { if (/^23/.test(error.code || '') || ['40001', '40P01'].includes(error.code)) throw databaseConflict(); throw error; }
    });
  }
  async function list({ prefix = '', cursor, limit = Infinity, paginate = true } = {}) {
    if (typeof prefix !== 'string' || (!Number.isInteger(limit) && limit !== Infinity) || limit < 0) throw new Error('Invalid database pagination');
    let after = '';
    if (cursor) { try { const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString()); if (parsed.namespace !== namespace || parsed.prefix !== prefix || typeof parsed.after !== 'string') throw new Error(); after = parsed.after; } catch { throw new Error('Invalid database cursor'); } }
    const params = [namespace, prefixPattern(prefix), after], capped = Number.isFinite(limit);
    if (capped) params.push(limit + 1);
    const result = await query(`SELECT record_key FROM beiqiang_private.business_records WHERE namespace=$1 AND record_key LIKE $2 ESCAPE '\\' AND record_key>$3 ORDER BY record_key ${capped ? 'LIMIT $4' : ''}`, params);
    const hasMore = capped && result.rows.length > limit, rows = result.rows.slice(0, capped ? limit : undefined);
    return { blobs: rows.map(row => ({ key: row.record_key })), directories: [], ...(!paginate && hasMore ? { cursor: Buffer.from(JSON.stringify({ namespace, prefix, after: rows.at(-1)?.record_key || after })).toString('base64url') } : {}) };
  }
  async function latest(kind, id) {
    if (!CURRENT[kind]) throw new Error('Unsupported current business kind');
    return (await query(`SELECT value FROM ${sqlTable(CURRENT[kind])} WHERE namespace=$1 AND object_id=$2`, [namespace, id])).rows[0]?.value ?? null;
  }
  async function allLatest(kind) {
    if (!CURRENT[kind]) throw new Error('Unsupported current business kind');
    return (await query(`SELECT value FROM ${sqlTable(CURRENT[kind])} WHERE namespace=$1 ORDER BY COALESCE(value->>'updated_at','') DESC,object_id`, [namespace])).rows.map(row => row.value);
  }
  async function revision(kind, item, expected) {
    if (!CURRENT[kind] || !Number.isSafeInteger(expected) || expected < 0 || !item?.id) throw new Error('Invalid business revision');
    return transaction(async client => {
      // A transaction-scoped object lock covers initial creation and subsequent CAS.
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [`${namespace}/${kind}/${item.id}`]);
      const current = (await client.query(`SELECT version FROM ${sqlTable(CURRENT[kind])} WHERE namespace=$1 AND object_id=$2`, [namespace, item.id])).rows[0];
      if (Number(current?.version || 0) !== expected) throw databaseConflict();
      const value = { ...item, version: expected + 1 }, key = `${kind}/${item.id}/${String(value.version).padStart(8, '0')}.json`;
      const bound = createDatabaseStore({ namespace, query: client.query.bind(client), transaction: callback => callback(client) });
      await bound.setJSON(key, value, { onlyIfNew: true }); return value;
    });
  }
  async function remove(key) {
    const parts = keyParts(namespace, key); if (parts.table) throw new Error('Versioned business history cannot be deleted');
    await query('DELETE FROM beiqiang_private.business_records WHERE namespace=$1 AND record_key=$2', [namespace, key]);
  }
  return { backend: 'postgres', namespace, get, setJSON, list, delete: remove, latest, allLatest, revision };
}
