import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { createAdminOrderDocumentHandlers } from "../edgeone-deploy/cloud-functions/api/admin/order-documents.js";
import { createBuyerOrderDocumentHandler } from "../edgeone-deploy/cloud-functions/api/order-document.js";

const reference = "BQ-20260823-ABCDEF12"; const receivedAt = "2026-08-23T08:00:00.000Z"; const accessCode = "ABCDEF0123456789ABCD";

test("requires admin access before preparing a buyer-facing document", async () => {
  let reads = 0; const handlers = createAdminOrderDocumentHandlers({ getStoreImpl: () => { reads += 1; return {}; } });
  const request = new Request("https://www.beiqiang.online/api/admin/order-documents", { method: "POST", headers: { Authorization: "Bearer wrong", "Content-Type": "application/json" }, body: JSON.stringify({ reference, receivedAt, name: "qc.pdf", contentType: "application/pdf", size: 100, category: "quality_inspection", title: "QC summary" }) });
  const result = await handlers.onRequestPost({ request, env: { INQUIRY_ADMIN_TOKEN: "correct" } }); assert.equal(result.status, 401); assert.equal(reads, 0);
});

test("verifies, saves and emails a buyer-facing order document", async () => {
  let record = { reference, receivedAt, status: "production", company: "Buyer Co", name: "Jane", email: "jane@example.com", orderDocuments: [] }; const mails = []; let blobKey = "";
  const inquiryStore = { get: async () => record, setJSON: async (key, value) => { record = value; } };
  const fileStore = { createUploadUrl: async (key, options) => { blobKey = key; return { key, url: "https://upload.example/file", expiresAt: Math.floor(Date.now() / 1000) + 900, options }; }, getMetadata: async () => ({ contentType: "application/pdf", headers: { "content-length": "100" } }), delete: async () => {} };
  const handlers = createAdminOrderDocumentHandlers({ getStoreImpl: (name) => name === "beiqiang-inquiries" ? inquiryStore : fileStore, createTransportImpl: () => ({ sendMail: async (mail) => { mails.push(mail); } }) });
  const common = { reference, receivedAt, name: "qc-summary.pdf", contentType: "application/pdf", size: 100, category: "quality_inspection", title: "BQ009 quality inspection summary", note: "Inspection evidence for the referenced batch." };
  const permissionRequest = new Request("https://www.beiqiang.online/api/admin/order-documents", { method: "POST", headers: { Authorization: "Bearer correct", "Content-Type": "application/json" }, body: JSON.stringify(common) }); const permissionResponse = await handlers.onRequestPost({ request: permissionRequest, env: { INQUIRY_ADMIN_TOKEN: "correct" } }); const permission = await permissionResponse.json();
  assert.equal(permissionResponse.status, 201); assert.match(blobKey, new RegExp(`^order-documents/2026-08-23/${reference}/`));
  const finalizeRequest = new Request("https://www.beiqiang.online/api/admin/order-documents", { method: "PATCH", headers: { Authorization: "Bearer correct", "Content-Type": "application/json" }, body: JSON.stringify({ ...common, uploadId: permission.uploadId, key: permission.key }) }); const finalizeResponse = await handlers.onRequestPatch({ request: finalizeRequest, env: { INQUIRY_ADMIN_TOKEN: "correct", SMTP_PASS: "test" } }); const result = await finalizeResponse.json();
  assert.equal(finalizeResponse.status, 201); assert.equal(record.orderDocuments[0].category, "quality_inspection"); assert.equal(record.orderDocuments[0].notificationSent, true); assert.equal(result.document.key, undefined); assert.equal(mails.length, 1); assert.match(mails[0].text, /does not change specifications/i);
});

test("rejects a document whose stored bytes do not match the upload reservation", async () => {
  const pending = { id: "abcdef0123456789abcd", key: `order-documents/2026-08-23/${reference}/abcdef0123456789abcd-qc.pdf`, name: "qc.pdf", title: "QC", category: "quality_inspection", note: "", contentType: "application/pdf", size: 100, expiresAt: Math.floor(Date.now() / 1000) + 900 }; const record = { reference, receivedAt, status: "production", pendingOrderDocuments: [pending], orderDocuments: [] }; let deleted = false;
  const handlers = createAdminOrderDocumentHandlers({ getStoreImpl: (name) => name === "beiqiang-inquiries" ? { get: async () => record } : { getMetadata: async () => ({ contentType: "application/pdf", headers: { "content-length": "99" } }), delete: async () => { deleted = true; } } });
  const request = new Request("https://www.beiqiang.online/api/admin/order-documents", { method: "PATCH", headers: { Authorization: "Bearer correct", "Content-Type": "application/json" }, body: JSON.stringify({ reference, receivedAt, uploadId: pending.id, key: pending.key }) }); const result = await handlers.onRequestPatch({ request, env: { INQUIRY_ADMIN_TOKEN: "correct" } }); assert.equal(result.status, 400); assert.equal(deleted, true);
});

test("downloads an order document only with the buyer private access code", async () => {
  const document = { id: "abcdef0123456789abcd", key: `order-documents/2026-08-23/${reference}/abcdef0123456789abcd-qc.pdf`, name: "qc summary.pdf", contentType: "application/pdf" }; const record = { reference, accessTokenHash: createHash("sha256").update(accessCode).digest("hex"), orderDocuments: [document] };
  const handler = createBuyerOrderDocumentHandler({ getStoreImpl: (name) => name === "beiqiang-inquiries" ? { get: async () => record } : { get: async () => new TextEncoder().encode("PDF") } });
  const request = (code) => new Request("https://www.beiqiang.online/api/order-document", { method: "POST", headers: { Origin: "https://www.beiqiang.online", "Content-Type": "application/json" }, body: JSON.stringify({ reference, accessCode: code, documentId: document.id }) });
  assert.equal((await handler({ request: request("FFFFFFFFFFFFFFFFFFFF") })).status, 404); const result = await handler({ request: request(accessCode) }); assert.equal(result.status, 200); assert.equal(result.headers.get("content-type"), "application/pdf"); assert.match(result.headers.get("content-disposition"), /attachment/);
});

test("buyer download rejects a revoked transaction document", async () => {
  const document = { id: "abcdef0123456789abcd", key: `order-documents/2026-08-23/${reference}/abcdef0123456789abcd-qc.pdf`, name: "qc.pdf", contentType: "application/pdf", revokedAt: "2026-08-23T10:00:00.000Z" }; const record = { reference, accessTokenHash: createHash("sha256").update(accessCode).digest("hex"), orderDocuments: [document] }; let fileReads = 0;
  const handler = createBuyerOrderDocumentHandler({ getStoreImpl: (name) => name === "beiqiang-inquiries" ? { get: async () => record } : { get: async () => { fileReads += 1; return new TextEncoder().encode("PDF"); } } });
  const request = new Request("https://www.beiqiang.online/api/order-document", { method: "POST", headers: { Origin: "https://www.beiqiang.online", "Content-Type": "application/json" }, body: JSON.stringify({ reference, accessCode, documentId: document.id }) });
  assert.equal((await handler({ request })).status, 410); assert.equal(fileReads, 0);
});
