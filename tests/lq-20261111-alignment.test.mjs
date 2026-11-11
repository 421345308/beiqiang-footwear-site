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

const cases = {
  "BQ-LQ018": {
    id: "1601974978404", size: "EU 37–48", upper: "", sole: "Rubber outsole",
    colors: ["Black Green", "Black Grey", "Black", "Black Khaki"],
    hashes: [
      "3bbd035e00c4b507c44647f18a7dd60bc844743fda32992dba3e5285abf19187",
      "2acbc14293ff5ad0e1db244ee7228cae7fb78533c6ebd9bcce169905673e09ff",
      "1a492e74562861a5065543c3ccccd9959896c896baecc53ff3decb0120756573",
      "e81eb15995353fec3c22b938e582d5b5d158b3154549ff9f9f65168a902198bd",
    ],
  },
  "BQ-LQ2572": {
    id: "1601974755167", size: "EU 39–46", upper: "Mesh", sole: "PU outsole",
    colors: ["Beige", "Black"],
    hashes: [
      "c0d9dabae8cac4962d27bd5ae3f25d7cf02a96117fb31c74e5339e3ad7da325a",
      "f914498076311e705804bf2bf952722c569dc9171127ca8c76b1d89872d2d107",
      "b31c2c418b71ebf1a7c28d58abc1e46bbcdef282454457de3fc93166be708647",
      "b7ea8fd328931ae5cea75985b1c03c69579180c36d618730ef015a283582766a",
    ],
  },
  "BQ-LQ2578": {
    id: "1601974917344", size: "EU 39–46", upper: "Jacquard fabric", sole: "Rubber-plastic outsole",
    colors: ["Beige", "Light Grey", "Black"],
    hashes: [
      "6034bf0a47430a26a0662e1f573108835180bfa47777a31e703d00a83b3514c6",
      "f8ce24798717ef2ca43dae1145616ae2a30b2d726862bae23dc377d14c2a24c3",
      "7a41c16941ddd8e8156b2414995da4d9de91df4e587e7fe78eea27f287040f44",
      "4d62bf1a66220d504985d1be15c5c357388749ea298679498be4924c809199f7",
    ],
  },
};

for (const [code, expected] of Object.entries(cases)) {
  test(`${code} retains the selected listing, original photos and colour mapping`, async () => {
    const product = products.find(item => item.code === code);
    assert.ok(product);
    assert.equal(products.filter(item => item.code === code).length, 1);
    assert.equal(product.alibabaProductId, expected.id);
    assert.equal(product.size, expected.size);
    assert.equal(product.upper, expected.upper);
    assert.equal(product.sole, expected.sole);
    assert.deepEqual(product.colors, expected.colors);
    assert.equal(product.images.length, expected.hashes.length);
    for (const [i, src] of product.images.entries()) {
      const data = await readFile(new URL(`../public${src}`, import.meta.url));
      assert.equal(createHash("sha256").update(data).digest("hex"), expected.hashes[i], src);
    }
    assert.deepEqual(productColours(product).map(item => item.name), expected.colors);
    for (const colour of productColours(product)) for (const index of colourViews(product, colour.id)) {
      assert.equal(photoLabels[code][index]?.colour, colour.name, `${colour.name} image ${index}`);
    }
  });
  test(`${code} retains evidence-bounded copy across five languages`, () => {
    const product = products.find(item => item.code === code);
    assert.notEqual(productNameZh(product), product.name);
    for (const color of product.colors) assert.notEqual(colorZh(color), color);
    for (const locale of ["de", "fr", "es"]) {
      assert.notEqual(productTitle(product, locale), product.code);
      for (const fact of [product.upper, product.sole].filter(Boolean)) assert.ok(productFact(fact, locale));
      for (const color of product.colors) assert.ok(productColour(color, locale));
    }
    for (const fact of [product.upper, product.sole].filter(Boolean)) assert.notEqual(factZh(fact), fact);
    for (const locale of ["en", "zh", "de", "fr", "es"]) {
      const presentation = productPresentation(product, locale);
      assert.ok(presentation?.summary && presentation.highlights.length === 3, locale);
      assert.ok(presentation.summary.includes(expected.size), locale);
    }
    assert.doesNotMatch([product.name, product.shortDescription, ...product.highlights].join(" "), /waterproof|anti.?slip|medical|hands.?free|certif/i);
    if (code === "BQ-LQ2572") assert.equal(product.fitEvidence, "wide_toe_verified");
    else assert.doesNotMatch(product.name, /wide.?toe/i);
  });
}
