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
