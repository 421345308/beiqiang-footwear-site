import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { products } from "../app/data/products.ts";
import { factZh } from "../app/data/products-zh.ts";
import { productFact } from "../app/data/europe-products.ts";
import { publicProductFact } from "../app/lib/public-product-facts.ts";
import { productPresentation } from "../app/lib/product-presentation.ts";

const placeholders = /材质待确认|材料成分待确认|待确认项|(?:upper )?material to be confirmed|material confirmed before quotation|composition to be confirmed|obermaterial zu bestätigen|matière de la tige à confirmer|material del corte por confirmar/i;

test("public product facts omit internal placeholders and keep meaningful descriptions", () => {
  for (const value of ["Material to be confirmed", "other", "To be confirmed", "Cushion-profile sole; material confirmed before quotation"]) assert.equal(publicProductFact(value), "");
  assert.equal(publicProductFact("Suede-effect upper; composition to be confirmed"), "Suede-effect upper");
  assert.equal(publicProductFact("EVA sole"), "EVA sole");
  for (const product of products) {
    for (const field of ["upper", "sole", "size"]) {
      assert.doesNotMatch(product[field], placeholders, `${product.code} ${field}`);
      assert.doesNotMatch(factZh(product[field]), placeholders, `${product.code} ${field} zh`);
      for (const locale of ["de", "fr", "es"]) assert.doesNotMatch(productFact(product[field], locale), placeholders, `${product.code} ${field} ${locale}`);
    }
  }
  const style = products.find(p => p.code === "BQ-LQ02503");
  assert.equal(style.upper, "Mesh-panel upper");
  assert.equal(style.sole, "");
  for (const locale of ["en", "zh", "de", "fr", "es"]) assert.ok(productPresentation(style, locale)?.highlights.length >= 3);
});

test("all public product pages and print sheets omit material placeholders", async () => {
  for (const product of products) for (const prefix of ["", "zh/", "de/", "fr/", "es/"]) {
    const path = `${prefix}products/${product.slug}/index.html`;
    const html = await readFile(new URL(`../edgeone-export-v1/${path}`, import.meta.url), "utf8");
    const visible = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
    assert.doesNotMatch(visible, placeholders, path);
    assert.doesNotMatch(visible, /<dd>\s*<\/dd>/i, path);
    assert.match(visible, /product-print-sheet/, path);
  }
});
