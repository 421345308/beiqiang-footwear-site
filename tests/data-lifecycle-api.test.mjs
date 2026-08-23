import assert from "node:assert/strict";
import test from "node:test";
import { createDataLifecycleHandlers } from "../edgeone-deploy/cloud-functions/api/admin/data-lifecycle.js";

const reference = "BQ-20260823-ABCDEF12";
const receivedAt = "2026-08-23T08:00:00.000Z";
const inquiryKey = `inquiries/2026-08-23/${reference}.json`;
const now = new Date("2026-08-24T10:00:00.000Z");
const env = { INQUIRY_ADMIN_TOKEN: "admin-secret", INQUIRY_DELETE_TOKEN: "separate-delete-secret" };

function request(method, body, { admin = "admin-secret", deletion = "separate-delete-secret" } = {}) {
  return new Request("https://www.beiqiang.online/api/admin/data-lifecycle", { method, headers: { Authorization: `Bearer ${admin}`, "X-Deletion-Authorization": deletion, "Content-Type": "application/json" }, body: JSON.stringify({ reference, receivedAt, ...body }) });
}

function memoryStore(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    async get(key) { return values.get(key) ?? null; },
    async setJSON(key, value, options = {}) { if (options.onlyIfNew && values.has(key)) throw new Error("already exists"); values.set(key, structuredClone(value)); },
    async delete(key) { values.delete(key); },
    async list({ prefix = "" }) { return { blobs: [...values.keys()].filter((key) => key.startsWith(prefix)).map((key) => ({ key })) }; },
  };
}

test("rejects admin and deletion credentials before opening storage", async () => {
  let storesOpened = 0;
  const handlers = createDataLifecycleHandlers({ getStoreImpl: () => { storesOpened += 1; return memoryStore(); }, nowImpl: () => now });
  assert.equal((await handlers.onRequestPatch({ request: request("PATCH", {}, { admin: "wrong" }), env })).status, 401);
  assert.equal((await handlers.onRequestDelete({ request: request("DELETE", {}, { deletion: "wrong" }), env })).status, 401);
  assert.equal(storesOpened, 0);
});

test("records review and hold evidence and blocks deletion requests while held", async () => {
  const inquiryStore = memoryStore({ [inquiryKey]: { reference, receivedAt, email: "buyer@example.com" } });
  const handlers = createDataLifecycleHandlers({ getStoreImpl: () => inquiryStore, nowImpl: () => now });
  assert.equal((await handlers.onRequestPost({ request: request("POST", { action: "schedule_review", actor: "Sales A", reason: "Annual review of inactive website record", reviewDue: "2027-08-24" }), env })).status, 200);
  assert.equal((await handlers.onRequestPost({ request: request("POST", { action: "place_hold", actor: "Sales A", reason: "Open shipment claim requires record preservation", category: "fulfillment_or_claim" }), env })).status, 200);
  assert.equal((await handlers.onRequestPost({ request: request("POST", { action: "request_deletion", actor: "Sales A", reason: "Verified buyer deletion request received", verificationBasis: "Buyer replied from the registered email address", scope: "full_website_inquiry_and_files" }), env })).status, 409);
  const saved = inquiryStore.values.get(inquiryKey);
  assert.equal(saved.dataLifecycle.review.reviewDue, "2027-08-24");
  assert.equal(saved.dataLifecycle.hold.status, "active");
  assert.deepEqual(saved.dataLifecycle.audit.map((item) => item.action), ["review_scheduled", "hold_placed"]);
});

test("requires independent approval and creates a 24-hour cooling-off period", async () => {
  const record = { reference, receivedAt, status: "order_confirmed", orderHandoff: { orderReference: "TA-1" }, dataLifecycle: { review: null, hold: null, deletion: { requestId: "DLR-ONE", status: "requested", scope: "full_website_inquiry_and_files", reason: "Verified request", verificationBasis: "Registered email reply", requestedAt: now.toISOString(), requestedBy: "Sales A" }, audit: [] } };
  const inquiryStore = memoryStore({ [inquiryKey]: record });
  const handlers = createDataLifecycleHandlers({ getStoreImpl: () => inquiryStore, nowImpl: () => now });
  assert.equal((await handlers.onRequestPatch({ request: request("PATCH", { approver: "Sales A", approvalBasis: "Reviewed order and external retention obligations", authoritativeRecordsPreserved: true }), env })).status, 400);
  assert.equal((await handlers.onRequestPatch({ request: request("PATCH", { approver: "Manager B", approvalBasis: "Reviewed order and external retention obligations", authoritativeRecordsPreserved: false }), env })).status, 409);
  assert.equal((await handlers.onRequestPatch({ request: request("PATCH", { approver: "Manager B", approvalBasis: "Reviewed contract, accounting and dispute retention obligations", authoritativeRecordsPreserved: true }), env })).status, 200);
  assert.equal(inquiryStore.values.get(inquiryKey).dataLifecycle.deletion.deleteAfter, "2026-08-25T10:00:00.000Z");
  assert.equal((await handlers.onRequestDelete({ request: request("DELETE", { actor: "Manager B", confirmation: `DELETE ${reference}`, executionBasis: "Rechecked hold state and approved deletion receipt" }), env })).status, 409);
});

