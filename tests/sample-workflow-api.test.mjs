import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { createSampleResponseHandler } from "../edgeone-deploy/cloud-functions/api/sample-response.js";

const reference = "BQ-20260823-ABCDEF12"; const accessCode = "ABCDEF0123456789ABCD";
function baseRecord(status = "buyer_review") { return { reference, receivedAt: "2026-08-23T08:00:00.000Z", status: "sample_discussion", company: "Buyer Co", name: "Jane", email: "jane@example.com", accessTokenHash: createHash("sha256").update(accessCode).digest("hex"), sampleProgram: { status, styleCodes: "BQ001", quantity: "1 pair", reviewScope: "Fit and visible workmanship only", history: [] } }; }
function request(decision, note = "") { return new Request("https://www.beiqiang.online/api/sample-response", { method: "POST", headers: { Origin: "https://www.beiqiang.online", "Content-Type": "application/json" }, body: JSON.stringify({ reference, accessCode, decision, note }) }); }

test("records buyer sample approval without confirming bulk order terms", async () => {
  let saved; const mails = []; const handler = createSampleResponseHandler({ getStoreImpl: () => ({ get: async () => baseRecord(), setJSON: async (key, value) => { saved = value; } }), createTransportImpl: () => ({ sendMail: async (mail) => { mails.push(mail); } }) });
  const result = await handler({ request: request("approve", "Fit accepted for this sample."), env: { SMTP_PASS: "test", SMTP_USER: "421345308@qq.com" } }); const body = await result.json();
  assert.equal(result.status, 200); assert.equal(saved.sampleProgram.status, "buyer_approved"); assert.equal(saved.sampleProgram.buyerDecision, "approved"); assert.equal(saved.sampleProgram.history.at(-1).actor, "Buyer"); assert.match(body.message, /bulk specifications/i); assert.equal(mails.length, 1); assert.match(mails[0].text, /separately/i);
});

test("requires a specific note for a buyer sample revision request", async () => {
  const handler = createSampleResponseHandler({ getStoreImpl: () => ({ get: async () => baseRecord(), setJSON: async () => {} }) });
  assert.equal((await handler({ request: request("revision"), env: {} })).status, 400);
  let saved; const accepted = createSampleResponseHandler({ getStoreImpl: () => ({ get: async () => baseRecord(), setJSON: async (key, value) => { saved = value; } }) });
  assert.equal((await accepted({ request: request("revision", "Please adjust the collar padding."), env: {} })).status, 200); assert.equal(saved.sampleProgram.status, "revision_requested");
});

test("rejects a repeated or out-of-stage sample decision", async () => {
  const handler = createSampleResponseHandler({ getStoreImpl: () => ({ get: async () => baseRecord("buyer_approved"), setJSON: async () => {} }) });
  assert.equal((await handler({ request: request("approve"), env: {} })).status, 409);
});
