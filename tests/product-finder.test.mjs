import assert from "node:assert/strict";
import test from "node:test";
import { products } from "../app/data/products.ts";
import { findProducts, matchesPriority } from "../app/lib/product-finder.ts";
import { getProductBuyingGuide } from "../app/lib/product-buying-guide.ts";

test("wide-toe recommendations never include an unverified fit claim", () => {
  const matches = findProducts(products, { buyerChannel: "importer_wholesaler", priority: "wide_toe", closure: "any", resultCount: 4 });
  assert.equal(matches.length, 4);
  assert.equal(new Set(matches.map((item) => item.product.code)).size, matches.length);
  assert.ok(matches.some((item) => item.product.code === "BQ-LQ2580"));
  assert.ok(matches.some((item) => item.product.code === "BQ001"));
  assert.ok(matches.some((item) => item.product.code === "BQ002"));
  assert.ok(matches.every((item) => item.product.fitEvidence === "wide_toe_verified"));
});

test("closure is a hard filter and results are bounded", () => {
  const matches = findProducts(products, { buyerChannel: "online_seller", priority: "open", closure: "Lace-Up", resultCount: 3 });
  assert.equal(matches.length, 3);
  assert.ok(matches.every((item) => item.product.closure === "Lace-Up"));
});

test("conflicting hard preferences return no invented recommendation", () => {
  const matches = findProducts(products, { buyerChannel: "sourcing_agent", priority: "easy_on", closure: "Lace-Up", resultCount: 4 });
  assert.deepEqual(matches, []);
});

test("dial-closure matches retain their closure and give relevant sample checks", () => {
  const currentDialStyles = products.filter(p => ["BQ-LQ02412", "BQ-LQ02503"].includes(p.code));
  const matches = findProducts(currentDialStyles, { buyerChannel: "importer_wholesaler", priority: "open", closure: "Dial", resultCount: 4 });
  assert.deepEqual(new Set(matches.map(item => item.product.code)), new Set(["BQ-LQ02412", "BQ-LQ02503"]));
  for (const {product} of matches) {
    assert.match(getProductBuyingGuide(product, "zh").checks[0], /旋钮/);
    assert.match(getProductBuyingGuide(product, "en").checks[0], /Dial/);
  }
});

test("finds documented fleece options described in the product summary", () => {
  for (const code of ["BQ-LQ2132", "BQ-LQK502"]) {
    assert.equal(matchesPriority(products.find(product => product.code === code), "cold_weather"), true, code);
  }
});
