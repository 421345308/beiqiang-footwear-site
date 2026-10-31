import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Pool } from 'pg';
import { createStorage } from '../self-hosted/storage.mjs';
const url=process.env.SELF_HOSTED_TEST_DATABASE_URL;
test('real PostgreSQL private storage roundtrip, transactions, concurrency and portable originals', {skip:!url},async()=>{
 const schema=`storage_test_${Date.now()}`,dataDir=await mkdtemp(path.join(os.tmpdir(),'bq-storage-')),pool=new Pool({connectionString:url});
 const db=createStorage({pool,dataDir,schema,publicOrigin:"https://test.example",uploadSecret:"a".repeat(32),maxUploadBytes:10});await db.initialize();
 try {
 const a=db.getStore('beiqiang-inquiries'),files=db.getStore('beiqiang-inquiry-files');
 await a.setJSON('inquiries/a.json',{messages:[],next:'old'},{metadata:{custom:'yes'},cacheControl:null});
 assert.deepEqual(await a.get('inquiries/a.json',{type:'json'}),{messages:[],next:'old'});
 assert.equal((await a.getMetadata('inquiries/a.json')).custom,'yes');
 await files.set('raw/a.bin',Buffer.from([0,255,19]),{contentType:'application/octet-stream',metadata:{headers:{'x-original':'yes'}}});
 assert.deepEqual(Buffer.from(await files.get('raw/a.bin',{type:'arrayBuffer'})),Buffer.from([0,255,19]));
 assert.equal((await files.getWithHeaders('raw/a.bin')).headers['x-original'],'yes');
 assert.equal((await files.get('raw/a.bin',{type:'blob'})).type,'application/octet-stream');
 assert.deepEqual(Buffer.from(await new Response(await files.get('raw/a.bin',{type:'stream'})).arrayBuffer()),Buffer.from([0,255,19]));
 await assert.rejects(db.withTransaction(async()=>{await a.set('rollback','x');await files.set('rollback.bin',Buffer.from([1]));throw new Error('abort');}),/abort/);
 assert.equal(await a.get('rollback'),null);assert.equal(await files.get('rollback.bin'),null);
 await Promise.all(Array.from({length:12},(_,i)=>db.withTransaction(async()=>{const value=await a.get('inquiries/a.json',{type:'json'});await new Promise(r=>setTimeout(r,3));value.messages.push(i);await a.setJSON('inquiries/a.json',value);})));
 assert.equal((await a.get('inquiries/a.json',{type:'json'})).messages.length,12);
 const peer=createStorage({pool,dataDir,schema});
 await Promise.all([db,peer].map((instance,i)=>instance.withTransaction(async()=>{const st=instance.getStore(a.namespace),v=await st.get('inquiries/a.json',{type:'json'});v.messages.push('peer'+i);await st.setJSON('inquiries/a.json',v);})));
 assert.equal((await a.get('inquiries/a.json',{type:'json'})).messages.length,14);
 const races=await Promise.allSettled(Array.from({length:5},()=>a.setJSON('new',{one:1},{onlyIfNew:true})));
 assert.equal(races.filter(r=>r.status==='fulfilled').length,1);assert.ok(races.filter(r=>r.status==='rejected').every(r=>r.reason.code==='PRECONDITION_FAILED'));
 const signed=await files.createUploadUrl('upload/a',{contentType:'image/png'}),token=new URL(signed.url).searchParams.get('token');
 await assert.rejects(db.acceptUpload({token:token+'x',body:Buffer.from([1]),contentType:'image/png'}),e=>e.status===401);
 await assert.rejects(db.acceptUpload({token,body:Buffer.from([1]),contentType:'text/plain'}),e=>e.status===415);
 await assert.rejects(db.acceptUpload({token,body:Buffer.alloc(11),contentType:'image/png'}),e=>e.status===413);
 await db.acceptUpload({token,body:new Blob([Buffer.from([1,2])]).stream(),contentType:'image/png'});
 await assert.rejects(db.acceptUpload({token,body:Buffer.from([3]),contentType:'image/png'}),e=>e.code==='PRECONDITION_FAILED');
 assert.deepEqual(Buffer.from(await files.get('upload/a',{type:'arrayBuffer'})),Buffer.from([1,2]));
 const etag=(await a.getMetadata('new')).etag;
 await assert.rejects(a.set('new','bad',{ifMatch:'bad'}),e=>e.code==='PRECONDITION_FAILED');
 await a.set('new','ok',{ifMatch:etag});await assert.rejects(a.set('new','bad',{ifNoneMatch:'*'}),e=>e.code==='PRECONDITION_FAILED');
 await db.withTransaction(async()=>{await assert.rejects(a.set('new','bad',{onlyIfNew:true}));await a.set('survives','ok');await db.withTransaction(async()=>a.set('nested','yes'));});
 assert.equal(await a.get('nested'),'yes');
 for(let i=0;i<5;i++)await a.set(`page/${i}`,'text');
 let cursor,keys=[];do{const result=await a.list({prefix:'page/',limit:2,cursor,paginate:false});keys.push(...result.blobs.map(r=>r.key));cursor=result.cursor;}while(cursor);assert.equal(new Set(keys).size,5);
 await assert.rejects(a.list({prefix:'different',cursor:Buffer.from(JSON.stringify({namespace:'bad'})).toString('base64url')}));
 await assert.rejects(files.set('../outside','x'),/Invalid storage key/);
 const exported=[];for await(const e of db.exportEntries())exported.push(e);
 const second=createStorage({pool,dataDir,schema:schema+'_restore'});await second.initialize();
 try {assert.equal((await second.importEntries(exported)).count,exported.length);assert.deepEqual(Buffer.from(await second.getStore(files.namespace).get('raw/a.bin',{type:'arrayBuffer'})),Buffer.from([0,255,19]));assert.deepEqual(await second.getStore(files.namespace).getMetadata('raw/a.bin'),await files.getMetadata('raw/a.bin'));} finally {await pool.query('DROP SCHEMA '+schema+'_restore CASCADE');}
 await db.withTransaction(async()=>{assert.equal(await a.get('nested'),'yes');},{readOnly:true});
 } finally {await pool.query(`DROP SCHEMA "${schema}" CASCADE`);await pool.end();await rm(dataDir,{recursive:true,force:true});}
});




