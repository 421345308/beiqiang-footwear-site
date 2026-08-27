import assert from "node:assert/strict";
import test from "node:test";
import { quotationChanges, quotationTotal } from "../app/lib/quotation-history.ts";

function quote(overrides = {}) {
  return { quoteNumber: "BQ-TEST-Q1", version: "1", currency: "USD", tradeTerm: "FOB", validUntil: "2026-09-15", leadTime: "31 days", paymentTerms: "To confirm", packing: "Standard", sampleTerms: "Discuss first", notes: "", lines: [{ code: "BQ001", description: "Black", quantity: "400 pairs", unitPrice: "10.20" }], status: "superseded", issuedAt: "2026-08-20T00:00:00.000Z", buyerDecision: "revision_requested", buyerNote: "", buyerRespondedAt: "", revisionBrief: null, ...overrides };
}

test("calculates a buyer-visible quotation total from issued line values", () => {
  assert.equal(quotationTotal(quote()), 4080);
});

test("identifies only fields changed between issued quotation versions", () => {
  const next = quote({ quoteNumber: "BQ-TEST-Q2", version: "2", validUntil: "2026-09-30", lines: [{ code: "BQ001", description: "Black", quantity: "800 pairs", unitPrice: "9.80" }] });
  assert.deepEqual(quotationChanges(quote(), next), ["product lines / quantity / unit price", "validity"]);
  assert.deepEqual(quotationChanges(quote(), next, "zh"), ["产品行／数量／单价", "有效期"]);
});
