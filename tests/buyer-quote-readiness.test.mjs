import test from "node:test";
import assert from "node:assert/strict";
import { assessBuyerQuoteReadiness } from "../app/lib/buyer-quote-readiness.ts";

const complete = {
  company: "Example Imports",
  buyerType: "Importer / wholesaler",
  market: "Germany",
  email: "buyer@example.com",
  whatsapp: "+49 123 456",
  styleCode: "BQ001, BQ009",
  bulkQuantity: "800 pairs",
  sampleQuantity: "2 pairs, EU 42",
  preferredTradeTerm: "FOB",
  deliveryDestination: "Hamburg, Germany",
  deliveryTiming: "Required in November",
  requirements: "Private label box and black color review",
  items: [{ code: "BQ001", quantity: "400", colors: "Black", sizes: "EU 39-45" }],
};

test("shows buyer-facing readiness without turning it into an order prediction", () => {
  const result = assessBuyerQuoteReadiness(complete);
  assert.equal(result.score, 100);
  assert.equal(result.label, "Ready for commercial review");
  assert.match(result.summary, /verify every fact/i);
  assert.deepEqual(result.missing, []);
});

test("localizes the buyer's next qualification actions in Chinese", () => {
  const result = assessBuyerQuoteReadiness({ company: "买家公司", buyerType: "Importer / wholesaler" }, "zh");
  assert.equal(result.locale, "zh");
  assert.equal(result.level, "early");
  assert.equal(result.label, "采购简报尚不完整");
  assert.ok(result.missing.includes("填写可用的邮箱或WhatsApp号码。"));
  assert.ok(result.missing.includes("至少选择一个产品款号或产品方向。"));
  assert.equal(result.missing.some((item) => /Obtain|Confirm|Identify/.test(item)), false);
});

test("keeps private-label artwork gaps visible before submission", () => {
  const result = assessBuyerQuoteReadiness({
    projectPath: "base_style_adaptation",
    adaptationBrief: { intent: "private_label", artworkStatus: "not_ready" },
  }, "zh");
  assert.ok(result.missing.includes("说明期望的Logo、鞋垫或标签位置。"));
  assert.ok(result.missing.includes("说明是否已有可用Logo图稿。"));
});
