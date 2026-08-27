import assert from "node:assert/strict";
import test from "node:test";
import { stat } from "node:fs/promises";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

test("server-renders the Beiqiang B2B sourcing page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /A complete walking-shoe range for your next market test/);
  assert.match(html, /View the complete catalogue/);
  assert.match(html, /421345308@qq\.com/);
  assert.match(html, /8618959805256/);
  assert.match(html, /Open buyer menu/i);
  assert.match(html, /aria-controls="mobile-buyer-menu"/i);
  assert.match(html, /\/catalog-web\/bq009\/01_main\.webp/i);
  assert.match(html, /\/videos\/beiqiang-factory-proof\.webm/i);
  assert.match(html, /\/videos\/beiqiang-factory-proof\.mp4/i);
  assert.match(html, /\/videos\/beiqiang-factory-proof-poster\.jpg/i);
  assert.match(html, /\/og\.jpg/i);
  assert.doesNotMatch(html, /orthopedic|medical|podiatrist|bunion friendly/i);
});

test("server-renders the complete searchable product catalogue", async () => {
  const response = await render("/products");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Compare all 30 documented styles/i);
  assert.match(html, /Compare styles/i);
  assert.match(html, /BQ001/);
  assert.match(html, /BQ030/);
  assert.doesNotMatch(html, /Tier [A-E]/i);
  assert.doesNotMatch(html, /orthopedic|medical|podiatrist|bunion friendly/i);
});

test("server-renders the gated 30-style line-sheet lead path", async () => {
  const response = await render("/line-sheet");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /30(?:<!-- -->)? styles[\s\S]*One buyer-ready shortlist/i);
  assert.match(html, /Unlock the 30-style PDF/i);
  assert.match(html, /product-discovery document, not a quotation/i);
  assert.doesNotMatch(html, /Tier [A-E]|A-level|B-level|guaranteed price|medical|orthopedic/i);
  const pdf = await stat(new URL("../public/downloads/beiqiang-footwear-line-sheet-2026.pdf", import.meta.url));
  assert.equal(pdf.size > 1_000_000, true);
});

test("server-renders the multi-style quote and technical development path", async () => {
  const response = await render("/request-quote");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Build one order brief across your shortlisted styles/i);
  assert.match(html, /Existing style adaptation/i);
  assert.match(html, /Technical product development/i);
  assert.match(html, /Buyer target values are reviewed as development requirements/i);
  assert.match(html, /Delivery and trade-term preference/i);
  assert.match(html, /Request DDP review/i);
  assert.match(html, /Response preferences \(optional\)/i);
  assert.match(html, /Preferred contact channel/i);
  assert.match(html, /do not create an appointment/i);
  assert.match(html, /customs clearance, duty, tax and local delivery are not promised/i);
  assert.match(html, /Existing-style adaptation brief/i);
  assert.match(html, /Logo \/ artwork readiness/i);
  assert.match(html, /buyer targets, not confirmed production specifications/i);
  assert.doesNotMatch(html, /guaranteed hardness|guaranteed test|medical|orthopedic/i);
});

test("server-renders the B2B buyer and trade-term guide", async () => {
  const response = await render("/buyer-guide");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Know every decision before a bulk order starts/i);
  assert.match(html, /EXW[\s\S]*FOB[\s\S]*FCA[\s\S]*DDP quote request/i);
  assert.match(html, /accepting a quotation create an order/i);
  assert.match(html, /does not collect card details, bank passwords or verification codes/i);
  assert.doesNotMatch(html, /guaranteed customs|free shipping|FOB includes door|medical|orthopedic/i);
});

test("server-renders the private buyer inquiry status lookup", async () => {
  const response = await render("/inquiry-status");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Check the next step without exposing internal records/i);
  assert.match(html, /Inquiry reference/i);
  assert.match(html, /Status access code/i);
  assert.match(html, /noindex/i);
  assert.doesNotMatch(html, /internalNote|accessTokenHash|INQUIRY_ADMIN_TOKEN/);
});

test("server-renders the secure multi-project buyer workspace", async () => {
  const response = await render("/buyer-workspace");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /One view for every sourcing project/i);
  assert.match(html, /15-minute one-time email link/i);
  assert.match(html, /Project-specific contact access/i);
  assert.match(html, /Private code still required for decisions/i);
  assert.match(html, /response is the same whether or not an email exists/i);
  assert.match(html, /noindex/i);
  assert.doesNotMatch(html, /accessTokenHash|internalNote|INQUIRY_ADMIN_TOKEN/);
});

test("server-renders the verified BQ001 product page", async () => {
  const response = await render("/products/bq001");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Wide Toe Box Knit Slip-On Walking Shoes/i);
  assert.match(html, /\/catalog-web\/bq001\/01_main\.webp/i);
  assert.match(html, /\/catalog-thumbs\/bq\d{3}\.webp/i);
  assert.match(html, /EU 36-46/);
  assert.match(html, /Knitted textile upper/);
  assert.match(html, /Print \/ save product sheet/i);
  assert.match(html, /Share with your buying team/i);
  assert.match(html, /WhatsApp[\s\S]*Email[\s\S]*Copy link/i);
  assert.match(html, /property="og:image" content="https:\/\/www\.beiqiang\.online\/catalog-web\/bq001\/01_main\.webp"/i);
  assert.match(html, /name="twitter:image" content="https:\/\/www\.beiqiang\.online\/catalog-web\/bq001\/01_main\.webp"/i);
  assert.match(html, /SOURCING REVIEW[\s\S]*NOT A QUOTATION/i);
  assert.match(html, /Confirm before quotation or order/i);
  assert.match(html, /www\.beiqiang\.online\/products\/bq001\//i);
  assert.match(html, /BQ001 sample \/ quotation request/);
  assert.doesNotMatch(html, /orthopedic|medical|podiatrist|waterproof/i);
});

