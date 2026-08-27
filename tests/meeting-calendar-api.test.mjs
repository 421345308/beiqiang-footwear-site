import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { createMeetingCalendarHandler } from "../edgeone-deploy/cloud-functions/api/meeting-calendar.js";

const reference = "BQ-20260828-ABCDEF12"; const accessCode = "ABCDEF0123456789ABCD"; const requestId = "BMR-ABCDEF012345";
function source(overrides = {}) { return { reference, accessTokenHash: createHash("sha256").update(accessCode).digest("hex"), meetingRequests: [{ id: requestId, meetingType: "quotation_review", confirmedChannel: "video_call", timezone: "Europe/Berlin", confirmedSlot: "2026-09-02T10:00", durationMinutes: 45, agenda: "Review quotation and packing.", reviewNote: "Prepare the current specification.", meetingLink: "https://meet.google.com/abc-defg-hij", status: "confirmed", submittedAt: "2026-08-28T02:00:00.000Z", reviewedAt: "2026-08-28T03:00:00.000Z" }], ...overrides }; }
function request(payload = { reference, accessCode, requestId }, origin = "https://www.beiqiang.online") { return new Request("https://www.beiqiang.online/api/meeting-calendar", { method: "POST", headers: { "Content-Type": "application/json", Origin: origin }, body: JSON.stringify(payload) }); }

test("confirmed meeting produces a private UTC calendar file without access credentials", async () => {
  const handler = createMeetingCalendarHandler({ getStoreImpl: () => ({ get: async () => source() }) }); const result = await handler({ request: request() }); const calendar = await result.text();
  assert.equal(result.status, 200); assert.match(result.headers.get("content-type"), /text\/calendar/); assert.match(result.headers.get("content-disposition"), /\.ics/); assert.match(calendar, /DTSTART:20260902T080000Z/); assert.match(calendar, /DTEND:20260902T084500Z/); assert.match(calendar, /UID:BMR-ABCDEF012345@beiqiang\.online/); assert.match(calendar, /STATUS:CONFIRMED/); assert.match(calendar, /https:\/\/meet\.google\.com\/abc-defg-hij/); assert.doesNotMatch(calendar, new RegExp(accessCode));
});

test("calendar download requires the private project credentials and a confirmed meeting", async () => {
  let current = source(); const handler = createMeetingCalendarHandler({ getStoreImpl: () => ({ get: async () => current }) });
  assert.equal((await handler({ request: request({}, "https://evil.example") })).status, 403);
  assert.equal((await handler({ request: request({ reference, accessCode: "00000000000000000000", requestId }) })).status, 404);
  current = source({ meetingRequests: [{ ...source().meetingRequests[0], status: "cancelled" }] }); assert.equal((await handler({ request: request() })).status, 409);
  current = source({ meetingRequests: [{ ...source().meetingRequests[0], timezone: "a city somewhere" }] }); assert.equal((await handler({ request: request() })).status, 409);
});

test("fixed UTC offsets convert correctly and legacy meetings default to 30 minutes", async () => {
  const current = source({ meetingRequests: [{ ...source().meetingRequests[0], timezone: "UTC+2", durationMinutes: undefined }] }); const handler = createMeetingCalendarHandler({ getStoreImpl: () => ({ get: async () => current }) }); const calendar = await (await handler({ request: request() })).text();
  assert.match(calendar, /DTSTART:20260902T080000Z/); assert.match(calendar, /DTEND:20260902T083000Z/);
});
