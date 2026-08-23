import assert from "node:assert/strict";
import test from "node:test";
import { createAdminInquiriesHandler, createAdminInquiryUpdateHandler } from "../edgeone-deploy/cloud-functions/api/admin/inquiries.js";

function request(token = "correct-token") {
  return new Request("https://www.beiqiang.online/api/admin/inquiries", { headers: { Authorization: `Bearer ${token}` } });
}

test("requires an explicitly configured admin token", async () => {
  const handler = createAdminInquiriesHandler();
  assert.equal((await handler({ request: request(), env: {} })).status, 503);
});

test("rejects an invalid admin token without reading storage", async () => {
  let reads = 0;
  const handler = createAdminInquiriesHandler({ getStoreImpl: () => { reads += 1; return {}; } });
  const result = await handler({ request: request("wrong-token"), env: { INQUIRY_ADMIN_TOKEN: "correct-token" } });
  assert.equal(result.status, 401);
  assert.equal(reads, 0);
});

test("returns newest inquiries and marks internal tests", async () => {
  const records = {
    "inquiries/2026-08-05/BQ-OLD.json": { reference: "BQ-OLD", receivedAt: "2026-08-05T10:00:00.000Z", company: "Buyer Co", name: "Jane", quantity: "500 pairs" },
    "inquiries/2026-08-06/BQ-TEST.json": { reference: "BQ-TEST", receivedAt: "2026-08-06T10:00:00.000Z", company: "Beiqiang Internal Deployment Test", name: "Internal", quantity: "0 pairs - test only" },
  };
  const handler = createAdminInquiriesHandler({ getStoreImpl: () => ({
    list: async () => ({ blobs: Object.keys(records).map((key) => ({ key })) }),
    get: async (key) => records[key],
  }) });
  const result = await handler({ request: request(), env: { INQUIRY_ADMIN_TOKEN: "correct-token" } });
  const body = await result.json();
  assert.equal(result.status, 200);
  assert.equal(body.records[0].reference, "BQ-TEST");
  assert.equal(body.records[0].internalTest, true);
  assert.equal(body.records[1].internalTest, false);
});

test("updates an inquiry pipeline record behind the admin token", async () => {
  const current = { reference: "BQ-20260823-ABCDEF12", receivedAt: "2026-08-23T08:00:00.000Z", company: "Buyer Co", status: "new" };
  let saved;
  const handler = createAdminInquiryUpdateHandler({ getStoreImpl: () => ({
    get: async () => current,
    setJSON: async (key, value) => { saved = { key, value }; },
  }) });
  const updateRequest = new Request("https://www.beiqiang.online/api/admin/inquiries", {
    method: "PATCH", headers: { Authorization: "Bearer correct-token", "Content-Type": "application/json" },
    body: JSON.stringify({ reference: current.reference, receivedAt: current.receivedAt, status: "quoted", owner: "Sales A", nextAction: "Follow up on 2026-08-25", buyerUpdate: "Quotation was sent by email.", internalNote: "FOB details pending", lastContactedAt: "2026-08-23" }),
  });
  const result = await handler({ request: updateRequest, env: { INQUIRY_ADMIN_TOKEN: "correct-token" } });
  assert.equal(result.status, 200);
  assert.equal(saved.key, "inquiries/2026-08-23/BQ-20260823-ABCDEF12.json");
  assert.equal(saved.value.status, "quoted");
  assert.equal(saved.value.owner, "Sales A");
  assert.equal(saved.value.buyerUpdate, "Quotation was sent by email.");
  assert.equal(saved.value.pipelineHistory.at(-1).from, "new");
  assert.equal(saved.value.pipelineHistory.at(-1).to, "quoted");
});

