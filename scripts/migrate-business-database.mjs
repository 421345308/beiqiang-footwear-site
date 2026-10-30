import { readFile, writeFile } from 'node:fs/promises';
import { getStore } from '@edgeone/pages-blob';
import { createDatabase, hashDatabaseValue } from '../edgeone-deploy/cloud-functions/_lib/database.js';
import { DATABASE_NAMESPACES } from '../edgeone-deploy/cloud-functions/_lib/database-store.js';
import { isAuthKey } from '../edgeone-deploy/cloud-functions/_lib/business-storage.js';

const endpoint = 'https://www.beiqiang.online/api/workbench';
async function requireFrozen() {
  const response = await fetch(endpoint);
  if (response.status !== 503 || (await response.json()).code !== 'BUSINESS_MAINTENANCE') throw new Error('Production business requests must be in maintenance before migration');
}
export async function exportBusiness(factory) {
  const entries = [], records = [];
  for (const namespace of DATABASE_NAMESPACES) {
    const store = factory({ name: namespace }), keys = []; let cursor;
    do {
      const page = await store.list({ prefix: '', limit: 200, paginate: false, consistency: 'strong', ...(cursor ? {cursor} : {}) });
      keys.push(...page.blobs.map(item => item.key).filter(key => !isAuthKey(key))); cursor = page.cursor;
    } while (cursor);
    for (const key of keys.sort()) {
      const value = await store.get(key, {type: 'json', consistency: 'strong'});
      if (value == null) throw new Error('Source changed during export');
      records.push({namespace, key, value}); entries.push({namespace, key, sha256: hashDatabaseValue(value)});
    }
  }
  const runs = new Map();
  for (const item of records.filter(row => row.key.startsWith('runs/'))) if (!runs.has(item.value.id) || runs.get(item.value.id).version < item.value.version) runs.set(item.value.id, item.value);
  if ([...runs.values()].some(run => run.status === 'running')) throw new Error('Drain running jobs before migrating; do not discard their leases');
  return { manifest: {schema_version: 1, namespaces: [...DATABASE_NAMESPACES], entries}, records };
}
export function validatePackage(data) {
  if (!data?.manifest || !Array.isArray(data.records) || data.records.length !== data.manifest.entries?.length) throw new Error('Invalid private migration package');
  const records = new Map(data.records.map(row => [`${row.namespace}\0${row.key}`, row]));
  if (records.size !== data.records.length) throw new Error('Duplicate migration record');
  for (const item of data.manifest.entries) {
    const row = records.get(`${item.namespace}\0${item.key}`);
    if (!DATABASE_NAMESPACES.has(item.namespace) || isAuthKey(item.key) || !row || hashDatabaseValue(row.value) !== item.sha256) throw new Error('Migration package checksum or scope mismatch');
  }
  return data;
}
async function main() {
  const [command, id, path] = process.argv.slice(2);
  if (!['init','export','import','verify','activate'].includes(command)) throw new Error('Usage: init | export/import/verify/activate <batch-id> <private-file>');
  let db;
  try {
    if (command === 'init') { db = createDatabase(process.env); await db.query(await readFile(new URL('../db/operations/001_private_backend.sql', import.meta.url),'utf8')); console.log('Private schema initialized'); return; }
    if (!id || !path) throw new Error('Explicit batch id and private file required');
    const sourceFactory = args => {
      if (!process.env.BEIQIANG_DEPLOY_TOKEN) throw new Error('Existing source administrator credential required');
      return getStore({...args, projectId: 'makers-zsvtdpeh3qf1', token: process.env.BEIQIANG_DEPLOY_TOKEN, consistency: 'strong'});
    };
    if (command === 'export') {
      await requireFrozen(); const data = await exportBusiness(sourceFactory); await requireFrozen();
      await writeFile(path, JSON.stringify({id,...data}), {flag:'wx', mode:0o600}); console.log(JSON.stringify({id,records:data.records.length,exported:true})); return;
    }
    const data = validatePackage(JSON.parse(await readFile(path,'utf8')));
    if (data.id !== id) throw new Error('Migration batch mismatch');
    db = createDatabase(process.env);
    if (command === 'import') {
      await requireFrozen(); await db.prepareMigration({id,manifest:data.manifest});
      await db.withTransaction(async tx => { for (const row of data.records) await tx.storeFactory({name:row.namespace}).setJSON(row.key,row.value,{onlyIfNew:true}); });
    }
    if (command === 'activate') {
      await requireFrozen(); const current = await exportBusiness(sourceFactory);
      if (hashDatabaseValue(current.manifest) !== hashDatabaseValue(data.manifest)) throw new Error('Source changed after export; keep maintenance on and reconcile');
      await db.activateMigration(id);
    } else await db.verifyMigration(id);
    console.log(JSON.stringify({id,records:data.records.length,verified:true,activated:command==='activate'}));
  } finally { await db?.close(); }
}
if (process.argv[1] && new URL(import.meta.url).pathname.endsWith(process.argv[1].replaceAll('\\','/').split('/').at(-1))) main().catch(() => { console.error('Database migration did not complete. Preserve source and inspect private configuration/package; no automatic retry or rollback to the old writer.'); process.exitCode=1; });
