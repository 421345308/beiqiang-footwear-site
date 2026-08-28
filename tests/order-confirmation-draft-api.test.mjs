import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { createAdminOrderConfirmationDraftHandler } from "../edgeone-deploy/cloud-functions/api/admin/order-confirmation-draft.js";
import { createOrderConfirmationDraftHandler } from "../edgeone-deploy/cloud-functions/api/order-confirmation-draft.js";

const reference = "BQ-20260823-ABCDEF12";
const accessCode = "0123456789ABCDEF0123";
const quoteNumber = `${reference}-Q1`;
const checklist = {
  productSpecification: "BQ001 approved specification sheet SPEC-1",
  sampleDecision: "Physical sample S-001 approved for listed scope",
  quantitySizeRatio: "1,000 pairs; EU 39/40/41/42/43 = 100/200/300/250/150",
  colorsMaterials: "Black stretch textile upper; execution per sample S-001",
  packingLabeling: "One pair per buyer-approved color box; PO barcode label",
  priceTradeTerm: "USD 9.80/pair FOB Xiamen",
  paymentTerms: "30% deposit; 70% before shipment after written inspection review",
  deliveryWindow: "31 days for 100 pairs; exact order window in formal order",
};
const baseRecord = {
  reference,
  email: "buyer@example.com",
  status: "negotiation",
  accessTokenHash: createHash("sha256").update(accessCode).digest("hex"),
  quotations: [{ quoteNumber, status: "buyer_accepted" }],
  buyerOrderRequests: [{ id: "OSR-0102030405", quoteNumber, status: "submitted" }],
  orderPreparationPackets: [{ id: "OPP-010203040506", version: 1, orderRequestId: "OSR-0102030405", quoteNumber, status: "reviewed" }],
};

