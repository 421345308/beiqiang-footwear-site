import test from 'node:test';
import assert from 'node:assert/strict';
import {products} from '../app/data/products.ts';
import {defaultSelection, parseSelection, selectionParams, filterCatalog, documentedSizes, matchingColour} from '../app/lib/catalog-selection.ts';
import {productColours} from '../app/lib/product-colours.ts';

test('catalog links restore valid filters, preserve attribution and reject unknown values',()=>{
 const input={...defaultSelection,q:'黑色 BQ',colour:'black',size:'40',closure:'Zip-Up',limit:24};
 const params=selectionParams(input,new URLSearchParams('utm_source=sample&compare=BQ001,BQ003'));
 assert.deepEqual(parseSelection(params),input);
 assert.equal(params.get('utm_source'),'sample');assert.equal(params.get('compare'),'BQ001,BQ003');
 assert.deepEqual(parseSelection(new URLSearchParams('direction=unknown&closure=Fake&colour=golden&size=999&show=-1&sort=popular')),defaultSelection);
 assert.equal(parseSelection(new URLSearchParams('q='+'a'.repeat(300))).q.length,80);
});
test('colour and size intersections return source-backed photo choices without inventing EU conversions',()=>{
 const selected=filterCatalog(products,{...defaultSelection,colour:'black',size:'40'});
 assert.ok(selected.length>0);
 for(const p of selected){assert.ok(documentedSizes(p).includes(40));assert.ok(productColours(p).some(c=>c.id===matchingColour(p,'black')&&/black/i.test(c.name)));}
 assert.deepEqual(documentedSizes(products.find(p=>p.code==='BQ-C2627')),[]);
 assert.deepEqual(filterCatalog(products,{...defaultSelection,q:'BQ018',colour:'blue'}),[]);
 assert.equal(filterCatalog(products,{...defaultSelection,q:'BQ018 薰衣草紫'})[0].code,'BQ018');
 assert.ok(filterCatalog(products,{...defaultSelection,closure:'Zip-Up'}).length>0);
});
test('public products and order-facing models use only their current Beiqiang identity',()=>{
 for (const product of products) {assert.equal(product.sourceModel,product.code);assert.match(product.sourceModel,/^BQ/);}
});

test('a solid-colour photo takes precedence over a mixed-colour match',()=>{
 assert.equal(matchingColour(products.find(p=>p.code==='BQ004'),'black'),'all-black');
});
