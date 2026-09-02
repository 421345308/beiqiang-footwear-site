import test from "node:test";
import assert from "node:assert/strict";
import { products } from "../app/data/products.ts";
import {
  catalogDirectionValues,
  isCatalogDirection,
  productMatchesCatalogDirection,
} from "../app/lib/catalog-filtering.ts";

test("every buyer-facing catalogue direction resolves to current products", () => {
  assert.equal(new Set(catalogDirectionValues).size, catalogDirectionValues.length);
  for (const direction of catalogDirectionValues) {
    const matching = products.filter((product) =>
      productMatchesCatalogDirection(product, direction),
    );
    assert.ok(matching.length > 0, `${direction} must not be an empty entry`);
    assert.ok(
      matching.every((product) =>
        productMatchesCatalogDirection(product, direction),
      ),
    );
  }
});

test("catalogue query directions are allowlisted", () => {
  assert.equal(isCatalogDirection("kids"), true);
  assert.equal(isCatalogDirection("fleece"), true);
  assert.equal(isCatalogDirection("medical"), false);
  assert.equal(isCatalogDirection(null), false);
});
