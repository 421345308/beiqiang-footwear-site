import assert from "node:assert/strict";
import test from "node:test";
import { buyerTypeFromFinder, finderBriefLabels, salesChannelFromFinder, sanitizeProductFinderBrief } from "../app/lib/product-finder-brief.ts";

test("keeps only bounded product-finder sourcing facts", () => {
  const result = sanitizeProductFinderBrief({ mode: "matched_shortlist", buyerChannel: "online_seller", priority: "easy_on", closure: "Slip-On", styleCodes: ["bq001", "BQ001", "BQ002", "bad", "BQ003", "BQ004", "BQ005"], inventedCapability: "confirmed" });
  assert.deepEqual(result, { mode: "matched_shortlist", buyerChannel: "online_seller", priority: "easy_on", closure: "Slip-On", styleCodes: ["BQ001", "BQ002", "BQ003", "BQ004"] });
  assert.equal("inventedCapability" in result, false);
});

test("rejects incomplete or unsupported finder briefs", () => {
  assert.equal(sanitizeProductFinderBrief({ buyerChannel: "consumer", priority: "bestseller", closure: "zip", styleCodes: ["BQ001"] }), null);
  assert.equal(sanitizeProductFinderBrief({ buyerChannel: "sourcing_agent", priority: "open", closure: "any", styleCodes: [] }), null);
});

test("keeps a human-review brief without forcing candidate products", () => {
  assert.deepEqual(sanitizeProductFinderBrief({ mode: "human_review", buyerChannel: "sourcing_agent", priority: "kids", closure: "Slip-On", styleCodes: [] }), { mode: "human_review", buyerChannel: "sourcing_agent", priority: "kids", closure: "Slip-On", styleCodes: [] });
});

test("maps finder context to editable quote-form defaults and bilingual labels", () => {
  assert.equal(buyerTypeFromFinder("brand_private_label"), "Brand / private label");
  assert.equal(salesChannelFromFinder("online_seller"), "Amazon / TikTok / online marketplace");
  const labels = finderBriefLabels({ mode: "matched_shortlist", buyerChannel: "importer_wholesaler", priority: "wide_toe", closure: "any", styleCodes: ["BQ001"] }, "zh");
  assert.equal(labels.buyer, "进口商／批发商");
  assert.match(labels.priority, /宽鞋头/);
});
