import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { createSampleRequestHandler } from "../edgeone-deploy/cloud-functions/api/sample-request.js";

const reference = "BQ-20260828-ABCDEF12";
const accessCode = "ABCDEF0123456789ABCD";
function source(overrides = {}) { return { reference, receivedAt: "2026-08-28T01:00:00.000Z", status: "qualified", name: "Jane", company: "Buyer Co", email: "buyer@example.com", styleCode: "BQ001", items: [{ code: "BQ009" }], recommendationSets: [{ items: [{ code: "BQ015" }] }], accessTokenHash: createHash("sha256").update(accessCode).digest("hex"), sampleRequests: [], ...overrides }; }
function body(overrides = {}) { return { reference, accessCode, styleCodes: ["BQ001", "BQ009"], sampleType: "existing_style", quantity: "2 pairs", sizes: "EU 41 / 42", colors: "Black", evaluationPurpose: "Review fit and visible workmanship", customizationTarget: "", acceptanceFocus: "Fit, color and visible workmanship", targetBulkQuantity: "500 pairs", shippingCountry: "Germany", shippingCity: "Hamburg", courierAccountAvailable: true, requestedTiming: "Receive before 20 September 2026", buyerConfirmation: true, ...overrides }; }
function request(payload = body(), origin = "https://www.beiqiang.online") { return new Request("https://www.beiqiang.online/api/sample-request", { method: "POST", headers: { "Content-Type": "application/json", Origin: origin }, body: JSON.stringify(payload) }); }

test("sample request is saved before notification and never confirms sample terms", async () => {
  let current = source(); const mails = []; const store = { get: async () => current, setJSON: async (_key, value) => { current = value; } };
  const handler = createSampleRequestHandler({ getStoreImpl: () => store, createTransportImpl: () => ({ sendMail: async (mail) => { assert.equal(current.sampleRequests[0].status, "pending"); assert.equal(current.sampleProgram, undefined); mails.push(mail); } }), nowImpl: () => new Date("2026-08-28T02:00:00.000Z"), randomBytesImpl: () => Buffer.from("abcdef012345", "hex") });
  const result = await handler({ request: request(), env: { SMTP_PASS: "configured", INQUIRY_NOTIFY_TO: "sales@example.com" } }); const payload = await result.json();
  assert.equal(result.status, 201); assert.equal(payload.sampleRequest.id, "BSR-ABCDEF012345"); assert.equal(payload.sampleRequest.status, "pending"); assert.equal(payload.sampleRequest.reviewedBy, undefined); assert.equal(payload.notificationSent, true); assert.equal(mails[0].to, "sales@example.com"); assert.match(mails[0].text, /does not confirm sample availability/i); assert.equal(current.sampleProgram, undefined); assert.equal(current.sampleRequests[0].notificationStatus, "sent");
});

test("sample request rejects bad access, unknown styles, active samples and duplicates", async () => {
  let current = source(); const store = { get: async () => current, setJSON: async (_key, value) => { current = value; } }; const handler = createSampleRequestHandler({ getStoreImpl: () => store });
  assert.equal((await handler({ request: request(body(), "https://evil.example"), env: {} })).status, 403);
  assert.equal((await handler({ request: request(body({ accessCode: "00000000000000000000" })), env: {} })).status, 404);
  assert.equal((await handler({ request: request(body({ styleCodes: ["BQ999"] })), env: {} })).status, 409);
  current = source({ sampleProgram: { status: "preparing" } }); assert.equal((await handler({ request: request(), env: {} })).status, 409);
  current = source({ sampleRequests: [{ id: "BSR-111111111111", status: "pending" }] }); assert.equal((await handler({ request: request(), env: {} })).status, 409);
});

test("adaptation and technical sample requests require a buyer target", async () => {
  let current = source(); const store = { get: async () => current, setJSON: async (_key, value) => { current = value; } }; const handler = createSampleRequestHandler({ getStoreImpl: () => store });
  assert.equal((await handler({ request: request(body({ sampleType: "branding_adaptation", customizationTarget: "" })), env: {} })).status, 400);
  assert.equal((await handler({ request: request(body({ sampleType: "technical_development", customizationTarget: "" })), env: {} })).status, 400);
});

test("SMTP failure preserves the pending request for manual review", async () => {
  let current = source(); const store = { get: async () => current, setJSON: async (_key, value) => { current = value; } }; const handler = createSampleRequestHandler({ getStoreImpl: () => store, createTransportImpl: () => ({ sendMail: async () => { throw new Error("smtp down"); } }), randomBytesImpl: () => Buffer.from("abcdef012345", "hex") });
  const result = await handler({ request: request(), env: { SMTP_PASS: "configured" } }); const payload = await result.json();
  assert.equal(result.status, 201); assert.equal(payload.notificationSent, false); assert.equal(current.sampleRequests[0].status, "pending"); assert.equal(current.sampleRequests[0].notificationStatus, "delivery_failed");
});
