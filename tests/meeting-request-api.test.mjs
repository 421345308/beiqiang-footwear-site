import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { createMeetingRequestHandler } from "../edgeone-deploy/cloud-functions/api/meeting-request.js";

const reference = "BQ-20260828-ABCDEF12"; const accessCode = "ABCDEF0123456789ABCD";
function source(overrides = {}) { return { reference, receivedAt: "2026-08-28T01:00:00.000Z", status: "qualified", name: "Jane", company: "Buyer Co", email: "buyer@example.com", accessTokenHash: createHash("sha256").update(accessCode).digest("hex"), meetingRequests: [], ...overrides }; }
function body(overrides = {}) { return { reference, accessCode, meetingType: "quotation_review", preferredChannel: "video_call", timezone: "Europe/Berlin", preferredSlots: ["2026-09-02T10:00", "2026-09-03T15:30"], agenda: "Review BQ001 quotation quantity, packing and sample terms.", attendees: "Purchasing manager and product manager", language: "en", buyerConfirmation: true, ...overrides }; }
function request(payload = body(), origin = "https://www.beiqiang.online") { return new Request("https://www.beiqiang.online/api/meeting-request", { method: "POST", headers: { "Content-Type": "application/json", Origin: origin }, body: JSON.stringify(payload) }); }

test("meeting request saves before notifying sales and never creates a booking", async () => {
  let current = source(); const mails = []; const store = { get: async () => current, setJSON: async (_key, value) => { current = value; } }; const handler = createMeetingRequestHandler({ getStoreImpl: () => store, createTransportImpl: () => ({ sendMail: async (mail) => { assert.equal(current.meetingRequests[0].status, "pending"); assert.equal(current.meetingRequests[0].confirmedSlot, ""); mails.push(mail); } }), nowImpl: () => new Date("2026-08-28T02:00:00.000Z"), randomBytesImpl: () => Buffer.from("abcdef012345", "hex") });
  const result = await handler({ request: request(), env: { SMTP_PASS: "configured", INQUIRY_NOTIFY_TO: "sales@example.com" } }); const payload = await result.json();
  assert.equal(result.status, 201); assert.equal(payload.meetingRequest.id, "BMR-ABCDEF012345"); assert.equal(payload.meetingRequest.status, "pending"); assert.equal(payload.meetingRequest.reviewedBy, undefined); assert.equal(payload.notificationSent, true); assert.equal(mails[0].to, "sales@example.com"); assert.match(mails[0].text, /does not create a calendar booking/i); assert.equal(current.meetingRequests[0].notificationStatus, "sent");
});

test("meeting request rejects unsafe, incomplete and conflicting submissions", async () => {
  let current = source(); const store = { get: async () => current, setJSON: async (_key, value) => { current = value; } }; const handler = createMeetingRequestHandler({ getStoreImpl: () => store, nowImpl: () => new Date("2026-08-28T02:00:00.000Z") });
  assert.equal((await handler({ request: request(body(), "https://evil.example"), env: {} })).status, 403);
  assert.equal((await handler({ request: request(body({ accessCode: "00000000000000000000" })), env: {} })).status, 404);
  assert.equal((await handler({ request: request(body({ preferredSlots: ["2026-09-02T10:00"] })), env: {} })).status, 400);
  assert.equal((await handler({ request: request(body({ timezone: "Berlin-ish" })), env: {} })).status, 400);
  assert.equal((await handler({ request: request(body({ preferredSlots: ["2026-08-01T10:00", "2026-08-02T10:00"] })), env: {} })).status, 400);
  current = source({ meetingRequests: [{ id: "BMR-111111111111", status: "confirmed" }] }); assert.equal((await handler({ request: request(), env: {} })).status, 409);
  current = source({ status: "lost" }); assert.equal((await handler({ request: request(), env: {} })).status, 409);
});

test("notification failure preserves a pending meeting for dashboard review", async () => {
  let current = source(); const store = { get: async () => current, setJSON: async (_key, value) => { current = value; } }; const handler = createMeetingRequestHandler({ getStoreImpl: () => store, createTransportImpl: () => ({ sendMail: async () => { throw new Error("smtp down"); } }), nowImpl: () => new Date("2026-08-28T02:00:00.000Z"), randomBytesImpl: () => Buffer.from("abcdef012345", "hex") });
  const result = await handler({ request: request(), env: { SMTP_PASS: "configured" } }); const payload = await result.json(); assert.equal(result.status, 201); assert.equal(payload.notificationSent, false); assert.equal(current.meetingRequests[0].status, "pending"); assert.equal(current.meetingRequests[0].notificationStatus, "delivery_failed");
});
