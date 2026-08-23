import assert from "node:assert/strict";
import test from "node:test";
import { createAdminWorkspaceContactHandlers } from "../edgeone-deploy/cloud-functions/api/admin/workspace-contacts.js";

const reference = "BQ-20260824-ABCDEF12";
const receivedAt = "2026-08-24T01:00:00.000Z";
const key = `inquiries/2026-08-24/${reference}.json`;
function source() { return { reference, receivedAt, status: "qualified", email: "primary@buyer.com", company: "Buyer Co", owner: "Sales A", accessTokenHash: "SECRET-HASH", workspaceContacts: [], workspaceContactAudit: [] }; }
function request(method, body, token = "correct") { return new Request("https://www.beiqiang.online/api/admin/workspace-contacts", { method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) }); }
function grantBody(overrides = {}) { return { reference, receivedAt, email: "ops@buyer.com", name: "Alex Operations", role: "operations", authorizationBasis: "Primary buyer confirmed access by verified company email on 2026-08-24.", authorizationConfirmed: true, actor: "Sales A", ...overrides }; }

test("workspace contact endpoints reject unauthorized requests before storage access", async () => {
  let reads = 0; const handlers = createAdminWorkspaceContactHandlers({ getStoreImpl: () => { reads += 1; return {}; } });
  assert.equal((await handlers.onRequestPost({ request: request("POST", grantBody(), "wrong"), env: { INQUIRY_ADMIN_TOKEN: "correct" } })).status, 401);
  assert.equal((await handlers.onRequestPatch({ request: request("PATCH", { reference, receivedAt, contactId: "BWC-ABCDEF012345", revocationReason: "Left company" }, "wrong"), env: { INQUIRY_ADMIN_TOKEN: "correct" } })).status, 401);
  assert.equal(reads, 0);
});

test("grant requires explicit verified authority and cannot duplicate the primary email", async () => {
  const record = source(); const store = { get: async () => structuredClone(record), setJSON: async () => { throw new Error("must not write"); } }; const handlers = createAdminWorkspaceContactHandlers({ getStoreImpl: () => store });
  assert.equal((await handlers.onRequestPost({ request: request("POST", grantBody({ authorizationConfirmed: false })), env: { INQUIRY_ADMIN_TOKEN: "correct" } })).status, 400);
  assert.equal((await handlers.onRequestPost({ request: request("POST", grantBody({ email: "PRIMARY@buyer.com" })), env: { INQUIRY_ADMIN_TOKEN: "correct" } })).status, 409);
  record.status = "spam"; assert.equal((await handlers.onRequestPost({ request: request("POST", grantBody()), env: { INQUIRY_ADMIN_TOKEN: "correct" } })).status, 409);
});

test("grant is saved before notification and returns an admin-safe audited record", async () => {
  let current = source(); const snapshots = []; const mails = [];
  const store = { get: async (requested) => requested === key ? structuredClone(current) : null, setJSON: async (requested, value) => { assert.equal(requested, key); current = structuredClone(value); snapshots.push(structuredClone(value)); } };
  const handlers = createAdminWorkspaceContactHandlers({ getStoreImpl: () => store, createTransportImpl: () => ({ sendMail: async (mail) => { assert.equal(current.workspaceContacts[0].status, "active"); assert.equal(current.workspaceContactAudit[0].action, "granted"); mails.push(mail); } }), nowImpl: () => new Date("2026-08-24T02:00:00.000Z"), randomBytesImpl: () => Buffer.from("abcdef012345", "hex") });
  const result = await handlers.onRequestPost({ request: request("POST", grantBody()), env: { INQUIRY_ADMIN_TOKEN: "correct", SMTP_PASS: "configured" } }); const body = await result.json();
  assert.equal(result.status, 201); assert.equal(snapshots.length, 2); assert.equal(body.contact.id, "BWC-ABCDEF012345"); assert.equal(body.contact.notificationStatus, "sent"); assert.equal(body.record.accessTokenHash, undefined); assert.equal(body.record.workspaceContactAudit.length, 1); assert.equal(mails.length, 1); assert.equal(mails[0].to, "ops@buyer.com"); assert.match(mails[0].text, /buyer-safe project summaries only/i); assert.doesNotMatch(mails[0].text, /20-character access code:\s*[A-Z0-9]{20}/i);
});

