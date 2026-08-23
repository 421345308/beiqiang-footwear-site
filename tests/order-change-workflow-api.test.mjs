import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { createOrderChangeResponseHandler } from "../edgeone-deploy/cloud-functions/api/order-change-response.js";

const reference = "BQ-20260823-ABCDEF12";
const accessCode = "0123456789ABCDEF0123";
const checklist = { productSpecification: "SPEC-1", sampleDecision: "Sample approved", quantitySizeRatio: "500 pairs", colorsMaterials: "Black knit", packingLabeling: "PK-1", priceTradeTerm: "Q1 / FOB Xiamen", paymentTerms: "30/70", deliveryWindow: "31 days" };
const currentOrder = { method: "contract", orderReference: "CT-1", orderUrl: "", confirmedAt: "2026-08-23", note: "Production update", fulfillmentStatus: "production", carrier: "", trackingNumber: "", paymentCurrency: "USD", paymentMilestones: [{ id: "PM-1", label: "Deposit", amount: "1000", dueDate: "2026-08-25", status: "paid", paidAt: "2026-08-24", reference: "PAY-1", note: "Received" }], orderChecklist: checklist };
const proposedOrder = { ...currentOrder, note: "Old proposed note", fulfillmentStatus: "order_documents", paymentMilestones: [{ id: "PM-1", label: "Deposit", amount: "1200", dueDate: "2026-08-26", status: "planned", paidAt: "", reference: "", note: "" }], orderChecklist: { ...checklist, quantitySizeRatio: "600 pairs", priceTradeTerm: "Q2 / FOB Xiamen" } };
function baseRecord() { return { reference, receivedAt: "2026-08-23T08:00:00.000Z", updatedAt: "2026-08-23T09:00:00.000Z", status: "order_confirmed", company: "Buyer Co", email: "buyer@example.com", accessTokenHash: createHash("sha256").update(accessCode).digest("hex"), orderHandoff: structuredClone(currentOrder), orderVersions: [{ version: 1, orderHandoff: structuredClone(currentOrder), acceptedAt: "2026-08-23T09:00:00.000Z", acceptedBy: "Sales A", source: "initial_confirmation" }], orderChangeRequests: [{ id: "OCR-ABCDEF012345", status: "awaiting_buyer", reason: "Quantity and price changed after PO review", changedFields: ["quantitySizeRatio", "priceTradeTerm", "paymentPlan"], baseVersion: 1, proposedHandoff: structuredClone(proposedOrder), createdAt: "2026-08-23T10:00:00.000Z", createdBy: "Sales A" }] }; }
function request(decision, note = "") { return new Request("https://www.beiqiang.online/api/order-change-response", { method: "POST", headers: { Origin: "https://www.beiqiang.online", "Content-Type": "application/json" }, body: JSON.stringify({ reference, accessCode, changeId: "OCR-ABCDEF012345", decision, note }) }); }

test("buyer acceptance creates a new critical version while preserving operational facts", async () => {
  const record = baseRecord(); let saved; let savedBeforeMail = false;
  const handler = createOrderChangeResponseHandler({ getStoreImpl: () => ({ get: async () => record, setJSON: async (key, value) => { saved = structuredClone(value); } }), createTransportImpl: () => ({ sendMail: async () => { savedBeforeMail = Boolean(saved); } }), nowImpl: () => new Date("2026-08-23T12:00:00.000Z") });
  const result = await handler({ request: request("accept", "Approved against revised PO"), env: { SMTP_PASS: "configured" } }); const body = await result.json();
  assert.equal(result.status, 200); assert.equal(body.decision, "accepted"); assert.equal(savedBeforeMail, true); assert.equal(saved.orderVersions.length, 2); assert.equal(saved.orderVersions.at(-1).acceptedBy, "Buyer"); assert.equal(saved.orderHandoff.orderChecklist.quantitySizeRatio, "600 pairs"); assert.equal(saved.orderHandoff.fulfillmentStatus, "production"); assert.equal(saved.orderHandoff.note, "Production update"); assert.equal(saved.orderHandoff.paymentMilestones[0].amount, "1200"); assert.equal(saved.orderHandoff.paymentMilestones[0].status, "paid"); assert.equal(saved.orderHandoff.paymentMilestones[0].reference, "PAY-1"); assert.equal(saved.orderChangeRequests[0].status, "buyer_accepted");
});

test("buyer rejection requires a reason and leaves the current order version unchanged", async () => {
  const record = baseRecord(); let saved;
  const handler = createOrderChangeResponseHandler({ getStoreImpl: () => ({ get: async () => record, setJSON: async (key, value) => { saved = structuredClone(value); } }), nowImpl: () => new Date("2026-08-23T12:00:00.000Z") });
  assert.equal((await handler({ request: request("reject"), env: {} })).status, 400); assert.equal(saved, undefined);
  const result = await handler({ request: request("reject", "The quantity does not match our PO"), env: {} }); assert.equal(result.status, 200); assert.equal(saved.orderVersions.length, 1); assert.equal(saved.orderHandoff.orderChecklist.quantitySizeRatio, "500 pairs"); assert.equal(saved.orderChangeRequests[0].status, "buyer_rejected"); assert.match(saved.nextAction, /keep current version 1 active/i);
});

test("an order change decision cannot be submitted twice", async () => {
  const record = baseRecord(); record.orderChangeRequests[0].status = "buyer_accepted";
  const handler = createOrderChangeResponseHandler({ getStoreImpl: () => ({ get: async () => record, setJSON: async () => assert.fail("must not write") }) });
  assert.equal((await handler({ request: request("accept"), env: {} })).status, 409);
});
