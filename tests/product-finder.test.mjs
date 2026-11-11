import assert from "node:assert/strict";
import test from "node:test";
import { products } from "../app/data/products.ts";
import { findProducts, matchesPriority } from "../app/lib/product-finder.ts";
import { getProductBuyingGuide } from "../app/lib/product-buying-guide.ts";

test("wide-toe recommendations never include an unverified fit claim", () => {
  const matches = findProducts(products, { buyerChannel: "importer_wholesaler", priority: "wide_toe", closure: "any", resultCount: 4 });
  assert.equal(matches.length, 4);
  assert.equal(new Set(matches.map((item) => item.product.code)).size, matches.length);
  assert.ok(matches.every((item) => item.product.fitEvidence === "wide_toe_verified"));
  // Adding another verified style may change the top four without making
  // previously verified styles ineligible.
  for (const code of ["BQ-LQ2580", "BQ001", "BQ002", "BQ-LQ2559"]) {
    const product = products.find((item) => item.code === code);
    assert.ok(product, code);
    assert.equal(matchesPriority(product, "wide_toe"), true, code);
    assert.equal(findProducts([product], { buyerChannel: "importer_wholesaler", priority: "wide_toe", closure: "any", resultCount: 4 })[0]?.product.code, code);
  }
});

test("closure is a hard filter and results are bounded", () => {
  const matches = findProducts(products, { buyerChannel: "online_seller", priority: "open", closure: "Lace-Up", resultCount: 3 });
  assert.equal(matches.length, 3);
  assert.ok(matches.every((item) => item.product.closure === "Lace-Up"));
});

test("men's sourcing direction does not match women's styles", () => {
  const women = products.find(product => product.code === "BQ1021");
  const men = products.find(product => product.code === "BQ1003");
  assert.ok(women); assert.ok(men);
  assert.equal(matchesPriority(women, "mens"), false);
  assert.equal(matchesPriority(men, "mens"), true);
  for (const buyerChannel of ["importer_wholesaler", "online_seller", "brand_private_label", "sourcing_agent"]) {
    const matches = findProducts(products, { buyerChannel, priority: "mens", closure: "any", resultCount: 4 });
    assert.ok(matches.every(item => item.product.code !== "BQ1021"));
  }
});

test("conflicting hard preferences return no invented recommendation", () => {
  const matches = findProducts(products, { buyerChannel: "sourcing_agent", priority: "easy_on", closure: "Lace-Up", resultCount: 4 });
  assert.deepEqual(matches, []);
});

test("dial-closure matches retain their closure and give relevant sample checks", () => {
  const currentDialStyles = products.filter(p => ["BQ-LQ02412", "BQ-LQ02503"].includes(p.code));
  const matches = findProducts(currentDialStyles, { buyerChannel: "importer_wholesaler", priority: "open", closure: "Dial", resultCount: 4 });
  assert.deepEqual(new Set(matches.map(item => item.product.code)), new Set(["BQ-LQ02412", "BQ-LQ02503"]));
  for (const {product} of matches) {
    assert.match(getProductBuyingGuide(product, "zh").checks[0], /旋钮/);
    assert.match(getProductBuyingGuide(product, "en").checks[0], /Dial/);
  }
});

test("finds documented fleece options described in the product summary", () => {
  for (const code of ["BQ-LQ2132", "BQ-LQK502"]) {
    assert.equal(matchesPriority(products.find(product => product.code === code), "cold_weather"), true, code);
  }
});
