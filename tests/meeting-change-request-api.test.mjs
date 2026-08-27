import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { createMeetingChangeRequestHandler } from "../edgeone-deploy/cloud-functions/api/meeting-change-request.js";

const reference = "BQ-20260828-ABCDEF12";
const accessCode = "ABCDEF0123456789ABCD";
const meetingId = "BMR-ABCDEF012345";
function meeting(overrides = {}) {
  return {
    id: meetingId,
    status: "confirmed",
    meetingType: "quotation_review",
    confirmedSlot: "2026-09-02T10:00",
    timezone: "Europe/Berlin",
    confirmedChannel: "video_call",
    changeRequests: [],
    ...overrides,
  };
}
function source(overrides = {}) {
  return {
    reference,
    status: "qualified",
    name: "Jane",
    company: "Buyer Co",
    email: "buyer@example.com",
    accessTokenHash: createHash("sha256").update(accessCode).digest("hex"),
    meetingRequests: [meeting()],
    ...overrides,
  };
}
function body(overrides = {}) {
  return {
    reference,
    accessCode,
    meetingId,
    action: "reschedule",
    timezone: "Europe/Berlin",
    preferredSlots: ["2026-09-04T10:00", "2026-09-05T15:00"],
    reason: "Our purchasing manager has a schedule conflict.",
    buyerConfirmation: true,
    ...overrides,
  };
}
function request(payload = body(), origin = "https://www.beiqiang.online") {
  return new Request("https://www.beiqiang.online/api/meeting-change-request", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify(payload),
  });
}

test("buyer reschedule request is saved without changing the confirmed meeting", async () => {
  let current = source();
  const mails = [];
  const store = {
    get: async () => current,
    setJSON: async (_key, value) => {
      current = structuredClone(value);
    },
  };
  const handler = createMeetingChangeRequestHandler({
    getStoreImpl: () => store,
    createTransportImpl: () => ({
      sendMail: async (mail) => {
        mails.push(mail);
      },
    }),
    nowImpl: () => new Date("2026-08-28T04:00:00.000Z"),
    randomBytesImpl: () => Buffer.from("123456789abc", "hex"),
  });
  const result = await handler({
    request: request(),
    env: { SMTP_PASS: "configured" },
  });
  const payload = await result.json();
  assert.equal(result.status, 201);
  assert.equal(payload.changeRequest.id, "BMC-123456789ABC");
  assert.equal(current.meetingRequests[0].confirmedSlot, "2026-09-02T10:00");
  assert.equal(current.meetingRequests[0].changeRequests[0].status, "pending");
  assert.equal(
    current.meetingRequests[0].changeRequests[0].notificationStatus,
    "sent",
  );
  assert.match(mails[0].text, /remains unchanged until Beiqiang approves/i);
});

test("buyer cancellation request also preserves the confirmed meeting until review", async () => {
  let current = source();
  const store = {
    get: async () => current,
    setJSON: async (_key, value) => {
      current = value;
    },
  };
  const handler = createMeetingChangeRequestHandler({
    getStoreImpl: () => store,
    nowImpl: () => new Date("2026-08-28T04:00:00.000Z"),
    randomBytesImpl: () => Buffer.from("123456789abc", "hex"),
  });
  const result = await handler({
    request: request(
      body({
        action: "cancel",
        timezone: "",
        preferredSlots: [],
        reason: "The sourcing project has been paused for this week.",
      }),
    ),
    env: {},
  });
  assert.equal(result.status, 201);
  assert.equal(current.meetingRequests[0].status, "confirmed");
  assert.equal(current.meetingRequests[0].changeRequests[0].action, "cancel");
});

test("meeting change requests reject unsafe, duplicate and non-confirmed changes", async () => {
  let current = source();
  const store = {
    get: async () => current,
    setJSON: async (_key, value) => {
      current = value;
    },
  };
  const handler = createMeetingChangeRequestHandler({
    getStoreImpl: () => store,
    nowImpl: () => new Date("2026-08-28T04:00:00.000Z"),
  });
  assert.equal(
    (
      await handler({
        request: request(body(), "https://evil.example"),
        env: {},
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await handler({
        request: request(body({ preferredSlots: ["2026-09-04T10:00"] })),
        env: {},
      })
    ).status,
    400,
  );
  current = source({ meetingRequests: [meeting({ status: "completed" })] });
  assert.equal((await handler({ request: request(), env: {} })).status, 409);
  current = source({
    meetingRequests: [
      meeting({
        changeRequests: [{ id: "BMC-AAAAAAAAAAAA", status: "pending" }],
      }),
    ],
  });
  assert.equal((await handler({ request: request(), env: {} })).status, 409);
});
