import test from 'node:test';
import assert from 'node:assert/strict';
import { products } from '../app/data/products.ts';
import { LINE_SHEET_CODES, isInPrintPhotoSnapshot, selectLineSheetProducts } from '../app/data/line-sheet-selection.ts';
import { productPresentation } from '../app/lib/product-presentation.ts';
import { productColours } from '../app/lib/product-colours.ts';
import { productCount } from '../app/data/catalog-meta.ts';
import { buildQuoteListShareUrl, parseSharedQuoteCodes } from '../app/lib/quote-list-share.ts';
import { validateInquiry } from '../edgeone-deploy/cloud-functions/api/inquiries.js';
import { buyerFitZh } from '../app/data/products-zh.ts';

const cases = [
  ['BQ-LQ02507','1601973978339',['Brown','Blue']],
  ['BQ-LQ02508','1601973995230',['Brown','Blue']],
  ['BQ-LQ2559','1601975753865',['Black','Khaki']],
];

test('three existing Alibaba styles are distinct website products with colour-aware galleries and five languages', () => {
  for (const [code,id,colours] of cases) {
    const product=products.find(p=>p.code===code);
    assert.ok(product,code);
    assert.equal(product.alibabaProductId,id);
    assert.deepEqual(product.colors,colours);
    assert.equal(product.size,'EU 39–48');
    assert.equal(product.upper,'');
    assert.equal(product.sole,'');
    assert.equal(product.images.length,4);
    assert.equal(new Set(product.images).size,4);
    assert.ok(LINE_SHEET_CODES.has(code), `${code} must be included in the website PDF`);
    assert.ok(!isInPrintPhotoSnapshot(code), `${code} keeps its existing print-photo scope`);
    for (const colour of productColours(product)) {
      assert.notEqual(colour.imageIndex,null,`${code} ${colour.name}`);
      assert.ok(product.images[colour.imageIndex]);
    }
    for (const locale of ['en','zh','de','fr','es']) {
      const copy=productPresentation(product,locale);
      assert.ok(copy?.summary && copy.highlights.length>=2,`${code} ${locale}`);
      assert.doesNotMatch(copy.summary,/in stock|waterproof|certified/i);
    }
  }
  assert.equal(selectLineSheetProducts(products).length,162);
  assert.equal(products.length,productCount);
});

test('two more existing Alibaba styles retain exact size labels and their own colour photos', () => {
  for (const [code,id,colours,size] of [
    ['BQ-LQ061','1601972965417',['Beige','Black','Tan'],'EU 36–48'],
    ['BQ-W5998','1601969869242',['Beige','Camel'],'35–45'],
  ]) {
    const product=products.find(p=>p.code===code);
    assert.ok(product,code);
    assert.equal(product.alibabaProductId,id);
    assert.deepEqual(product.colors,colours);
    assert.equal(product.size,size);
    assert.equal(product.upper,'');
    assert.equal(product.sole,'');
    assert.equal(product.images.length,4);
    assert.ok(LINE_SHEET_CODES.has(code), `${code} must be included in the website PDF`);
    assert.ok(!isInPrintPhotoSnapshot(code), `${code} keeps its existing print-photo scope`);
    for (const colour of productColours(product)) {
      assert.notEqual(colour.imageIndex,null,`${code} ${colour.name}`);
      assert.ok(product.images[colour.imageIndex]);
    }
    for (const locale of ['en','zh','de','fr','es']) {
      const copy=productPresentation(product,locale);
      assert.ok(copy?.summary && copy.highlights.length>=2,`${code} ${locale}`);
      assert.doesNotMatch(copy.summary,/in stock|waterproof|certified/i);
    }
  }
});

test('website-only styles retain their identity through quote sharing and inquiry validation', () => {
  const codes=['BQ-LQ02507','BQ-LQ02508','BQ-LQ2559','BQ-LQ061','BQ-W5998','BQ1021','BQ-LQ2633','BQ-LQ2598','BQ1013','BQ-LQ2588-1'];
  const shared=new URL(buildQuoteListShareUrl(codes,'zh'));
  assert.deepEqual(parseSharedQuoteCodes(shared.searchParams.get('shortlist'),products.map(p=>p.code)),codes);
  for (const code of codes) {
    const product=products.find(p=>p.code===code);
    const result=validateInquiry({name:'Website QA',company:'Example Imports',buyerType:'Importer / wholesaler',market:'United States',quantity:'300 pairs',email:'qa@example.com',requirements:'Please discuss samples for this style.',consent:true,styleCode:code,styleLabel:product.name,context:'product',page:`/zh/products/${product.slug}/`,formStartedAt:Date.now()-5000});
    assert.equal(result.error,undefined,code);
    assert.equal(result.inquiry.styleCode,code);
  }
});


