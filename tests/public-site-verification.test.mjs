import assert from "node:assert/strict";
import test from "node:test";
import {
  formatReport,
  inspectText,
  normalizeOrigin,
  verifyPublicSite,
} from "../scripts/verify-public-site.mjs";

test("normalizes the public origin and rejects non-http protocols", () => {
  assert.equal(normalizeOrigin("https://www.beiqiang.online/products/"), "https://www.beiqiang.online");
  assert.throws(() => normalizeOrigin("file:///tmp/site"), /http or https/i);
});

test("reports required and forbidden content independently", () => {
  assert.deepEqual(inspectText("BQ061 ready", [/BQ061/, /AA811/], [/SKU evidence/i]), {
    missing: ["/AA811/"],
    forbidden: [],
  });
  assert.deepEqual(inspectText("SKU evidence", [], [/SKU evidence/i]), {
    missing: [],
    forbidden: ["/SKU evidence/i"],
  });
});

test("checks every public acquisition route and produces an actionable failure report", async () => {
  const content = {
    "/": "Quanzhou Beiqiang Footwear >Products< >Programs< >Verify< >How to buy< Buyer workspace context-contact-dock Full inquiry /request-quote/ 421345308@qq.com",
    "/zh/": "泉州鞋类工厂供应商 >产品选款< >采购方案< >了解工厂< >如何采购< 买家工作台 context-contact-dock 完整询价 /zh/request-quote/",
    "/products/": "Walking and casual shoes for wholesale BQ031 START BY SOURCING DIRECTION",
    "/zh/products/": "31 BQ031 采购方向",
    "/products/bq031/": "BQ031 ZX2116 Mesh knitted textile upper /request-quote/",
    "/collections/high-top-shoes/": "High-top and sock-style casual shoes recorded silhouette collection-high-top-shoes",
    "/zh/collections/high-top-shoes/": "高帮与袜套式休闲鞋采购选款 仍需逐款确认 collection-high-top-shoes",
    "/collections/kids-shoes/": "Kids casual and walking shoe styles does not confirm age grading collection-kids-shoes",
    "/zh/collections/kids-shoes/": "儿童休闲与步行鞋批发选款 不等于年龄分级 collection-kids-shoes",
    "/collections/extended-size-shoes/": "documented extended EU size directions is not current stock collection-extended-size-shoes",
    "/zh/collections/extended-size-shoes/": "延伸至较大欧码 不是现货 collection-extended-size-shoes",
    "/collections/fleece-lined-shoes/": "documented fleece-lined color options may apply only to selected colors collection-fleece-lined-shoes",
    "/zh/collections/fleece-lined-shoes/": "已有加绒颜色方向 可能只适用于个别颜色 collection-fleece-lined-shoes",
    "/robots.txt": "User-agent: Googlebot\nUser-agent: OAI-SearchBot\nUser-agent: ChatGPT-User\nDisallow: /admin/\nDisallow: /buyer-workspace/\nDisallow: /inquiry-status/\nSitemap: https://www.beiqiang.online/sitemap.xml",
    "/sitemap.xml": '<loc>https://www.beiqiang.online/products/bq031/</loc><xhtml:link hreflang="zh-CN"/><image:loc>x</image:loc><video:content_loc>x</video:content_loc>',
    "/llms.txt": "31 organized product pages BQ031 / ZX2116 Alibaba Trade Assurance or a signed bilateral contract 421345308@qq.com",
  };
  const fetchImpl = async (url) => new Response(content[new URL(url).pathname] || "missing", { status: content[new URL(url).pathname] ? 200 : 404 });
  const passing = await verifyPublicSite("https://www.beiqiang.online", { fetchImpl });
  assert.equal(passing.ok, true);
  assert.equal(passing.passed, 16);

  const failing = await verifyPublicSite("https://www.beiqiang.online", { fetchImpl: async () => new Response("", { status: 503 }) });
  assert.equal(failing.ok, false);
  assert.match(formatReport(failing), /FAIL \/products\/ status=503 missing=/);
});
