import assert from "node:assert/strict";
import test from "node:test";
import { buildQuoteBriefText } from "../app/lib/quote-brief.ts";

const input = {
  lines: [{ code: "BQ001", slug: "bq001", sourceModel: "A001", name: "Walking shoe", image: "/catalog-thumbs/bq001.webp", quantity: "300", colors: "black", sizes: "EU 39-45", notes: "plain carton" }],
  name: "Buyer Name", company: "Buyer Company", buyerType: "Importer / wholesaler", market: "Germany", channel: "Wholesale", email: "buyer@example.com", whatsapp: "+49 123", contactPreferences: { preferredContactMethod: "email", preferredResponseLanguage: "en", buyerTimezone: "Europe/Berlin", preferredContactWindow: "09:00-12:00" }, projectPath: "base_style_adaptation", sampleQuantity: "2 pairs", bulkQuantity: "300 pairs", preferredTradeTerm: "FOB", deliveryDestination: "Hamburg", deliveryTiming: "October", existingSole: "", changesRequired: "", targetValues: "", ndaRequired: "No", requirements: "Confirm packing", adaptationBrief: { intent: "private_label", artworkStatus: "vector_ready", brandingPlacement: "tongue", colorDirection: "black", packingLabeling: "plain carton" },
};

test("builds a buyer-reviewable English sourcing brief without converting it into an order", () => {
  const brief = buildQuoteBriefText(input, "en");
  assert.match(brief, /Buyer Company/); assert.match(brief, /BQ001/); assert.match(brief, /300/); assert.match(brief, /FOB/); assert.match(brief, /Hamburg/); assert.match(brief, /private_label/); assert.match(brief, /not a Beiqiang quotation/i); assert.doesNotMatch(brief, /order confirmed|payment received|manufacturing approved/i);
});

test("builds the same conservative sourcing brief in Chinese", () => {
  const brief = buildQuoteBriefText({ ...input, projectPath: "technical_development", changesRequired: "调整鞋底", targetValues: "硬度目标待审核" }, "zh");
  assert.match(brief, /买家采购简报草稿/); assert.match(brief, /技术产品开发/); assert.match(brief, /调整鞋底/); assert.match(brief, /硬度目标待审核/); assert.match(brief, /不是贝强报价/);
});
