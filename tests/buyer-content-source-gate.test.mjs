import test from 'node:test';
import assert from 'node:assert/strict';
import { products, heldSourceProducts, productsInCollection } from '../app/data/products.ts';
import { FACTORY_SOURCE_CODES } from '../app/data/factory-source-codes.ts';
import { FINDER_STYLE_CODES } from '../edgeone-deploy/cloud-functions/api/catalog-style-codes.js';
import { readFile } from 'node:fs/promises';

async function render(path) {
  const { default: worker } = await import('../dist/server/index.js');
  return worker.fetch(new Request(`https://www.beiqiang.online${path}`), { ASSETS: { fetch: async () => new Response('', {status:404}) } }, {waitUntil(){}});
}

test('public supply matches the reviewed raw-package register, not image folders', () => {
  assert.equal(products.length, 31);
  assert.equal(heldSourceProducts.length, 25);
  assert.deepEqual(new Set(products.map(p => p.code)), FACTORY_SOURCE_CODES);
  assert.deepEqual(FINDER_STYLE_CODES, FACTORY_SOURCE_CODES);
  for (const held of heldSourceProducts) assert.ok(!FACTORY_SOURCE_CODES.has(held.code));
  assert.deepEqual(productsInCollection('extended-size-shoes').map(p=>p.code), ['BQ001','BQ002','BQ031']);
  assert.deepEqual(productsInCollection('fleece-lined-shoes').map(p=>p.code), ['BQ006','BQ015']);
});

test('held source pages return 404 and are absent from sitemap, catalogue and machine summary', async () => {
  for (const path of ['/products/bq032','/zh/products/bq061']) assert.equal((await render(path)).status,404,path);
  const text = (await (await render('/sitemap.xml')).text()) + (await (await render('/products')).text()) + await readFile(new URL('../public/llms.txt',import.meta.url),'utf8');
  for (const held of heldSourceProducts) assert.ok(!text.includes(`/products/${held.slug}/`),held.code);
});

test('both homepages render buyer paths and copy without JavaScript or internal workflow jargon', async () => {
  for (const prefix of ['', '/zh']) {
    const response=await render(prefix || '/'); assert.equal(response.status,200);
    const html=await response.text();
    for (const slug of ['wholesale-walking-shoes','private-label-walking-shoes','oem-knit-shoes']) assert.ok(html.includes(`href="${prefix}/solutions/${slug}/"`));
    assert.ok(html.includes(`href="${prefix}/request-quote/"`));
    assert.ok(html.indexOf('id="solutions"') < html.indexOf('id="collections"'));
    assert.doesNotMatch(html, /56-style|56款|受控决定|商业起点|工厂端项目审核|buyer workspace: it introduces/i);
  }
});
