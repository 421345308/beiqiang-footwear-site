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
  assert.match(wideHtml, /联系偏好（选填）/);
  assert.match(wideHtml, /不代表已预约、自动发信或承诺回复时效/);
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
  assert.match(html, /3\. 联系偏好（选填）/);
  assert.match(html, /方便联系的当地时间/);
  assert.match(html, /产品价格与运费分开/);
  assert.match(html, /现有款调整简报/);
  assert.match(html, /Logo \/ 图稿准备状态/);
  assert.match(html, /以上均为买家目标/);
  assert.doesNotMatch(html, /立即付款|信用卡结账|一键下单/);
});

test("publishes Chinese factory trust, OEM, sample, buying-guide and line-sheet paths", async () => {
  for (const [path, heading, boundary] of [
    ["/zh/factory", /用看得见的证据开始工厂端采购沟通/, /不据此虚构产能、客户品牌或认证/],
    ["/zh/quality-packing", /在纸箱准备前，把订单要求变成可核对项目/, /检查标准与容差/],
    ["/zh/oem-odm", /两条采购路径，一个原则：先确认可行性/, /不能提前假定/],
    ["/zh/sample-order-process", /把产品兴趣转成可下单的规格/, /需要直接商业确认/],
    ["/zh/buyer-guide", /在大货开始前，弄清每一个关键决定/, /网站不收集银行卡、网银密码或验证码/],
    ["/zh/line-sheet", /一份可用于选款的目录/, /获取30款产品目录/],
  ]) {
    const response = await render(path); const html = await response.text();
    assert.equal(response.status, 200, path); assert.match(html, heading, path); assert.match(html, boundary, path);
    assert.match(html, /hrefLang="en"/i, path); assert.match(html, /hrefLang="zh-CN"/i, path);
    assert.doesNotMatch(html, /guaranteed price|guaranteed customization|medical claim|立即付款|信用卡结账/i, path);
  }
});

test("publishes Chinese sourcing programs and decision-stage buyer resources", async () => {
  for (const [path, heading, boundary] of [
    ["/zh/solutions/wholesale-walking-shoes", /步行鞋批发选款方案/, /网站图片和产品目录是最终报价吗/],
    ["/zh/solutions/private-label-walking-shoes", /从已有产品证据开始的私标步行鞋项目/, /所有改动都能做/],
    ["/zh/solutions/oem-knit-shoes", /OEM针织步行鞋开发先从可核对的技术需求开始/, /买家目标、已确认能力、固定项/],
    ["/zh/resources", /把产品兴趣整理成供应商可以审核的采购需求/, /指南能改善需求，但不能确认产品/],
    ["/zh/resources/footwear-rfq-checklist", /进口商与批发买家的鞋类询价清单/, /未知项可以标记为待确认/],
    ["/zh/resources/shoe-sample-approval-checklist", /大货生产前的鞋类样品审核清单/, /样品通过.*没有足够意义/],
    ["/zh/resources/private-label-walking-shoes-sourcing-guide", /私标步行鞋：从产品候选到正式订单/, /不是信用卡结账/],
  ]) {
    const response = await render(path); const html = await response.text();
    assert.equal(response.status, 200, path); assert.match(html, heading, path); assert.match(html, boundary, path);
    assert.match(html, /hrefLang="en"/i, path); assert.match(html, /hrefLang="zh-CN"/i, path);
    assert.match(html, /建立|询价|采购/, path);
    assert.doesNotMatch(html, /保证价格|保证定制|销量第一|保证治疗|保证矫形|立即付款|一键下单/i, path);
  }
});