function adminRequest(body, token = "admin-secret") {
  return new Request("https://www.beiqiang.online/api/admin/order-confirmation-draft", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
}
function buyerRequest(body) {
  return new Request("https://www.beiqiang.online/api/order-confirmation-draft", { method: "PATCH", headers: { Origin: "https://www.beiqiang.online", "Content-Type": "application/json" }, body: JSON.stringify(body) });
}

test("admin issues a versioned pre-order confirmation only after packet and quote review", async () => {
  let state = structuredClone(baseRecord); const mails = [];
  const handler = createAdminOrderConfirmationDraftHandler({
    getStoreImpl: () => ({ get: async () => structuredClone(state), setJSON: async (_key, value) => { state = structuredClone(value); } }),
    createTransportImpl: () => ({ sendMail: async (mail) => mails.push(mail) }),
    randomBytesImpl: () => Buffer.from("010203040506", "hex"),
    nowImpl: () => new Date("2026-08-28T12:00:00.000Z"),
  });
  const result = await handler({ request: adminRequest({ reference, packetId: "OPP-010203040506", orderChannel: "alibaba_trade_assurance", orderChecklist: checklist, draftNote: "Compare every item with the accepted quote and PO.", issuedBy: "Sales A" }), env: { INQUIRY_ADMIN_TOKEN: "admin-secret", SMTP_PASS: "configured" } });
  const body = await result.json();
  assert.equal(result.status, 200); assert.equal(body.draft.id, "OCD-010203040506");
  assert.equal(state.orderConfirmationDrafts[0].status, "awaiting_buyer");
  assert.equal(state.orderHandoff, undefined); assert.equal(mails.length, 1);
  assert.match(mails[0].text, /all eight/i); assert.doesNotMatch(mails[0].text, /admin-secret/);
});

test("admin rejects placeholders, unreviewed packets and a second pending draft", async () => {
  const invalid = createAdminOrderConfirmationDraftHandler({ getStoreImpl: () => ({}) });
  const placeholder = await invalid({ request: adminRequest({ reference, packetId: "OPP-010203040506", orderChannel: "contract", orderChecklist: { ...checklist, colorsMaterials: "TBD" }, draftNote: "Review all fields." }), env: { INQUIRY_ADMIN_TOKEN: "admin-secret" } });
  assert.equal(placeholder.status, 400);
  const unreviewed = createAdminOrderConfirmationDraftHandler({ getStoreImpl: () => ({ get: async () => ({ ...baseRecord, orderPreparationPackets: [{ ...baseRecord.orderPreparationPackets[0], status: "submitted" }] }) }) });
  const second = await unreviewed({ request: adminRequest({ reference, packetId: "OPP-010203040506", orderChannel: "contract", orderChecklist: checklist, draftNote: "Review all fields." }), env: { INQUIRY_ADMIN_TOKEN: "admin-secret" } });
  assert.equal(second.status, 409);
  const pending = createAdminOrderConfirmationDraftHandler({ getStoreImpl: () => ({ get: async () => ({ ...baseRecord, orderConfirmationDrafts: [{ id: "OCD-AAAAAAAAAAAA", version: 1, status: "awaiting_buyer" }] }) }) });
  const third = await pending({ request: adminRequest({ reference, packetId: "OPP-010203040506", orderChannel: "contract", orderChecklist: checklist, draftNote: "Review all fields." }), env: { INQUIRY_ADMIN_TOKEN: "admin-secret" } });
  assert.equal(third.status, 409);
});

test("buyer accepts only the current draft without creating an order", async () => {
  let state = { ...structuredClone(baseRecord), orderConfirmationDrafts: [{ id: "OCD-010203040506", version: 1, orderRequestId: "OSR-0102030405", packetId: "OPP-010203040506", packetVersion: 1, quoteNumber, orderChannel: "alibaba_trade_assurance", orderChecklist: checklist, draftNote: "Review all fields.", status: "awaiting_buyer", issuedAt: "2026-08-28T12:00:00.000Z" }] };
  const mails = [];
  const handler = createOrderConfirmationDraftHandler({ getStoreImpl: () => ({ get: async () => structuredClone(state), setJSON: async (_key, value) => { state = structuredClone(value); } }), createTransportImpl: () => ({ sendMail: async (mail) => mails.push(mail) }), nowImpl: () => new Date("2026-08-28T13:00:00.000Z") });
  const result = await handler({ request: buyerRequest({ reference, accessCode, draftId: "OCD-010203040506", action: "accept", buyerNote: "Matches our PO.", buyerRevisionFields: [], buyerConfirmation: true }), env: { SMTP_PASS: "configured" } });
  const body = await result.json();
  assert.equal(result.status, 200); assert.equal(body.draft.status, "buyer_accepted");
  assert.equal(state.orderHandoff, undefined); assert.equal(mails.length, 1);
  assert.match(body.message, /does not create a formal order/i);
});

test("buyer revision requires precise fields and preserves the draft", async () => {
  const draft = { id: "OCD-010203040506", version: 1, status: "awaiting_buyer" };
  let state = { ...structuredClone(baseRecord), orderConfirmationDrafts: [draft] };
  const handler = createOrderConfirmationDraftHandler({ getStoreImpl: () => ({ get: async () => structuredClone(state), setJSON: async (_key, value) => { state = structuredClone(value); } }), nowImpl: () => new Date("2026-08-28T13:00:00.000Z") });
  const invalid = await handler({ request: buyerRequest({ reference, accessCode, draftId: draft.id, action: "request_revision", buyerNote: "Wrong", buyerRevisionFields: [], buyerConfirmation: true }), env: {} });
  assert.equal(invalid.status, 400);
  const result = await handler({ request: buyerRequest({ reference, accessCode, draftId: draft.id, action: "request_revision", buyerNote: "Size ratio should use the attached buyer PO.", buyerRevisionFields: ["quantitySizeRatio"], buyerConfirmation: true }), env: {} });
  assert.equal(result.status, 200); assert.equal(state.orderConfirmationDrafts.length, 1);
  assert.equal(state.orderConfirmationDrafts[0].status, "buyer_revision_requested");
  assert.deepEqual(state.orderConfirmationDrafts[0].buyerRevisionFields, ["quantitySizeRatio"]);
});
