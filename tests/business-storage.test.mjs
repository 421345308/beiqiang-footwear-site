import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createDatabase } from '../edgeone-deploy/cloud-functions/_lib/database.js';
import { createWorkbenchHandlers } from '../edgeone-deploy/cloud-functions/api/workbench.js';
import { createOperationsHandlers } from '../edgeone-deploy/cloud-functions/api/operations.js';
import { createWorkbenchRunnerHandler } from '../edgeone-deploy/cloud-functions/api/workbench-runner.js';
import { hash, sign, COOKIE, STORE_NAME } from '../edgeone-deploy/cloud-functions/_lib/workbench.js';
import { OPS_STORE, sourceHash } from '../edgeone-deploy/cloud-functions/_lib/operations.js';
import { exportBusiness, validatePackage } from '../scripts/migrate-business-database.mjs';

const origin='https://www.beiqiang.online', token='a'.repeat(64), ref='BQ-20261030-DBHTTP01';
function fixture(extra={}) {
  const maps=new Map(), writes=[];
  const factory=({name})=>{ if(!maps.has(name))maps.set(name,new Map());const data=maps.get(name);return {
    get:async key=>structuredClone(data.get(key)??null),
    setJSON:async(key,value,opts={})=>{if(opts.onlyIfNew&&data.has(key))throw Object.assign(new Error('conflict'),{code:'PRECONDITION_FAILED'});writes.push({name,key});data.set(key,structuredClone(value));},
    delete:async key=>data.delete(key),list:async({prefix='',limit=1000})=>({blobs:[...data.keys()].filter(key=>key.startsWith(prefix)).slice(0,limit).map(key=>({key}))})
  };};
  const env={WORKBENCH_OWNER_EMAIL:'owner@example.invalid',WORKBENCH_SESSION_SECRET:'test-session-secret-for-database-http',WORKBENCH_RUNNER_SECRET:'test-runner-secret-for-database-http',WORKBENCH_RUNNER_MODE:'self_hosted',WORKBENCH_AUTODISPATCH:'enabled',...extra};
  factory({name:STORE_NAME});maps.get(STORE_NAME).set(`sessions/${hash(token)}.json`,{email:env.WORKBENCH_OWNER_EMAIL,csrf_token:'test-csrf',expires_at:'2099-01-01T00:00:00Z'});
  const source={reference:ref,name:'Integration buyer',company:'Database HTTP fixture',requirements:'Need options, no commercial promises.',receivedAt:'2026-10-30T00:00:00Z',messages:[]};
  factory({name:'beiqiang-inquiries'});maps.get('beiqiang-inquiries').set(`inquiries/2026-10-30/${ref}.json`,source);
  const deps={getStoreImpl:factory}, api=createWorkbenchHandlers(deps),ops=createOperationsHandlers(deps),runner=createWorkbenchRunnerHandler(deps);
  async function call(handler,body,{query='',owner=true,customEnv=env,machine=false}={}){
    const headers={'content-type':'application/json',origin,'x-workbench-token':'test-csrf'};
    if(owner)headers.cookie=`${COOKIE}=${token}.${sign(token,env.WORKBENCH_SESSION_SECRET)}`;
    if(machine)headers.authorization=`Bearer ${env.WORKBENCH_RUNNER_SECRET}`;
    const response=await handler({env:customEnv,request:new Request(origin+'/api/test'+query,{method:body?'POST':'GET',headers,...(body?{body:JSON.stringify(body)}:{})})});
    return {status:response.status,body:await response.json()};
  }
  return {env,factory,maps,writes,source,deps,api,ops,runner,call,machine:body=>call(runner,body,{machine:true})};
}

