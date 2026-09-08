import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

async function render(path) {
  const { default: worker } = await import("../dist/server/index.js");
  const fetchPage = (url) => worker.fetch(new Request(url, { headers: { accept: "text/html" } }), {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  }, { waitUntil() {}, passThroughOnException() {} });
  let url = new URL(path, "https://www.beiqiang.online");
  let response = await fetchPage(url);
  for (let count = 0; [301, 302, 307, 308].includes(response.status) && count < 3; count++) {
    url = new URL(response.headers.get("location"), url);
    assert.equal(url.origin, "https://www.beiqiang.online");
    response = await fetchPage(url);
  }
  assert.equal(response.status, 200, path);
  return (await response.text()).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
}

test("a buyer without a selected SKU can find the direct inquiry route in either language", async () => {
  for (const prefix of ["", "/zh"]) {
    const quote = await render(`${prefix}/request-quote/`);
    assert.ok(quote.includes(`href="${prefix}/sourcing-review/"`), "quote empty state links to sourcing help");
    assert.ok(quote.includes(prefix ? "不需要款号" : "without a product code"));
    const direct = await render(`${prefix}/sourcing-review/`);
    assert.ok(direct.includes('class="inquiry-form"'), "form renders on the server without requiring finder storage");
    assert.ok(direct.includes('CATALOG-2026'), "generic inquiry uses the existing server-validated context");
    assert.ok(direct.includes(prefix ? "保密协议" : "NDA terms"), "confidential-file warning remains visible");
    assert.ok(direct.includes(prefix ? "不是下单" : "not an order"));
    assert.ok(!direct.includes('sourcing-review-loading'));
    assert.ok(direct.includes(`href="https://www.beiqiang.online${prefix}/sourcing-review/"`), "canonical remains on the main domain");
  }
});

test("optional inquiry groups use native disclosure and preserve fields and form validation", async () => {
  for (const prefix of ["", "/zh"]) {
    const quote = await render(`${prefix}/request-quote/`);
    const groups = [...quote.matchAll(/<details class="optional-inquiry-details"[^>]*>([\s\S]*?)<\/details>/g)];
    assert.equal(groups.length, 3, "readiness, contact preference and adaptation groups start collapsed");
    assert.ok(groups.some(([, inner]) => inner.includes("contact-preference-fields")));
    assert.ok(groups.some(([, inner]) => inner.includes("adaptation-brief-fields")));
    assert.ok(quote.includes('type="checkbox"') && quote.includes('required=""'), "consent and required fields retained");
    assert.ok(quote.includes('class="quote-brief-review"'), "printable quote review remains outside disclosure");
    assert.ok(quote.includes(prefix ? "邮箱与WhatsApp至少填一项" : "either email or WhatsApp"));
  }
  const source = await readFile(new URL("../app/components/OptionalInquiryDetails.tsx", import.meta.url), "utf8");
  assert.match(source, /onInvalidCapture/);
  assert.match(source, /event\.currentTarget\.open = true/);
  assert.match(source, /\{children\}/, "collapsing keeps input elements mounted");
});

test("factory and process pages explain buyer decisions without internal audit language", async () => {
  for (const prefix of ["", "/zh"]) {
    for (const slug of ["factory", "oem-odm", "quality-packing", "sample-order-process"]) {
      const html = await render(`${prefix}/${slug}/`);
      assert.ok(html.includes(`href="${prefix}/sourcing-review/"`), "all capability pages offer no-SKU consultation");
      assert.ok(!/内部询盘台账|internal inquiry ledger|冻结参考|高影响规格/.test(html));
    }
  }
});
