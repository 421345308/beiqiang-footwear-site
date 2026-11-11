import test from 'node:test';
import assert from 'node:assert/strict';
import { products } from '../app/data/products.ts';
import { LINE_SHEET_CODES, selectLineSheetProducts } from '../app/data/line-sheet-selection.ts';
import { productPresentation } from '../app/lib/product-presentation.ts';
import { productColours } from '../app/lib/product-colours.ts';

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
  assert.equal(products.length,152);
});
