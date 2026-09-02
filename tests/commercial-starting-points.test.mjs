import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

test("publishes buyer-readable commercial screening references in both languages", async () => {
  const component = await source("app/components/CommercialStartingPoints.tsx");
  assert.match(component, /2 pairs/);
  assert.match(component, /USD 8–12 \/ pair/);
  assert.match(component, /31 days/);
  assert.match(component, /34 × 23 × 13 cm · 0\.5 kg/);
  assert.match(component, /2双/);
  assert.match(component, /8–12美元 \/ 双/);
  assert.match(component, /31天/);
});

test("keeps price, logistics, stock and order boundaries explicit", async () => {
  const component = await source("app/components/CommercialStartingPoints.tsx");
  assert.match(component, /Freight, duty, tax and local delivery are excluded/);
  assert.match(component, /not an offer, quotation, stock promise or order confirmation/);
  assert.match(component, /不构成要约、正式报价、库存承诺或订单确认/);
  assert.doesNotMatch(component, /InStock|"@type":\s*"Offer"|guaranteed delivery/i);
});

test("places commercial starting points on product, buying-guide and quote-request paths", async () => {
  const paths = [
    "app/products/[slug]/page.tsx",
    "app/zh/products/[slug]/page.tsx",
    "app/buyer-guide/page.tsx",
    "app/zh/buyer-guide/page.tsx",
    "app/request-quote/QuoteRequestBuilder.tsx",
    "app/zh/request-quote/ChineseQuoteRequestBuilder.tsx",
  ];
  for (const path of paths) {
    const page = await source(path);
    assert.match(page, /CommercialStartingPoints/, `${path} should show commercial screening references`);
  }
});
