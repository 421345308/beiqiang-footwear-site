import assert from "node:assert/strict";
import test from "node:test";
import { getBuyerNextAction } from "../app/lib/buyer-next-action.ts";

const open = { status: { code: "commercial_discussion" } };

test("prioritizes a formal order handoff over earlier workflow actions", () => {
  const action = getBuyerNextAction({ ...open, sampleProgram: { status: "buyer_review" }, buyerQuotation: { status: "issued", quoteNumber: "Q1" }, orderHandoff: { method: "alibaba_trade_assurance", orderReference: "TA-1", orderUrl: "https://trade.alibaba.com/order/1" } });
  assert.equal(action.href, "https://trade.alibaba.com/order/1"); assert.equal(action.external, true); assert.match(action.body, /before any production or payment/i);
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

test("closed requests never encourage a workflow submission", () => {
  const action = getBuyerNextAction({ status: { code: "closed" }, buyerQuotation: { status: "issued", quoteNumber: "Q1" } });
  assert.equal(action.tone, "closed"); assert.equal(action.href, "#buyer-contact-actions");
});
