import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { createInquiryStatusHandler } from "../edgeone-deploy/cloud-functions/api/inquiry-status.js";

const reference = "BQ-20260823-ABCDEF12";
const accessCode = "0123456789ABCDEF0123";
const record = {
  reference, receivedAt: "2026-08-23T08:00:00.000Z", status: "quoted", styleCode: "BQ001, BQ009", styleLabel: "Two styles",
  projectPath: "base_style_adaptation", quantity: "800 pairs", preferredTradeTerm: "FCA", deliveryDestination: "Los Angeles, CA 90001", deliveryTiming: "Arrival in November", accessTokenHash: createHash("sha256").update(accessCode).digest("hex"),
  internalNote: "Never expose this", nextAction: "Internal only", buyerUpdate: "Quotation details were sent by email.",
  items: [{ code: "BQ001", name: "Wide Toe Box Knit Slip-On", quantity: "400", colors: "Black", sizes: "EU 36-46" }],
  attachments: [{ id: "abcdef0123456789abcd", key: "inquiry-files/private/internal-key.pdf", name: "brand-tech-pack.pdf", size: 2048, uploadedAt: "2026-08-23T09:00:00.000Z" }],
  messages: [{ id: "MSG-ABC", sender: "sales", body: "Please confirm the sample size.", sentAt: "2026-08-23T09:15:00.000Z", notificationSent: true, internalRouting: "never expose" }],
  orderDocuments: [{ id: "abcdef0123456789abcd", key: "order-documents/private/qc.pdf", name: "qc.pdf", title: "Quality inspection summary", category: "quality_inspection", note: "For the referenced batch", contentType: "application/pdf", size: 100, uploadedAt: "2026-08-23T09:20:00.000Z", internalApproval: "never expose" }],
  sampleProgram: { status: "buyer_review", sampleReference: "BQ001-S1-R1", styleCodes: "BQ001", quantity: "1 pair", sizes: "EU 42", colors: "Black", purpose: "Fit review", reviewScope: "Fit and visible workmanship only", deliverables: "One physical pair", acceptanceCriteria: "Visible workmanship and fit comments", exclusions: "Bulk consistency and laboratory tests", reviewRounds: [{ round: 1, sampleReference: "BQ001-S1-R1", styleCodes: "BQ001", purpose: "Fit review", reviewScope: "Fit and visible workmanship only", deliverables: "One physical pair", acceptanceCriteria: "Visible workmanship and fit comments", exclusions: "Bulk consistency and laboratory tests", status: "awaiting_buyer", openedAt: "2026-08-23T09:25:00.000Z", internalRoundNote: "never expose" }], currency: "USD", sampleCharge: "50.00", chargeStatus: "paid", paidAt: "2026-08-20", courier: "DHL", trackingNumber: "DHL123", shippedAt: "2026-08-21", expectedDelivery: "2026-08-24", note: "Review this reference sample.", updatedAt: "2026-08-23T09:25:00.000Z", history: [{ actor: "Internal only" }], internalCost: "never expose" },
  orderHandoff: { method: "alibaba_trade_assurance", orderReference: "TA-2026-001", orderUrl: "https://trade.alibaba.com/order/example", confirmedAt: "2026-08-23", note: "Review the order details before payment.", paymentCurrency: "USD", paymentMilestones: [{ id: "PM-1", label: "Deposit", amount: "980.00", dueDate: "2026-08-25", status: "paid", paidAt: "2026-08-24", reference: "TA-PAY-1", note: "Recorded", internalBankData: "never expose" }], orderChecklist: { productSpecification: "SPEC-1", sampleDecision: "Sample approved", quantitySizeRatio: "500 pairs / PO-1", colorsMaterials: "Black / MAT-1", packingLabeling: "PK-1", priceTradeTerm: "Q1 / FOB Xiamen", paymentTerms: "30/70", deliveryWindow: "31 days" } },
  quotations: [{ quoteNumber: `${reference}-Q1`, version: "1", currency: "USD", tradeTerm: "FOB", validUntil: "2026-09-30", leadTime: "Subject to confirmation", paymentTerms: "To be confirmed", packing: "To be confirmed", sampleTerms: "Discuss first", notes: "Sample approval required", lines: [{ code: "BQ001", description: "Black", quantity: "400", unitPrice: "9.80" }], status: "buyer_revision_requested", issuedAt: "2026-08-23T09:30:00.000Z", buyerDecision: "revision_requested", revisionBrief: { reasons: ["unit_price"], affectedCodes: ["BQ001"], targetQuantity: "800 pairs", targetUnitPrice: "USD 9.20", targetTradeTerm: "FOB", requestedDelivery: "", requestedPayment: "", requestedPacking: "", requestedSample: "" }, internalCost: "never expose" }],
  buyerOrderRequests: [{ id: "OSR-1", quoteNumber: `${reference}-Q1`, preferredOrderChannel: "alibaba_trade_assurance", legalCompanyName: "Buyer Legal Co", purchasingContact: "Jane", purchaseOrderReference: "PO-1", destination: "Hamburg, Germany", requestedWindow: "November 2026", instructions: "Use packing reference", status: "submitted", submittedAt: "2026-08-23T10:00:00.000Z", internalRisk: "never expose" }],
  recommendationSets: [{ id: "REC-ABCDEF012345", title: "Three commercial directions", introduction: "Selected for the buyer's stated channel.", items: [{ code: "BQ001", reason: "Verified wide-toe direction." }, { code: "BQ009", reason: "Athletic mesh direction." }], nextStep: "Choose one or two styles for sampling.", status: "issued", issuedAt: "2026-08-23T10:30:00.000Z", issuedBy: "Internal salesperson", internalMargin: "never expose" }],
};