test('postgres never falls back to Blob; unauthenticated requests do not open database',async()=>{
  const f=fixture({WORKBENCH_STORAGE:'postgres'});let opened=0;
  const api=createWorkbenchHandlers({...f.deps,createDatabaseImpl(){opened++;throw new Error('connection failed');}});
  assert.equal((await f.call(api.onRequestGet,null,{owner:false})).status,401);assert.equal(opened,0);
  assert.equal((await f.call(api.onRequestPost,{action:'create',task:{title:'Fail closed'}})).status,503);
  assert.equal(opened,1);assert.equal(f.writes.length,0);
});
test('maintenance stops owner writes and automatic claims while preserving records',async()=>{
  const f=fixture({WORKBENCH_MAINTENANCE:'enabled'});
  assert.equal((await f.call(f.api.onRequestPost,{action:'create',task:{title:'Paused'}})).body.code,'BUSINESS_MAINTENANCE');
  assert.equal((await f.machine({action:'claim'})).body.code,'BUSINESS_MAINTENANCE');assert.equal(f.writes.length,0);
});
test('unified task projection keeps business status and agent status separate; automatic claims require readiness',async()=>{
  const f=fixture();const task=(await f.call(f.api.onRequestPost,{action:'create',task:{title:'Internal analysis',status:'等待客户'}})).body.task;
  const queued=(await f.call(f.api.onRequestPost,{action:'enqueue',task_id:task.id,instruction:'Analyze only'})).body.run;
  assert.equal((await f.machine({action:'claim'})).status,409);
  await f.machine({action:'heartbeat',capabilities:{ready:true,auth:'chatgpt',model:'gpt-6.1-sol'}});
  const state=(await f.call(f.api.onRequestGet)).body;
  assert.equal(state.capabilities.dispatch.ready,true);assert.equal(state.capabilities.backend.kind,'private_blob');
  assert.equal(state.unified_tasks.length,2);assert.equal(state.unified_tasks.find(t=>t.task_id===task.id).status,'等待客户');
  assert.equal((await f.machine({action:'claim'})).body.job.id,queued.id);
  await f.machine({action:'heartbeat',capabilities:{ready:false,auth:'unknown',model:'gpt-6.1-sol'}});
  assert.equal((await f.call(f.api.onRequestGet)).body.capabilities.dispatch.ready,false);
});
test('migration export excludes authentication, preserves history and rejects tampered packages',async()=>{
  const f=fixture();await f.factory({name:STORE_NAME}).setJSON('goals/current.json',{phase:'fixture'});
  const data=await exportBusiness(f.factory);assert.equal(data.records.length,1);assert.ok(!JSON.stringify(data).includes('csrf'));
  assert.equal(validatePackage(data),data);data.records[0].value.phase='changed';assert.throws(()=>validatePackage(data));
});

test('real PostgreSQL HTTP flow: owner auth stays Blob, atomic enqueue, automatic claim, review, source unchanged', {skip:!process.env.BQ_HTTP_DATABASE_URL},async()=>{
  const env={WORKBENCH_DATABASE_URL:process.env.BQ_HTTP_DATABASE_URL,WORKBENCH_DATABASE_MIGRATION_ID:'http-acceptance',WORKBENCH_STORAGE:'postgres'};
  const db=createDatabase(env);
  try {
    const database=new URL(env.WORKBENCH_DATABASE_URL).pathname;
    assert.ok(database.startsWith('/beiqiang_test_http'),'Only the dedicated test database is allowed');
    await db.query(await readFile(new URL('../db/operations/001_private_backend.sql',import.meta.url),'utf8'));
    await db.query('TRUNCATE beiqiang_private.business_records,beiqiang_private.migration_batches CASCADE');
    await db.prepareMigration({id:env.WORKBENCH_DATABASE_MIGRATION_ID,manifest:{schema_version:1,namespaces:[STORE_NAME,OPS_STORE],entries:[]}});
    await db.verifyMigration(env.WORKBENCH_DATABASE_MIGRATION_ID);
    const f=fixture(env), before=JSON.stringify(f.source);
    let detail=await f.call(f.ops.onRequestGet,null,{query:`?reference=${ref}`});assert.equal(detail.status,200);
    const enqueue=()=>f.call(f.ops.onRequestPost,{action:'enqueue_agent',reference:ref,source_hash:sourceHash(f.source),expected_version:0});
    const competing=await Promise.all([enqueue(),enqueue()]);assert.deepEqual(competing.map(r=>r.status).sort(),[201,409]);
    const run=competing.find(r=>r.status===201).body.run;
    assert.equal(f.writes.length,0,'No business dual-write to Blob');
    await f.machine({action:'heartbeat',capabilities:{ready:true,auth:'chatgpt',model:'gpt-6.1-sol'}});
    const claims=await Promise.all([f.machine({action:'claim'}),f.machine({action:'claim'})]);
    const claimed=claims.filter(r=>r.body.job);assert.equal(claimed.length,1);
    const job=claimed[0].body.job;assert.equal(job.id,run.id);
    const result={summary:'Real database integration; model output is a fixture.',changes:[],next_steps:['Review'],fields:{internal_note:'Fixture only',next_action:'Clarify needs',handling_status:'open'}};
    assert.equal((await f.machine({action:'complete',run_id:run.id,lease_token:job.lease_token,result})).status,200);
    const reviewed=await f.call(f.ops.onRequestPost,{action:'review',reference:ref,proposal_id:run.id,decision:'accept'});assert.equal(reviewed.status,200);
    detail=await f.call(f.ops.onRequestGet,null,{query:`?reference=${ref}`});assert.equal(detail.body.handling.version,1);assert.equal(detail.body.handling.internal_note,'Fixture only');assert.equal(detail.body.agent_runs[0].status,'accepted');
    const state=(await f.call(f.api.onRequestGet)).body;assert.equal(state.capabilities.backend.kind,'postgres');assert.equal(state.unified_tasks.find(t=>t.reference===ref).latest_run_status,'accepted');
    assert.equal(JSON.stringify(f.source),before);assert.equal(f.writes.length,0);assert.equal((await db.query("SELECT count(*)::int AS n FROM beiqiang_private.business_records WHERE record_key LIKE 'sessions/%'")).rows[0].n,0);
  } finally {await db.close();}
});
