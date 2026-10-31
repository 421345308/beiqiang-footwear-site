import { AsyncLocalStorage } from 'node:async_hooks';
import { createHash, createHmac, timingSafeEqual, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, lstat, open, unlink } from 'node:fs/promises';
import path from 'node:path';
import { Pool } from 'pg';
import { databaseConfig } from '../edgeone-deploy/cloud-functions/_lib/database.js';

const conflict = () => Object.assign(new Error('Storage precondition failed'), { code: 'PRECONDITION_FAILED', status: 412 });
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
function identity(value, label) {
  if (typeof value !== 'string' || !value || value.length > 2048 || /[\0\r\n\\]/.test(value) || value.split('/').some(p => p === '..' || p === '.')) throw new Error(`Invalid storage ${label}`);
  return value;
}
const matches = (condition, etag) => String(condition).split(',').some(s => s.trim() === '*' ? Boolean(etag) : s.trim().replace(/^"|"$/g, '') === etag);

/** Private PostgreSQL index plus immutable content-addressed original files.
 * Backup/restore requires both the database and dataDir. Unreferenced files are
 * deliberately retained after overwrite/rollback; no unsafe online GC is run.
 */
export function createStorage({ connectionString, dataDir, schema = 'beiqiang_storage', pool: suppliedPool, ssl, max = 4, publicOrigin, uploadSecret, maxUploadBytes = 15 * 1024 * 1024 } = {}) {
  if (!/^[a-z_][a-z0-9_]{0,62}$/.test(schema)) throw new Error('Invalid storage schema');
  if (!dataDir || !path.isAbsolute(dataDir)) throw new Error('Storage dataDir must be absolute');
  if (ssl && (ssl === true ? false : ssl.rejectUnauthorized === false)) throw new Error('TLS certificate verification must remain enabled');
  const root = path.resolve(dataDir), table = `"${schema}".storage_objects`;
  const pool = suppliedPool || new Pool({ ...databaseConfig({ WORKBENCH_DATABASE_URL: connectionString }), max, ...(ssl ? {ssl} : {}) });
  const context = new AsyncLocalStorage();
  if (!Number.isSafeInteger(maxUploadBytes) || maxUploadBytes < 1) throw new Error('Invalid upload size limit');
  const sign = value => createHmac('sha256', uploadSecret).update(value).digest('base64url');
  function uploadConfig() {
    if (Buffer.byteLength(String(uploadSecret || '')) < 32) throw new Error('Private upload signing secret is not configured');
    const origin = new URL(publicOrigin);
    if (!['http:','https:'].includes(origin.protocol) || origin.username || origin.password || (origin.protocol!=='https:' && !['localhost','127.0.0.1','[::1]'].includes(origin.hostname))) throw new Error('Upload publicOrigin requires HTTPS');
    return origin.origin;
  }
  async function acceptUpload({token,body,contentType}={}) {
    uploadConfig();
    let claim;
    try {
      if(typeof token!=='string'||token.length>16384)throw 0;
      const [value,signature,...extra]=token.split('.'), expected=sign(value), left=Buffer.from(signature||''),right=Buffer.from(expected);
      if(extra.length||left.length!==right.length||!timingSafeEqual(left,right))throw 0;
      claim=JSON.parse(Buffer.from(value,'base64url'));
      if(!Number.isSafeInteger(claim.expiresAt)||claim.expiresAt<=Math.floor(Date.now()/1000)||!Number.isSafeInteger(claim.maxBytes)||claim.maxBytes<1||claim.maxBytes>maxUploadBytes)throw 0;
      identity(claim.namespace,'namespace');identity(claim.key,'key');
    } catch {throw Object.assign(new Error('Invalid or expired upload authorization'),{status:401});}
    if(claim.contentType && claim.contentType!==contentType)throw Object.assign(new Error('Upload content type does not match authorization'),{status:415});
    const chunks=[];let total=0;
    const iterable=body instanceof ReadableStream?body: [body instanceof Blob?Buffer.from(await body.arrayBuffer()):Buffer.from(body||'')];
    for await(const chunk of iterable){const data=Buffer.from(chunk);total+=data.length;if(total>claim.maxBytes)throw Object.assign(new Error('Upload exceeds size limit'),{status:413});chunks.push(data);}
    await withTransaction(async()=>{
      const inserted=await query(`INSERT INTO "${schema}".storage_upload_receipts(token_hash,expires_at) VALUES($1,to_timestamp($2)) ON CONFLICT DO NOTHING`,[hash(token),claim.expiresAt]);
      if(!inserted.rowCount)throw conflict();
      await getStore(claim.namespace).set(claim.key,Buffer.concat(chunks),{contentType:claim.contentType||contentType,onlyIfNew:true});
    });return {key:claim.key};
  }
  const query = (...args) => (context.getStore()?.client || pool).query(...args);
  async function initialize() {
    await mkdir(root, {recursive:true, mode:0o700});
    if ((await lstat(root)).isSymbolicLink()) throw new Error('Storage directory must not be a symbolic link');
    const sql = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
    const client = await pool.connect();
    try { await client.query('BEGIN'); await client.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`); await client.query(`SET LOCAL search_path TO "${schema}"`); await client.query(sql); await client.query('COMMIT'); }
    catch(e) { await client.query('ROLLBACK'); throw e; } finally {client.release();}
  }
  async function withTransaction(callback, {readOnly = false} = {}) {
    if (context.getStore()) return callback(api);
    const client = await pool.connect();
    try {
      await client.query(readOnly ? 'BEGIN READ ONLY' : 'BEGIN');
      const result = await context.run({client, readOnly}, () => callback(api));
      const committed=await client.query('COMMIT');
      if(committed.command!=='COMMIT')throw new Error('Storage transaction was aborted before commit');
      return result;
    } catch(e) { await client.query('ROLLBACK'); throw e; } finally {client.release();}
  }
  async function lock(namespace, key) {
    const tx = context.getStore();
    if (tx && !tx.readOnly) await query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [JSON.stringify([schema,namespace,key])]);
  }
  const filePath = h => { if (!/^[a-f0-9]{64}$/.test(h)) throw new Error('Invalid content hash'); return path.join(root,h); };
  async function persist(bytes) {
    const digest = hash(bytes), destination = filePath(digest);
    const temporary = path.join(root, `.pending-${randomUUID()}`);
    const handle = await open(temporary, 'wx', 0o600);
    try { await handle.writeFile(bytes); await handle.sync(); }
    finally { await handle.close(); }
    // rename only exposes complete bytes; concurrent identical hashes are safe.
    try { await rename(temporary,destination); }
    catch(error) { await unlink(temporary).catch(()=>{}); throw error; }
    // Persist the directory entry before committing the PostgreSQL reference.
    if (process.platform !== 'win32') { const directory=await open(root,'r'); try {await directory.sync();} finally {await directory.close();} }
    return digest;
  }
  function getStore(options) {
    const namespace = identity(typeof options === 'string' ? options : options?.name, 'namespace');
    async function row(key) { identity(key,'key'); await lock(namespace,key); return (await query(`SELECT * FROM ${table} WHERE namespace=$1 AND object_key=$2`,[namespace,key])).rows[0]; }
    async function bytes(record) {
      if (record.kind !== 'binary') return Buffer.from(record.body);
      const filename = filePath(record.file_hash);
      if ((await lstat(filename)).isSymbolicLink()) throw new Error('Storage object must not be a symbolic link');
      const data = await readFile(filename);
      if (hash(data) !== record.file_hash) throw new Error('Storage file checksum mismatch');
      return data;
    }
    function metadata(record) { return {...record.metadata, etag:record.etag, size:Number(record.size),headers:{...(record.metadata.headers||{}),'content-length':String(record.size),etag:record.etag,...(record.metadata.contentType?{'content-type':record.metadata.contentType}:{})}}; }
    async function get(key,{type='text'}={}) {
      const record = await row(key); if (!record) return null;
      const data = await bytes(record);
      switch(type) {
        case 'text':return data.toString(); case 'json':return JSON.parse(data.toString());
        case 'arrayBuffer': return data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength);
        case 'blob': return new Blob([data],{type:record.metadata.contentType || ''});
        case 'stream': return new ReadableStream({start(c){c.enqueue(new Uint8Array(data));c.close();}});
        default:throw new Error('Invalid storage response type');
      }
    }
    async function write(key,value,options={},kind='text') {
      identity(key,'key');
      let data;
      if (kind === 'json') {const text=JSON.stringify(value); if(text===undefined)throw new Error('Invalid JSON value'); data=Buffer.from(text);}
      else if(typeof value==='string') data=Buffer.from(value);
      else {kind='binary'; data=Buffer.from(value instanceof Blob ? await value.arrayBuffer() : value instanceof ReadableStream ? await new Response(value).arrayBuffer() : value);}
      const digest=hash(data), fileHash=kind==='binary' ? await persist(data) : null;
      return withTransaction(async()=>{
        const current=await row(key);
        if ((options.onlyIfNew && current) || (options.ifMatch!==undefined && !matches(options.ifMatch,current?.etag)) || (options.ifNoneMatch!==undefined && matches(options.ifNoneMatch,current?.etag))) throw conflict();
        const meta=options.preserveMetadata ? {...options.metadata} : {...(options.metadata || {}), ...(options.contentType ? {contentType:options.contentType} : kind==='json'?{contentType:'application/json'}:{}),cacheControl:options.cacheControl===undefined?'max-age=0, stale-while-revalidate=60':options.cacheControl};
        await query(`INSERT INTO ${table}(namespace,object_key,kind,body,file_hash,etag,metadata,size) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(namespace,object_key) DO UPDATE SET kind=EXCLUDED.kind,body=EXCLUDED.body,file_hash=EXCLUDED.file_hash,etag=EXCLUDED.etag,metadata=EXCLUDED.metadata,size=EXCLUDED.size,updated_at=clock_timestamp()`,[namespace,key,kind,kind==='binary'?null:data.toString(),fileHash,options.etag || digest,meta,data.length]);
      });
    }
    async function list({prefix='',cursor,limit=Infinity,paginate=true,directories=false}={}) {
      if(typeof prefix!=='string'|| !(limit===Infinity || Number.isInteger(limit)&&limit>=0))throw new Error('Invalid storage pagination');
      let after=''; if(cursor){try{const c=JSON.parse(Buffer.from(cursor,'base64url'));if(c.namespace!==namespace||c.prefix!==prefix||c.directories!==directories||typeof c.after!=='string')throw 0; after=c.after;}catch{throw new Error('Invalid storage cursor');}}
      const rows=(await query(`SELECT object_key,etag FROM ${table} WHERE namespace=$1 AND starts_with(object_key,$2) AND object_key>$3 ORDER BY object_key`,[namespace,prefix,after])).rows;
      const entries=[],seen=new Set();
      for(const r of rows){const suffix=r.object_key.slice(prefix.length), slash=suffix.indexOf('/');const directory=directories&&slash>=0?prefix+suffix.slice(0,slash+1):null;const key=directory||r.object_key;if(seen.has(key))continue;seen.add(key);entries.push({key,etag:r.etag,directory});}
      const cap=limit===Infinity?(paginate?entries.length:1000):limit, selected=entries.slice(0,cap), more=entries.length>cap;
      // Directory cursors skip every key beneath the returned directory.
      const last=selected.at(-1); let marker=last?.key;
      if(last?.directory) marker=rows.filter(r=>r.object_key.startsWith(last.directory)).at(-1)?.object_key;
      return {blobs:selected.filter(r=>!r.directory).map(({key,etag})=>({key,etag})),directories:selected.filter(r=>r.directory).map(r=>r.directory),...(more&&last?{cursor:Buffer.from(JSON.stringify({namespace,prefix,directories,after:marker})).toString('base64url')}:{})};
    }
    return {namespace,backend:'postgres-files',get,set:(k,v,o)=>write(k,v,o),setJSON:(k,v,o)=>write(k,v,o,'json'),list,
      createUploadUrl:async(key,{expireSeconds=3600,contentType,maxBytes=maxUploadBytes}={})=>{
        identity(key,'key');const origin=uploadConfig();
        if(!Number.isSafeInteger(maxBytes)||maxBytes<1||maxBytes>maxUploadBytes||!Number.isSafeInteger(expireSeconds)||expireSeconds<1||expireSeconds>86400||contentType!==undefined&&(typeof contentType!=='string'||contentType.length>255||/[\r\n]/.test(contentType)))throw new Error('Invalid upload authorization options');
        const expiresAt=Math.floor(Date.now()/1000)+expireSeconds,value=Buffer.from(JSON.stringify({namespace,key,expiresAt,contentType,maxBytes,nonce:randomUUID()})).toString('base64url');
        return {url:`${origin}/api/storage-upload?token=${value}.${sign(value)}`,key,expiresAt};
      },
      getMetadata:async key=>{const r=await row(key);return r?metadata(r):null;},
      getWithHeaders:async key=>{const r=await row(key);if(!r)return null;return {body:(await bytes(r)).toString(),headers:{...(r.metadata.headers||{}),etag:r.etag,'content-length':String(r.size),...(r.metadata.contentType?{'content-type':r.metadata.contentType}:{}),...(r.metadata.cacheControl?{'cache-control':r.metadata.cacheControl}:{})}};},
      delete:async(key,options={})=>withTransaction(async()=>{const r=await row(key);if(options.ifMatch!==undefined&&!matches(options.ifMatch,r?.etag))throw conflict();await query(`DELETE FROM ${table} WHERE namespace=$1 AND object_key=$2`,[namespace,key]);})};
  }
  async function* exportEntries({namespaces}={}) {
    const rows=(await query(`SELECT * FROM ${table} ${namespaces?'WHERE namespace=ANY($1::text[])':''} ORDER BY namespace,object_key`,namespaces?[namespaces]:[])).rows;
    for(const r of rows) yield {namespace:r.namespace,key:r.object_key,kind:r.kind,data:r.kind==='binary'?Buffer.from(await getStore(r.namespace).get(r.object_key,{type:'arrayBuffer'})).toString('base64'):r.body,metadata:r.metadata,etag:r.etag};
  }
  async function importEntries(entries,{onlyIfNew=true}={}) {
    let count=0; await withTransaction(async()=>{for await(const e of entries){if(!['json','text','binary'].includes(e.kind))throw new Error('Invalid import kind');const store=getStore(e.namespace),options={onlyIfNew,metadata:e.metadata,preserveMetadata:true,etag:e.etag};if(e.kind==='json')await store.setJSON(e.key,JSON.parse(e.data),options);else await store.set(e.key,e.kind==='binary'?Buffer.from(e.data,'base64'):e.data,options);count++;}});return {count};
  }
  const api={getStore,storeFactory:getStore,withTransaction,runInTransaction:withTransaction,query,initialize,exportEntries,importEntries,acceptUpload,close:()=>suppliedPool?Promise.resolve():pool.end()};
  return api;
}


