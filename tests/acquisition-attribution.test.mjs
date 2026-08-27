import assert from "node:assert/strict";
import test from "node:test";
import { buildTrackedAcquisitionUrl, campaignSlug } from "../app/lib/acquisition-attribution.ts";

test("builds a canonical campaign link without buyer identity fields", () => {
  const result = buildTrackedAcquisitionUrl({ channel: "linkedin", destination: "/products/bq009/", campaign: "BQ009 US Importers", content: "Message A" });
  const url = new URL(result); assert.equal(url.origin, "https://www.beiqiang.online"); assert.equal(url.pathname, "/products/bq009/"); assert.equal(url.searchParams.get("utm_source"), "linkedin"); assert.equal(url.searchParams.get("utm_medium"), "social_outreach"); assert.equal(url.searchParams.get("utm_campaign"), "bq009-us-importers"); assert.equal(url.searchParams.get("utm_content"), "message-a"); assert.equal(result.includes("buyer@example.com"), false);
});

test("rejects external destinations and short campaign codes", () => {
  assert.throws(() => buildTrackedAcquisitionUrl({ channel: "email", destination: "https://example.com", campaign: "valid-campaign" }), /destination/i);
  assert.throws(() => buildTrackedAcquisitionUrl({ channel: "email", destination: "//example.com", campaign: "valid-campaign" }), /destination/i);
  assert.throws(() => buildTrackedAcquisitionUrl({ channel: "email", destination: "/products/", campaign: "x" }), /at least 3/i);
  assert.equal(campaignSlug(" Buyer Name / BQ009 "), "buyer-name-bq009");
});
