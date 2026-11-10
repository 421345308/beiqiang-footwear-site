import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { products } from "../app/data/products.ts";
import photoLabels from "../app/data/product-photo-labels.json" with { type: "json" };
import { productColour, productSizeNote, productTitle } from "../app/data/europe-products.ts";
import { colorZh, factZh, productNameZh } from "../app/data/products-zh.ts";
import { colourViews, productColours } from "../app/lib/product-colours.ts";
import { productPresentation } from "../app/lib/product-presentation.ts";
import { isStyleCode } from "../edgeone-deploy/cloud-functions/_lib/style-code.js";

const expected = {
  "BQ-LQ02505": { id: "1601980799940", colors: ["Black", "Grey"], size: "EU 39–48" },
  "BQ-LQ2509": { id: "1601980840117", colors: ["Grey", "Dark Brown"], size: "EU 39–48" },
  "BQ-LQ029": { id: "1601975754227", colors: ["Black"], size: "EU 39–48" },
  "BQ-LQ1026": { id: "1601981444129", colors: ["Grey", "Black", "Burgundy"], size: "EU 36–48" },
  "BQ-LQ9705": { id: "1601980506275", colors: ["Black", "Grey", "Burgundy"], size: "EU 36–48" },
};

test("five distinct product identities retain their linked listing and colour-specific photos", async () => {
  const ids = new Set();
  for (const [code, facts] of Object.entries(expected)) {
    const product = products.find(p => p.code === code);
    assert.ok(product, code);
    assert.equal(product.alibabaProductId, facts.id, code);
    assert.equal(ids.has(facts.id), false, code);
    ids.add(facts.id);
    assert.equal(product.size, facts.size, code);
    assert.deepEqual(product.colors, facts.colors, code);
    assert.ok(product.images.length >= 4, code);
    assert.equal(isStyleCode(code), true, code);
    const hashes = new Set();
    for (const source of product.images) {
      const bytes = await readFile(new URL(`../public${source}`, import.meta.url));
      hashes.add(createHash("sha256").update(bytes).digest("hex"));
    }
    assert.equal(hashes.size, product.images.length, `${code} must not repeat a gallery image`);
    const colours = productColours(product);
    assert.deepEqual(colours.map(c => c.name), facts.colors, code);
    for (const colour of colours) {
      for (const index of colourViews(product, colour.id)) {
        assert.equal(photoLabels[code][index]?.colour, colour.name, `${code}: ${colour.name} image ${index}`);
      }
    }
  }
});

test("all five products have reviewed names and presentation in five languages", () => {
  for (const code of Object.keys(expected)) {
    const product = products.find(p => p.code === code);
    assert.notEqual(productNameZh(product), product.name, code);
    for (const colour of product.colors) {
      assert.notEqual(colorZh(colour), colour, `${code}: ${colour}`);
      for (const locale of ["de", "fr", "es"]) assert.notEqual(productColour(colour, locale), colour.toLowerCase(), `${code}: ${locale} ${colour}`);
    }
    for (const locale of ["de", "fr", "es"]) assert.notEqual(productTitle(product, locale), code, `${code}: ${locale}`);
    for (const locale of ["en", "zh", "de", "fr", "es"]) {
      const copy = productPresentation(product, locale);
      assert.ok(copy?.summary && copy.highlights.length === 3, `${code}: ${locale}`);
    }
    assert.doesNotMatch([product.name, product.shortDescription, ...product.highlights].join(" "), /waterproof|anti.?slip|boa|certif|hands.?free/i, code);
  }
});

test("winter boot size ranges remain attached to their actual colours in every language", () => {
  for (const code of ["BQ-LQ1026", "BQ-LQ9705"]) {
    const product = products.find(p => p.code === code);
    assert.equal(product.sizeNote, "Sizes vary by colour: Black EU 36–48; Grey EU 39–48; Burgundy EU 36–41.");
    assert.match(factZh(product.sizeNote), /黑色 EU 36–48.*灰色 EU 39–48.*酒红色 EU 36–41/);
    for (const locale of ["de", "fr", "es"]) {
      const note = productSizeNote(product.sizeNote, locale);
      assert.match(note, /36–48/);
      assert.match(note, /39–48/);
      assert.match(note, /36–41/);
    }
  }
  const shoe = products.find(p => p.code === "BQ-LQ029");
  assert.deepEqual(shoe.colors, ["Black"]);
  assert.match(shoe.shortDescription, /mesh or plush lining/i);
});
