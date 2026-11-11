import test from 'node:test';
import assert from 'node:assert/strict';
import { products } from '../app/data/products.ts';
import { LINE_SHEET_CODES, selectLineSheetProducts } from '../app/data/line-sheet-selection.ts';
import { productPresentation } from '../app/lib/product-presentation.ts';
import { productColours } from '../app/lib/product-colours.ts';
import { productCount } from '../app/data/catalog-meta.ts';
import { buildQuoteListShareUrl, parseSharedQuoteCodes } from '../app/lib/quote-list-share.ts';
import { validateInquiry } from '../edgeone-deploy/cloud-functions/api/inquiries.js';

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
    assert.ok(!LINE_SHEET_CODES.has(code),code);
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
  assert.equal(selectLineSheetProducts(products).length,149);
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
    assert.ok(!LINE_SHEET_CODES.has(code),code);
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
  const codes=['BQ-LQ02507','BQ-LQ02508','BQ-LQ2559','BQ-LQ061','BQ-W5998'];
  const shared=new URL(buildQuoteListShareUrl(codes,'zh'));
  assert.deepEqual(parseSharedQuoteCodes(shared.searchParams.get('shortlist'),products.map(p=>p.code)),codes);
  for (const code of codes) {
    const product=products.find(p=>p.code===code);
    const result=validateInquiry({name:'Website QA',company:'Example Imports',buyerType:'Importer / wholesaler',market:'United States',quantity:'300 pairs',email:'qa@example.com',requirements:'Please discuss samples for this style.',consent:true,styleCode:code,styleLabel:product.name,context:'product',page:`/zh/products/${product.slug}/`,formStartedAt:Date.now()-5000});
    assert.equal(result.error,undefined,code);
    assert.equal(result.inquiry.styleCode,code);
  }
});
