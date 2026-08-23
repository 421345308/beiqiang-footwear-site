import { timingSafeEqual } from "node:crypto";
import { getStore } from "@edgeone/pages-blob";

function response(status, body) { return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=UTF-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } }); }
function clean(value, max) { return typeof value === "string" ? value.trim().replace(/\0/g, "").slice(0, max) : ""; }
function authorized(request, env) { const expected = typeof env?.INQUIRY_ADMIN_TOKEN === "string" ? env.INQUIRY_ADMIN_TOKEN.trim() : ""; const header = request.headers.get("authorization") || ""; const supplied = header.startsWith("Bearer ") ? header.slice(7).trim() : ""; const a = Buffer.from(expected); const b = Buffer.from(supplied); return a.length === b.length && a.length > 0 && timingSafeEqual(a, b); }
function safeRecord(record) { const safe = { ...record }; delete safe.accessTokenHash; delete safe.pendingUploads; delete safe.pendingAttachments; delete safe.pendingOrderDocuments; safe.attachments = (record.attachments || []).map((item) => { const copy = { ...item }; delete copy.key; return copy; }); safe.orderDocuments = (record.orderDocuments || []).map((item) => { const copy = { ...item }; delete copy.key; return copy; }); return safe; }

export function createDocumentLifecycleHandler({ getStoreImpl = getStore } = {}) {
  return async function onRequestPost(context) {
    if (!context.env?.INQUIRY_ADMIN_TOKEN) return response(503, { ok: false, message: "Inquiry dashboard access has not been configured." });
    if (!authorized(context.request, context.env)) return response(401, { ok: false, message: "Invalid access token." });
    let payload; try { payload = await context.request.json(); } catch { return response(400, { ok: false, message: "Invalid request." }); }
    const reference = clean(payload.reference, 40).toUpperCase(); const date = clean(payload.receivedAt, 40).slice(0, 10); const fileId = clean(payload.fileId, 40); const kind = payload.kind === "buyer_attachment" ? "buyer_attachment" : payload.kind === "order_document" ? "order_document" : ""; const action = payload.action === "restore" ? "restore" : payload.action === "revoke" ? "revoke" : ""; const reason = clean(payload.reason, 600); const actor = clean(payload.actor, 100) || "Authorized admin";
    if (!/^BQ-[A-Z0-9-]+$/.test(reference) || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^[a-f0-9]{20}$/.test(fileId) || !kind || !action || reason.length < 3) return response(400, { ok: false, message: "Choose the file action and record a specific reason." });
    const key = `inquiries/${date}/${reference}.json`; const field = kind === "buyer_attachment" ? "attachments" : "orderDocuments";
    try {
      const store = getStoreImpl("beiqiang-inquiries"); const record = await store.get(key, { type: "json", consistency: "strong" }); if (!record) return response(404, { ok: false, message: "Inquiry record was not found." });
      const files = Array.isArray(record[field]) ? record[field] : []; const index = files.findIndex((item) => item.id === fileId); if (index < 0) return response(404, { ok: false, message: "The referenced file was not found." });
      const file = files[index]; if (action === "revoke" && file.revokedAt) return response(409, { ok: false, message: "This file is already revoked." }); if (action === "restore" && !file.revokedAt) return response(409, { ok: false, message: "This file is already active." });
      const changedAt = new Date().toISOString(); const updatedFile = action === "revoke" ? { ...file, revokedAt: changedAt, revokedBy: actor, revocationReason: reason } : { ...file, revokedAt: "", revokedBy: "", revocationReason: "", restoredAt: changedAt, restoredBy: actor, restorationReason: reason };
      const audit = { id: `${changedAt}-${fileId}-${action}`, kind, fileId, fileName: clean(file.name, 180), action, reason, actor, changedAt };
      const updated = { ...record, [field]: files.map((item, itemIndex) => itemIndex === index ? updatedFile : item), documentAudit: [...(Array.isArray(record.documentAudit) ? record.documentAudit : []).slice(-99), audit], updatedAt: changedAt };
      await store.setJSON(key, updated, { cacheControl: null }); return response(200, { ok: true, record: safeRecord(updated), audit });
    } catch (error) { console.error("Document lifecycle update failed", error); return response(503, { ok: false, message: "The file lifecycle action could not be saved." }); }
  };
}

export const onRequestPost = createDocumentLifecycleHandler();
