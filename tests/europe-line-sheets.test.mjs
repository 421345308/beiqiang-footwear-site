import { sheets } from '../scripts/europe-line-sheet-data.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { products } from '../app/data/products.ts';
test('all three translated catalogues match their published copies and actual product count',async()=>{
  const manifest=JSON.parse(await readFile(new URL('../app/data/europe-line-sheet-manifest.json',import.meta.url),'utf8'));
  assert.equal(manifest.productCount,products.length);assert.equal(manifest.pageCount,Math.ceil(products.length/4)+2);
  assert.equal(manifest.translationDataSha256,createHash('sha256').update(JSON.stringify(sheets)).digest('hex'),'Regenerate PDF catalogues when product facts or translations change');
  for(const locale of ['de','fr','es']){
    const entry=manifest.files[locale];const bytes=await readFile(new URL('../public/downloads/'+entry.name,import.meta.url));
    assert.equal(bytes.subarray(0,5).toString(),'%PDF-');assert.equal(createHash('sha256').update(bytes).digest('hex'),entry.sha256);

  }
});
