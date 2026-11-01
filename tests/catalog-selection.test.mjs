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

test('EU paired ranges include intermediate and final labels without asserting individual availability',()=>{
 const product=products.find(p=>p.code==='BQ1045');
 assert.deepEqual(documentedSizes(product),[36,37,38,39,40,41,42,43,44,45]);
 for(const size of ['36','38','40','42','44','45']){
  assert.equal(filterCatalog(products,{...defaultSelection,q:'BQ1045',size})[0]?.code,'BQ1045');
 }
 for(const size of ['35','46']) assert.deepEqual(filterCatalog(products,{...defaultSelection,q:'BQ1045',size}),[]);
 for(const code of ['BQ-C2627','BQ-CA67']) {
  assert.deepEqual(documentedSizes(products.find(p=>p.code===code)),[]);
  assert.deepEqual(filterCatalog(products,{...defaultSelection,q:code,size:'40'}),[]);
 }
});

test('EU size parsing requires a complete, bounded range with coherent paired endpoints',()=>{
 const withSize=size=>({...products[0],size});
 assert.deepEqual(documentedSizes(withSize('EU 39–45')),[39,40,41,42,43,44,45]);
 assert.deepEqual(documentedSizes(withSize('EU 36-37–46-47')),Array.from({length:12},(_,i)=>36+i));
 for(const size of ['36–45','EU 45–39','EU 19–40','EU 39–56','EU 36-38–44-45','EU 36-37–43-44','EU 36-37–44-','EU 36–45 extra']) {
  assert.deepEqual(documentedSizes(withSize(size)),[],size);
 }
});
