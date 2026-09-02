import assert from "node:assert/strict";
import test from "node:test";
import { buildQuoteListShareUrl, mergeSharedQuoteList, parseSharedQuoteCodes } from "../app/lib/quote-list-share.ts";

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