test("requires and records a standardized reason when an opportunity is lost", async () => {
  const current = { reference: "BQ-20260823-ABCDEF12", receivedAt: "2026-08-23T08:00:00.000Z", company: "Buyer Co", status: "negotiation", pipelineHistory: [] }; let saved;
  const handler = createAdminInquiryUpdateHandler({ getStoreImpl: () => ({ get: async () => current, setJSON: async (key, value) => { saved = value; } }) });
  const makeRequest = (lostReason = "") => new Request("https://www.beiqiang.online/api/admin/inquiries", { method: "PATCH", headers: { Authorization: "Bearer correct-token", "Content-Type": "application/json" }, body: JSON.stringify({ reference: current.reference, receivedAt: current.receivedAt, status: "lost", lostReason }) });
  assert.equal((await handler({ request: makeRequest(), env: { INQUIRY_ADMIN_TOKEN: "correct-token" } })).status, 400);
  assert.equal((await handler({ request: makeRequest("price"), env: { INQUIRY_ADMIN_TOKEN: "correct-token" } })).status, 200);
  assert.equal(saved.lostReason, "price"); assert.equal(saved.pipelineHistory.at(-1).reason, "price");
});

test("stores immutable quotation versions without exposing them to the buyer status API", async () => {
  const current = { reference: "BQ-20260823-ABCDEF12", receivedAt: "2026-08-23T08:00:00.000Z", company: "Buyer Co", status: "qualified", quotations: [] };
  let saved;
  const handler = createAdminInquiryUpdateHandler({ getStoreImpl: () => ({ get: async () => current, setJSON: async (key, value) => { saved = value; } }) });
  const quotation = { version: "1", currency: "USD", tradeTerm: "FOB", validUntil: "2026-09-01", leadTime: "31 days after confirmation", paymentTerms: "To be confirmed", packing: "1 pair / box", sampleTerms: "Discuss first", notes: "Subject to sample approval", lines: [{ code: "BQ001", description: "Black / EU 39-45", quantity: "500", unitPrice: "9.80" }] };
  const updateRequest = new Request("https://www.beiqiang.online/api/admin/inquiries", { method: "PATCH", headers: { Authorization: "Bearer correct-token", "Content-Type": "application/json" }, body: JSON.stringify({ reference: current.reference, receivedAt: current.receivedAt, status: "quoted", quotation }) });
  const result = await handler({ request: updateRequest, env: { INQUIRY_ADMIN_TOKEN: "correct-token" } });
  assert.equal(result.status, 200); assert.equal(saved.quotations.length, 1); assert.equal(saved.quotations[0].quoteNumber, "BQ-20260823-ABCDEF12-Q1"); assert.equal(saved.quotations[0].lines[0].unitPrice, "9.80");
});

test("stores a validated Trade Assurance order handoff", async () => {
  const current = { reference: "BQ-20260823-ABCDEF12", receivedAt: "2026-08-23T08:00:00.000Z", status: "negotiation" }; let saved;
  const handler = createAdminInquiryUpdateHandler({ getStoreImpl: () => ({ get: async () => current, setJSON: async (key, value) => { saved = value; } }) });
  const updateRequest = new Request("https://www.beiqiang.online/api/admin/inquiries", { method: "PATCH", headers: { Authorization: "Bearer correct-token", "Content-Type": "application/json" }, body: JSON.stringify({ reference: current.reference, receivedAt: current.receivedAt, status: "negotiation", orderHandoff: { method: "alibaba_trade_assurance", orderReference: "TA-2026-001", orderUrl: "https://trade.alibaba.com/order/example", confirmedAt: "2026-08-23", note: "Review before payment.", paymentCurrency: "USD", paymentMilestones: [{ id: "PM-1", label: "Deposit", amount: "980.00", dueDate: "2026-08-25", status: "paid", paidAt: "2026-08-24", reference: "TA-PAY-1", note: "Recorded in Trade Assurance" }] } }) });
  const result = await handler({ request: updateRequest, env: { INQUIRY_ADMIN_TOKEN: "correct-token" } });
  assert.equal(result.status, 200); assert.equal(saved.orderHandoff.orderReference, "TA-2026-001"); assert.equal(saved.orderHandoff.orderUrl, "https://trade.alibaba.com/order/example"); assert.equal(saved.orderHandoff.paymentMilestones[0].amount, "980.00"); assert.equal(saved.orderHandoff.paymentMilestones[0].status, "paid");
});