test("server-renders the verified BQ002 product page", async () => {
  const response = await render("/products/bq002");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Extra Wide Toe Box Knit Slip-On Walking Shoes/i);
  assert.match(html, /Grey White, Grey Black, Grey Khaki/i);
  assert.doesNotMatch(html, /orthopedic|medical|podiatrist|waterproof/i);
});

test("server-renders the evidence-led BQ009 L1026 product page", async () => {
  const response = await render("/products/bq009");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Breathable Mesh Thick-Sole Athletic Walking Shoes/i);
  assert.match(html, /L1026/);
  assert.match(html, /1601825074604/);
  assert.match(html, /Open BQ009 on Alibaba\.com/);
  assert.match(html, /Upper, outsole and lining materials/i);
  assert.doesNotMatch(html, /orthopedic foot support|bunion friendly|anatomical wide toe box/i);
});

test("server-renders lower-tier products conservatively", async () => {
  const response = await render("/products/bq030");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Kids Mesh Lace-Up Walking Shoes/);
  assert.match(html, /Kids compliance and age positioning/);
  assert.doesNotMatch(html, /orthopedic|medical|podiatrist|bunion friendly/i);
});

test("uses the Alibaba store fallback only when a product has no mapped listing", async () => {
  const response = await render("/products/bq014");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /View Beiqiang Alibaba\.com store/);
  assert.doesNotMatch(html, /Open BQ014 on Alibaba\.com/);
});

test("server-renders buyer-intent collection pages", async () => {
  const response = await render("/collections/knit-slip-on");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Knit slip-on walking shoes/);
  assert.match(html, /Compare styles before you request samples/);
  assert.match(html, /program=collection-knit-slip-on/);
  assert.match(html, /CollectionTracking-/);
});

for (const [slug, expectedTitle, expectedBoundary] of [
  ["wholesale-walking-shoes", /Wholesale walking shoes for importers and online sellers/i, /not as claims of sales volume/i],
  ["private-label-walking-shoes", /Private-label walking shoes built from a documented base style/i, /not a guarantee that every logo/i],
  ["oem-knit-shoes", /OEM knit walking-shoe development starts with a controlled brief/i, /do not prove that a new technical target/i],
]) {
  test(`server-renders the ${slug} commercial sourcing program`, async () => {
    const response = await render(`/solutions/${slug}`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, expectedTitle);
    assert.match(html, expectedBoundary);
    assert.match(html, /Turn product interest into a decision-ready inquiry/i);
    assert.match(html, /application\/ld\+json/i);
    assert.doesNotMatch(html, /medical|orthopedic|guaranteed customs|guaranteed customization/i);
  });
}

for (const [pathname, expected] of [
  ["/factory", /factory-side sourcing conversation/i],
  ["/quality-packing", /Make order details visible/i],
  ["/oem-odm", /confirm feasibility first/i],
  ["/sample-order-process", /order-ready specification/i],
]) {
  test(`server-renders the ${pathname} trust page`, async () => {
    const response = await render(pathname);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, expected);
    assert.match(html, /421345308@qq\.com/);
    assert.doesNotMatch(html, /certified|million pairs|medical|orthopedic|guaranteed customization/i);
  });
}

test("server-renders the protected inquiry ledger shell", async () => {
  const response = await render("/admin/inquiries");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Inquiry &amp; order pipeline/);
  assert.match(html, /Dashboard access token/);
  assert.match(html, /Buyer relationship memory/i);
  assert.match(html, /Repeat-account signals only/i);
  assert.match(html, /Commercial-review ready/i);
  assert.match(html, /Brief readiness/i);
  assert.match(html, /Readiness score/i);
  assert.match(html, /Samples awaiting buyer/i);
  assert.match(html, /Buyer-safe reply starters remain drafts/i);
  assert.match(html, /今日成交工作台/);
  assert.match(html, /可追踪获客链接与渠道质量/);
  assert.match(html, /运营优先级只说明/);
  assert.match(html, /销售执行与管道健康/);
  assert.match(html, /不可覆盖聚合快照/);
  assert.match(html, /不是收入预测或成交概率/);
  assert.match(html, /Export pipeline CSV/);
});

test("server-renders privacy and B2B terms with conservative transaction boundaries", async () => {
  const privacy = await render("/privacy"); const privacyHtml = await privacy.text();
  assert.equal(privacy.status, 200); assert.match(privacyHtml, /Optional first-party analytics/i); assert.match(privacyHtml, /Repeat-order and next-project records/i); assert.match(privacyHtml, /active project-specific contact authorizations/i); assert.match(privacyHtml, /one-way email hash/i); assert.match(privacyHtml, /necessary service and security events/i); assert.match(privacyHtml, /Response preferences and external contact records/i); assert.match(privacyHtml, /do not prove delivery, email opening, identity, agreement, payment or an order/i); assert.match(privacyHtml, /request deletion/i); assert.doesNotMatch(privacyHtml, /fully compliant|certified compliance/i);
  const terms = await render("/terms"); const termsHtml = await terms.text();
  assert.equal(terms.status, 200); assert.match(termsHtml, /Product discovery is not an automatic order/i); assert.match(termsHtml, /Repeat orders and future projects/i); assert.match(termsHtml, /explicitly authorized project contact/i); assert.match(termsHtml, /does not request website visitors to enter card/i);
});

test("explains that adaptation briefs are buyer targets rather than confirmed production facts", async () => {
  const response = await render("/privacy"); const html = await response.text();
  assert.equal(response.status, 200); assert.match(html, /Existing-style adaptation brief/i); assert.match(html, /do not prove manufacturing feasibility/i);
});
