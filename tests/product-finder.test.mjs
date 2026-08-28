import assert from "node:assert/strict";
import test from "node:test";
import { products } from "../app/data/products.ts";
import { findProducts } from "../app/lib/product-finder.ts";

test("wide-toe recommendations never include an unverified fit claim", () => {
  const matches = findProducts(products, { buyerChannel: "importer_wholesaler", priority: "wide_toe", closure: "any", resultCount: 4 });
  assert.deepEqual(matches.map((item) => item.product.code), ["BQ001", "BQ002"]);
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