test("rejects a paid milestone without an actual paid date", async () => {
  const current = { reference: "BQ-20260823-ABCDEF12", receivedAt: "2026-08-23T08:00:00.000Z", status: "negotiation" };
  const handler = createAdminInquiryUpdateHandler({ getStoreImpl: () => ({ get: async () => current, setJSON: async () => {} }) });
  const request = new Request("https://www.beiqiang.online/api/admin/inquiries", { method: "PATCH", headers: { Authorization: "Bearer correct-token", "Content-Type": "application/json" }, body: JSON.stringify({ reference: current.reference, receivedAt: current.receivedAt, status: "negotiation", orderHandoff: { method: "contract", orderReference: "CT-1", paymentCurrency: "USD", paymentMilestones: [{ label: "Deposit", amount: "500", status: "paid" }] } }) });
  assert.equal((await handler({ request, env: { INQUIRY_ADMIN_TOKEN: "correct-token" } })).status, 400);
});

test("rejects unsafe order links and unsupported order confirmation", async () => {
  const current = { reference: "BQ-20260823-ABCDEF12", receivedAt: "2026-08-23T08:00:00.000Z", status: "negotiation" };
  const handler = createAdminInquiryUpdateHandler({ getStoreImpl: () => ({ get: async () => current, setJSON: async () => {} }) });
  const malicious = new Request("https://www.beiqiang.online/api/admin/inquiries", { method: "PATCH", headers: { Authorization: "Bearer correct-token", "Content-Type": "application/json" }, body: JSON.stringify({ reference: current.reference, receivedAt: current.receivedAt, status: "negotiation", orderHandoff: { method: "alibaba_trade_assurance", orderReference: "TA-1", orderUrl: "https://example.com/payment" } }) });
  assert.equal((await handler({ request: malicious, env: { INQUIRY_ADMIN_TOKEN: "correct-token" } })).status, 400);
  const unsupported = new Request("https://www.beiqiang.online/api/admin/inquiries", { method: "PATCH", headers: { Authorization: "Bearer correct-token", "Content-Type": "application/json" }, body: JSON.stringify({ reference: current.reference, receivedAt: current.receivedAt, status: "order_confirmed" }) });
  assert.equal((await handler({ request: unsupported, env: { INQUIRY_ADMIN_TOKEN: "correct-token" } })).status, 409);
});

test("stores a validated sample project with append-only stage history", async () => {
  const current = { reference: "BQ-20260823-ABCDEF12", receivedAt: "2026-08-23T08:00:00.000Z", status: "sample_discussion", owner: "Sales A", sampleProgram: { status: "preparing", history: [{ from: "terms_confirmed", to: "preparing", changedAt: "2026-08-23T09:00:00.000Z", actor: "Sales A" }] } }; let saved;
  const handler = createAdminInquiryUpdateHandler({ getStoreImpl: () => ({ get: async () => current, setJSON: async (key, value) => { saved = value; } }) });
  const sampleProgram = { status: "shipped", styleCodes: "BQ001", quantity: "2 pairs", sizes: "EU 41 / 42", colors: "Black", purpose: "Fit and color review", reviewScope: "Review fit, visible color and workmanship on the referenced sample.", currency: "USD", sampleCharge: "80.00", chargeStatus: "paid", paidAt: "2026-08-22", courier: "DHL", trackingNumber: "DHL123", shippedAt: "2026-08-23", expectedDelivery: "2026-08-27", note: "Bulk terms remain separate." };
  const updateRequest = new Request("https://www.beiqiang.online/api/admin/inquiries", { method: "PATCH", headers: { Authorization: "Bearer correct-token", "Content-Type": "application/json" }, body: JSON.stringify({ reference: current.reference, receivedAt: current.receivedAt, status: current.status, owner: current.owner, sampleProgram }) });
  const result = await handler({ request: updateRequest, env: { INQUIRY_ADMIN_TOKEN: "correct-token" } });
  assert.equal(result.status, 200); assert.equal(saved.sampleProgram.status, "shipped"); assert.equal(saved.sampleProgram.trackingNumber, "DHL123"); assert.equal(saved.sampleProgram.history.length, 2); assert.equal(saved.sampleProgram.history.at(-1).to, "shipped");
});