function request(code = accessCode) { return new Request(`https://www.beiqiang.online/api/inquiry-status?reference=${reference}&accessCode=${code}`); }

test("returns only the buyer-safe inquiry status fields", async () => {
  const handler = createInquiryStatusHandler({ getStoreImpl: () => ({ get: async () => record }) });
  const result = await handler({ request: request() }); const body = await result.json();
  assert.equal(result.status, 200); assert.equal(body.request.status.code, "quotation_stage");
  assert.equal(body.request.items[0].code, "BQ001"); assert.equal(body.request.buyerUpdate, "Quotation details were sent by email.");
  assert.equal(body.request.preferredTradeTerm, "FCA"); assert.match(body.request.deliveryDestination, /Los Angeles/);
  assert.equal(body.request.attachments[0].name, "brand-tech-pack.pdf"); assert.equal(body.request.attachments[0].key, undefined);
  assert.equal(body.request.messages[0].body, "Please confirm the sample size."); assert.equal(body.request.messages[0].internalRouting, undefined); assert.equal(body.request.messages[0].notificationSent, undefined);
  assert.equal(body.request.orderDocuments[0].title, "Quality inspection summary"); assert.equal(body.request.orderDocuments[0].key, undefined); assert.equal(body.request.orderDocuments[0].internalApproval, undefined);
  assert.equal(body.request.sampleProgram.styleCodes, "BQ001"); assert.equal(body.request.sampleProgram.sampleReference, "BQ001-S1-R1"); assert.equal(body.request.sampleProgram.reviewScope, "Fit and visible workmanship only"); assert.match(body.request.sampleProgram.exclusions, /Bulk consistency/); assert.equal(body.request.sampleProgram.reviewRounds[0].internalRoundNote, undefined); assert.equal(body.request.sampleProgram.history, undefined); assert.equal(body.request.sampleProgram.internalCost, undefined);
  assert.equal(body.request.orderHandoff.orderReference, "TA-2026-001"); assert.match(body.request.orderHandoff.orderUrl, /^https:\/\/trade\.alibaba\.com\//);
  assert.equal(body.request.orderHandoff.paymentMilestones[0].label, "Deposit"); assert.equal(body.request.orderHandoff.paymentMilestones[0].internalBankData, undefined);
  assert.equal(body.request.orderHandoff.orderChecklist.productSpecification, "SPEC-1"); assert.equal(Object.keys(body.request.orderHandoff.orderChecklist).length, 8);
  assert.equal(body.request.buyerQuotation.quoteNumber, `${reference}-Q1`); assert.equal(body.request.buyerQuotation.internalCost, undefined); assert.deepEqual(body.request.buyerQuotation.revisionBrief.affectedCodes, ["BQ001"]);
  assert.equal(body.request.buyerOrderRequest.legalCompanyName, "Buyer Legal Co"); assert.equal(body.request.buyerOrderRequest.internalRisk, undefined);
  assert.equal(body.request.buyerRecommendation.items[1].code, "BQ009"); assert.equal(body.request.buyerRecommendation.issuedBy, undefined); assert.equal(body.request.buyerRecommendation.internalMargin, undefined);
  assert.equal(body.request.internalNote, undefined); assert.equal(body.request.nextAction, undefined); assert.equal(body.request.accessTokenHash, undefined);
});

test("rejects an incorrect inquiry status access code", async () => {
  const handler = createInquiryStatusHandler({ getStoreImpl: () => ({ get: async () => record }) });
  const result = await handler({ request: request("FFFFFFFFFFFFFFFFFFFF") });
  assert.equal(result.status, 404);
});
