import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const canonical=value=>JSON.stringify(value,(_key,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
const digest=data=>createHash('sha256').update(data).digest('hex');
const bytes=e=>e.kind==='binary'?Buffer.from(e.data,'base64'):Buffer.from(e.data);
const atStage=async(stage,fn)=>{try{return await fn();}catch(error){error.migrationStage ||= stage;throw error;}};
export function safeDiagnostic(error){const code=String(error.code||error.cause?.code||'');return {error:'MIGRATION_FAILED',stage:error.migrationStage||'validation-or-output',httpStatus:Number.isInteger(error.statusCode||error.status)?(error.statusCode||error.status):undefined,category:/^[A-Z0-9_]{1,60}$/.test(code)?code:error.message==='Source changed since export'?'SOURCE_CHANGED':error.message==='Source changed during export'?'SOURCE_CHANGED':error.message==='Migration output directory must be git ignored'?'OUTPUT_NOT_IGNORED':error.message==='Invalid run record during cutover inspection'?'INVALID_RUN_RECORD':error instanceof SyntaxError?'INVALID_JSON':error instanceof TypeError?'NETWORK_OR_ARGUMENT':'VALIDATION',name:['Error','TypeError','SyntaxError','PreconditionFailedError'].includes(error.name)?error.name:'Error'};}
const sorted=entries=>[...entries].sort((a,b)=>a.namespace.localeCompare(b.namespace)||a.key.localeCompare(b.key));
function stableMetadata(metadata){return {...metadata,...(metadata.headers?{headers:Object.fromEntries(Object.entries(metadata.headers).filter(([key])=>/^(content-|cache-control$|etag$|last-modified$|expires$|x-cos-meta-|x-cos-hash-)/i.test(key)).map(([key,value])=>[key.toLowerCase(),value]))}:{})};}
function manifestFor(entries,namespaces){return {namespaces:[...namespaces].sort(),entries:sorted(entries).map(e=>({namespace:e.namespace,key:e.key,sha256:digest(bytes(e)),metadataSha256:digest(canonical(e.metadata)),metadataStableSha256:digest(canonical(stableMetadata(e.metadata))),etag:e.etag}))};}
const bundleHash=b=>digest(JSON.stringify({version:b.version,rehearsal:b.rehearsal,authStrategy:b.authStrategy,manifest:b.manifest}));
export async function inventory(source){const result=await atStage('source-inventory',()=>source.listStores());const namespaces=result.stores.map(s=>s.name).filter(n=>/^beiqiang-[a-zA-Z0-9_-]+$/.test(n)).sort();if(!namespaces.length)throw new Error('No eligible source stores found');return {namespaces,count:namespaces.length};}
async function collect(source,namespaces){
 const entries=[];
 for(const namespace of namespaces){const store=source.getStore(namespace);let cursor;do{const page=await atStage('source-list',()=>store.list({paginate:false,limit:500,cursor,consistency:'strong'}));for(let offset=0;offset<page.blobs.length;offset+=4){await Promise.all(page.blobs.slice(offset,offset+4).map(async info=>{const [body,metadata]=await Promise.all([atStage('source-body',()=>store.get(info.key,{type:'arrayBuffer',consistency:'strong'})),atStage('source-metadata',()=>store.getMetadata(info.key,{consistency:'strong'}))]);if(body===null||!metadata)throw new Error('Source changed during export');const data=Buffer.from(body);const contentType=metadata.contentType||metadata.headers?.['content-type']||'';const text=/^(text\/|application\/(json|[^;]+\+json))/.test(contentType);const validText=text&&Buffer.from(data.toString()).equals(data);entries.push({namespace,key:info.key,kind:validText?'text':'binary',data:validText?data.toString():data.toString('base64'),metadata,etag:metadata.etag||info.etag||digest(data)});}));}cursor=page.cursor;}while(cursor);}
 return sorted(entries);
}
function activeRuns(entries){
 const latest=new Map();for(const e of sorted(entries)){if(!/^(runs|inquiry_runs)\//.test(e.key))continue;try{const v=JSON.parse(bytes(e).toString()),id=e.namespace+'/'+(v.id||e.key.replace(/\/\d+\.json$/,''));const old=latest.get(id);if(!old||Number(v.version||0)>=Number(old.version||0))latest.set(id,v);}catch{throw new Error('Invalid run record during cutover inspection');}}
 return [...latest.values()].filter(v=>['running','claimed','executing'].includes(v.status)||v.state==='running').length;
}export async function exportSource(source,{rehearsal=false,authStrategy,maintenanceCheck}={}){
 if(!['preserve','revoke'].includes(authStrategy))throw new Error('Explicit authStrategy preserve or revoke is required');
 if(!rehearsal&&(!maintenanceCheck||!await maintenanceCheck()))throw new Error('Whole-site maintenance 503 gate is required');
 const {namespaces}=await inventory(source),entries=await collect(source,namespaces),manifest=manifestFor(entries,namespaces);
 const bundle={version:1,rehearsal,authStrategy,createdAt:new Date().toISOString(),activeRuns:activeRuns(entries),entries,manifest};bundle.sha256=bundleHash(bundle);
 await atStage('source-second-pass',()=>verifySource(source,bundle));
 if(!rehearsal&&bundle.activeRuns)throw new Error('Running jobs prevent cutover');
 if(!rehearsal&&!await maintenanceCheck())throw new Error('Whole-site maintenance gate changed');
 return bundle;
}
export function verifyBundle(bundle){
 if(typeof bundle.rehearsal!=='boolean'||!['preserve','revoke'].includes(bundle.authStrategy)||bundle.activeRuns!==activeRuns(bundle.entries)||bundle.version!==1||!Array.isArray(bundle.entries)||bundle.sha256!==bundleHash(bundle)||JSON.stringify(manifestFor(bundle.entries,bundle.manifest.namespaces))!==JSON.stringify(bundle.manifest))throw new Error('Migration bundle integrity mismatch');
 const seen=new Set();for(const e of bundle.entries){const id=JSON.stringify([e.namespace,e.key]);if(seen.has(id)||!bundle.manifest.namespaces.includes(e.namespace)||!['text','json','binary'].includes(e.kind))throw new Error('Invalid migration entry');seen.add(id);}return {count:bundle.entries.length,namespaces:bundle.manifest.namespaces.length};
}
export async function verifySource(source,bundle){verifyBundle(bundle);const {namespaces}=await inventory(source),entries=await collect(source,namespaces);const stable=m=>JSON.stringify({...m,entries:m.entries.map(item=>{const entry={...item};delete entry.metadataSha256;return entry;})});if(stable(manifestFor(entries,namespaces))!==stable(bundle.manifest))throw new Error('Source changed since export');return {count:entries.length,namespaces:namespaces.length};}
export async function verifyTarget(storage,bundle){verifyBundle(bundle);const entries=[];for await(const e of storage.exportEntries())entries.push(e);if(JSON.stringify(manifestFor(entries,bundle.manifest.namespaces))!==JSON.stringify(bundle.manifest))throw new Error('Target differs from migration manifest');return {count:entries.length};}
export async function importBundle(storage,bundle,{allowRehearsal=false,sessionSecretPreserved=false}={}){
 verifyBundle(bundle);if(bundle.rehearsal&&!allowRehearsal)throw new Error('Rehearsal bundle cannot activate production');if(bundle.activeRuns)throw new Error('Running jobs prevent cutover');
 if(bundle.authStrategy!=='preserve'||!sessionSecretPreserved)throw new Error('Authentication migration requires preserve strategy and unchanged session secrets; revoke requires a separate reviewed revocation plan');
 return storage.withTransaction(async()=>{const existing=[];for await(const e of storage.exportEntries())existing.push(e);if(existing.length){await verifyTarget(storage,bundle);return {count:existing.length,idempotent:true};}await storage.importEntries(bundle.entries);await verifyTarget(storage,bundle);return {count:bundle.entries.length,idempotent:false};});
}
async function privateOutput(filename,bundle){const absolute=path.resolve(filename),repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');const relative=path.relative(repo,absolute);if(relative.startsWith('..')||path.isAbsolute(relative))throw new Error('Migration output must be inside an ignored repository directory');try{execFileSync('git',['check-ignore','--quiet','--',relative],{cwd:repo,stdio:'ignore',windowsHide:true});}catch{throw new Error('Migration output directory must be git ignored');}await mkdir(path.dirname(absolute),{recursive:true,mode:0o700});await writeFile(absolute,JSON.stringify(bundle),{flag:'wx',mode:0o600});}
export async function main(argv=process.argv.slice(2)){
 const [command,...args]=argv,flag=n=>args.includes('--'+n),value=n=>{const i=args.indexOf('--'+n);return i<0?undefined:args[i+1];};
 const source=async()=>{const sdk=await import('@edgeone/pages-blob');const projectId=process.env.PROJECT_ID,token=process.env.BEIQIANG_DEPLOY_TOKEN;if(!projectId||!token)throw new Error('Source credentials missing');return {listStores:()=>sdk.listStores({projectId,token,consistency:'strong'}),getStore:name=>sdk.getStore({name,projectId,token,consistency:'strong'})};};
 if(command==='inventory'){const info=await inventory(await source());return {namespaces:info.count};}
 if(command==='export'){const maintenanceUrl=value('maintenance-url');const bundle=await exportSource(await source(),{rehearsal:flag('rehearsal'),authStrategy:value('auth-strategy'),maintenanceCheck:async()=>{if(!maintenanceUrl)return false;const response=await fetch(maintenanceUrl,{redirect:'error'});return response.status===503&&response.headers.get('x-beiqiang-maintenance')==='unified-migration';}});if(!value('file'))throw new Error('Private output --file required');await atStage('private-output',()=>privateOutput(value('file'),bundle));return {count:bundle.entries.length,namespaces:bundle.manifest.namespaces.length,namespaceCounts:bundle.manifest.namespaces.map(namespace=>({namespace,count:bundle.entries.filter(e=>e.namespace===namespace).length})),rehearsal:bundle.rehearsal,activeRuns:bundle.activeRuns};}
 if(!value('file'))throw new Error('Private input --file required');const bundle=JSON.parse(await readFile(value('file'),'utf8'));verifyBundle(bundle);
 if(command==='verify'&&flag('source'))return verifySource(await source(),bundle);
 if(!['import','verify'].includes(command))throw new Error('Expected inventory, export, import or verify');
 if(flag('allow-rehearsal')&&!['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.DATABASE_URL).hostname))throw new Error('Rehearsal import is limited to an isolated localhost database');
 const {createStorage}=await import('./storage.mjs'),storage=createStorage({connectionString:process.env.DATABASE_URL,dataDir:process.env.BEIQIANG_DATA_DIR});
 try{await storage.initialize();return command==='import'?await importBundle(storage,bundle,{sessionSecretPreserved:flag('session-secret-preserved'),allowRehearsal:flag('allow-rehearsal')}):await verifyTarget(storage,bundle);}finally{await storage.close();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().then(result=>console.log(JSON.stringify(result))).catch(error=>{console.error(JSON.stringify(safeDiagnostic(error)));process.exitCode=1;});