test("deletes only matching website records and leaves a minimal completed receipt", async () => {
  const fileKey = `inquiry-files/2026-08-23/${reference}/abcdef0123456789abcd-tech-pack.pdf`;
  const record = { reference, receivedAt, email: "buyer@example.com", attachments: [{ id: "abcdef0123456789abcd", key: fileKey, name: "secret-tech-pack.pdf" }], dataLifecycle: { hold: null, deletion: { requestId: "DLR-TWO", status: "approved", scope: "full_website_inquiry_and_files", requestedAt: "2026-08-22T10:00:00.000Z", requestedBy: "Sales A", approvedAt: "2026-08-22T11:00:00.000Z", approvedBy: "Manager B", deleteAfter: "2026-08-23T11:00:00.000Z" }, audit: [] } };
  const stores = {
    "beiqiang-inquiries": memoryStore({ [inquiryKey]: record, "inquiries/2026-08-23/BQ-OTHER.json": { reference: "BQ-OTHER" } }),
    "beiqiang-inquiry-files": memoryStore({ [fileKey]: new Uint8Array([1]), "inquiry-files/2026-08-23/BQ-OTHER/other.pdf": new Uint8Array([2]) }),
    "beiqiang-buyer-access": memoryStore({ "magic/one.json": { reference }, "session/one.json": { reference }, "activity/one.json": { reference }, "session/other.json": { reference: "BQ-OTHER" } }),
    "beiqiang-events": memoryStore({ "events/one.json": { details: { reference } }, "events/other.json": { details: { reference: "BQ-OTHER" } } }),
    "beiqiang-deletion-audit": memoryStore(),
  };
  const handlers = createDataLifecycleHandlers({ getStoreImpl: (name) => stores[name], nowImpl: () => now });
  const result = await handlers.onRequestDelete({ request: request("DELETE", { actor: "Manager B", confirmation: `DELETE ${reference}`, executionBasis: "Cooling-off complete; hold and scope rechecked" }), env });
  const body = await result.json();
  assert.equal(result.status, 200);
  assert.equal(stores["beiqiang-inquiries"].values.has(inquiryKey), false);
  assert.equal(stores["beiqiang-inquiry-files"].values.has(fileKey), false);
  assert.equal(stores["beiqiang-inquiry-files"].values.has("inquiry-files/2026-08-23/BQ-OTHER/other.pdf"), true);
  assert.equal(stores["beiqiang-buyer-access"].values.has("session/other.json"), true);
  assert.equal(stores["beiqiang-events"].values.has("events/other.json"), true);
  assert.equal(body.receipt.status, "completed");
  assert.doesNotMatch(JSON.stringify(body.receipt), /buyer@example\.com|secret-tech-pack|accessCode|password/i);
  assert.match(body.receipt.boundary, /Trade Assurance/);
});

test("keeps the inquiry marked for investigation when file deletion fails", async () => {
  const fileKey = `inquiry-files/2026-08-23/${reference}/abcdef0123456789abcd-file.pdf`;
  const record = { reference, receivedAt, attachments: [{ id: "abcdef0123456789abcd", key: fileKey }], dataLifecycle: { hold: null, deletion: { requestId: "DLR-FAIL", status: "approved", scope: "full_website_inquiry_and_files", deleteAfter: "2026-08-23T10:00:00.000Z" }, audit: [] } };
  const inquiryStore = memoryStore({ [inquiryKey]: record });
  const stores = { "beiqiang-inquiries": inquiryStore, "beiqiang-inquiry-files": { async delete() { throw new Error("storage failure"); } }, "beiqiang-deletion-audit": memoryStore() };
  const handlers = createDataLifecycleHandlers({ getStoreImpl: (name) => stores[name], nowImpl: () => now });
  const result = await handlers.onRequestDelete({ request: request("DELETE", { actor: "Manager B", confirmation: `DELETE ${reference}`, executionBasis: "Cooling-off complete; hold and scope rechecked" }), env });
  assert.equal(result.status, 503);
  assert.equal(inquiryStore.values.get(inquiryKey).dataLifecycle.deletion.status, "execution_failed");
});
