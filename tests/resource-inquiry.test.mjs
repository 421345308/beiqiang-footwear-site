import assert from "node:assert/strict";
import test from "node:test";
import { buyerResources } from "../app/data/resources.ts";
import { chineseBuyerResources } from "../app/data/resources-zh.ts";
import { findInquiryResource, resourceFromProgram, resourceInquiryHref } from "../app/lib/resource-inquiry.ts";
import { products } from "../app/data/products.ts";
import { mergeSharedQuoteList, parseSharedQuoteCodes } from "../app/lib/quote-list-share.ts";
import { validateInquiry } from "../edgeone-deploy/cloud-functions/api/inquiries.js";

test("a general guide CTA needs no selected product and retains a recognized inquiry source", () => {
  for (const locale of ["en", "zh"]) {
    const resources = locale === "zh" ? chineseBuyerResources : buyerResources;
    for (const resource of resources) {
      const url = new URL(resourceInquiryHref(resource, locale), "https://www.beiqiang.online");
      assert.equal(url.pathname, `${locale === "zh" ? "/zh" : ""}/sourcing-review/`);
      assert.equal(url.searchParams.get("resource"), resource.slug);
      assert.equal(url.searchParams.has("shortlist"), false);
      const origin = `resource-${resource.slug}`;
      assert.equal(resourceFromProgram(origin, resources)?.title, resource.title);
      const result = validateInquiry({ name: "Test Buyer", company: "Test Company", market: "US", quantity: "To discuss", email: "buyer@example.com", consent: true, styleCode: "CATALOG-2026", context: "sourcing_review", sourcingProgram: origin, formStartedAt: Date.now() - 5000 });
      assert.equal(result.error, undefined);
      assert.equal(result.inquiry.sourcingProgram, origin);
    }
  }
});

test("an explicit guide product CTA imports only that real style and preserves existing buyer details", () => {
  for (const resource of buyerResources) {
    for (const code of resource.relatedProductCodes) {
      assert.ok(products.some((product) => product.code === code), `${code} lacks a published product`);
      const url = new URL(resourceInquiryHref(resource, "en", code), "https://www.beiqiang.online");
      assert.equal(url.pathname, "/request-quote/");
      const codes = parseSharedQuoteCodes(url.searchParams.get("shortlist"), products.map((product) => product.code));
      assert.deepEqual(codes, [code]);
      const first = mergeSharedQuoteList([], codes, products);
      assert.equal(first.imported, 1);
      assert.equal(first.lines[0].quantity, "");
      const entered = { ...first.lines[0], quantity: "120", colors: "Buyer's color", notes: "Sample review requested" };
      const again = mergeSharedQuoteList([entered], codes, products);
      assert.equal(again.imported, 0);
      assert.deepEqual(again.lines, [entered]);
    }
  }
});

test("invalid sources and unrelated styles cannot become selected products or guide instructions", () => {
  assert.equal(findInquiryResource("<script>alert(1)</script>", buyerResources), null);
  assert.equal(resourceFromProgram("resource-invented-page", buyerResources), null);
  assert.equal(resourceFromProgram("private-label-walking-shoes", buyerResources), null);
  for (const code of ["BQ999", "BQ001<script>", "bq001", "BQ001,BQ002"]) {
    const url = new URL(resourceInquiryHref(buyerResources[0], "en", code), "https://www.beiqiang.online");
    assert.equal(url.pathname, "/sourcing-review/");
    assert.equal(url.searchParams.has("shortlist"), false);
  }
});

async function render(pathname) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

test("all bilingual guides publish both the no-code inquiry path and explicit product quote paths", async () => {
  for (const locale of ["en", "zh"]) {
    for (const resource of locale === "zh" ? chineseBuyerResources : buyerResources) {
      const response = await render(`${locale === "zh" ? "/zh" : ""}/resources/${resource.slug}`);
      assert.equal(response.status, 200);
      const html = await response.text();
      assert.ok(html.includes(`href="${resourceInquiryHref(resource, locale)}"`), `${resource.slug} lacks the no-style route`);
      for (const code of resource.relatedProductCodes) {
        const href = resourceInquiryHref(resource, locale, code).replaceAll("&", "&amp;");
        assert.ok(html.includes(`href="${href}"`), `${locale}/${resource.slug} has no explicit quote path for ${code}`);
      }
    }
  }
});
