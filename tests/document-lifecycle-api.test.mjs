import assert from "node:assert/strict";
import test from "node:test";
import { createDocumentLifecycleHandler } from "../edgeone-deploy/cloud-functions/api/admin/document-lifecycle.js";

const reference = "BQ-20260823-ABCDEF12"; const receivedAt = "2026-08-23T08:00:00.000Z"; const fileId = "abcdef0123456789abcd";
function request(action, token = "correct", reason = "Superseded by reviewed version") { return new Request("https://www.beiqiang.online/api/admin/document-lifecycle", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ reference, receivedAt, fileId, kind: "order_document", action, reason, actor: "Sales A" }) }); }

test("protects file lifecycle actions with the admin token", async () => {
  let reads = 0; const handler = createDocumentLifecycleHandler({ getStoreImpl: () => { reads += 1; return {}; } });
  assert.equal((await handler({ request: request("revoke", "wrong"), env: { INQUIRY_ADMIN_TOKEN: "correct" } })).status, 401); assert.equal(reads, 0);
});

test("revokes access while preserving the file record and appending audit evidence", async () => {
  const document = { id: fileId, key: `order-documents/2026-08-23/${reference}/${fileId}-spec.pdf`, name: "spec.pdf", title: "Specification" }; let saved;
  const handler = createDocumentLifecycleHandler({ getStoreImpl: () => ({ get: async () => ({ reference, receivedAt, orderDocuments: [document] }), setJSON: async (key, value) => { saved = value; } }) });
  const result = await handler({ request: request("revoke"), env: { INQUIRY_ADMIN_TOKEN: "correct" } }); const body = await result.json();
  assert.equal(result.status, 200); assert.ok(saved.orderDocuments[0].revokedAt); assert.equal(saved.orderDocuments[0].key, document.key); assert.equal(saved.documentAudit[0].action, "revoke"); assert.equal(body.record.orderDocuments[0].key, undefined);
});

test("restores access only from a revoked record and keeps both audit events", async () => {
  const document = { id: fileId, key: `order-documents/2026-08-23/${reference}/${fileId}-spec.pdf`, name: "spec.pdf", revokedAt: "2026-08-23T09:00:00.000Z", revocationReason: "Wrong version" }; let saved;
  const handler = createDocumentLifecycleHandler({ getStoreImpl: () => ({ get: async () => ({ reference, receivedAt, orderDocuments: [document], documentAudit: [{ id: "old", action: "revoke" }] }), setJSON: async (key, value) => { saved = value; } }) });
  assert.equal((await handler({ request: request("restore", "correct", "Reviewed and approved for restoration"), env: { INQUIRY_ADMIN_TOKEN: "correct" } })).status, 200); assert.equal(saved.orderDocuments[0].revokedAt, ""); assert.ok(saved.orderDocuments[0].restoredAt); assert.equal(saved.documentAudit.length, 2); assert.equal(saved.documentAudit.at(-1).action, "restore");
});