test("publishes three Chinese product collections with SKU evidence boundaries", async () => {
  for (const [path, heading, boundary] of [
    ["/zh/collections/wide-toe-box", /已有SKU证据的宽鞋头步行鞋/, /不代表所有贝强鞋款均为宽鞋头/],
    ["/zh/collections/knit-slip-on", /针织与织物套穿步行鞋/, /材料、可用颜色、尺码、包装与商业条件/],
    ["/zh/collections/breathable-lace-up", /针织、网布与织物系带步行鞋/, /不代表防水、医疗、测试性能/],
  ]) {
    const response = await render(path); const html = await response.text();
    assert.equal(response.status, 200, path); assert.match(html, heading, path); assert.match(html, boundary, path);
    assert.match(html, /建立多款询价/, path); assert.match(html, /hrefLang="en"/i, path); assert.match(html, /hrefLang="zh-CN"/i, path);
    assert.match(html, /CollectionPage/, path); assert.match(html, /ItemList/, path);
    assert.doesNotMatch(html, /保证价格|保证定制|销量第一|保证治疗|保证矫形|立即付款|一键下单/i, path);
  }

  const english = await render("/collections/wide-toe-box");
  const englishHtml = await english.text();
  assert.match(englishHtml, /hrefLang="zh-CN"[^>]+\/zh\/collections\/wide-toe-box\//);
  assert.match(englishHtml, /\/request-quote\//);
});

test("publishes Chinese privacy and terms boundaries", async () => {
  const privacy = await render("/zh/privacy");
  const privacyHtml = await privacy.text();
  assert.equal(privacy.status, 200);
  assert.match(privacyHtml, /只收集处理B2B采购需求所需的信息/);
  assert.match(privacyHtml, /可选第一方分析/);
  assert.match(privacyHtml, /回复偏好与站外沟通记录/);
  assert.match(privacyHtml, /不证明消息送达、邮件打开、身份、同意、付款或订单/);
  const terms = await render("/zh/terms");
  const termsHtml = await terms.text();
  assert.equal(terms.status, 200);
  assert.match(termsHtml, /网站帮助双方准备订单，但不自动创建正式交易/);
  assert.match(termsHtml, /Alibaba Trade Assurance/);
});

test("publishes noindex Chinese buyer status and multi-project workspace entry points", async () => {
  const status = await render("/zh/inquiry-status");
  const statusHtml = await status.text();
  assert.equal(status.status, 200);
  assert.match(statusHtml, /用私密查询码查看采购项目进度/);
  assert.match(statusHtml, /询盘编号识别项目，私密查询码保护项目/);
  assert.match(statusHtml, /name="robots" content="noindex, nofollow/i);
  assert.match(statusHtml, /href="\/inquiry-status\/"[^>]*><b>English/);

  const workspace = await render("/zh/buyer-workspace");
  const workspaceHtml = await workspace.text();
  assert.equal(workspace.status, 200);
  assert.match(workspaceHtml, /用一个邮箱查看多个采购项目/);
  assert.match(workspaceHtml, /15分钟一次性邮件链接/);
  assert.match(workspaceHtml, /公司名或邮箱域名相似不会自动授权/);
  assert.match(workspaceHtml, /name="robots" content="noindex, nofollow/i);
  assert.match(workspaceHtml, /href="\/buyer-workspace\/"[^>]*><b>English/);
});

test("keeps the complete Chinese buyer decision center on the protected project APIs", async () => {
  const source = await readFile(new URL("../app/zh/inquiry-status/ChineseTransactionCenter.tsx", import.meta.url), "utf8");
  for (const endpoint of [
    "/api/recommendation-response",
    "/api/sample-response",
    "/api/quotation-response",
    "/api/order-setup-request",
    "/api/order-change-response",
    "/api/order-document",
    "/api/fulfillment-case-response",
    "/api/delivery-feedback",
    "/api/repeat-order-request",
  ]) assert.match(source, new RegExp(endpoint.replaceAll("/", "\\/")));
  assert.match(source, /按本版接受报价/);
  assert.match(source, /批准本轮实物样品/);
  assert.match(source, /申请准备正式订单/);
  assert.match(source, /接受该订单变更/);
  assert.match(source, /报告收货问题/);
  assert.match(source, /上一订单的价格、库存、材料、尺码配比、包装和交期不会自动沿用/);
  assert.match(source, /正式Trade Assurance订单或双方合同/);
  assert.doesNotMatch(source, /credit card checkout|instant purchase|guaranteed stock/i);
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
  assert.match(xml, /https:\/\/www\.beiqiang\.online\/zh\/factory\/?/);
  assert.match(xml, /https:\/\/www\.beiqiang\.online\/zh\/line-sheet\/?/);
  assert.match(xml, /https:\/\/www\.beiqiang\.online\/zh\/resources\/footwear-rfq-checklist\/?/);
  assert.match(xml, /https:\/\/www\.beiqiang\.online\/zh\/solutions\/private-label-walking-shoes\/?/);
  assert.match(xml, /https:\/\/www\.beiqiang\.online\/zh\/collections\/wide-toe-box\/?/);
  assert.match(xml, /https:\/\/www\.beiqiang\.online\/zh\/collections\/knit-slip-on\/?/);
  assert.match(xml, /https:\/\/www\.beiqiang\.online\/zh\/collections\/breathable-lace-up\/?/);
  assert.doesNotMatch(xml, /zh\/inquiry-status|zh\/buyer-workspace/);
});

test("includes every Chinese public route in the EdgeOne export contract", async () => {
  const exporter = await readFile(new URL("../scripts/export-edgeone-static.mjs", import.meta.url), "utf8");
  assert.match(exporter, /chineseProductRoutes/);
  assert.match(exporter, /chineseCollectionRoutes/);
  assert.match(exporter, /pathname:\s*"\/zh"/);
  assert.match(exporter, /pathname:\s*"\/zh\/products"/);
  assert.match(exporter, /pathname:\s*"\/zh\/request-quote"/);
  assert.match(exporter, /pathname:\s*"\/zh\/inquiry-status"/);
  assert.match(exporter, /pathname:\s*"\/zh\/buyer-workspace"/);
  assert.match(exporter, /chineseCapabilityRoutes/);
  assert.match(exporter, /chineseSolutionRoutes/);
  assert.match(exporter, /chineseResourceRoutes/);
  assert.match(exporter, /pathname:\s*"\/zh\/resources"/);
  for (const slug of ["line-sheet", "factory", "quality-packing", "oem-odm", "sample-order-process", "buyer-guide"]) assert.match(exporter, new RegExp(`"${slug}"`));
  assert.match(exporter, /zh\/products\/\$\{slug\}\/index\.html/);
  assert.match(exporter, /zh\/collections\/\$\{slug\}\/index\.html/);
});

test("keeps the mobile language switch on the matching page", async () => {
  const header = await readFile(new URL("../app/components/ChineseSiteHeader.tsx", import.meta.url), "utf8");
  const mobile = await readFile(new URL("../app/components/ChineseMobileNavigation.tsx", import.meta.url), "utf8");
  const selector = await readFile(new URL("../app/components/LanguageSelector.tsx", import.meta.url), "utf8");
  assert.match(header, /ChineseMobileNavigation englishHref=\{englishHref\}/);
  assert.match(header, /LanguageSelector locale="zh" alternateHref=\{englishHref\}/);
  assert.match(mobile, /href=\{englishHref\}/);
  assert.match(mobile, /hrefLang="en"/);
  assert.match(mobile, /语言 \/ Language/);
  assert.match(selector, /href=\{alternateHref\}/);
  assert.match(selector, /简体中文/);
  assert.match(selector, /English/);
});

test("consent banner follows the public page language", async () => {
  const source = await readFile(new URL("../app/components/ConsentBanner.tsx", import.meta.url), "utf8");
  assert.match(source, /pathname\.startsWith\("\/zh\/"\)/);
  assert.match(source, /你的隐私选择/);
  assert.match(source, /仅使用必要功能/);
  assert.match(source, /同意站内统计/);
  assert.match(source, /href="\/zh\/privacy\/"/);
  assert.match(source, /Your privacy choice/);
});
