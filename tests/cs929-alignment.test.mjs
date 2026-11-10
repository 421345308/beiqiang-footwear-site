import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { products } from "../app/data/products.ts";
import photoLabels from "../app/data/product-photo-labels.json" with { type: "json" };
import { productColour, productFact, productSizeNote, productTitle } from "../app/data/europe-products.ts";
import { colorZh, factZh, productNameZh } from "../app/data/products-zh.ts";
import { colourViews, productColours } from "../app/lib/product-colours.ts";
import { productPresentation } from "../app/lib/product-presentation.ts";

const code = "BQ-CS929";
const product = products.find(item => item.code === code);
const expectedImages = [
  "fe2b0e4d93ad2cbc52acc687b1fef88d44f567e5cced5fbe49a26ff5bb4b72a2",
  "9c2782d6e41156bcf4eee4adfb7e4c8ec6a0c0957f874a97f3c39e388baf5642",
  "98e6cb1891d28a8d335632138bcdebde7abffc8ff6fb98c76b8f695d21abdca3",
  "ddbc521a32b55e480550c7f5d7f49a6b87569b9992203e2bdab953fb33d5111d",
];

test("BQ-CS929 keeps exact source photos and three colour mappings", async () => {
  assert.ok(product);
  assert.equal(products.filter(item => item.code === code).length, 1);
  assert.equal(product.alibabaProductId, "1601970118386");
  assert.deepEqual(product.colors, ["Black", "Silver", "Grey/Blue"]);
  assert.equal(product.images.length, expectedImages.length);
  for (const [i, src] of product.images.entries()) {
    const data = await readFile(new URL(`../public${src}`, import.meta.url));
    assert.equal(createHash("sha256").update(data).digest("hex"), expectedImages[i], src);
  }
  assert.deepEqual(productColours(product).map(item => item.name), product.colors);
  for (const colour of productColours(product)) for (const index of colourViews(product, colour.id)) {
    assert.equal(photoLabels[code][index]?.colour, colour.name);
  }
  assert.deepEqual(photoLabels[code].map(label => label.colour), ["Black", "Silver", "Grey/Blue", "Black"]);
});

test("BQ-CS929 keeps verified materials and size-system limits in five languages", () => {
  assert.equal(product.size, "39–47");
  assert.match(product.sizeNote, /confirm the size system and sample measurements/i);
  assert.equal(product.upper, "Mesh");
  assert.equal(product.sole, "Rubber outsole");
  assert.ok(product.highlights.includes("EVA midsole"));
  assert.notEqual(productNameZh(product), product.name);
  assert.notEqual(factZh(product.sole), product.sole);
  for (const color of product.colors) assert.notEqual(colorZh(color), color);
  for (const locale of ["de", "fr", "es"]) {
    assert.notEqual(productTitle(product, locale), product.code);
    for (const value of [product.upper, product.sole, "EVA midsole"]) assert.ok(productFact(value, locale));
    assert.ok(productSizeNote(product.sizeNote, locale));
    for (const color of product.colors) assert.ok(productColour(color, locale));
  }
  for (const locale of ["en", "zh", "de", "fr", "es"]) {
    const presentation = productPresentation(product, locale);
    assert.ok(presentation?.summary && presentation.highlights.length === 3, locale);
  }
  assert.doesNotMatch([product.size, product.name, product.shortDescription, ...product.highlights].join(" "), /\bEU\b|waterproof|anti.?slip|wide.?toe|hands.?free|certif/i);
});
