import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { products } from '../app/data/products.ts';
import { productPresentation, productOrderCopy } from '../app/lib/product-presentation.ts';
import { productShareCopy } from '../app/lib/product-share-copy.ts';
import { publicLocales } from '../app/lib/public-locales.ts';

test('three comparison styles have distinct, complete five-language buying summaries with accurate boundaries', () => {
  for (const {id} of publicLocales) {
    const entries = ['BQ008','BQ009','BQ031'].map(code => productPresentation(products.find(p=>p.code===code),id));
    assert.equal(new Set(entries.map(p=>p.summary)).size,3);
    for (const entry of entries) {
      assert.equal(entry.highlights.length,3);
      assert.doesNotMatch(JSON.stringify(entry),/hero direction|trunk|verified product-level|reviewed color|in stock|MOQ|\$/i);
    }
    assert.doesNotMatch(JSON.stringify(entries[0]),/EVA/);
    assert.doesNotMatch(JSON.stringify(entries[1]),/EVA/);
    assert.match(entries[1].summary,/35–45/);
    assert.match(entries[2].summary,/38–47/);
    assert.ok(productOrderCopy[id].text.length>50);
  }
  for (const code of ['BQ001','BQ003','BQ-LQ2597','BQ-C2627']) {
    for (const {id} of publicLocales) {
      const presentation = productPresentation(products.find(p=>p.code===code),id);
      assert.ok(presentation?.summary && presentation.highlights.length >= 2, `${code} ${id}`);
    }
  }
});

const source=fs.readFileSync(new URL('../app/components/ProductShareActions.tsx',import.meta.url),'utf8')
  .replace('import { useProductColour } from "./ProductColourOptions";', 'const useProductColour = () => ({id: globalThis.__shareColour});')
  .replace('import { trackEvent } from "../lib/tracking";', 'const trackEvent = () => {};');
const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext}}).outputText
  .replaceAll('"react/jsx-runtime"',JSON.stringify(import.meta.resolve('react/jsx-runtime')))
  .replaceAll('"react"',JSON.stringify(import.meta.resolve('react')))
  .replace(/"(\.\.\/[^"\n]+)"/g,(_,path)=>JSON.stringify(new URL(`../app/components/${path}.ts`,import.meta.url).href));
const {default:Share}=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
test('five-language share markup sends the actual selected-colour URL through email and WhatsApp',()=>{
  const product=products.find(p=>p.code==='BQ009');
  for(const {id:locale} of publicLocales) {
    globalThis.__shareColour='orange';
    const url=`https://www.beiqiang.online/${locale}/products/bq009/`;
    const html=renderToStaticMarkup(React.createElement(Share,{product,code:product.code,name:product.name,url,locale}));
    assert.ok(html.includes(productShareCopy[locale].copy));
    const links=[...html.matchAll(/href="([^"]+)"/g)].map(m=>decodeURIComponent(m[1].replaceAll('&amp;','&')));
    assert.equal(links.length,2);
    for(const link of links) assert.ok(link.includes(`${url}?colour=orange`),link);
    globalThis.__shareColour='';
    const initial=renderToStaticMarkup(React.createElement(Share,{product,code:product.code,name:product.name,url,locale}));
    assert.ok(!decodeURIComponent(initial).includes('?colour='));
  }
});
