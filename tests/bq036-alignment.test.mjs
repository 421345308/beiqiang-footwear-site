import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { products, heldSourceProducts } from "../app/data/products.ts";
import photoLabels from "../app/data/product-photo-labels.json" with { type: "json" };
import { productColour, productFact, productTitle } from "../app/data/europe-products.ts";
import { colorZh, factZh, productNameZh } from "../app/data/products-zh.ts";
import { colourViews, productColours } from "../app/lib/product-colours.ts";
import { productPresentation } from "../app/lib/product-presentation.ts";

const product = products.find(item => item.code === "BQ036");
const expectedImages = [
  "ae7590a8226b97f6797e01980e6dcd2a7d147ecbfef2fae8e029f2e8fe1183ba",
  "fb43de20a5301027dc7edb8ac040acd31d389bd7014f5bd469a59272c222e7ca",
  "87486f388ae46a2ae342f8dde9c010849e8f1d2e5a57d738bf586651dc2efc51",
  "788795b9eb559523b3d951d1d60d2145804d2f7cb209b872a3e341e9959a1960",
  "dfd8caa07c0cb63cb62d12924e7ad79247594c3cf8a831b39fb7d7578c29127a",
  "5d6d7ef150d26d130f559efbe583e40a205ee71a33f3d118b22b7fc98850e616",
];

test("BQ036 publishes one confirmed identity and exact current-channel images", async () => {
  assert.ok(product);
  assert.equal(products.filter(item => item.code === "BQ036").length, 1);
  assert.equal(heldSourceProducts.some(item => item.code === "BQ036"), false);
  assert.equal(product.alibabaProductId, "1601924292931");
  assert.equal(product.closure, "Slip-On");
  assert.equal(product.upper, "High-top knitted textile upper");
  assert.equal(product.sole, "EVA sole");
  assert.equal(product.size, "EU 35–45");
  assert.deepEqual(product.colors, ["Black White", "All Black"]);
  assert.equal(product.images.length, expectedImages.length);
  for (const [index, src] of product.images.entries()) {
    const bytes = await readFile(new URL(`../public${src}`, import.meta.url));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), expectedImages[index], src);
  }
  assert.deepEqual(productColours(product).map(item => item.name), product.colors);
  for (const colour of productColours(product)) for (const index of colourViews(product, colour.id)) {
    assert.equal(photoLabels.BQ036[index]?.colour, colour.name, `${colour.name} image ${index}`);
  }
  assert.equal(photoLabels.BQ036[4].colour, undefined, "two-colour photo must not be assigned to one colour");
});

test("BQ036 retains its documented facts in five languages", () => {
  assert.notEqual(productNameZh(product), product.name);
  for (const colour of product.colors) assert.notEqual(colorZh(colour), colour);
  for (const locale of ["de", "fr", "es"]) {
    assert.notEqual(productTitle(product, locale), product.code);
    for (const value of [product.upper, product.sole]) assert.ok(productFact(value, locale));
    for (const colour of product.colors) assert.ok(productColour(colour, locale));
  }
  for (const value of [product.upper, product.sole]) assert.notEqual(factZh(value), value);
  for (const locale of ["en", "zh", "de", "fr", "es"]) {
    const copy = productPresentation(product, locale);
    assert.ok(copy?.summary && copy.highlights.length === 3, locale);
  }
  assert.doesNotMatch([product.name, product.shortDescription, ...product.highlights].join(" "), /wide.?toe|waterproof|anti.?slip|hands.?free|certif/i);
});
