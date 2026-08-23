import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { createInquiryMessageHandler } from "../edgeone-deploy/cloud-functions/api/inquiry-messages.js";
import { createAdminInquiryMessageHandler } from "../edgeone-deploy/cloud-functions/api/admin/inquiry-message.js";

const reference = "BQ-20260823-ABCDEF12"; const receivedAt = "2026-08-23T08:00:00.000Z"; const accessCode = "ABCDEF0123456789ABCD";
const baseRecord = { reference, receivedAt, status: "qualified", company: "Buyer Co", name: "Jane", email: "jane@example.com", whatsapp: "+1", accessTokenHash: createHash("sha256").update(accessCode).digest("hex"), messages: [] };

test("saves a private buyer message and notifies sales", async () => {
  let saved; const mails = [];
  const handler = createInquiryMessageHandler({ getStoreImpl: () => ({ get: async () => baseRecord, setJSON: async (key, value) => { saved = value; } }), createTransportImpl: () => ({ sendMail: async (mail) => { mails.push(mail); } }) });
  const request = new Request("https://www.beiqiang.online/api/inquiry-messages", { method: "POST", headers: { Origin: "https://www.beiqiang.online", "Content-Type": "application/json" }, body: JSON.stringify({ reference, accessCode, message: "Can BQ009 be sampled in black EU 42?" }) });
  const result = await handler({ request, env: { SMTP_PASS: "test" } }); const body = await result.json();
  assert.equal(result.status, 201); assert.equal(saved.messages.length, 1); assert.equal(saved.messages[0].sender, "buyer"); assert.equal(saved.messages[0].notificationSent, true); assert.equal(mails.length, 1); assert.match(body.message, /saved with this inquiry/i);
});

test("rejects buyer messages for a closed inquiry", async () => {
  const handler = createInquiryMessageHandler({ getStoreImpl: () => ({ get: async () => ({ ...baseRecord, status: "lost" }) }) });
  const request = new Request("https://www.beiqiang.online/api/inquiry-messages", { method: "POST", headers: { Origin: "https://www.beiqiang.online", "Content-Type": "application/json" }, body: JSON.stringify({ reference, accessCode, message: "Please reopen this request." }) });
  assert.equal((await handler({ request, env: {} })).status, 409);
});

test("requires the admin token before a sales reply is saved", async () => {
  let reads = 0;
  const handler = createAdminInquiryMessageHandler({ getStoreImpl: () => ({ get: async () => { reads += 1; return baseRecord; } }) });
  const request = new Request("https://www.beiqiang.online/api/admin/inquiry-message", { method: "POST", headers: { Authorization: "Bearer wrong", "Content-Type": "application/json" }, body: JSON.stringify({ reference, receivedAt, message: "We are checking the sample." }) });
  const result = await handler({ request, env: { INQUIRY_ADMIN_TOKEN: "correct" } });
  assert.equal(result.status, 401); assert.equal(reads, 0);
});

test("saves a sales reply before notifying the buyer", async () => {
  let saved; const mails = [];
  const handler = createAdminInquiryMessageHandler({ getStoreImpl: () => ({ get: async () => baseRecord, setJSON: async (key, value) => { saved = value; } }), createTransportImpl: () => ({ sendMail: async (mail) => { mails.push(mail); } }) });
  const request = new Request("https://www.beiqiang.online/api/admin/inquiry-message", { method: "POST", headers: { Authorization: "Bearer correct", "Content-Type": "application/json" }, body: JSON.stringify({ reference, receivedAt, message: "We can review the black sample after confirming size and delivery address." }) });
  const result = await handler({ request, env: { INQUIRY_ADMIN_TOKEN: "correct", SMTP_PASS: "test" } }); const body = await result.json();
  assert.equal(result.status, 201); assert.equal(saved.messages[0].sender, "sales"); assert.equal(saved.messages[0].notificationSent, true); assert.equal(saved.lastContactedAt, new Date().toISOString().slice(0, 10)); assert.equal(body.notificationSent, true); assert.equal(body.record.accessTokenHash, undefined); assert.equal(mails.length, 1); assert.match(mails[0].text, /does not change quotation or order terms/i);
});

