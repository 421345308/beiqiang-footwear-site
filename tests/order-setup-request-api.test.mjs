import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { createOrderSetupRequestHandler } from "../edgeone-deploy/cloud-functions/api/order-setup-request.js";

const reference = "BQ-20260823-ABCDEF12";
const receivedAt = "2026-08-23T09:00:00.000Z";
const accessCode = "A1B2C3D4E5F60718293A";
const quoteNumber = `${reference}-Q1`;
const baseRecord = {
  reference, receivedAt, status: "negotiation", company: "Buyer Co", name: "Jane", email: "jane@example.com",
  accessTokenHash: createHash("sha256").update(accessCode).digest("hex"), quotations: [{ quoteNumber, status: "buyer_accepted" }],
};
const validPayload = { reference, accessCode, quoteNumber, preferredOrderChannel: "alibaba_trade_assurance", legalCompanyName: "Buyer Legal Co Ltd", purchasingContact: "Jane Doe", purchaseOrderReference: "PO-2026-08", destination: "Hamburg, Germany", requestedWindow: "Target arrival by 30 November 2026", instructions: "Use the approved packing reference.", buyerConfirmation: true };

function request(payload = validPayload) {
  return new Request("https://www.beiqiang.online/api/order-setup-request", { method: "POST", headers: { Origin: "https://www.beiqiang.online", "Content-Type": "application/json" }, body: JSON.stringify(payload) });
}

test("records a buyer order-setup request without creating a production order", async () => {
  let saved; const mails = [];
  const handler = createOrderSetupRequestHandler({
    getStoreImpl: () => ({ get: async () => structuredClone(baseRecord), setJSON: async (_key, value) => { saved = value; } }),
    createTransportImpl: () => ({ sendMail: async (mail) => { mails.push(mail); } }), randomBytesImpl: () => Buffer.from("0102030405", "hex"),
  });
  const result = await handler({ request: request(), env: { SMTP_PASS: "configured" } }); const body = await result.json();
  assert.equal(result.status, 200); assert.equal(body.ok, true); assert.equal(saved.status, "negotiation"); assert.equal(saved.orderHandoff, undefined); assert.equal(saved.buyerOrderRequests.length, 1); assert.equal(saved.buyerOrderRequests[0].id, "OSR-0102030405"); assert.equal(saved.buyerOrderRequests[0].legalCompanyName, "Buyer Legal Co Ltd"); assert.match(saved.buyerUpdate, /order setup request/i); assert.match(body.message, /not yet a production order/i); assert.equal(mails.length, 1); assert.match(mails[0].text, /not a confirmed production order/i);
});

test("requires an accepted quotation and buyer confirmation before order setup", async () => {
  let reads = 0;
  const missingConfirmationHandler = createOrderSetupRequestHandler({ getStoreImpl: () => { reads += 1; return {}; } });
  const missingConfirmation = await missingConfirmationHandler({ request: request({ ...validPayload, buyerConfirmation: false }), env: {} });
  assert.equal(missingConfirmation.status, 400); assert.equal(reads, 0);
  const issuedHandler = createOrderSetupRequestHandler({ getStoreImpl: () => ({ get: async () => ({ ...baseRecord, quotations: [{ quoteNumber, status: "buyer_accepted" }, { quoteNumber: `${reference}-Q2`, status: "issued" }] }) }) });
  const issued = await issuedHandler({ request: request(), env: {} }); const body = await issued.json();
  assert.equal(issued.status, 409); assert.match(body.message, /accept the current issued quotation/i);
});

test("prevents duplicate setup requests and does not overwrite buyer evidence", async () => {
  let writes = 0; const existing = { ...baseRecord, buyerOrderRequests: [{ id: "OSR-OLD", quoteNumber, status: "submitted", submittedAt: receivedAt }] };
  const handler = createOrderSetupRequestHandler({ getStoreImpl: () => ({ get: async () => existing, setJSON: async () => { writes += 1; } }) });
  const result = await handler({ request: request(), env: {} }); const body = await result.json();
  assert.equal(result.status, 409); assert.match(body.message, /already exists/i); assert.equal(writes, 0); assert.equal(existing.buyerOrderRequests[0].id, "OSR-OLD");
});
