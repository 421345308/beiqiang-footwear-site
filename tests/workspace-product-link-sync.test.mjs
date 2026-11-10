import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { products } from "../app/data/products.ts";
import { productTitle, productColour } from "../app/data/europe-products.ts";
import { colorZh, productNameZh } from "../app/data/products-zh.ts";
import { productPresentation } from "../app/lib/product-presentation.ts";
import { isStyleCode, extractStyleCodes } from "../edgeone-deploy/cloud-functions/_lib/style-code.js";
import { buildQuoteListShareUrl, parseSharedQuoteCodes } from "../app/lib/quote-list-share.ts";

test("reviewed website links point to the chosen product identities", () => {
  const expected = {
    BQ006: "1601814931739", BQ014: "10000043732626",
    BQ015: "1601939743040", BQ020: "1601839073314",
    "BQ-9002": "1602003801096",
  };
  for (const [code, id] of Object.entries(expected)) {
    assert.equal(products.find(p => p.code === code)?.alibabaProductId, id, code);
  }
});

test("BQ-9002 publishes its own two source colours and five-language product copy", async () => {
  const product = products.find(p => p.code === "BQ-9002");
  assert.ok(product);
  assert.equal(product.size, "EU 38–47");
  assert.equal(product.upper, "Knitted textile upper");
  assert.equal(product.sole, "EVA sole");
  assert.deepEqual(product.colors, ["Light Grey", "Dark Grey"]);
  assert.equal(product.fitEvidence, "unconfirmed");
  const hashes = [
    "a165bc6ff73baddcc326b77faa4ce5c47d93baf4a7eab46da6c6cbd5b38540a0",
    "d0d7c41c195d1a00a85d0b3dddf9a6600a0e6431dc4cc8a7772218fc49a6b112",
    "02425749baf62012dac6672c080994bd68fb78af956e26c93e552551337134ab",
    "cf0c12ac14b9920aad2659d4a6090b6aa0d0e82bd8b34b9ffd9c55e44bd51a43",
  ];
  for (const [index, expected] of hashes.entries()) {
    const bytes = await readFile(new URL(`../public${product.images[index]}`, import.meta.url));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), expected);
  }
  assert.notEqual(productNameZh(product), product.name);
  assert.notEqual(colorZh(product.colors[0]), product.colors[0]);
  for (const locale of ["de", "fr", "es"]) {
    assert.notEqual(productTitle(product, locale), product.code);
    assert.notEqual(productColour(product.colors[0], locale), product.colors[0].toLowerCase());
  }
  for (const locale of ["en", "zh", "de", "fr", "es"]) {
    assert.equal(productPresentation(product, locale)?.highlights.length, 3);
  }
  assert.doesNotMatch([product.name, product.shortDescription, ...product.highlights].join(" "), /wide.toe|hands.free|waterproof|certif/i);
  assert.equal(isStyleCode(product.code), true);
  const shared = new URL(buildQuoteListShareUrl([product.code, "BQ001"]));
  assert.deepEqual(parseSharedQuoteCodes(shared.searchParams.get("shortlist"), products.map(p => p.code)), [product.code, "BQ001"]);
  assert.deepEqual(extractStyleCodes("BQ-9002, BQ001; inquiry BQ-20261103-ABCDEF12"), ["BQ-9002", "BQ001"]);
});
