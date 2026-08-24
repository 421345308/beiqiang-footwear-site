import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: pathname.endsWith(".xml") ? "application/xml" : "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("publishes a Chinese B2B homepage and complete 30-style catalog", async () => {
  const home = await render("/zh");
  const homeHtml = await home.text();
  assert.equal(home.status, 200);
  assert.match(homeHtml, /用30款真实产品资料，开始下一次鞋类选款/);
  assert.match(homeHtml, /30款/);
  assert.match(homeHtml, /English/);
  assert.match(homeHtml, /正式交易通过Alibaba Trade Assurance订单或双方签署合同/);

  const catalog = await render("/zh/products");
  const catalogHtml = await catalog.text();
  assert.equal(catalog.status, 200);
  assert.match(catalogHtml, /按款号、源款号或产品搜索/);
  assert.match(catalogHtml, /BQ001/);
  assert.match(catalogHtml, /BQ030/);
  assert.match(catalogHtml, /比较/);
  assert.doesNotMatch(catalogHtml, /guaranteed medical|best seller|guaranteed price/i);
});

test("keeps Chinese product evidence SKU-specific and provides conversion actions", async () => {
  const wide = await render("/zh/products/bq001");
  const wideHtml = await wide.text();
  assert.equal(wide.status, 200);
  assert.match(wideHtml, /该SKU已有宽鞋头证据/);
  assert.match(wideHtml, /加入询价单/);
  assert.match(wideHtml, /分享给采购团队/);
  assert.match(wideHtml, /提交样品 \/ 报价需求/);
  assert.match(wideHtml, /hrefLang="en"[^>]+https:\/\/www\.beiqiang\.online\/products\/bq001\//);
  assert.match(wideHtml, /hrefLang="zh-CN"[^>]+https:\/\/www\.beiqiang\.online\/zh\/products\/bq001\//);
  assert.match(wideHtml, /property="og:image"/);

  const stretch = await render("/zh/products/bq010");
  const stretchHtml = await stretch.text();
  assert.equal(stretch.status, 200);
  assert.match(stretchHtml, /弹力织物/);
  assert.match(stretchHtml, /不根据外观推断鞋楦宽度/);
  assert.doesNotMatch(stretchHtml, /该SKU已有宽鞋头证据/);
});

test("supports a Chinese multi-style sourcing brief without a retail checkout", async () => {
  const response = await render("/zh/request-quote");
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /多款B2B询价/);
  assert.match(html, /技术产品开发/);
  assert.match(html, /贸易术语/);
  assert.match(html, /我同意贝强使用这些资料审核并回复本次B2B采购需求/);
  assert.match(html, /产品价格与运费分开/);
  assert.doesNotMatch(html, /立即付款|信用卡结账|一键下单/);
});

test("publishes Chinese privacy and terms boundaries", async () => {
  const privacy = await render("/zh/privacy");
  const privacyHtml = await privacy.text();
  assert.equal(privacy.status, 200);
  assert.match(privacyHtml, /只收集处理B2B采购需求所需的信息/);
  assert.match(privacyHtml, /可选第一方分析/);
  const terms = await render("/zh/terms");
  const termsHtml = await terms.text();
  assert.equal(terms.status, 200);
  assert.match(termsHtml, /网站帮助双方准备订单，但不自动创建正式交易/);
  assert.match(termsHtml, /Alibaba Trade Assurance/);
});

test("links English and Chinese equivalents for search engines and buyers", async () => {
  const product = await render("/products/bq001");
  const html = await product.text();
  assert.equal(product.status, 200);
  assert.match(html, />中文<|>简体中文</);
  assert.match(html, /hrefLang="zh-CN"[^>]+https:\/\/www\.beiqiang\.online\/zh\/products\/bq001\//);

  const sitemap = await render("/sitemap.xml");
  const xml = await sitemap.text();
  assert.match(xml, /https:\/\/www\.beiqiang\.online\/zh\/products\/bq001\/?/);
  assert.match(xml, /https:\/\/www\.beiqiang\.online\/zh\/products\/bq030\/?/);
  assert.doesNotMatch(xml, /zh\/inquiry-status|zh\/buyer-workspace/);
});

test("includes every Chinese public route in the EdgeOne export contract", async () => {
  const exporter = await readFile(new URL("../scripts/export-edgeone-static.mjs", import.meta.url), "utf8");
  assert.match(exporter, /chineseProductRoutes/);
  assert.match(exporter, /pathname:\s*"\/zh"/);
  assert.match(exporter, /pathname:\s*"\/zh\/products"/);
  assert.match(exporter, /pathname:\s*"\/zh\/request-quote"/);
  assert.match(exporter, /zh\/products\/\$\{slug\}\/index\.html/);
});
