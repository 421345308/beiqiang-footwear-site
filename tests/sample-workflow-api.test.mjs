import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { createSampleResponseHandler } from "../edgeone-deploy/cloud-functions/api/sample-response.js";

const reference = "BQ-20260823-ABCDEF12"; const accessCode = "ABCDEF0123456789ABCD";
function baseRecord(status = "buyer_review") { return { reference, receivedAt: "2026-08-23T08:00:00.000Z", status: "sample_discussion", company: "Buyer Co", name: "Jane", email: "jane@example.com", accessTokenHash: createHash("sha256").update(accessCode).digest("hex"), sampleProgram: { status, sampleReference: "BQ001-S1-R2", styleCodes: "BQ001", quantity: "1 pair", purpose: "Fit review", reviewScope: "Fit and visible workmanship only", deliverables: "One physical pair", acceptanceCriteria: "Visible workmanship and buyer fit comments", exclusions: "Bulk consistency and laboratory tests", reviewRounds: [{ round: 1, sampleReference: "BQ001-S1-R1", styleCodes: "BQ001", reviewScope: "First construction review", status: "revision_requested", decision: "revision_requested", buyerNote: "Adjust collar", respondedAt: "2026-08-20T00:00:00.000Z" }, { round: 2, sampleReference: "BQ001-S1-R2", styleCodes: "BQ001", reviewScope: "Fit and visible workmanship only", deliverables: "One physical pair", acceptanceCriteria: "Visible workmanship and buyer fit comments", exclusions: "Bulk consistency and laboratory tests", status: "awaiting_buyer", openedAt: "2026-08-22T00:00:00.000Z", decision: "", buyerNote: "", respondedAt: "" }], history: [] } }; }
function request(decision, note = "") { return new Request("https://www.beiqiang.online/api/sample-response", { method: "POST", headers: { Origin: "https://www.beiqiang.online", "Content-Type": "application/json" }, body: JSON.stringify({ reference, accessCode, decision, note }) }); }

test("records buyer sample approval without confirming bulk order terms", async () => {
  let saved; const mails = []; const handler = createSampleResponseHandler({ getStoreImpl: () => ({ get: async () => baseRecord(), setJSON: async (key, value) => { saved = value; } }), createTransportImpl: () => ({ sendMail: async (mail) => { mails.push(mail); } }) });
  const result = await handler({ request: request("approve", "Fit accepted for this sample."), env: { SMTP_PASS: "test", SMTP_USER: "421345308@qq.com" } }); const body = await result.json();
  assert.equal(result.status, 200); assert.equal(saved.sampleProgram.status, "buyer_approved"); assert.equal(saved.sampleProgram.buyerDecision, "approved"); assert.equal(saved.sampleProgram.reviewRounds[0].decision, "revision_requested"); assert.equal(saved.sampleProgram.reviewRounds[1].decision, "approved"); assert.equal(saved.sampleProgram.reviewRounds[1].buyerNote, "Fit accepted for this sample."); assert.match(saved.nextAction, /excluded bulk terms/i); assert.equal(saved.nextActionDue, saved.updatedAt.slice(0, 10)); assert.match(saved.buyerUpdate, /review round 2/i); assert.equal(saved.sampleProgram.history.at(-1).actor, "Buyer"); assert.match(body.message, /bulk specifications/i); assert.equal(mails.length, 1); assert.match(mails[0].text, /immutable sample-review round/i);
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
