import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {Pool} from 'pg';
import {createStorage} from '../self-hosted/storage.mjs';
import {inventory,exportSource,verifySource,verifyBundle,importBundle,verifyTarget,safeDiagnostic} from '../self-hosted/migrate.mjs';
function fake(){const records=new Map([
 ['beiqiang-owner-workbench-v1',new Map([['sessions/live.json',Buffer.from('{"token":"synthetic-only"}')],['runs/r/00000001.json',Buffer.from('{"id":"r","version":1,"status":"running"}')],['runs/r/00000002.json',Buffer.from('{"id":"r","version":2,"status":"completed"}')]])],
 ['beiqiang-inquiry-files',new Map([['private/original.bin',Buffer.from([0,255,13,10,127])]])],['beiqiang-empty',new Map()],['foreign-store',new Map()]
 ]);return {records,listStores:async()=>({stores:[...records.keys()].map(name=>({name}))}),getStore:name=>({list:async()=>({blobs:[...records.get(name).keys()].map(key=>({key,etag:'source-etag'}))}),get:async key=>{const b=records.get(name).get(key);return b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength);},getMetadata:async key=>({etag:'source-etag',contentType:key.endsWith('.json')?'application/json':'application/octet-stream',headers:{'content-length':String(records.get(name).get(key).length),'x-original':'kept'}})})};}
test('complete source enumeration, maintenance/rehearsal, corruption and source stability',async()=>{
 const source=fake();assert.equal((await inventory(source)).count,3);
 await assert.rejects(exportSource(source,{authStrategy:'preserve'}),/maintenance/);
 let reads=0;const originalStore=source.getStore;source.getStore=name=>{const st=originalStore(name);return {...st,getMetadata:async key=>{const meta=await st.getMetadata(key);meta.headers.date=String(++reads);meta.headers['x-cos-request-id']='request'+reads;return meta;}};};
 const b=await exportSource(source,{rehearsal:true,authStrategy:'preserve'});assert.equal(b.entries.length,4);assert.equal(b.activeRuns,0);assert.ok(b.entries.some(e=>e.key.startsWith('sessions/')));verifyBundle(b);
 assert.deepEqual(safeDiagnostic(Object.assign(new Error('secret data'),{code:'ECONNRESET'})).category,'ECONNRESET');
 assert.ok(!JSON.stringify(safeDiagnostic(new Error('secret data'))).includes('secret data'));
 const broken=structuredClone(b);broken.entries[0].data='corrupt';assert.throws(()=>verifyBundle(broken),/integrity/);
 source.records.get('beiqiang-inquiry-files').set('private/original.bin',Buffer.from([8]));await assert.rejects(verifySource(source,b),/changed/);
 const running=fake();running.records.get('beiqiang-owner-workbench-v1').delete('runs/r/00000002.json');await assert.rejects(exportSource(running,{authStrategy:'preserve',maintenanceCheck:async()=>true}),/Running jobs/);
});
test('real PostgreSQL migration retains sessions, bytes, metadata and rejects overwrite',{skip:!process.env.SELF_HOSTED_TEST_DATABASE_URL},async()=>{
 const pool=new Pool({connectionString:process.env.SELF_HOSTED_TEST_DATABASE_URL}),schema=`migration_test_${Date.now()}`,dataDir=await mkdtemp(path.join(os.tmpdir(),'bq-migrate-')),storage=createStorage({pool,schema,dataDir});
 try{await storage.initialize();const rehearsal=await exportSource(fake(),{rehearsal:true,authStrategy:'preserve'});await assert.rejects(importBundle(storage,rehearsal,{sessionSecretPreserved:true}),/Rehearsal/);
 const bundle=await exportSource(fake(),{authStrategy:'preserve',maintenanceCheck:async()=>true});await assert.rejects(importBundle(storage,bundle),/Authentication/);
 assert.equal((await importBundle(storage,bundle,{sessionSecretPreserved:true})).count,4);assert.equal((await importBundle(storage,bundle,{sessionSecretPreserved:true})).idempotent,true);await verifyTarget(storage,bundle);
 assert.deepEqual(Buffer.from(await storage.getStore('beiqiang-inquiry-files').get('private/original.bin',{type:'arrayBuffer'})),Buffer.from([0,255,13,10,127]));
 assert.equal((await storage.getStore('beiqiang-owner-workbench-v1').get('sessions/live.json',{type:'json'})).token,'synthetic-only');
 await storage.getStore('beiqiang-inquiry-files').set('extra',Buffer.from([1]));await assert.rejects(importBundle(storage,bundle,{sessionSecretPreserved:true}),/differs/);
 }finally{await pool.query(`DROP SCHEMA "${schema}" CASCADE`);await pool.end();await rm(dataDir,{recursive:true,force:true});}
});

