import assert from "node:assert/strict";
import test from "node:test";
import { products } from "../app/data/products.ts";
import { findProducts, matchesPriority } from "../app/lib/product-finder.ts";

test("European finder conditions retain real products and exact closure across all buyer channels", () => {
  for (const buyerChannel of ["importer_wholesaler", "online_seller", "brand_private_label", "sourcing_agent"])
    for (const priority of ["open", "wide_toe", "easy_on", "breathable_lace_up", "mens", "kids", "cold_weather"])
      for (const closure of ["any", "Slip-On", "Lace-Up"])
        for (const resultCount of [2, 3, 4]) {
          const matches = findProducts(products, { buyerChannel, priority, closure, resultCount });
          assert.ok(matches.length <= resultCount);
          assert.equal(new Set(matches.map(({ product }) => product.code)).size, matches.length);
          for (const { product } of matches) {
            assert.ok(products.includes(product));
            assert.ok(matchesPriority(product, priority));
            assert.ok(closure === "any" || product.closure === closure);
          }
        }
});

test("removing the conflicting closure recovers genuine slip-on choices", () => {
  const answers = { buyerChannel: "sourcing_agent", priority: "easy_on", closure: "Lace-Up", resultCount: 3 };
  assert.deepEqual(findProducts(products, answers), []);
  const relaxed = findProducts(products, { ...answers, closure: "any" });
  assert.equal(relaxed.length, 3);
  assert.ok(relaxed.every(({ product }) => product.closure === "Slip-On"));
});
