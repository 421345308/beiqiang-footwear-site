import { sheets } from './europe-line-sheet-data.mjs';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { products } from '../app/data/products.ts';
import { europeLocales } from '../app/data/europe-copy.ts';

const root = resolve(import.meta.dirname, '..');
await mkdir(resolve(root,'tmp/pdfs'), {recursive:true});

const dataPath=resolve(root,'tmp/pdfs/europe-line-sheets.json');
await writeFile(dataPath,JSON.stringify(sheets,null,2));
const home=process.env.USERPROFILE || process.env.HOME || '';
const candidates=[process.env.BEIQIANG_PYTHON,resolve(home,'.cache/codex-runtimes/codex-primary-runtime/dependencies/python',process.platform==='win32'?'python.exe':'bin/python'),'python3','python'].filter(Boolean);
const python=candidates.find(binary=>spawnSync(binary,['-c','import reportlab'],{stdio:'ignore'}).status===0);
if(!python) throw new Error('ReportLab is required. Set BEIQIANG_PYTHON to its Python runtime.');
const result=spawnSync(python,[resolve(root,'scripts/generate-europe-line-sheets.py'),dataPath],{cwd:root,stdio:'inherit'});
if(result.error) throw result.error;
if(result.status!==0) process.exit(result.status || 1);
const manifest={productCount:products.length,pageCount:Math.ceil(products.length/4)+2,translationDataSha256:createHash('sha256').update(JSON.stringify(sheets)).digest('hex'),files:{}};
for(const locale of europeLocales){
  const name=`beiqiang-footwear-line-sheet-${locale}-2026.pdf`;
  const bytes=await readFile(resolve(root,'public/downloads',name));
  manifest.files[locale]={name,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};
}
await writeFile(resolve(root,'app/data/europe-line-sheet-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