test("notification failure never rolls back an active delegated contact", async () => {
  let current = source(); const store = { get: async () => structuredClone(current), setJSON: async (requested, value) => { current = structuredClone(value); } };
  const handlers = createAdminWorkspaceContactHandlers({ getStoreImpl: () => store, createTransportImpl: () => ({ sendMail: async () => { throw new Error("smtp down"); } }), nowImpl: () => new Date("2026-08-24T02:00:00.000Z"), randomBytesImpl: () => Buffer.from("abcdef012345", "hex") });
  const result = await handlers.onRequestPost({ request: request("POST", grantBody()), env: { INQUIRY_ADMIN_TOKEN: "correct", SMTP_PASS: "configured" } }); const body = await result.json();
  assert.equal(result.status, 201); assert.equal(current.workspaceContacts[0].status, "active"); assert.equal(current.workspaceContacts[0].notificationStatus, "delivery_failed"); assert.equal(body.notificationSent, false);
});

test("revocation is saved before email, remains audited and cannot be repeated", async () => {
  let current = source(); current.workspaceContacts = [{ id: "BWC-ABCDEF012345", email: "ops@buyer.com", name: "Alex Operations", role: "operations", status: "active", grantedAt: "2026-08-24T01:00:00.000Z", grantedBy: "Sales A", authorizationBasis: "Verified company email", notificationStatus: "sent", notificationAttemptedAt: "2026-08-24T01:00:00.000Z", revokedAt: "", revokedBy: "", revocationReason: "", revocationNotificationStatus: "" }]; current.workspaceContactAudit = [{ id: "BWA-111111111111", contactId: "BWC-ABCDEF012345", action: "granted", email: "ops@buyer.com", role: "operations", actor: "Sales A", reason: "Verified company email", changedAt: "2026-08-24T01:00:00.000Z" }];
  let writes = 0; const mails = []; const store = { get: async () => structuredClone(current), setJSON: async (requested, value) => { current = structuredClone(value); writes += 1; } };
  const handlers = createAdminWorkspaceContactHandlers({ getStoreImpl: () => store, createTransportImpl: () => ({ sendMail: async (mail) => { assert.equal(current.workspaceContacts[0].status, "revoked"); mails.push(mail); } }), nowImpl: () => new Date("2026-08-24T03:00:00.000Z"), randomBytesImpl: () => Buffer.from("222222222222", "hex") });
  const body = { reference, receivedAt, contactId: "BWC-ABCDEF012345", revocationReason: "Contact left the buyer company", actor: "Sales A" };
  const first = await handlers.onRequestPatch({ request: request("PATCH", body), env: { INQUIRY_ADMIN_TOKEN: "correct", SMTP_PASS: "configured" } }); const firstBody = await first.json(); const second = await handlers.onRequestPatch({ request: request("PATCH", body), env: { INQUIRY_ADMIN_TOKEN: "correct", SMTP_PASS: "configured" } });
  assert.equal(first.status, 200); assert.equal(second.status, 409); assert.equal(writes, 2); assert.equal(mails.length, 1); assert.equal(firstBody.contact.status, "revoked"); assert.equal(firstBody.contact.revocationNotificationStatus, "sent"); assert.equal(current.workspaceContactAudit.length, 2); assert.equal(current.workspaceContactAudit.at(-1).action, "revoked");
});

test("primary inquiry email access can be revoked and restored without changing the inquiry email", async () => {
  let current = source(); const mails = []; const store = { get: async () => structuredClone(current), setJSON: async (requested, value) => { current = structuredClone(value); } };
  const handlers = createAdminWorkspaceContactHandlers({ getStoreImpl: () => store, createTransportImpl: () => ({ sendMail: async (mail) => { mails.push(mail); } }), nowImpl: () => new Date("2026-08-24T04:00:00.000Z"), randomBytesImpl: () => Buffer.from("333333333333", "hex") });
  const base = { reference, receivedAt, contactId: "PRIMARY", actor: "Sales A" };
  const revoked = await handlers.onRequestPatch({ request: request("PATCH", { ...base, action: "revoke", reason: "Primary contact left the buyer company" }), env: { INQUIRY_ADMIN_TOKEN: "correct", SMTP_PASS: "configured" } }); const revokedBody = await revoked.json();
  assert.equal(revoked.status, 200); assert.equal(current.email, "primary@buyer.com"); assert.equal(revokedBody.primaryAccess.status, "revoked"); assert.equal(current.workspaceContactAudit.at(-1).action, "primary_revoked"); assert.match(mails[0].subject, /access removed/i);
  const restored = await handlers.onRequestPatch({ request: request("PATCH", { ...base, action: "restore", reason: "Buyer director verified restored mailbox control" }), env: { INQUIRY_ADMIN_TOKEN: "correct", SMTP_PASS: "configured" } }); const restoredBody = await restored.json();
  assert.equal(restored.status, 200); assert.equal(restoredBody.primaryAccess.status, "active"); assert.equal(current.workspaceContactAudit.at(-1).action, "primary_restored"); assert.match(mails[1].subject, /access restored/i);
});
