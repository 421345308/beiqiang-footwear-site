import test from 'node:test';
import assert from 'node:assert/strict';
import { products, heldSourceProducts, productsInCollection } from '../app/data/products.ts';
import { PUBLISHED_PRODUCT_CODES, ADDITIONAL_PRODUCT_CODES } from '../app/data/published-product-codes.ts';
import { FINDER_STYLE_CODES } from '../edgeone-deploy/cloud-functions/api/catalog-style-codes.js';
import { readFile } from 'node:fs/promises';

async function render(path) {
  const { default: worker } = await import('../dist/server/index.js');
  return worker.fetch(new Request(`https://www.beiqiang.online${path}`), { ASSETS: { fetch: async () => new Response('', {status:404}) } }, {waitUntil(){}});
}

test('public products match the publication registry without exposing internal supply categories', () => {
  assert.ok(products.some(p => p.code === 'BQ-LQ032'));
  assert.equal(ADDITIONAL_PRODUCT_CODES.size, products.length - 31);
  assert.equal(heldSourceProducts.length, 25);
  assert.deepEqual(new Set(products.map(p => p.code)), PUBLISHED_PRODUCT_CODES);
  assert.deepEqual(FINDER_STYLE_CODES, PUBLISHED_PRODUCT_CODES);
  for (const held of heldSourceProducts) assert.ok(!PUBLISHED_PRODUCT_CODES.has(held.code));
  const extended = productsInCollection('extended-size-shoes').map(p=>p.code);
  for (const code of ['BQ031','BQ-LQ059','BQ-LQ060','BQ-LQ2597','BQ1031','BQ1067','BQ-LQ032']) assert.ok(extended.includes(code), code);
  assert.ok(!extended.includes('BQ-LQ2651'), 'unconfirmed size systems must not enter EU-size filtering');
  const fleece = productsInCollection('fleece-lined-shoes').map(p=>p.code);
  for (const code of ['BQ006','BQ015','BQ-LQ0323F','BQ-LQ2132','BQ-LQ2505','BQ-LQ2772']) assert.ok(fleece.includes(code), code);
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
    assert.ok(html.indexOf('class="studio-hero"') >= 0);
    assert.ok(html.indexOf('class="studio-hero"') < html.indexOf('id="collections"'));
    assert.doesNotMatch(html, /56-style|56款|受控决定|商业起点|工厂端项目审核|buyer workspace: it introduces/i);
  }
});
