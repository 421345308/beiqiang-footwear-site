import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { products } from "../app/data/products.ts";
import { productTitle } from "../app/data/europe-products.ts";
import { productNameZh } from "../app/data/products-zh.ts";
import { productPresentation } from "../app/lib/product-presentation.ts";

test("BQ1009 uses the reviewed SC22 white and black shoes with the correct public listing", async () => {
  const product = products.find((item) => item.code === "BQ1009");
  assert.ok(product);
  assert.equal(product.alibabaProductId, "1601943520149");
  assert.equal(product.size, "EU 39-44");
  assert.deepEqual(product.colors, ["White", "Black"]);
  assert.equal(product.closure, "Lace-Up");
  assert.equal(product.fitEvidence, "unconfirmed");
  const expected = [
    "8718e65eb66a7a58115ae64852c71c7edfb22da89981c540a67cb39df9b47b92",
    "7730851aeea7275f0d8a17fefdada0abd8b801a998d0a37b1c49b04895336c61",
  ];
  for (let i = 0; i < expected.length; i++) {
    const bytes = await readFile(new URL(`../public${product.images[i]}`, import.meta.url));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), expected[i]);
  }
  assert.doesNotMatch([product.name, product.shortDescription, product.upper, product.sole, ...product.highlights].join(" "), /rubber|genuine leather|wide toe|hands.free/i);
  assert.notEqual(productNameZh(product), product.name);
  for (const locale of ["de", "fr", "es"]) assert.notEqual(productTitle(product, locale), product.code);
  for (const locale of ["en", "zh", "de", "fr", "es"]) {
    const copy = productPresentation(product, locale);
    assert.ok(copy?.summary);
    assert.equal(copy.highlights.length, 3);
    assert.match(copy.summary, /39–44/);
  }
});
