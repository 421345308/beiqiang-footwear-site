import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { products } from "../app/data/products.ts";
import photoLabels from "../app/data/product-photo-labels.json" with { type: "json" };
import { productColour, productFact, productTitle } from "../app/data/europe-products.ts";
import { colorZh, factZh, productNameZh } from "../app/data/products-zh.ts";
import { colourViews, productColours } from "../app/lib/product-colours.ts";
import { productPresentation } from "../app/lib/product-presentation.ts";

const expected = {
  "BQ-LQ015": { id: "1601975924693", colors: ["Black Grey", "Black", "Black Green", "Black Khaki"], size: "EU 37–48", upper: "Synthetic leather", sole: "Rubber sole" },
  "BQ-LQ2560": { id: "1601975826614", colors: ["Khaki", "Black"], size: "EU 39–48", upper: "", sole: "" },
  "BQ-LQ2580": { id: "1601975631791", colors: ["Yellow", "Black"], size: "EU 39–48", upper: "Jacquard mesh", sole: "MD + TPR sole" },
  "BQ-LQ2416": { id: "1601976114323", colors: ["Dark Grey", "Khaki"], size: "EU 39–48", upper: "", sole: "MD sole" },
};

test("four distinct supplier-backed identities retain their listing, materials and colour-bound original photographs", async () => {
  const listingIds = new Set();
  for (const [code, facts] of Object.entries(expected)) {
    const product = products.find(p => p.code === code);
    assert.ok(product, code);
    assert.equal(product.alibabaProductId, facts.id, code);
    assert.equal(listingIds.has(facts.id), false, code);
    listingIds.add(facts.id);
    for (const field of ["size", "upper", "sole"]) assert.equal(product[field], facts[field], `${code}: ${field}`);
    assert.deepEqual(product.colors, facts.colors, code);
    assert.equal(product.images.length, 4, code);
    const hashes = new Set();
    for (const src of product.images) hashes.add(createHash("sha256").update(await readFile(new URL(`../public${src}`, import.meta.url))).digest("hex"));
    assert.equal(hashes.size, 4, `${code}: duplicate photo`);
    const colours = productColours(product);
    assert.deepEqual(colours.map(c => c.name), facts.colors, code);
    for (const colour of colours) for (const index of colourViews(product, colour.id)) {
      assert.equal(photoLabels[code][index]?.colour, colour.name, `${code}: ${colour.name} image ${index}`);
    }
  }
  assert.equal(products.find(p => p.code === "BQ-LQ2580").fitEvidence, "wide_toe_verified");
  assert.equal(products.find(p => p.code === "BQ-LQ2560").fitEvidence, "unconfirmed");
});

test("five-language product copy and fields keep the documented facts", () => {
  for (const code of Object.keys(expected)) {
    const product = products.find(p => p.code === code);
    assert.notEqual(productNameZh(product), product.name, code);
    for (const colour of product.colors) assert.notEqual(colorZh(colour), colour, `${code}: ${colour}`);
    for (const locale of ["de", "fr", "es"]) {
      assert.notEqual(productTitle(product, locale), code, `${code}: ${locale}`);
      for (const value of [product.upper, product.sole].filter(Boolean)) assert.ok(productFact(value, locale), `${code}: ${locale} ${value}`);
    }
    for (const value of [product.upper, product.sole].filter(Boolean)) assert.notEqual(factZh(value), value, `${code}: zh ${value}`);
    for (const locale of ["en", "zh", "de", "fr", "es"]) {
      const copy = productPresentation(product, locale);
      assert.ok(copy?.summary && copy.highlights.length === 3, `${code}: ${locale}`);
    }
    assert.doesNotMatch([product.name, product.shortDescription, ...product.highlights].join(" "), /waterproof|anti.?slip|boa|certif|hands.?free/i, code);
  }
  assert.equal(productColour("Black Green", "fr"), "noir vert");
  assert.equal(colorZh("Black Khaki"), "黑卡其");
});
