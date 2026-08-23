import assert from "node:assert/strict";
import test from "node:test";
import { BUYER_MESSAGE_TEMPLATES, buildBuyerMessageTemplate, recommendedBuyerMessageTemplate } from "../app/lib/buyer-message-templates.ts";

const record = { reference: "BQ-20260823-ABC", name: "Jane", company: "Buyer Co", status: "new", styleCode: "BQ009", items: [{ code: "BQ009" }, { code: "BQ024" }] };

test("recommends a reply starter from the verified pipeline stage", () => {
  assert.equal(recommendedBuyerMessageTemplate(record), "qualification");
  assert.equal(recommendedBuyerMessageTemplate({ ...record, status: "sample_discussion" }), "sample_details");
  assert.equal(recommendedBuyerMessageTemplate({ ...record, status: "quoted" }), "quotation_review");
  assert.equal(recommendedBuyerMessageTemplate({ ...record, status: "order_confirmed" }), "order_handoff");
});

test("keeps technical buyer targets separate from confirmed capability", () => {
  const message = buildBuyerMessageTemplate({ ...record, projectPath: "technical_development" }, "qualification");
  assert.match(message, /remain buyer targets/i); assert.match(message, /feasibility, sampling/i); assert.doesNotMatch(message, /we can achieve|guaranteed|confirmed capability/i);
});

test("keeps every reply starter inside B2B quotation and transaction boundaries", () => {
  for (const template of BUYER_MESSAGE_TEMPLATES) {
    const message = buildBuyerMessageTemplate(record, template.id);
    assert.match(message, /Beiqiang Footwear Supply/); assert.match(message, /BQ-20260823-ABC|BQ009/);
    assert.equal(message.length <= 2000, true);
    assert.doesNotMatch(message, /free shipping|best price guaranteed|certified|medical|orthopedic|pay on this website/i);
  }
  assert.match(buildBuyerMessageTemplate(record, "quotation_review"), /does not automatically create an order/i);
  assert.match(buildBuyerMessageTemplate(record, "order_handoff"), /does not collect card or bank credentials/i);
});
