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

test("issues a new version after review and supersedes the prior revision request", async () => {
  let saved; const revisedQuote = { ...quote, quoteNumber: `${reference}-Q2`, version: "2", status: "draft" }; const prior = { ...quote, status: "buyer_revision_requested", revisionBrief: { reasons: ["unit_price"], affectedCodes: ["BQ001"], targetQuantity: "", targetUnitPrice: "USD 9.20", targetTradeTerm: "", requestedDelivery: "", requestedPayment: "", requestedPacking: "", requestedSample: "" } }; const record = { reference, receivedAt, status: "negotiation", quotations: [prior, revisedQuote] };
  const handler = createAdminQuotationHandler({ getStoreImpl: () => ({ get: async () => record, setJSON: async (key, value) => { saved = value; } }) }); const request = new Request("https://www.beiqiang.online/api/admin/quotation", { method: "POST", headers: { Authorization: "Bearer correct-token", "Content-Type": "application/json" }, body: JSON.stringify({ reference, receivedAt, quoteNumber: revisedQuote.quoteNumber }) });
  const result = await handler({ request, env: { INQUIRY_ADMIN_TOKEN: "correct-token" } }); assert.equal(result.status, 200); assert.equal(saved.quotations[0].status, "superseded"); assert.equal(saved.quotations[0].revisionBrief.targetUnitPrice, "USD 9.20"); assert.equal(saved.quotations[1].status, "issued"); assert.equal(saved.quotations[1].revisionBrief, null);
});

test("records a buyer quotation acceptance without converting it into an order", async () => {
  let saved; const mails = []; const record = { reference, receivedAt, status: "quoted", company: "Buyer Co", name: "Jane", email: "jane@example.com", whatsapp: "+1", accessTokenHash: createHash("sha256").update(accessCode).digest("hex"), quotations: [{ ...quote, status: "issued", issuedAt: receivedAt }] };
  const handler = createQuotationResponseHandler({ getStoreImpl: () => ({ get: async () => record, setJSON: async (key, value) => { saved = value; } }), createTransportImpl: () => ({ sendMail: async (mail) => { mails.push(mail); } }) });
  const request = new Request("https://www.beiqiang.online/api/quotation-response", { method: "POST", headers: { Origin: "https://www.beiqiang.online", "Content-Type": "application/json" }, body: JSON.stringify({ reference, accessCode, quoteNumber, decision: "accept", note: "Please prepare the Trade Assurance order." }) });
  const result = await handler({ request, env: { SMTP_PASS: "test", SMTP_USER: "421345308@qq.com" } }); const body = await result.json();
  assert.equal(result.status, 200); assert.equal(saved.quotations[0].status, "buyer_accepted"); assert.equal(saved.status, "negotiation"); assert.equal(saved.quotations[0].buyerNote, "Please prepare the Trade Assurance order."); assert.match(body.message, /not yet a production order/i); assert.equal(mails.length, 1);
});

test("records a structured quotation revision brief as buyer targets", async () => {
  let saved; let savedBeforeEmail = false; const mails = []; const record = { reference, receivedAt, status: "quoted", company: "Buyer Co", name: "Jane", email: "jane@example.com", accessTokenHash: createHash("sha256").update(accessCode).digest("hex"), quotations: [{ ...quote, status: "issued", issuedAt: receivedAt }] };
  const handler = createQuotationResponseHandler({ getStoreImpl: () => ({ get: async () => record, setJSON: async (key, value) => { saved = structuredClone(value); } }), createTransportImpl: () => ({ sendMail: async (mail) => { savedBeforeEmail = saved?.quotations?.[0]?.status === "buyer_revision_requested"; mails.push(mail); } }) });
  const revisionBrief = { reasons: ["unit_price", "trade_term_freight"], affectedCodes: ["BQ001"], targetQuantity: "1,000 pairs", targetUnitPrice: "USD 9.20", targetTradeTerm: "FOB", requestedDelivery: "Arrival before 30 November", requestedPayment: "", requestedPacking: "Neutral carton", requestedSample: "" };
  const request = new Request("https://www.beiqiang.online/api/quotation-response", { method: "POST", headers: { Origin: "https://www.beiqiang.online", "Content-Type": "application/json" }, body: JSON.stringify({ reference, accessCode, quoteNumber, decision: "revise", note: "Please review this commercial direction.", revisionBrief }) });
  const result = await handler({ request, env: { SMTP_PASS: "test" } }); const body = await result.json();
  assert.equal(result.status, 200); assert.equal(savedBeforeEmail, true); assert.equal(saved.quotations[0].status, "buyer_revision_requested"); assert.deepEqual(saved.quotations[0].revisionBrief.reasons, ["unit_price", "trade_term_freight"]); assert.deepEqual(saved.quotations[0].revisionBrief.affectedCodes, ["BQ001"]); assert.match(saved.nextAction, /structured buyer targets/i); assert.equal(saved.nextActionDue, saved.updatedAt.slice(0, 10)); assert.match(body.message, /buyer targets/i); assert.match(mails[0].text, /buyer targets only/i);
});

test("rejects an empty or fabricated quotation revision brief", async () => {
  let writes = 0; const record = { reference, receivedAt, status: "quoted", accessTokenHash: createHash("sha256").update(accessCode).digest("hex"), quotations: [{ ...quote, status: "issued", issuedAt: receivedAt }] };
  const handler = createQuotationResponseHandler({ getStoreImpl: () => ({ get: async () => record, setJSON: async () => { writes += 1; } }) });
  const request = (revisionBrief) => new Request("https://www.beiqiang.online/api/quotation-response", { method: "POST", headers: { Origin: "https://www.beiqiang.online", "Content-Type": "application/json" }, body: JSON.stringify({ reference, accessCode, quoteNumber, decision: "revise", revisionBrief }) });
  assert.equal((await handler({ request: request({ reasons: [], affectedCodes: [] }), env: {} })).status, 400);
  assert.equal((await handler({ request: request({ reasons: ["invented_reason"], affectedCodes: ["BQ999"] }), env: {} })).status, 400); assert.equal(writes, 0);
});

test("rejects expired or already-closed quotation responses", async () => {
  const base = { reference, receivedAt, status: "quoted", accessTokenHash: createHash("sha256").update(accessCode).digest("hex") };
  const request = () => new Request("https://www.beiqiang.online/api/quotation-response", { method: "POST", headers: { Origin: "https://www.beiqiang.online", "Content-Type": "application/json" }, body: JSON.stringify({ reference, accessCode, quoteNumber, decision: "decline", note: "This project is no longer proceeding." }) });
  const expiredHandler = createQuotationResponseHandler({ getStoreImpl: () => ({ get: async () => ({ ...base, quotations: [{ ...quote, status: "issued", validUntil: "2020-01-01" }] }) }) });
  assert.equal((await expiredHandler({ request: request(), env: {} })).status, 409);
  const closedHandler = createQuotationResponseHandler({ getStoreImpl: () => ({ get: async () => ({ ...base, quotations: [{ ...quote, status: "buyer_accepted" }] }) }) });
  assert.equal((await closedHandler({ request: request(), env: {} })).status, 409);
});
