import assert from "node:assert/strict";
import test from "node:test";
import { getBuyerNextAction } from "../app/lib/buyer-next-action.ts";

const open = { status: { code: "commercial_discussion" } };

test("prioritizes a formal order handoff over earlier workflow actions", () => {
  const action = getBuyerNextAction({ ...open, sampleProgram: { status: "buyer_review" }, buyerQuotation: { status: "issued", quoteNumber: "Q1" }, orderHandoff: { method: "alibaba_trade_assurance", orderReference: "TA-1", orderUrl: "https://trade.alibaba.com/order/1" } });
  assert.equal(action.href, "https://trade.alibaba.com/order/1"); assert.equal(action.external, true); assert.match(action.body, /before any production or payment/i);
});

test("prioritizes a pending confirmed-order change over the existing order link", () => {
  const action = getBuyerNextAction({ ...open, orderChangeRequests: [{ id: "OCR-ABCDEF012345", status: "awaiting_buyer" }], orderHandoff: { method: "alibaba_trade_assurance", orderReference: "TA-1", orderUrl: "https://trade.alibaba.com/order/1" } });
  assert.equal(action.href, "#order-change-review"); assert.match(action.title, /OCR-ABCDEF012345/); assert.match(action.body, /current version stays active/i);
});

test("routes a shipped buyer to delivery feedback before a repeat project, then shows the active project", () => {
  const shipped = { ...open, orderHandoff: { method: "contract", orderReference: "CT-1", fulfillmentStatus: "shipped" } };
  assert.equal(getBuyerNextAction(shipped).href, "#delivery-feedback");
  const repeat = { ...shipped, deliveryFeedback: [{ action: "received_as_expected" }], repeatOrderOpportunities: [{ id: "ROP-ABCDEF012345", status: "qualified", intent: "repeat_same_order", nextAction: "Prepare quotation" }] };
  const action = getBuyerNextAction(repeat); assert.equal(action.href, "#repeat-order"); assert.match(action.title, /ROP-ABCDEF012345/);
});

test("surfaces a pending buyer sample decision before quotation work", () => {
  const action = getBuyerNextAction({ ...open, sampleProgram: { status: "buyer_review" }, buyerQuotation: { status: "issued", quoteNumber: "Q1" } });
  assert.equal(action.href, "#sample-review"); assert.match(action.title, /sample/i);
});

test("routes an open issued quotation to the decision area", () => {
  const action = getBuyerNextAction({ ...open, buyerQuotation: { status: "issued", quoteNumber: "BQ-Q2" } });
  assert.equal(action.href, "#buyer-quotation"); assert.match(action.title, /BQ-Q2/);
});

test("routes an accepted quotation to order setup only before a request exists", () => {
  const setup = getBuyerNextAction({ ...open, buyerQuotation: { status: "buyer_accepted", quoteNumber: "Q1" } });
  const waiting = getBuyerNextAction({ ...open, buyerQuotation: { status: "buyer_accepted", quoteNumber: "Q1" }, buyerOrderRequest: { quoteNumber: "Q1" } });
  assert.equal(setup.href, "#order-setup-request"); assert.equal(waiting.href, "#buyer-message-center"); assert.match(waiting.body, /not yet a production order/i);
});

test("separates a quotation revision request from a declined quotation", () => {
  const revision = getBuyerNextAction({ ...open, buyerQuotation: { status: "buyer_revision_requested", quoteNumber: "Q1" } }); const declined = getBuyerNextAction({ ...open, buyerQuotation: { status: "buyer_declined", quoteNumber: "Q1" } });
  assert.match(revision.title, /commercial targets/i); assert.match(revision.body, /new version/i); assert.match(declined.eyebrow, /declined/i); assert.doesNotMatch(declined.body, /revision/i);
});

test("closed requests never encourage a workflow submission", () => {
  const action = getBuyerNextAction({ status: { code: "closed" }, buyerQuotation: { status: "issued", quoteNumber: "Q1" } });
  assert.equal(action.tone, "closed"); assert.equal(action.href, "#buyer-contact-actions");
});

test("routes a buyer to an issued product recommendation before general qualification", () => {
  const action = getBuyerNextAction({ ...open, buyerRecommendation: { status: "issued", title: "Three options for your market" } });
  assert.equal(action.href, "#buyer-recommendation"); assert.match(action.title, /Three options/);
});

test("surfaces pending and confirmed sourcing meeting status", () => {
  const pending = getBuyerNextAction({ ...open, meetingRequests: [{ id: "BMR-ABCDEF012345", status: "pending" }] }); assert.equal(pending.href, "#meeting-request"); assert.match(pending.title, /BMR-ABCDEF012345/);
  const confirmed = getBuyerNextAction({ ...open, meetingRequests: [{ id: "BMR-ABCDEF012345", status: "confirmed", confirmedSlot: "2026-09-02T10:00", timezone: "Europe\/Berlin" }] }); assert.equal(confirmed.href, "#meeting-request"); assert.match(confirmed.title, /2026-09-02/);
});

test("turns a recorded shortlist into a quote-building next step", () => {
  const action = getBuyerNextAction({ ...open, buyerRecommendation: { status: "buyer_shortlisted", title: "Selected options" } });
  assert.equal(action.href, "#buyer-recommendation"); assert.match(action.body, /quantity, colors and size ratio/i);
});
