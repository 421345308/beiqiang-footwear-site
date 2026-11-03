import { productFact } from "../app/data/europe-products.ts";
import test from 'node:test';
import assert from 'node:assert/strict';
import { products } from '../app/data/products.ts';
import { ADDITIONAL_PRODUCT_CODES } from '../app/data/published-product-codes.ts';
import { productPresentation } from '../app/lib/product-presentation.ts';
import { pageAlternates, productPageRoutes, publicLocales } from '../app/lib/public-locales.ts';
import { buildQuoteListShareUrl, parseSharedQuoteCodes, mergeSharedQuoteList } from '../app/lib/quote-list-share.ts';
import { validateInquiry } from '../edgeone-deploy/cloud-functions/api/inquiries.js';
import { SITE_RELEASE } from '../app/data/site-release.ts';
import { discoveryGroups, diverseProductPreview } from '../app/data/product-discovery.ts';
import { productsInCollection } from '../app/data/products.ts';
import { getProductBuyingGuide, getRelatedProducts } from '../app/lib/product-buying-guide.ts';
import { factZh } from '../app/data/products-zh.ts';

test('moulded and mule styles preserve source size labels and construction boundaries', () => {
  const clog=products.find(p=>p.code==='BQ-C2627');
  const covered=products.find(p=>p.code==='BQ-CA67');
  const mule=products.find(p=>p.code==='BQ-M858');
  assert.equal(clog.size.split(' / ').length,3);
  assert.equal(covered.size.split(' / ').length,5);
  assert.equal(covered.closure,'Slip-On');
  assert.match(covered.shortDescription,/not adjustable lacing/);
  assert.match(getProductBuyingGuide(clog).shape,/one size option/);
  assert.match(getProductBuyingGuide(mule).shape,/do not establish material composition/);
  assert.ok([clog,covered].every(p => productsInCollection('clogs-and-vented-shoes').includes(p)));
  assert.deepEqual(productsInCollection('mule-shoes').map(p=>p.code),[mule.code]);
  assert.ok(getRelatedProducts(mule,products).every(p => p.collections.some(c => ['clogs-and-vented-shoes','mule-shoes'].includes(c))));
  for(const p of [clog,covered,mule]) {
    assert.equal(p.sole,'');
    assert.doesNotMatch(p.size,/EU|US|UK/);
    for(const fact of [p.sizeNote,p.upper,...p.highlights,...p.confirmBeforeQuote]) assert.match(factZh(fact),/[\u4e00-\u9fff]/);
  }
});

test('homepage categories use the same inventory as landing pages and representative photos belong to that range', () => {
  const groups = discoveryGroups(products);
  const preview = diverseProductPreview(products);
  assert.equal(new Set(preview.map(p => p.code)).size, preview.length);
  assert.ok(preview.length <= groups.length);
  for (const group of groups) {
    assert.deepEqual(group.products.map(p => p.code), productsInCollection(group.slug).map(p => p.code));
    assert.ok(group.products.some(p => p.slug === group.cover), group.slug);
    assert.ok(preview.some(p => group.products.includes(p)), `Missing range: ${group.slug}`);
  }
  assert.deepEqual(diverseProductPreview([]), []);
  assert.deepEqual(diverseProductPreview(products, 0), []);
});

test('published product identity survives quote sharing and inquiry validation', () => {
  for (const code of ADDITIONAL_PRODUCT_CODES) {
    const product=products.find(p=>p.code===code);
    const url=new URL(buildQuoteListShareUrl([code,'BQ001'], 'zh'));
    const parsed=parseSharedQuoteCodes(url.searchParams.get('shortlist'),products.map(p=>p.code));
    assert.deepEqual(parsed,[code,'BQ001']);
    assert.equal(mergeSharedQuoteList([],parsed,products).lines[0].code,code);
    const result=validateInquiry({name:'Website QA',company:'Example Imports',buyerType:'Importer / wholesaler',market:'United States',quantity:'300 pairs',email:'qa@example.com',requirements:'Please discuss samples for the specified style.',consent:true,styleCode:code,styleLabel:product.name,context:'product',page:`/zh/products/${product.slug}/`,formStartedAt:Date.now()-5000});
    assert.equal(result.error,undefined,JSON.stringify(result));
    assert.equal(result.inquiry.styleCode,code);
  }
  assert.deepEqual(parseSharedQuoteCodes('BQ-LQ999,BQ061,BQ-LQ059',products.map(p=>p.code)),['BQ-LQ059']);
});

test('BQ001 and BQ002 sizes match current product data in every presentation', () => {
  for (const code of ['BQ001','BQ002']) assert.equal(products.find(p=>p.code===code).size,'EU 36-45');
  const item=products.find(p=>p.code==='BQ001');
  for (const locale of publicLocales) {
    const value=productPresentation(item,locale.id);
    assert.ok(value.summary.includes('EU 36–45'));
    assert.ok(value.highlights.some(line=>line.includes('EU 36–45')));
    assert.doesNotMatch(JSON.stringify(value),/36[–-]46/);
  }
});

test('published locale registry emits matching canonical and reciprocal product routes',()=>{
  assert.equal(SITE_RELEASE.productCount,products.length);
  const routes=productPageRoutes(products.map(p=>p.slug));
  assert.equal(routes.length,products.length*publicLocales.length);
  assert.equal(new Set(routes.map(r=>r.pathname)).size,routes.length);
  for (const product of products) for(const locale of publicLocales) {
    const alt=pageAlternates(`/products/${product.slug}`,locale.id);
    assert.equal(alt.canonical,alt.languages[locale.hreflang]);
    assert.equal(alt.languages['x-default'],alt.languages.en);
  }
});

test('product pages use one customer-facing presentation without disclosing internal supply categories',async()=>{
  const {default:worker}=await import('../dist/server/index.js');
  for (const code of ADDITIONAL_PRODUCT_CODES) for (const locale of publicLocales) {
    const product=products.find(p=>p.code===code);
    const path=`${locale.prefix}/products/${product.slug}`;
    const response=await worker.fetch(new Request(`https://www.beiqiang.online${path}`),{ASSETS:{fetch:async()=>new Response('',{status:404})}},{waitUntil(){}});
    assert.equal(response.status,200);
    const html=await response.text();
    const schemas=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
    const schema=schemas.find(s=>s['@type']==='Product');
    assert.equal(schema.sku,code);
    assert.equal(schema.manufacturer,undefined);
    assert.equal(schema.offers,undefined);
    assert.doesNotMatch(html,/Supplier-sourced|manufacturing partner|贝强自有工厂鞋款|对接供应商供货|Modell aus der Beiqiang-Fertigung|Modèle fabriqué par Beiqiang|Modelo de fabricación Beiqiang/i);
    if (product.sole) assert.ok(html.includes(product.sole) || (["de", "fr", "es"].includes(locale.id) && html.includes(productFact(product.sole, locale.id))) || /橡胶|EVA|PVC|PU|TPR/.test(html));
    assert.match(html,/product-print-sheet/);
    assert.match(html,new RegExp(`href="https://www.beiqiang.online${path}/"`));
    assert.ok(schemas.some(s=>s['@type']==='BreadcrumbList'));
  }
});
