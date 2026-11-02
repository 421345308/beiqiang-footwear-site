import assert from 'node:assert/strict';
import test from 'node:test';
import { products } from '../app/data/products.ts';
import { productNameZh } from '../app/data/products-zh.ts';
import { productTitle, productSizeNote } from '../app/data/europe-products.ts';
import { documentedSizes, filterCatalog, defaultSelection } from '../app/lib/catalog-selection.ts';
import { colourViews, productColours } from '../app/lib/product-colours.ts';
import { buildQuoteListShareUrl, parseSharedQuoteCodes } from '../app/lib/quote-list-share.ts';
import { buildComparisonUrl, parseComparisonCodes } from '../app/lib/comparison-link.ts';
import { sanitizeProductFinderBrief } from '../app/lib/product-finder-brief.ts';
import { savePrivateLabelConcept, readPrivateLabelConcept } from '../app/lib/private-label-concept.ts';
import { extractStyleCodes } from '../edgeone-deploy/cloud-functions/_lib/style-code.js';
import { validateInquiry } from '../edgeone-deploy/cloud-functions/api/inquiries.js';
import { sanitizeEventPayload } from '../edgeone-deploy/cloud-functions/api/events.js';

test('new product colours each resolve to their own available photographs', () => {
  const product = products.find(p => p.code === 'BQ-LQ2651');
  assert.ok(product);
  const colours = productColours(product);
  assert.deepEqual(colours.map(c => c.id), ['black', 'white-black', 'white-grey']);
  assert.equal(new Set(colours.map(c => c.imageIndex)).size, colours.length);
  assert.equal(colourViews(product, 'black').length, 2);
  for (const c of colours) assert.ok(product.images[c.imageIndex]?.endsWith('.jpg'));
});

test('a longer new style code survives buyer sharing, comparison, finder and inquiry', () => {
  const code = 'BQ-LQ2599-1';
  const allowed = products.map(p => p.code);
  assert.ok(allowed.includes(code));
  const shared = new URL(buildQuoteListShareUrl([code, 'BQ001'], 'zh'));
  assert.deepEqual(parseSharedQuoteCodes(shared.searchParams.get('shortlist'), allowed), [code, 'BQ001']);
  const comparison = new URL(buildComparisonUrl([code, 'BQ001'], 'zh'));
  assert.deepEqual(parseComparisonCodes(comparison.searchParams.get('compare'), allowed), [code, 'BQ001']);
  const brief = {mode:'matched_shortlist', buyerChannel:'online_seller', priority:'open', closure:'any', styleCodes:[code]};
  assert.deepEqual(sanitizeProductFinderBrief(brief).styleCodes, [code]);
  const result = validateInquiry({name:'Buyer', company:'Example Imports', buyerType:'Importer / wholesaler', market:'Germany', quantity:'300 pairs', email:'qa@example.com', requirements:'Please discuss samples.', consent:true, styleCode:code, styleLabel:code, context:'product', page:'/products/bq-lq2599-1/', formStartedAt:Date.now()-5000, finderBrief:brief});
  assert.deepEqual(result.inquiry.finderBrief.styleCodes, [code]);
  assert.equal(sanitizeEventPayload({event:'comparison_share', details:{styleCodes:`${code},BQ001`}}).details.styleCodes, `${code},BQ001`);
  assert.deepEqual(extractStyleCodes(`Style ${code}, BQ001; inquiry BQ-20261103-ABCDEF12`), [code, 'BQ001']);
});

test('private-label draft retains the complete longer style code', () => {
  const previousWindow = globalThis.window;
  const previousStorage = globalThis.localStorage;
  const entries = new Map();
  globalThis.window = {};
  globalThis.localStorage = {setItem:(key,value)=>entries.set(key,value), getItem:key=>entries.get(key) || null};
  try {
    savePrivateLabelConcept({styleCode:'BQ-LQ2599-1', styleSlug:'bq-lq2599-1', sourceModel:'', styleName:'Style', placement:'Tongue', artworkStatus:'not_ready', brandText:'', notes:'', createdAt:''});
    assert.equal(readPrivateLabelConcept().styleCode, 'BQ-LQ2599-1');
  } finally {
    if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow;
    if (previousStorage === undefined) delete globalThis.localStorage; else globalThis.localStorage = previousStorage;
  }
});

test('unknown size systems stay out of EU filters and product names are localized', () => {
  const uncertain = products.find(p => p.code === 'BQ-LQ2651');
  const confirmed = products.find(p => p.code === 'BQ-LQ032');
  assert.ok(uncertain && confirmed);
  assert.deepEqual(documentedSizes(uncertain), []);
  assert.ok(documentedSizes(confirmed).includes(48));
  const results = filterCatalog([uncertain, confirmed], {...defaultSelection, size:'48'});
  assert.deepEqual(results.map(p => p.code), ['BQ-LQ032']);
  assert.notEqual(productNameZh(uncertain), uncertain.name);
  for (const locale of ['de', 'fr', 'es']) {
    assert.notEqual(productTitle(uncertain, locale), uncertain.code);
    assert.notEqual(productTitle(uncertain, locale), uncertain.name);
    assert.ok(productSizeNote(uncertain.sizeNote, locale).length > 15);
  }
});
