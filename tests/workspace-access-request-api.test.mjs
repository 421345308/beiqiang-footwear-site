import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { createWorkspaceAccessRequestHandler } from "../edgeone-deploy/cloud-functions/api/workspace-access-request.js";

const reference = "BQ-20260828-ABCDEF12";
const accessCode = "ABCDEF0123456789ABCD";
function source(overrides = {}) { return { reference, receivedAt: "2026-08-28T01:00:00.000Z", status: "qualified", company: "Buyer Co", email: "primary@buyer.com", accessTokenHash: createHash("sha256").update(accessCode).digest("hex"), workspaceContacts: [], workspaceAccessRequests: [], ...overrides }; }
function body(overrides = {}) { return { reference, accessCode, name: "Alex Finance", email: "finance@buyer.com", role: "finance", purpose: "Review quotation and formal order preparation for this project.", confirmed: true, ...overrides }; }
function request(payload = body(), origin = "https://www.beiqiang.online") { return new Request("https://www.beiqiang.online/api/workspace-access-request", { method: "POST", headers: { "Content-Type": "application/json", Origin: origin }, body: JSON.stringify(payload) }); }

test("colleague request rejects bad origin, bad project access and primary email", async () => {
  let current = source(); const store = { get: async () => current, setJSON: async (_key, value) => { current = value; } }; const handler = createWorkspaceAccessRequestHandler({ getStoreImpl: () => store });
  assert.equal((await handler({ request: request(body(), "https://evil.example"), env: {} })).status, 403);
  assert.equal((await handler({ request: request(body({ accessCode: "00000000000000000000" })), env: {} })).status, 404);
  assert.equal((await handler({ request: request(body({ email: "PRIMARY@buyer.com" })), env: {} })).status, 409);
  assert.equal(current.workspaceAccessRequests.length, 0);
});

test("colleague request is saved before sales notification and never grants access", async () => {
  let current = source(); const mails = []; const store = { get: async () => current, setJSON: async (_key, value) => { current = value; } }; const handler = createWorkspaceAccessRequestHandler({ getStoreImpl: () => store, createTransportImpl: () => ({ sendMail: async (mail) => { assert.equal(current.workspaceAccessRequests[0].status, "pending"); assert.equal(current.workspaceContacts.length, 0); mails.push(mail); } }), nowImpl: () => new Date("2026-08-28T02:00:00.000Z"), randomBytesImpl: () => Buffer.from("abcdef012345", "hex") });
  const result = await handler({ request: request(), env: { SMTP_PASS: "configured", INQUIRY_NOTIFY_TO: "sales@example.com" } }); const payload = await result.json();
  assert.equal(result.status, 201); assert.equal(payload.request.id, "BWR-ABCDEF012345"); assert.equal(payload.request.status, "pending"); assert.equal(payload.request.reviewedBy, undefined); assert.equal(payload.notificationSent, true); assert.equal(mails[0].to, "sales@example.com"); assert.match(mails[0].text, /does not grant access/i); assert.equal(current.workspaceContacts.length, 0);
});

test("duplicate pending and already-authorized colleagues are rejected", async () => {
  let current = source({ workspaceAccessRequests: [{ id: "BWR-111111111111", email: "finance@buyer.com", status: "pending" }] }); const store = { get: async () => current, setJSON: async (_key, value) => { current = value; } }; const handler = createWorkspaceAccessRequestHandler({ getStoreImpl: () => store });
  assert.equal((await handler({ request: request(), env: {} })).status, 409);
  current = source({ workspaceContacts: [{ email: "finance@buyer.com", status: "active" }] });
  assert.equal((await handler({ request: request(), env: {} })).status, 409);
});

test("notification failure keeps the pending request for manual review", async () => {
  let current = source(); const store = { get: async () => current, setJSON: async (_key, value) => { current = value; } }; const handler = createWorkspaceAccessRequestHandler({ getStoreImpl: () => store, createTransportImpl: () => ({ sendMail: async () => { throw new Error("smtp down"); } }), randomBytesImpl: () => Buffer.from("abcdef012345", "hex") });
  const result = await handler({ request: request(), env: { SMTP_PASS: "configured" } }); const payload = await result.json();
  assert.equal(result.status, 201); assert.equal(payload.notificationSent, false); assert.equal(current.workspaceAccessRequests[0].status, "pending"); assert.equal(current.workspaceAccessRequests[0].notificationStatus, "delivery_failed");
});
