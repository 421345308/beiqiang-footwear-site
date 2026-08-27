import assert from "node:assert/strict";
import test from "node:test";
import { createAdminMeetingRequestHandler } from "../edgeone-deploy/cloud-functions/api/admin/meeting-request.js";

const pending = { id: "BMR-ABCDEF012345", meetingType: "quotation_review", preferredChannel: "video_call", timezone: "Europe/Berlin", preferredSlots: ["2026-09-02T10:00", "2026-09-03T15:30"], agenda: "Review quotation", language: "en", status: "pending", submittedAt: "2026-08-28T02:00:00.000Z" };
function source(item = pending) { return { reference: "BQ-20260828-ABCDEF12", receivedAt: "2026-08-28T01:00:00.000Z", status: "qualified", name: "Jane", email: "buyer@example.com", accessTokenHash: "never expose", meetingRequests: [item] }; }
function request(action, extra = {}, token = "correct-token") { const current = source(); return new Request("https://www.beiqiang.online/api/admin/meeting-request", { method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ reference: current.reference, receivedAt: current.receivedAt, requestId: pending.id, action, actor: "Sales A", ...extra }) }); }

test("meeting admin rejects invalid access before reading storage", async () => {
  let reads = 0; const handler = createAdminMeetingRequestHandler({ getStoreImpl: () => { reads += 1; return {}; } }); assert.equal((await handler({ request: request("confirm"), env: {} })).status, 503); assert.equal((await handler({ request: request("confirm", {}, "wrong"), env: { INQUIRY_ADMIN_TOKEN: "correct-token" } })).status, 401); assert.equal(reads, 0);
});

test("confirmation is saved before buyer email and exposes no project access code", async () => {
  let current = source(); let writes = 0; const mails = []; const store = { get: async () => current, setJSON: async (_key, value) => { current = structuredClone(value); writes += 1; } }; const handler = createAdminMeetingRequestHandler({ getStoreImpl: () => store, createTransportImpl: () => ({ sendMail: async (mail) => { assert.equal(writes, 1); assert.equal(current.meetingRequests[0].status, "confirmed"); mails.push(mail); } }), nowImpl: () => new Date("2026-08-28T03:00:00.000Z") });
  const result = await handler({ request: request("confirm", { confirmedSlot: "2026-09-02T10:00", confirmedChannel: "video_call", meetingLink: "https://meet.google.com/abc-defg-hij", note: "Please prepare the current quotation." }), env: { INQUIRY_ADMIN_TOKEN: "correct-token", SMTP_PASS: "configured" } }); const payload = await result.json();
  assert.equal(result.status, 200); assert.equal(payload.notificationSent, true); assert.equal(writes, 2); assert.equal(current.meetingRequests[0].confirmedSlot, "2026-09-02T10:00"); assert.equal(current.meetingRequests[0].notificationStatus, "sent"); assert.equal(payload.record.accessTokenHash, undefined); assert.match(mails[0].text, /does not confirm product specifications/i); assert.doesNotMatch(mails[0].text, /ABCDEF0123456789ABCD/);
});

test("confirmation accepts only buyer slots and approved video hosts", async () => {
  const handler = createAdminMeetingRequestHandler({ getStoreImpl: () => ({ get: async () => source(), setJSON: async () => {} }) });
  assert.equal((await handler({ request: request("confirm", { confirmedSlot: "2026-09-04T10:00", confirmedChannel: "video_call", meetingLink: "https://meet.google.com/abc" }), env: { INQUIRY_ADMIN_TOKEN: "correct-token" } })).status, 400);
  assert.equal((await handler({ request: request("confirm", { confirmedSlot: "2026-09-02T10:00", confirmedChannel: "video_call", meetingLink: "https://evil.example/meeting" }), env: { INQUIRY_ADMIN_TOKEN: "correct-token" } })).status, 400);
});

test("decline, cancel and completion preserve the meeting lifecycle", async () => {
  let current = source(); const store = { get: async () => current, setJSON: async (_key, value) => { current = structuredClone(value); } }; const handler = createAdminMeetingRequestHandler({ getStoreImpl: () => store, nowImpl: () => new Date("2026-08-28T03:00:00.000Z") });
  assert.equal((await handler({ request: request("decline", { note: "No matching language resource is available." }), env: { INQUIRY_ADMIN_TOKEN: "correct-token" } })).status, 200); assert.equal(current.meetingRequests[0].status, "declined");
  current = source({ ...pending, status: "confirmed", confirmedSlot: "2026-09-02T10:00", confirmedChannel: "phone" }); assert.equal((await handler({ request: request("cancel", { note: "Responsible salesperson is unavailable." }), env: { INQUIRY_ADMIN_TOKEN: "correct-token" } })).status, 200); assert.equal(current.meetingRequests[0].status, "cancelled");
  current = source({ ...pending, status: "confirmed", confirmedSlot: "2026-09-02T10:00", confirmedChannel: "phone" }); assert.equal((await handler({ request: request("complete", { outcomeSummary: "Buyer requested a revised quantity breakdown; no price was confirmed." }), env: { INQUIRY_ADMIN_TOKEN: "correct-token" } })).status, 200); assert.equal(current.meetingRequests[0].status, "completed"); assert.match(current.meetingRequests[0].outcomeSummary, /no price was confirmed/i);
});
