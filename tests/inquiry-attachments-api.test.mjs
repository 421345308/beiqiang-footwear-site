import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { createInquiryAttachmentHandler } from "../edgeone-deploy/cloud-functions/api/inquiry-attachments.js";
import { createAdminAttachmentHandler } from "../edgeone-deploy/cloud-functions/api/admin/inquiry-attachment.js";

const reference = "BQ-20260823-ABCDEF12";
const accessCode = "ABCDEF0123456789ABCD";
const record = { reference, receivedAt: "2026-08-23T08:00:00.000Z", accessTokenHash: createHash("sha256").update(accessCode).digest("hex"), attachments: [] };

function buyerRequest(method, body) {
  return new Request("https://www.beiqiang.online/api/inquiry-attachments", { method, headers: { "Content-Type": "application/json", Origin: "https://www.beiqiang.online" }, body: JSON.stringify({ reference, accessCode, name: "brand-tech-pack.pdf", contentType: "application/pdf", size: 2048, ...body }) });
}

test("issues a short-lived upload URL only after inquiry access verification", async () => {
  const stores = {
    "beiqiang-inquiries": { get: async () => record, setJSON: async () => {} },
    "beiqiang-inquiry-files": { createUploadUrl: async (key, options) => ({ url: "https://upload.example/signed", key, expiresAt: 123, options }) },
  };
  const handler = createInquiryAttachmentHandler({ getStoreImpl: (name) => stores[name] });
  const result = await handler.onRequestPost({ request: buyerRequest("POST") }); const body = await result.json();
  assert.equal(result.status, 201); assert.equal(body.ok, true); assert.match(body.key, new RegExp(`^inquiry-files/2026-08-23/${reference}/[a-f0-9]{20}-brand-tech-pack\\.pdf$`)); assert.equal(body.contentType, "application/pdf");
});

test("rejects unsafe attachment types before creating storage access", async () => {
  let uploads = 0;
  const handler = createInquiryAttachmentHandler({ getStoreImpl: (name) => name === "beiqiang-inquiries" ? { get: async () => record, setJSON: async () => {} } : { createUploadUrl: async () => { uploads += 1; } } });
  const result = await handler.onRequestPost({ request: buyerRequest("POST", { name: "page.svg", contentType: "image/svg+xml" }) });
  assert.equal(result.status, 400); assert.equal(uploads, 0);
});

test("verifies the stored file and attaches metadata to the inquiry", async () => {
  let saved;
  const uploadId = "abcdef0123456789abcd"; const key = `inquiry-files/2026-08-23/${reference}/${uploadId}-brand-tech-pack.pdf`;
  const recordWithPending = { ...record, pendingAttachments: [{ id: uploadId, key, name: "brand-tech-pack.pdf", contentType: "application/pdf", size: 2048, expiresAt: Math.floor(Date.now() / 1000) + 900 }] };
  const stores = {
    "beiqiang-inquiries": { get: async () => recordWithPending, setJSON: async (savedKey, value) => { saved = { savedKey, value }; } },
    "beiqiang-inquiry-files": { getMetadata: async () => ({ contentType: "application/pdf", headers: { "content-length": "2048" } }), delete: async () => {} },
  };
  const handler = createInquiryAttachmentHandler({ getStoreImpl: (name) => stores[name] });
  const result = await handler.onRequestPatch({ request: buyerRequest("PATCH", { uploadId, key }) }); const body = await result.json();
  assert.equal(result.status, 201); assert.equal(body.attachment.name, "brand-tech-pack.pdf"); assert.equal(saved.value.attachments.length, 1); assert.equal(saved.value.attachments[0].key, key);
});

test("admin download requires the token and a file recorded on that inquiry", async () => {
  const attachment = { id: "abcdef0123456789abcd", key: `inquiry-files/2026-08-23/${reference}/abcdef0123456789abcd-brand-tech-pack.pdf`, name: "brand-tech-pack.pdf", contentType: "application/pdf" };
  const stores = { "beiqiang-inquiries": { get: async () => ({ ...record, attachments: [attachment] }) }, "beiqiang-inquiry-files": { get: async () => new TextEncoder().encode("pdf").buffer } };
  const handler = createAdminAttachmentHandler({ getStoreImpl: (name) => stores[name] });
  const url = `https://www.beiqiang.online/api/admin/inquiry-attachment?reference=${reference}&receivedAt=${encodeURIComponent(record.receivedAt)}&attachmentId=${attachment.id}`;
  assert.equal((await handler({ request: new Request(url), env: { INQUIRY_ADMIN_TOKEN: "correct-token" } })).status, 401);
  const result = await handler({ request: new Request(url, { headers: { Authorization: "Bearer correct-token" } }), env: { INQUIRY_ADMIN_TOKEN: "correct-token" } });
  assert.equal(result.status, 200); assert.match(result.headers.get("content-disposition"), /attachment;/); assert.equal(await result.text(), "pdf");
});

test("admin download rejects a revoked buyer attachment before reading file bytes", async () => {
  const attachment = { id: "abcdef0123456789abcd", key: `inquiry-files/2026-08-23/${reference}/abcdef0123456789abcd-brand-tech-pack.pdf`, name: "brand-tech-pack.pdf", contentType: "application/pdf", revokedAt: "2026-08-23T10:00:00.000Z" }; let fileReads = 0;
  const stores = { "beiqiang-inquiries": { get: async () => ({ ...record, attachments: [attachment] }) }, "beiqiang-inquiry-files": { get: async () => { fileReads += 1; return new ArrayBuffer(1); } } };
  const handler = createAdminAttachmentHandler({ getStoreImpl: (name) => stores[name] }); const url = `https://www.beiqiang.online/api/admin/inquiry-attachment?reference=${reference}&receivedAt=${encodeURIComponent(record.receivedAt)}&attachmentId=${attachment.id}`;
  assert.equal((await handler({ request: new Request(url, { headers: { Authorization: "Bearer correct-token" } }), env: { INQUIRY_ADMIN_TOKEN: "correct-token" } })).status, 410); assert.equal(fileReads, 0);
});
