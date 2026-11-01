import assert from "node:assert/strict";
import test from "node:test";
import { buildQuoteListShareUrl, mergeSharedQuoteList, parseSharedQuoteCodes, parseSharedQuoteSelection } from "../app/lib/quote-list-share.ts";
import { sharedImportMessage } from "../app/lib/quote-share-copy.ts";
import { products } from "../app/data/products.ts";

const allowed = Array.from({ length: 15 }, (_, index) => `BQ${String(index + 1).padStart(3, "0")}`);
const catalog = allowed.map((code) => ({ code, slug: code.toLowerCase(), sourceModel: `MODEL-${code}`, name: `Style ${code}` }));

test("accepts only unique known style codes and caps a shared quote list at twelve", () => {
  const input = `bq001,BQ999,bad,${allowed.join(",")},BQ001`;
  assert.deepEqual(parseSharedQuoteCodes(input, allowed), allowed.slice(0, 12));
});

test("builds canonical bilingual shortlist links without commercial or identity data", () => {
  const english = new URL(buildQuoteListShareUrl(["bq001", "BQ002", "BQ001"]));
  const chinese = new URL(buildQuoteListShareUrl(["BQ003"], "zh"));
  assert.equal(english.pathname, "/request-quote/");
  assert.equal(english.searchParams.get("shortlist"), "BQ001,BQ002");
  assert.equal(chinese.pathname, "/zh/request-quote/");
  for (const url of [english, chinese]) for (const key of ["quantity", "colors", "sizes", "notes", "price", "email", "company"]) assert.equal(url.searchParams.has(key), false);
});

test("merges shared products without overwriting existing line details or exceeding twelve", () => {
  const existing = [{ code: "BQ001", slug: "bq001", sourceModel: "MODEL-BQ001", name: "Style BQ001", image: "/old.webp", quantity: "600", colors: "Black", sizes: "EU 39-45", notes: "Keep this" }];
  const result = mergeSharedQuoteList(existing, allowed.slice(0, 15), catalog);
  assert.equal(result.lines.length, 12);
  assert.equal(result.imported, 11);
  assert.deepEqual(result.lines[0], existing[0]);
  assert.equal(result.lines[1].code, "BQ002");
  assert.equal(result.lines[1].quantity, "");
});

test("five-language links carry colour, sizes and quantity while excluding private notes and contact data", () => {
  const product = products.find(p => p.code === "BQ009");
  const line = { code: product.code, slug: product.slug, sourceModel: product.sourceModel, name: product.name, image: "", quantity: "120 双", colors: "Orange, Mint Green", sizes: "EU 40–44", notes: "private note buyer@example.com" };
  for (const locale of ["en", "zh", "de", "fr", "es"]) {
    const url = new URL(buildQuoteListShareUrl([line], locale));
    assert.equal(url.pathname, `${locale === "en" ? "" : `/${locale}`}/request-quote/`);
    assert.equal(url.searchParams.get("shortlist"), "BQ009");
    assert.doesNotMatch(decodeURIComponent(url.href), /buyer@example\.com|private note/);
    const codes = parseSharedQuoteCodes(url.searchParams.get("shortlist"), products.map(p => p.code));
    const details = parseSharedQuoteSelection(url.hash, codes);
    const result = mergeSharedQuoteList([], codes, products, details);
    assert.equal(result.lines[0].colors, line.colors);
    assert.equal(result.lines[0].quantity, line.quantity);
    assert.equal(result.lines[0].sizes, line.sizes);
    assert.equal(result.lines[0].notes, "");
    assert.ok(result.lines[0].image.includes(product.slug));
    assert.equal(new URL(url).origin + new URL(url).pathname + new URL(url).search, `https://www.beiqiang.online${url.pathname}?shortlist=BQ009`);
  }
});

test("shared detail never overwrites existing buyer data and remains visible for review", () => {
  const product = products.find(p => p.code === "BQ009");
  const existing = [{ code: product.code, slug: product.slug, sourceModel: product.sourceModel, name: product.name, image: "", quantity: "80", colors: "Black White", sizes: "EU 39", notes: "Keep" }];
  const incoming = [{ code: product.code, quantity: "120", colors: "Orange", sizes: "EU 44" }];
  const result = mergeSharedQuoteList(existing, [product.code], products, incoming);
  assert.deepEqual(result.lines, existing);
  assert.equal(result.imported, 0);
  assert.match(sharedImportMessage("fr", [product.code], result.imported, existing, incoming), /Orange.*EU 44.*120/);
});

test("a shared selection fills empty fields of an existing style without changing filled fields", () => {
  const product = products.find(p => p.code === "BQ009");
  const existing = [{ code: product.code, slug: product.slug, sourceModel: product.sourceModel, name: product.name, image: "old", quantity: "80", colors: "", sizes: "", notes: "Keep" }];
  const incoming = [{ code: product.code, quantity: "120", colors: "Orange", sizes: "EU 44" }];
  const result = mergeSharedQuoteList(existing, [product.code], products, incoming);
  assert.equal(result.updated, 1);
  assert.equal(result.lines[0].quantity, "80");
  assert.equal(result.lines[0].colors, "Orange");
  assert.equal(result.lines[0].sizes, "EU 44");
  assert.equal(result.lines[0].notes, "Keep");
  assert.notEqual(result.lines[0].image, "old");
});

test("malformed, foreign or oversized shared selections are ignored without corrupting the list", () => {
  assert.deepEqual(parseSharedQuoteSelection("#selection=not-json", ["BQ009"]), []);
  assert.deepEqual(parseSharedQuoteSelection(`#selection=${encodeURIComponent(JSON.stringify({v: 1, items: [{c: "BQ001", o:"Black"}]}))}`, ["BQ009"]), []);
  const product = products.find(p => p.code === "BQ009");
  const line = { code: product.code, slug: product.slug, sourceModel: "", name: product.name, image: "", quantity: "1".repeat(201), colors: "", sizes: "", notes: "" };
  assert.throws(() => buildQuoteListShareUrl([line]), RangeError);
});
