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

const code = "BQ-L3522";
const product = products.find(item => item.code === code);
const expectedImages = [
  "dcdb7e62d930e9cac3659e85744d0663dab56b3eb56c8a8abf48b016f427899d",
  "7d0260b4d45bb89ec705585f0986d5311e62404574e95137b414ee1543e5c567",
  "354a6f0a54b6b4846627b6c36b0bfd1436068d9e1bfeeb998f59c313ecbbd406",
  "04a2806de52650998913757c7e5186ee9e5899e44d467567a4590fd602e79021",
];

test("BQ-L3522 keeps its source photographs and distinct colour mapping", async () => {
  assert.ok(product);
  assert.equal(products.filter(item => item.code === code).length, 1);
  assert.equal(product.alibabaProductId, "1601969920294");
  assert.deepEqual(product.colors, ["Green", "Black", "Beige"]);
  assert.equal(product.images.length, expectedImages.length);
  for (const [i, src] of product.images.entries()) {
    const data = await readFile(new URL(`../public${src}`, import.meta.url));
    assert.equal(createHash("sha256").update(data).digest("hex"), expectedImages[i], src);
  }
  assert.deepEqual(productColours(product).map(item => item.name), product.colors);
  for (const colour of productColours(product)) for (const index of colourViews(product, colour.id)) {
    assert.equal(photoLabels[code][index]?.colour, colour.name);
  }
  assert.deepEqual(photoLabels[code].map(label => label.colour), ["Green", "Black", "Beige", "Green"]);
});

test("BQ-L3522 preserves its size-system and material limits in five languages", () => {
  assert.equal(product.size, "39–46");
  assert.match(product.sizeNote, /confirm the size system and sample measurements/i);
  assert.equal(product.upper, "Cow suede");
  assert.equal(product.sole, "");
  assert.notEqual(productNameZh(product), product.name);
  assert.notEqual(factZh(product.upper), product.upper);
  for (const color of product.colors) assert.notEqual(colorZh(color), color);
  for (const locale of ["de", "fr", "es"]) {
    assert.notEqual(productTitle(product, locale), product.code);
    assert.ok(productFact(product.upper, locale));
    assert.ok(productSizeNote(product.sizeNote, locale));
    for (const color of product.colors) assert.ok(productColour(color, locale));
  }
  for (const locale of ["en", "zh", "de", "fr", "es"]) {
    const presentation = productPresentation(product, locale);
    assert.ok(presentation?.summary && presentation.highlights.length === 3, locale);
  }
  assert.doesNotMatch([product.size, product.name, product.shortDescription, ...product.highlights].join(" "), /\bEU\b|waterproof|anti.?slip|wide.?toe|hands.?free|certif/i);
});
