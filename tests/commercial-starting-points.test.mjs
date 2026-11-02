import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

test("publishes buyer-readable commercial screening references in both languages", async () => {
  const component = await source("app/components/CommercialStartingPoints.tsx");
  assert.match(component, /2-pair starting point/);
  assert.match(component, /USD 8–15 \/ pair/);
  assert.match(component, /Most wholesale styles/);
  assert.match(component, /agreed trade terms/);
  assert.match(component, /2双/);
  assert.match(component, /8–15美元 \/ 双/);
  assert.match(component, /多数批发款/);
});

test("keeps price, logistics, stock and order boundaries explicit", async () => {
  const component = await source("app/components/CommercialStartingPoints.tsx");
  assert.match(component, /availability depends on the selected styles/);
  assert.match(component, /price, availability, packaging, timing and trade terms are confirmed for each order/i);
  assert.match(component, /结合具体要求书面确认报价/);
  assert.doesNotMatch(component, /InStock|"@type":\s*"Offer"|guaranteed delivery/i);
});

test("places commercial starting points on buying-guide and quote-request paths", async () => {
  const paths = [
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
