import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { createAdminQuotationHandler } from "../edgeone-deploy/cloud-functions/api/admin/quotation.js";
import { createQuotationResponseHandler } from "../edgeone-deploy/cloud-functions/api/quotation-response.js";

const reference = "BQ-20260823-ABCDEF12"; const receivedAt = "2026-08-23T08:00:00.000Z"; const quoteNumber = `${reference}-Q1`; const accessCode = "ABCDEF0123456789ABCD";
const quote = { quoteNumber, version: "1", currency: "USD", tradeTerm: "FOB", validUntil: "2099-12-31", leadTime: "Subject to confirmation", paymentTerms: "To be confirmed", packing: "To be confirmed", sampleTerms: "Discuss first", notes: "Sample approval required", lines: [{ code: "BQ001", description: "Black", quantity: "500", unitPrice: "9.80" }], status: "draft", createdAt: receivedAt };

test("issues one immutable quotation to the private buyer status page and email", async () => {
  let saved; const mails = []; const record = { reference, receivedAt, status: "new", company: "Buyer Co", name: "Jane", email: "jane@example.com", quotations: [quote] };
  const handler = createAdminQuotationHandler({ getStoreImpl: () => ({ get: async () => record, setJSON: async (key, value) => { saved = value; } }), createTransportImpl: () => ({ sendMail: async (mail) => { mails.push(mail); } }) });
  const request = new Request("https://www.beiqiang.online/api/admin/quotation", { method: "POST", headers: { Authorization: "Bearer correct-token", "Content-Type": "application/json" }, body: JSON.stringify({ reference, receivedAt, quoteNumber }) });
  const result = await handler({ request, env: { INQUIRY_ADMIN_TOKEN: "correct-token", SMTP_PASS: "test", SMTP_USER: "421345308@qq.com" } }); const body = await result.json();
  assert.equal(result.status, 200); assert.equal(saved.quotations[0].status, "issued"); assert.equal(saved.status, "quoted"); assert.equal(body.quoteEmailSent, true); assert.equal(body.record.accessTokenHash, undefined); assert.equal(mails.length, 1); assert.match(mails[0].text, /not a production order/i);
});

test("records a buyer quotation acceptance without converting it into an order", async () => {
  let saved; const mails = []; const record = { reference, receivedAt, status: "quoted", company: "Buyer Co", name: "Jane", email: "jane@example.com", whatsapp: "+1", accessTokenHash: createHash("sha256").update(accessCode).digest("hex"), quotations: [{ ...quote, status: "issued", issuedAt: receivedAt }] };
  const handler = createQuotationResponseHandler({ getStoreImpl: () => ({ get: async () => record, setJSON: async (key, value) => { saved = value; } }), createTransportImpl: () => ({ sendMail: async (mail) => { mails.push(mail); } }) });
  const request = new Request("https://www.beiqiang.online/api/quotation-response", { method: "POST", headers: { Origin: "https://www.beiqiang.online", "Content-Type": "application/json" }, body: JSON.stringify({ reference, accessCode, quoteNumber, decision: "accept", note: "Please prepare the Trade Assurance order." }) });
  const result = await handler({ request, env: { SMTP_PASS: "test", SMTP_USER: "421345308@qq.com" } }); const body = await result.json();
  assert.equal(result.status, 200); assert.equal(saved.quotations[0].status, "buyer_accepted"); assert.equal(saved.status, "negotiation"); assert.equal(saved.quotations[0].buyerNote, "Please prepare the Trade Assurance order."); assert.match(body.message, /not yet a production order/i); assert.equal(mails.length, 1);
});

test("rejects expired or already-closed quotation responses", async () => {
  const base = { reference, receivedAt, status: "quoted", accessTokenHash: createHash("sha256").update(accessCode).digest("hex") };
  const request = () => new Request("https://www.beiqiang.online/api/quotation-response", { method: "POST", headers: { Origin: "https://www.beiqiang.online", "Content-Type": "application/json" }, body: JSON.stringify({ reference, accessCode, quoteNumber, decision: "decline", note: "Please revise packing." }) });
  const expiredHandler = createQuotationResponseHandler({ getStoreImpl: () => ({ get: async () => ({ ...base, quotations: [{ ...quote, status: "issued", validUntil: "2020-01-01" }] }) }) });
  assert.equal((await expiredHandler({ request: request(), env: {} })).status, 409);
  const closedHandler = createQuotationResponseHandler({ getStoreImpl: () => ({ get: async () => ({ ...base, quotations: [{ ...quote, status: "buyer_accepted" }] }) }) });
  assert.equal((await closedHandler({ request: request(), env: {} })).status, 409);
});
