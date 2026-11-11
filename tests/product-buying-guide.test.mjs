import assert from "node:assert/strict";
import test from "node:test";
import { products, heldSourceProducts } from "../app/data/products.ts";
import { getProductBuyingGuide, getRelatedProducts } from "../app/lib/product-buying-guide.ts";

const product = (code) => products.find((item) => item.code === code);

test("sample guidance follows each style's recorded construction, not universal fit claims", () => {
  for (const locale of ["en", "zh"]) {
    for (const item of products) {
      const guide = getProductBuyingGuide(item, locale);
      assert.doesNotMatch(guide.shape, /供应商|supplier/i);
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
  assert.match(getProductBuyingGuide(product("BQ-LQ052")).checks[0], /Lacing/);
  assert.match(getProductBuyingGuide(product("BQ-LQ052"), "zh").checks[0], /系带/);
  assert.doesNotMatch(getProductBuyingGuide(product("BQ-LQ052")).checks[0], /Moulded lace-look/);
  assert.match(getProductBuyingGuide(product("BQ1048")).checks[0], /Moulded lace-look/);
  assert.match(getProductBuyingGuide(product("BQ1021")).checks[0], /Hook-and-loop straps/);
  assert.match(getProductBuyingGuide(product("BQ1021"), "zh").checks[0], /魔术贴/);
  assert.match(getProductBuyingGuide(product("BQ-LQ2633")).checks[0], /Toggle cord/);
  assert.match(getProductBuyingGuide(product("BQ-LQ2633"), "zh").checks[0], /抽绳扣/);
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
  const ventedLaceUp = product("BQ-LQ052");
  const relatedVented = getRelatedProducts(ventedLaceUp, products);
  assert.equal(relatedVented.length, 3);
  assert.ok(relatedVented.every((candidate) => candidate.fitEvidence === "wide_toe_verified"));
  assert.ok(relatedVented.every((candidate) => !(candidate.closure === "Slip-On" && candidate.collections.includes("clogs-and-vented-shoes"))));
  assert.deepEqual(getRelatedProducts(heldSourceProducts[0], products), []);
  assert.equal(getRelatedProducts(product("BQ009"), products, 1).length, 1);
});

test("bilingual product pages expose sampling checks and sourcing links as server-rendered text", async () => {
  const { default: worker } = await import("../dist/server/index.js");
  for (const prefix of ["", "/zh"]) {
    for (const code of ["bq001", "bq006", "bq016", "bq029", "bq031", "bq-lq052", "bq1021", "bq-lq2633"]) {
      const response = await worker.fetch(new Request(`http://localhost${prefix}/products/${code}`, { headers: { accept: "text/html" } }), {
        ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
      }, { waitUntil() {}, passThroughOnException() {} });
      assert.equal(response.status, 200);
      const html = (await response.text()).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
      const guide = html.match(/<section[^>]+product-buying-guide[\s\S]*?<\/section>/)?.[0];
      assert.ok(guide, `${prefix}/${code}: guide present outside scripts`);
      if (code === "bq-lq052") {
        assert.match(guide, prefix ? /系带：/ : /Lacing:/);
        assert.doesNotMatch(guide, prefix ? /仿鞋带装饰/ : /Moulded lace-look/);
      }
      if (code === "bq1021") assert.match(guide, prefix ? /魔术贴/ : /Hook-and-loop straps/);
      if (code === "bq-lq2633") assert.match(guide, prefix ? /抽绳扣/ : /Toggle cord/);
      assert.ok(guide.includes(prefix ? "不是本款已通过检测的声明" : "not test results for this style"));
      assert.ok(guide.includes('href="#inquiry"'));
      for (const slug of ["wholesale-walking-shoes", "private-label-walking-shoes", "oem-knit-shoes"]) {
        assert.ok(guide.includes(`href="${prefix}/solutions/${slug}/"`));
      }
    }
  }
});
