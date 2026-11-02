import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { products } from '../app/data/products.ts';
import { productColours, galleryImage } from '../app/lib/product-colours.ts';
import { localizedInquiryPayload } from '../app/lib/europe-inquiry.ts';
import { EMPTY_QUOTE_REQUEST_DRAFT } from '../app/lib/quote-request-draft.ts';
import { buildQuoteListShareUrl, parseSharedQuoteSelection, mergeSharedQuoteList } from '../app/lib/quote-list-share.ts';
import { readQuoteList, saveQuoteList } from '../app/lib/quote-list.ts';

// Render and exercise the actual editor independently of the inquiry network form.
const source = fs.readFileSync(new URL('../app/components/EuropeInquiry.tsx', import.meta.url), 'utf8').split('export default function EuropeInquiry')[0];
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext } }).outputText
  .replaceAll('"react/jsx-runtime"', JSON.stringify(import.meta.resolve('react/jsx-runtime')))
  .replace(/"(\.\.\/[^"\n]+)"/g, (_, path) => JSON.stringify(new URL(`../app/components/${path}.ts`, import.meta.url).href));
const { editQuoteColours, QuoteColourEditor } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const product = products.find(p => p.code === 'BQ009');
const options = productColours(product);
const line = { code: product.code, slug: product.slug, sourceModel: product.sourceModel, name: product.name, image: '', colors: options[0].name, quantity: '120', sizes: 'EU 40, 41', notes: 'Mixed sizes per colour' };

test('colour edits preserve multiple selections and all other purchasing requirements', () => {
  const added = editQuoteColours(line, product, options[1].name, true);
  assert.equal(added.colors, `${options[0].name}, ${options[1].name}`);
  assert.equal(added.image, galleryImage(product.images[options[1].imageIndex]));
  assert.equal(editQuoteColours(added, product, options[1].name, true).colors, added.colors);
  const removed = editQuoteColours(added, product, options[0].name, false);
  assert.equal(removed.colors, options[1].name);
  for (const key of ['quantity', 'sizes', 'notes', 'code', 'sourceModel']) assert.equal(removed[key], line[key]);
  assert.equal(line.colors, options[0].name);
  assert.equal(editQuoteColours(line, product, 'No photograph', true), line);
  assert.equal(editQuoteColours(removed, product, '', false).colors, '');
  assert.equal(localizedInquiryPayload(EMPTY_QUOTE_REQUEST_DRAFT, [removed], 'fr').items[0].colors, options[1].name);
});

test('all three languages render labelled native multi-select checkboxes with only photographed colours', () => {
  const withMissing = { ...product, colors: [...product.colors, 'No photograph'] };
  for (const locale of ['de', 'fr', 'es']) {
    const html = renderToStaticMarkup(React.createElement(QuoteColourEditor, { line, product: withMissing, locale, onChange() {} }));
    assert.equal((html.match(/type="checkbox"/g) || []).length, options.length);
    assert.equal((html.match(/checked=""/g) || []).length, 1);
    assert.ok(html.includes('aria-describedby="quote-colours-help-BQ009"'));
    assert.ok(html.includes('<legend'));
    assert.ok(!html.includes('No photograph'));
    assert.ok(html.includes('min-height:48px'));
    assert.ok(html.includes('type="button"'));
  }
});

test('editor checkbox events produce the next genuine colour selection without replacing the line', () => {
  let changed;
  const tree = QuoteColourEditor({ line, product, locale: 'de', onChange(next) { changed = next; } });
  const labels = tree.props.children[2].props.children;
  labels[1].props.children[0].props.onChange({ target: { checked: true } });
  assert.equal(changed.colors, `${options[0].name}, ${options[1].name}`);
  assert.equal(changed.notes, line.notes);
});

test('edited mixed colours survive persistence and localized team sharing', () => {
  const changed = editQuoteColours(line, product, options[1].name, true);
  const storage = new Map();
  const oldWindow = globalThis.window;
  const oldStorage = globalThis.localStorage;
  globalThis.window = { dispatchEvent() {} };
  globalThis.localStorage = { getItem(key) { return storage.get(key) ?? null; }, setItem(key, value) { storage.set(key, value); } };
  try {
    saveQuoteList([changed]);
    const restored = readQuoteList()[0];
    assert.equal(restored.colors, changed.colors);
    assert.equal(restored.image, changed.image);
    assert.equal(restored.notes, line.notes);
    for (const locale of ['de', 'fr', 'es']) {
      const url = new URL(buildQuoteListShareUrl([restored], locale));
      const selections = parseSharedQuoteSelection(url.hash, [product.code]);
      const imported = mergeSharedQuoteList([], [product.code], products, selections).lines[0];
      assert.equal(imported.colors, changed.colors);
      assert.equal(imported.quantity, line.quantity);
      assert.equal(imported.sizes, line.sizes);
      assert.equal(imported.notes, '');
    }
  } finally { globalThis.window = oldWindow; globalThis.localStorage = oldStorage; }
});
