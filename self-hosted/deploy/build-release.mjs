import {readFile,mkdir,readdir,lstat,copyFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const roots=['pg','nodemailer','@edgeone/pages-blob'];
const forbidden=/(^|\/)(?:\.git|\.env[^/]*|\.local|local|private|tests?|__tests__)(\/|$)|(?:\.pem|auth\.json|\.private\.[^/]+)$/i;
export async function buildRelease({source=fileURLToPath(new URL('../../',import.meta.url)),output}={}) {
  source=path.resolve(source); output=path.resolve(output||'');
  if(!output||output===source||output.startsWith(source+path.sep))throw new Error('Output must be a new external directory');
  try {await lstat(output);throw new Error('Output already exists');}catch(e){if(e.code!=='ENOENT')throw e;}
  const lock=JSON.parse(await readFile(path.join(source,'package-lock.json'),'utf8'));
  const packages=new Map(), files=new Set();
  async function add(relative){
    const normalized=relative.split(path.sep).join('/');
    if(forbidden.test(normalized))throw new Error(`Excluded private/test path: ${normalized}`);
    const src=path.join(source,relative),stat=await lstat(src);
    if(stat.isSymbolicLink())throw new Error(`Symlinks excluded: ${normalized}`);
    if(stat.isDirectory()){for(const entry of await readdir(src))await add(path.join(relative,entry));return;}
    if(!stat.isFile())throw new Error('Nonregular release file');
    await mkdir(path.dirname(path.join(output,relative)),{recursive:true});
    await copyFile(src,path.join(output,relative));files.add(normalized);
  }
  async function codeTree(relative){
    for(const entry of await readdir(path.join(source,relative),{withFileTypes:true})){
      const rel=path.join(relative,entry.name),normalized=rel.split(path.sep).join('/');
      if(forbidden.test(normalized))continue;
      if(entry.isDirectory())await codeTree(rel);
      else if(/\.(?:mjs|js|sql)$/.test(entry.name)||relative.split(path.sep).join('/')==='self-hosted/deploy'&&/\.(?:sh|service|conf|md|example)$/.test(entry.name))await add(rel);
    }
  }
  function resolvePackage(name,parent=''){
    let cursor=parent;
    while(true){const candidate=(cursor?cursor+'/':'')+'node_modules/'+name;if(lock.packages[candidate])return candidate;
      if(!cursor)break;const index=cursor.lastIndexOf('/node_modules/');cursor=index<0?'':cursor.slice(0,index);}
    throw new Error(`Dependency not locked: ${name}`);
  }
  async function dependency(key){
    if(packages.has(key))return;
    const record=lock.packages[key];if(record.link||record.dev)throw new Error(`Nonproduction dependency: ${key}`);
    const installed=JSON.parse(await readFile(path.join(source,key,'package.json'),'utf8'));
    if(installed.version!==record.version)throw new Error(`Installed version differs from lock: ${key}`);
    packages.set(key,record);
    // Keep registry runtime files and licenses; omit their shipped test suites.
    async function packageTree(relative){for(const entry of await readdir(path.join(source,relative),{withFileTypes:true})){
      const rel=path.join(relative,entry.name);
      if(entry.name==='node_modules')continue;
      if(/^(?:tests?|testing|__tests__|__mocks__)$|(?:^|[.-])(?:test|spec)\.[cm]?[jt]s$/i.test(entry.name))continue;
      if(entry.isSymbolicLink())throw new Error(`Dependency symlink excluded: ${rel}`);
      if(entry.isDirectory())await packageTree(rel);
      else {await mkdir(path.dirname(path.join(output,rel)),{recursive:true});await copyFile(path.join(source,rel),path.join(output,rel));files.add(rel.split(path.sep).join('/'));}
    }}
    await packageTree(key);
    for(const name of Object.keys({...record.dependencies,...record.optionalDependencies})){
      let child;try{child=resolvePackage(name,key);}catch(e){if(record.optionalDependencies?.[name])continue;throw e;}
      await dependency(child);
    }
    for(const name of Object.keys(record.peerDependencies||{})){
      if(record.peerDependenciesMeta?.[name]?.optional)continue;
      await dependency(resolvePackage(name,key));
    }
  }
  await mkdir(output,{recursive:true});
  await codeTree('edgeone-deploy/cloud-functions');
  await codeTree('self-hosted');
  // Relative data imports outside these trees are followed explicitly.
  for(const relative of files){if(!/\.(?:mjs|js)$/.test(relative)||relative.startsWith('node_modules/'))continue;
    const text=await readFile(path.join(source,relative),'utf8');
    for(const match of text.matchAll(/(?:from\s*|import\s*\()\s*['"](\.[^'"]+)['"]/g)){
      const resolved=path.resolve(source,path.dirname(relative),match[1]);
      if(!resolved.startsWith(source+path.sep))throw new Error('Source import escapes project');
      const rel=path.relative(source,resolved).split(path.sep).join('/');
      if(!files.has(rel))await add(rel);
    }
  }
  for(const name of roots)await dependency(resolvePackage(name));
  const dependencies=Object.fromEntries(roots.map(name=>[name,lock.packages['node_modules/'+name].version]));
  const metadata={name:'beiqiang-unified-api',version:'1.0.0',private:true,type:'module',engines:{node:'>=24.22.1'},dependencies};
  await writeFile(path.join(output,'package.json'),JSON.stringify(metadata,null,2)+'\n');
  const minimalLock={name:metadata.name,version:metadata.version,lockfileVersion:3,requires:true,packages:{'':{name:metadata.name,version:metadata.version,dependencies,engines:metadata.engines},...Object.fromEntries(packages)}};
  await writeFile(path.join(output,'package-lock.json'),JSON.stringify(minimalLock,null,2)+'\n');
  files.add('package.json');files.add('package-lock.json');
  const manifest=[];let bytes=0;
  for(const relative of [...files].sort()){const contents=await readFile(path.join(output,relative));bytes+=contents.length;manifest.push(`${createHash('sha256').update(contents).digest('hex')}  ${relative}`);}
  await writeFile(path.join(output,'SHA256SUMS'),manifest.join('\n')+'\n');
  return {output,packages:packages.size,files:files.size,bytes,dependencies};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)console.log(JSON.stringify(await buildRelease({output:process.argv[2]})));
