import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {buildRelease} from '../self-hosted/deploy/build-release.mjs';
const deploy=new URL('../self-hosted/deploy/',import.meta.url);
const read=name=>readFileSync(new URL(name,deploy),'utf8');
test('dedicated API is non-root and constrained to persistent files',()=>{
  const unit=read('beiqiang-api.service');
  assert.match(unit,/User=beiqiang-api/);
  assert.match(unit,/ReadWritePaths=\/var\/lib\/beiqiang\/files/);
  assert.match(unit,/KillMode=control-group/);
  assert.match(unit,/MemoryMax=256M/);
});
test('gateway owns only independent TLS listener and explicit loopback upstream',()=>{
  const config=read('nginx.conf');
  assert.deepEqual([...config.matchAll(/listen\s+([^;]+);/g)].map(m=>m[1]),['8443 ssl']);
  assert.match(config,/proxy_pass http:\/\/127\.0\.0\.1:8787/);
  assert.match(read('beiqiang-gateway.service'),/-c \/etc\/beiqiang\/nginx.conf/);
});
test('every nginx temporary directory stays in its existing private writable tree',()=>{
  const config=read('nginx.conf'),setup=read('prepare-host.sh');
  for(const [directive,directory] of Object.entries({client_body:'body',proxy:'proxy',fastcgi:'fastcgi',uwsgi:'uwsgi',scgi:'scgi'})){
    const target=`/var/lib/beiqiang/gateway/${directory}`;
    assert.match(config,new RegExp(`${directive}_temp_path ${target};`));
    assert.ok(setup.includes(target));
  }
  assert.match(setup,/-o www-data -g www-data -m 0700/);
  assert.match(read('beiqiang-gateway.service'),/ReadWritePaths=\/var\/lib\/beiqiang\/gateway \/var\/log\/beiqiang/);
  assert.match(read('beiqiang-gateway.service'),/ProtectSystem=strict/);
});
test('backup is quiesced, hashed, and restore uses an isolated database',()=>{
  assert.match(read('backup.sh'),/systemctl stop beiqiang-runner.service beiqiang-api.service/);
  assert.match(read('backup.sh'),/pg_dump -p 5433 -Fc/);
  assert.match(read('backup.sh'),/sha256sum/);
  assert.match(read('restore-check.sh'),/beiqiang_restore_/);
  assert.match(read('restore-check.sh'),/sha256sum -c SHA256SUMS/);
  assert.match(read('restore-check.sh'),/Unsafe archive member/);
});
test('new release permissions permit the service user to read immutable code',()=>{
  assert.match(read('release.sh'),/-type d -exec chmod 0755/);
  assert.match(read('release.sh'),/-type f -exec chmod 0644/);
  assert.match(read('release.sh'),/Release contains symlinks/);
});
test('PostgreSQL listen address passes plain localhost without manual quote escaping',t=>{
  const bash=process.platform==='win32'?'C:/Program Files/Git/bin/bash.exe':'bash';
  const available=spawnSync(bash,['--version'],{encoding:'utf8',timeout:5000});
  if(available.status!==0){t.skip('bash unavailable');return;}
  const command=read('prepare-host.sh').split(/\r?\n/).find(line=>line.startsWith('pg_conftool 16 beiqiang set listen_addresses '));
  assert.ok(command);
  const result=spawnSync(bash,['-c',`pg_conftool() { printf '%s\\n' "$@"; }; ${command}`],{encoding:'utf8',timeout:5000});
  assert.equal(result.status,0,result.stderr);
  assert.deepEqual(result.stdout.trim().split('\n'),['16','beiqiang','set','listen_addresses','localhost']);
  // PostgreSQL numeric values may carry unit suffixes without string quoting.
  for(const name of ['shared_buffers','work_mem','maintenance_work_mem'])assert.match(read('prepare-host.sh'),new RegExp(`set ${name} [0-9]+MB(?:\\n|$)`));
});
test('scripts never restart proxy, alter firewall, or delete original data',()=>{
  for(const name of readdirSync(deploy).filter(n=>n.endsWith('.sh'))){
    const source=read(name);
    assert.doesNotMatch(source,/\b(?:iptables|nft|reboot|rm\s+-rf)\b/);
    assert.doesNotMatch(source,/systemctl\s+(?:stop|restart)\s+(?:sing-box|nginx)(?:\s|$)/);
  }
});
test('all deployment shell scripts parse with bash',t=>{
  const candidates=process.platform==='win32'?['C:/Program Files/Git/bin/bash.exe']:['bash'];
  const bash=candidates.find(path=>spawnSync(path,['--version'],{encoding:'utf8',timeout:5000}).status===0);
  if(!bash){t.skip('bash unavailable');return;}
  for(const name of readdirSync(deploy).filter(n=>n.endsWith('.sh'))){
    const result=spawnSync(bash,['-n',fileURLToPath(new URL(name,deploy))],{encoding:'utf8',timeout:10000});
    assert.equal(result.status,0,`${name}: ${result.stderr}`);
  }
});
test('minimal production release follows locked runtime dependency closure',async()=>{
  const staging=await mkdtemp(path.join(tmpdir(),'beiqiang-release-'));
  try {
    const output=path.join(staging,'release');
    const result=await buildRelease({output});
    assert.deepEqual(Object.keys(result.dependencies).sort(),['@edgeone/pages-blob','nodemailer','pg']);
    assert.ok(result.packages<25);
    assert.ok(result.bytes<5_000_000);
    const manifest=await readFile(path.join(output,'SHA256SUMS'),'utf8');
    assert.match(manifest,/self-hosted\/server.mjs/);
    assert.match(manifest,/self-hosted\/schema.sql/);
    assert.match(manifest,/self-hosted\/deploy\/release.sh/);
    assert.doesNotMatch(manifest,/(?:\/\.local\/|\.private\.|node_modules\/(?:next|react)\/|\/(?:tests?|testing)\/|\/test\.js)/);
    const lock=JSON.parse(await readFile(path.join(output,'package-lock.json'),'utf8'));
    assert.equal(Object.keys(lock.packages).length,result.packages+1);
    await assert.rejects(buildRelease({output}),/already exists/);
  } finally {await rm(staging,{recursive:true,force:true});}
});
