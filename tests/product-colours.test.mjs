import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {products} from '../app/data/products.ts';
import media from '../app/data/product-colour-media.json' with {type:'json'};
import {productColours,colourImage,colourViews,galleryImage,withColour} from '../app/lib/product-colours.ts';
import labels from '../app/data/product-photo-labels.json' with {type:'json'};
import {addProductToQuote,readQuoteList,saveQuoteList} from '../app/lib/quote-list.ts';

test('every mapped colour belongs to its own product and resolves to a reviewed existing photograph',()=>{
  for (const p of products) {
    assert.ok(media[p.code],p.code);
    for (const [name,index] of Object.entries(media[p.code].images)) {
      assert.ok(p.colors.includes(name),`${p.code}: ${name}`);
      assert.ok(Number.isInteger(index) && p.images[index],`${p.code}: ${index}`);
      assert.ok(fs.existsSync(`public${galleryImage(p.images[index],true).split('?')[0]}`),`${p.code}: small image`);
    }
    assert.equal(new Set(productColours(p).map(c=>c.id)).size,p.colors.length);
    assert.equal(colourImage(p,''),0);
  }
  const mule=products.find(p=>p.code==='BQ-M858');
  assert.equal(productColours(mule).find(c=>c.id==='sand').imageIndex,1);
  assert.equal(colourImage(mule,'sand'),1);
  const uncertain=products.find(p=>p.code==='BQ019');
  assert.equal(productColours(uncertain).some(c=>c.id==='cream'),false);
  assert.ok(!uncertain.colors.includes('Cream'));
  const lace=products.find(p=>p.code==='BQ003');
  assert.equal(colourImage(lace,'pink'),2);
  assert.equal(withColour('/zh/products/bq003/#inquiry','pink'),'/zh/products/bq003/?colour=pink#inquiry');
});

test('adding colours merges one style without overwriting quantity, sizes, notes or existing requests',()=>{
  const old={window:globalThis.window,localStorage:globalThis.localStorage,sessionStorage:globalThis.sessionStorage};
  const memory=new Map();
  const storage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)};
  globalThis.window={dispatchEvent(){}}; globalThis.localStorage=storage; globalThis.sessionStorage=storage;
  try {
    const p=products.find(p=>p.code==='BQ003');
    assert.equal(addProductToQuote(p,'Pink'),true);
    const lines=readQuoteList(); lines[0].quantity='300'; lines[0].sizes='38, 39'; lines[0].notes='Logo sample'; saveQuoteList(lines);
    assert.equal(addProductToQuote(p,'Grey'),false);
    addProductToQuote(p,'Pink'); addProductToQuote(p,'Imaginary blue');
    const [line]=readQuoteList();
    assert.equal(readQuoteList().length,1);
    assert.equal(line.colors,'Pink, Grey');
    assert.equal(line.quantity,'300'); assert.equal(line.sizes,'38, 39'); assert.equal(line.notes,'Logo sample');
    assert.equal(line.image,'/catalog-web/bq003/02_grey.webp?v=20261025-colour-galleries');
    storage.setItem('bq-colour-BQ007','orange');
    addProductToQuote(products.find(p=>p.code==='BQ007'));
    assert.equal(readQuoteList()[1].colors,'Orange');
  } finally {
    for(const [k,v] of Object.entries(old)) { if(v===undefined) delete globalThis[k]; else globalThis[k]=v; }
  }
});

test('selected-colour galleries never borrow a detail photograph from another colour',()=>{
  for (const product of products) for (const colour of productColours(product)) {
    const views = colourViews(product, colour.id);
    assert.ok(views.includes(colour.imageIndex));
    assert.equal(new Set(views).size, views.length);
    for (const index of views) assert.equal(labels[product.code][index].colour,colour.name,`${product.code} ${colour.name} ${index}`);
  }
  const product=products.find(p=>p.code==='BQ018');
  const purple=colourViews(product,'lavender');
  assert.ok(purple.length>=6);
  assert.ok(purple.some(i=>labels.BQ018[i].role==='outsole'));
  assert.ok(purple.some(i=>labels.BQ018[i].role==='top'));
  assert.ok(colourViews(product,'all-black').every(i=>!purple.includes(i)));
});