test("opens an immutable sample review round and freezes its evidence scope", async () => {
  const current = { reference: "BQ-20260823-ABCDEF12", receivedAt: "2026-08-23T08:00:00.000Z", status: "sample_discussion", owner: "Sales A", sampleProgram: { status: "delivered", reviewRounds: [], history: [] } }; let saved;
  const complete = { status: "buyer_review", sampleReference: "BQ001-S1-R1", styleCodes: "BQ001", quantity: "1 pair", sizes: "EU 42", colors: "Black", purpose: "Fit and visible workmanship review", reviewScope: "Review the named physical pair only.", deliverables: "One physical pair and measurement sheet MS-1.", acceptanceCriteria: "Buyer checks fit comments, visible workmanship and measurements listed in MS-1.", exclusions: "Bulk material consistency, laboratory tests, packing, price and production timing.", currency: "USD", sampleCharge: "50", chargeStatus: "paid", paidAt: "2026-08-20", courier: "DHL", trackingNumber: "DHL123", shippedAt: "2026-08-21", expectedDelivery: "2026-08-24", note: "Confirm the physical label before review." };
  const handler = createAdminInquiryUpdateHandler({ getStoreImpl: () => ({ get: async () => current, setJSON: async (key, value) => { saved = structuredClone(value); } }) }); const makeRequest = (sampleProgram) => new Request("https://www.beiqiang.online/api/admin/inquiries", { method: "PATCH", headers: { Authorization: "Bearer correct-token", "Content-Type": "application/json" }, body: JSON.stringify({ reference: current.reference, receivedAt: current.receivedAt, status: current.status, owner: current.owner, sampleProgram }) });
  const result = await handler({ request: makeRequest(complete), env: { INQUIRY_ADMIN_TOKEN: "correct-token" } }); assert.equal(result.status, 200); assert.equal(saved.sampleProgram.reviewRounds.length, 1); assert.equal(saved.sampleProgram.reviewRounds[0].sampleReference, "BQ001-S1-R1"); assert.equal(saved.sampleProgram.reviewRounds[0].status, "awaiting_buyer");
  const frozenHandler = createAdminInquiryUpdateHandler({ getStoreImpl: () => ({ get: async () => saved, setJSON: async () => {} }) }); const changed = await frozenHandler({ request: makeRequest({ ...complete, acceptanceCriteria: "Different criteria after opening review." }), env: { INQUIRY_ADMIN_TOKEN: "correct-token" } }); assert.equal(changed.status, 400); assert.match((await changed.json()).message, /scope is frozen/i);
});

test("rejects invalid sample payment and shipping evidence", async () => {
  const current = { reference: "BQ-20260823-ABCDEF12", receivedAt: "2026-08-23T08:00:00.000Z", status: "sample_discussion" };
  const handler = createAdminInquiryUpdateHandler({ getStoreImpl: () => ({ get: async () => current, setJSON: async () => {} }) });
  const makeRequest = (sampleProgram) => new Request("https://www.beiqiang.online/api/admin/inquiries", { method: "PATCH", headers: { Authorization: "Bearer correct-token", "Content-Type": "application/json" }, body: JSON.stringify({ reference: current.reference, receivedAt: current.receivedAt, status: current.status, sampleProgram }) });
  const base = { status: "preparing", styleCodes: "BQ001", quantity: "1 pair", currency: "USD", sampleCharge: "50", chargeStatus: "paid" };
  assert.equal((await handler({ request: makeRequest(base), env: { INQUIRY_ADMIN_TOKEN: "correct-token" } })).status, 400);
  assert.equal((await handler({ request: makeRequest({ ...base, status: "shipped", chargeStatus: "planned", courier: "", trackingNumber: "", shippedAt: "" }), env: { INQUIRY_ADMIN_TOKEN: "correct-token" } })).status, 400);
});

