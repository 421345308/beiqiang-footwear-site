import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { products } from '../app/data/products.ts';
import { productColours } from '../app/lib/product-colours.ts';

// Exercise the actual print markup with controlled shared-selection snapshots.
const source = fs.readFileSync(new URL('../app/components/StudioProductPrintSheet.tsx', import.meta.url), 'utf8')
  .replace('import { useProductColour } from "./ProductColourOptions";', 'const useProductColour = () => globalThis.__printColour;');
const compiled = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext } }).outputText
  .replaceAll('"react/jsx-runtime"', JSON.stringify(import.meta.resolve('react/jsx-runtime')))
  .replace(/"(\.\.\/[^"\n]+)"/g, (_, path) => JSON.stringify(new URL(`../app/components/${path}.ts`, import.meta.url).href));
const { default: Sheet } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const product = products.find(p => p.code === 'BQ003');
function render(colour, locale = 'en', item = product) {
  globalThis.__printColour = { id: colour?.id || '', colour };
  return renderToStaticMarkup(React.createElement(Sheet, { product: item, name: 'Test style', description: 'Style description', upper: 'Mesh', sole: 'EVA', external: false, url: 'https://example.com/products/style/', locale }));
}

test('print sheet follows selected colour, changes photographs, and restores unselected SSR content', () => {
  const initial = render(undefined);
  assert.ok(initial.includes(product.images[0]));
  assert.ok(initial.includes(product.colors.join(' · ')));
  for (const colour of productColours(product)) {
    const html = render(colour);
    assert.ok(html.includes(product.images[colour.imageIndex]));
    assert.ok(html.includes(`<dd>${colour.name}</dd>`));
    assert.ok(html.includes(`?colour=${colour.id}`));
    assert.ok(!html.includes(`<dd>${product.colors.join(' · ')}</dd>`));
  }
  assert.equal(render(undefined), initial);
  assert.ok(render(productColours(product)[0], 'zh').includes('配色'));
});

test('a missing individual photograph never passes off the default shoe as the selected colour', () => {
  const html = render({id:'unpictured', name:'Unpictured', imageIndex:null}, 'en', {...product, code:'NO-MEDIA'});
  assert.ok(html.includes('No individual photo for this colour.'));
  assert.ok(html.includes('<dd>Unpictured</dd>'));
  assert.ok(!html.includes('<img'));
});