test('BQ1003 uses the documented four colour options and flags the larger size measurements',()=>{
 const item=products.find(p=>p.code==='BQ1003');
 assert.equal(item.closure,'Slip-On');
 assert.deepEqual(item.colors,['Black','Grey','Blue','Red']);
 assert.equal(item.size,'EU 38–50');
 assert.match(item.sizeNote,/47–50/);
 assert.equal(item.upper,'');
 assert.equal(item.sole,'');
});


test('Mary Jane and toggle styles retain source identity, colours, closure and five-language copy',()=>{
 for(const [code,id,closure,colors,size] of [['BQ1021','1601943593293','Hook & Loop',['Beige','Black'],'EU 36–42'],['BQ-LQ2633','1601973753470','Toggle',['Off White','Black','Light Grey'],'EU 39–48']]) {
  const p=products.find(x=>x.code===code);assert.ok(p);assert.equal(p.alibabaProductId,id);assert.equal(p.closure,closure);assert.deepEqual(p.colors,colors);assert.equal(p.size,size);assert.equal(p.sole,'');assert.equal(p.images.length,4);
  assert.ok(LINE_SHEET_CODES.has(code));assert.ok(!isInPrintPhotoSnapshot(code));
  for(const c of productColours(p)) assert.notEqual(c.imageIndex,null);
  for(const l of ['en','zh','de','fr','es']) { const x=productPresentation(p,l);assert.ok(x?.summary && x.highlights.length>=2);assert.doesNotMatch(x.summary,/in stock|waterproof|certified/i); }
 }
});


test('BQ-LQ2598 retains its source colour options and lace-up construction',()=>{
 const p=products.find(x=>x.code==='BQ-LQ2598');assert.ok(p);assert.equal(p.alibabaProductId,'1601973831465');assert.equal(p.closure,'Lace-Up');assert.deepEqual(p.colors,['White','Black','Khaki']);assert.equal(p.size,'EU 39–48');assert.equal(p.fitEvidence,'wide_toe_verified');assert.equal(p.images.length,4);assert.ok(LINE_SHEET_CODES.has(p.code));assert.ok(!isInPrintPhotoSnapshot(p.code));
 for(const c of productColours(p)) assert.notEqual(c.imageIndex,null);
 for(const l of ['en','zh','de','fr','es']) assert.ok(productPresentation(p,l)?.summary);
});

test('Chinese buyer labels distinguish women’s and men’s styles',()=>{
 const women=products.find(p=>p.code==='BQ1021');const men=products.find(p=>p.code==='BQ1003');
 assert.match(buyerFitZh(women),/女鞋/);assert.doesNotMatch(buyerFitZh(women),/男士/);
 assert.match(buyerFitZh(men),/男士/);
});


test('BQ1013 and BQ-LQ2588-1 retain source identities, colour images and size-label boundaries',()=>{
 for(const [code,id,closure,colors,size] of [['BQ1013','1601943542214','Slip-On',['Sand','Wine Red','Black'],'36–48'],['BQ-LQ2588-1','1601973772709','Lace-Up',['White','Black/White','All Black'],'EU 39–47']]) {
  const p=products.find(x=>x.code===code);assert.ok(p);assert.equal(p.alibabaProductId,id);assert.equal(p.closure,closure);assert.deepEqual(p.colors,colors);assert.equal(p.size,size);assert.equal(p.upper,'');assert.equal(p.sole,'');assert.equal(p.images.length,4);assert.ok(LINE_SHEET_CODES.has(code));
  for(const c of productColours(p)) assert.notEqual(c.imageIndex,null);
  for(const l of ['en','zh','de','fr','es']) assert.ok(productPresentation(p,l)?.summary);
 }
 assert.match(products.find(x=>x.code==='BQ1013').sizeNote,/Supplier size labels/);
 assert.equal(products.find(x=>x.code==='BQ-LQ2588-1').fitEvidence,'wide_toe_verified');
});