test("saves a due shortlist follow-up in the private thread before notifying the buyer", async () => {
  let saved; let savedBeforeEmail = false;
  const recommendation = { id: "REC-ABCDEF012345", status: "issued", issuedAt: "2026-08-20T23:30:00.000Z", followUps: [] };
  const handler = createAdminInquiryMessageHandler({ getStoreImpl: () => ({ get: async () => ({ ...baseRecord, recommendationSets: [recommendation] }), setJSON: async (key, value) => { saved = structuredClone(value); } }), createTransportImpl: () => ({ sendMail: async () => { savedBeforeEmail = saved?.recommendationSets?.[0]?.followUps?.length === 1; } }), nowImpl: () => new Date("2026-08-22T00:05:00.000Z") });
  const request = new Request("https://www.beiqiang.online/api/admin/inquiry-message", { method: "POST", headers: { Authorization: "Bearer correct", "Content-Type": "application/json" }, body: JSON.stringify({ reference, receivedAt, message: "Please choose BQ001 or BQ009 and confirm quantity, colors and size range.", recommendationId: recommendation.id, recommendationFollowUpStage: "selection_check", sentBy: "Sales A" }) });
  const result = await handler({ request, env: { INQUIRY_ADMIN_TOKEN: "correct", SMTP_PASS: "test" } });
  assert.equal(result.status, 201); assert.equal(savedBeforeEmail, true); assert.equal(saved.messages[0].recommendationId, recommendation.id); assert.equal(saved.recommendationSets[0].followUps[0].notificationSent, true); assert.equal(saved.nextActionDue, "2026-08-26");
});

test("blocks an early or out-of-order shortlist follow-up without writing", async () => {
  let writes = 0; const recommendation = { id: "REC-ABCDEF012345", status: "issued", issuedAt: "2026-08-23T08:00:00.000Z", followUps: [] };
  const handler = createAdminInquiryMessageHandler({ getStoreImpl: () => ({ get: async () => ({ ...baseRecord, recommendationSets: [recommendation] }), setJSON: async () => { writes += 1; } }), nowImpl: () => new Date("2026-08-24T18:00:00.000Z") });
  const makeRequest = (stage) => new Request("https://www.beiqiang.online/api/admin/inquiry-message", { method: "POST", headers: { Authorization: "Bearer correct", "Content-Type": "application/json" }, body: JSON.stringify({ reference, receivedAt, message: "Reviewed buyer follow-up message.", recommendationId: recommendation.id, recommendationFollowUpStage: stage }) });
  const early = await handler({ request: makeRequest("selection_check"), env: { INQUIRY_ADMIN_TOKEN: "correct" } }); assert.equal(early.status, 409); assert.match((await early.json()).message, /2026-08-25/);
  const wrongStage = await handler({ request: makeRequest("sample_or_quote"), env: { INQUIRY_ADMIN_TOKEN: "correct" } }); assert.equal(wrongStage.status, 409); assert.equal(writes, 0);
});

test("stops the shortlist sequence after a buyer response or two follow-ups", async () => {
  let writes = 0; const followUps = [{ id: "RFU-1", stage: "selection_check", sentAt: "2026-08-15T00:00:00.000Z" }, { id: "RFU-2", stage: "sample_or_quote", sentAt: "2026-08-20T00:00:00.000Z" }];
  const makeHandler = (recommendation) => createAdminInquiryMessageHandler({ getStoreImpl: () => ({ get: async () => ({ ...baseRecord, recommendationSets: [recommendation] }), setJSON: async () => { writes += 1; } }), nowImpl: () => new Date("2026-08-23T00:00:00.000Z") });
  const makeRequest = (id) => new Request("https://www.beiqiang.online/api/admin/inquiry-message", { method: "POST", headers: { Authorization: "Bearer correct", "Content-Type": "application/json" }, body: JSON.stringify({ reference, receivedAt, message: "One more follow-up.", recommendationId: id, recommendationFollowUpStage: "sample_or_quote" }) });
  const responded = await makeHandler({ id: "REC-ABCDEF012345", status: "buyer_shortlisted", buyerRespondedAt: receivedAt, followUps: [] })({ request: makeRequest("REC-ABCDEF012345"), env: { INQUIRY_ADMIN_TOKEN: "correct" } }); assert.equal(responded.status, 409);
  const complete = await makeHandler({ id: "REC-FEDCBA543210", status: "issued", issuedAt: receivedAt, followUps })({ request: makeRequest("REC-FEDCBA543210"), env: { INQUIRY_ADMIN_TOKEN: "correct" } }); assert.equal(complete.status, 409); assert.equal(writes, 0);
});