test("prevents an internal edit from inventing buyer sample approval", async () => {
  const current = { reference: "BQ-20260823-ABCDEF12", receivedAt: "2026-08-23T08:00:00.000Z", status: "sample_discussion", sampleProgram: { status: "buyer_review" } };
  const handler = createAdminInquiryUpdateHandler({ getStoreImpl: () => ({ get: async () => current, setJSON: async () => {} }) });
  const request = new Request("https://www.beiqiang.online/api/admin/inquiries", { method: "PATCH", headers: { Authorization: "Bearer correct-token", "Content-Type": "application/json" }, body: JSON.stringify({ reference: current.reference, receivedAt: current.receivedAt, status: current.status, sampleProgram: { status: "buyer_approved", styleCodes: "BQ001", quantity: "1 pair" } }) });
  assert.equal((await handler({ request, env: { INQUIRY_ADMIN_TOKEN: "correct-token" } })).status, 400);
});

test("blocks order confirmation until all eight written readiness items exist", async () => {
  const current = { reference: "BQ-20260823-ABCDEF12", receivedAt: "2026-08-23T08:00:00.000Z", status: "negotiation", orderHandoff: { method: "contract", orderReference: "CT-2026-01", confirmedAt: "2026-08-23", orderChecklist: { productSpecification: "SPEC-1" } } };
  const handler = createAdminInquiryUpdateHandler({ getStoreImpl: () => ({ get: async () => current, setJSON: async () => {} }) });
  const request = new Request("https://www.beiqiang.online/api/admin/inquiries", { method: "PATCH", headers: { Authorization: "Bearer correct-token", "Content-Type": "application/json" }, body: JSON.stringify({ reference: current.reference, receivedAt: current.receivedAt, status: "order_confirmed" }) });
  const result = await handler({ request, env: { INQUIRY_ADMIN_TOKEN: "correct-token" } }); const body = await result.json();
  assert.equal(result.status, 409); assert.match(body.message, /all eight/i);
});

test("allows order confirmation only with a complete buyer-safe readiness summary", async () => {
  const checklist = { productSpecification: "SPEC-1", sampleDecision: "BQ001 sample approved 2026-08-20", quantitySizeRatio: "500 pairs / final size ratio in PO-1", colorsMaterials: "Black knit / material reference MAT-1", packingLabeling: "1 pair box / marks PK-1", priceTradeTerm: "Q1 / FOB Xiamen", paymentTerms: "30% deposit / 70% balance", deliveryWindow: "31 days after written confirmation" };
  const current = { reference: "BQ-20260823-ABCDEF12", receivedAt: "2026-08-23T08:00:00.000Z", status: "negotiation", orderHandoff: { method: "contract", orderReference: "CT-2026-01", confirmedAt: "2026-08-23", orderChecklist: checklist } }; let saved;
  const handler = createAdminInquiryUpdateHandler({ getStoreImpl: () => ({ get: async () => current, setJSON: async (key, value) => { saved = value; } }) });
  const request = new Request("https://www.beiqiang.online/api/admin/inquiries", { method: "PATCH", headers: { Authorization: "Bearer correct-token", "Content-Type": "application/json" }, body: JSON.stringify({ reference: current.reference, receivedAt: current.receivedAt, status: "order_confirmed" }) });
  assert.equal((await handler({ request, env: { INQUIRY_ADMIN_TOKEN: "correct-token" } })).status, 200); assert.equal(saved.status, "order_confirmed"); assert.equal(saved.orderHandoff.orderChecklist.priceTradeTerm, "Q1 / FOB Xiamen");
});
