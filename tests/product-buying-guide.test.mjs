import assert from "node:assert/strict";
import test from "node:test";
import { products, heldSourceProducts } from "../app/data/products.ts";
import { getProductBuyingGuide, getRelatedProducts } from "../app/lib/product-buying-guide.ts";

const product = (code) => products.find((item) => item.code === code);

test("sample guidance follows each style's recorded construction, not universal fit claims", () => {
  for (const locale of ["en", "zh"]) {
    for (const item of products) {
      const guide = getProductBuyingGuide(item, locale);
      assert.equal(guide.checks.length, 3);
      assert.ok(guide.order.includes(item.size));
      assert.ok(guide.order.includes(String(item.colors.length)));
      if (item.fitEvidence !== "wide_toe_verified") {
        assert.doesNotMatch(guide.shape, /This style has a wide toe box|这款为宽鞋头设计/);
      }
    }
  }
  assert.match(getProductBuyingGuide(product("BQ001")).checks[0], /Entry and hold/);
  assert.match(getProductBuyingGuide(product("BQ031")).checks[0], /Lacing/);
  assert.match(getProductBuyingGuide(product("BQ016"), "zh").shape, /不要只凭EU码数推算适用年龄/);
  assert.match(getProductBuyingGuide(product("BQ029"), "zh").shape, /高帮结构/);
  assert.match(getProductBuyingGuide(product("BQ006"), "zh").checks[1], /普通还是加绒版本/);
  assert.doesNotMatch(getProductBuyingGuide(product("BQ009"), "zh").checks[1], /加绒/);
});

test("related styles separate children and adults and respect confirmed wide-toe selection", () => {
  assert.deepEqual(getRelatedProducts(product("BQ016"), products).map((item) => item.code), ["BQ030"]);
  assert.deepEqual(getRelatedProducts(product("BQ030"), products).map((item) => item.code), ["BQ016"]);
  for (const item of products) {
    const related = getRelatedProducts(item, [...products, ...heldSourceProducts]);
    assert.ok(related.length <= 3);
    assert.ok(related.every((candidate) => candidate.code !== item.code));
    assert.ok(related.every((candidate) => /kids/i.test(candidate.group) === /kids/i.test(item.group)));
    assert.ok(related.every((candidate) => products.some((current) => current.code === candidate.code)));
    if (item.fitEvidence === "wide_toe_verified") {
      assert.equal(related.length, Math.min(3, products.filter(p=>p.fitEvidence === 'wide_toe_verified').length - 1));
      assert.ok(related.every((candidate) => candidate.fitEvidence === "wide_toe_verified"));
    }
  }
  assert.deepEqual(getRelatedProducts(heldSourceProducts[0], products), []);
  assert.equal(getRelatedProducts(product("BQ009"), products, 1).length, 1);
});

test("bilingual product pages expose sampling checks and sourcing links as server-rendered text", async () => {
  const { default: worker } = await import("../dist/server/index.js");
  for (const prefix of ["", "/zh"]) {
    for (const code of ["bq001", "bq006", "bq016", "bq029", "bq031"]) {
      const response = await worker.fetch(new Request(`http://localhost${prefix}/products/${code}`, { headers: { accept: "text/html" } }), {
        ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
      }, { waitUntil() {}, passThroughOnException() {} });
      assert.equal(response.status, 200);
      const html = (await response.text()).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
      const guide = html.match(/<section[^>]+product-buying-guide[\s\S]*?<\/section>/)?.[0];
      assert.ok(guide, `${prefix}/${code}: guide present outside scripts`);
      assert.ok(guide.includes(prefix ? "不是本款已通过检测的声明" : "not test results for this style"));
      assert.ok(guide.includes('href="#inquiry"'));
      for (const slug of ["wholesale-walking-shoes", "private-label-walking-shoes", "oem-knit-shoes"]) {
        assert.ok(guide.includes(`href="${prefix}/solutions/${slug}/"`));
      }
    }
  }
});
