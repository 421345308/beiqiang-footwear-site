import { timingSafeEqual } from "node:crypto";
import { getStore } from "@edgeone/pages-blob";

function response(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=UTF-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}

function authorized(request, env) {
  const expected = typeof env?.INQUIRY_ADMIN_TOKEN === "string" ? env.INQUIRY_ADMIN_TOKEN.trim() : "";
  const header = request.headers.get("authorization") || "";
  const supplied = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const a = Buffer.from(expected); const b = Buffer.from(supplied);
  return a.length === b.length && a.length > 0 && timingSafeEqual(a, b);
}

function safeDownloadName(value) {
  return String(value || "buyer-file").replace(/[\r\n"\\/]/g, "-").slice(0, 180);
}

export function createAdminAttachmentHandler({ getStoreImpl = getStore } = {}) {
  return async function onRequestGet(context) {
    if (!context.env?.INQUIRY_ADMIN_TOKEN) return response(503, { ok: false, message: "Inquiry dashboard access has not been configured." });
    if (!authorized(context.request, context.env)) return response(401, { ok: false, message: "Invalid access token." });
    const url = new URL(context.request.url);
    const reference = (url.searchParams.get("reference") || "").trim().toUpperCase();
    const receivedAt = (url.searchParams.get("receivedAt") || "").trim();
    const attachmentId = (url.searchParams.get("attachmentId") || "").trim();
    const date = receivedAt.slice(0, 10);
    if (!/^BQ-[A-Z0-9-]+$/.test(reference) || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^[a-f0-9]{20}$/.test(attachmentId)) return response(400, { ok: false, message: "Invalid attachment request." });
    try {
      const inquiryStore = getStoreImpl("beiqiang-inquiries");
      const record = await inquiryStore.get(`inquiries/${date}/${reference}.json`, { type: "json", consistency: "strong" });
      const attachment = record?.attachments?.find((file) => file.id === attachmentId);
      if (!attachment || !String(attachment.key || "").startsWith(`inquiry-files/${date}/${reference}/`)) return response(404, { ok: false, message: "Attachment was not found." });
      if (attachment.revokedAt) return response(410, { ok: false, message: "This attachment has been revoked. Review the inquiry audit before restoring access." });
      const fileStore = getStoreImpl("beiqiang-inquiry-files");
      const file = await fileStore.get(attachment.key, { type: "arrayBuffer", consistency: "strong" });
      if (!file) return response(404, { ok: false, message: "Attachment was not found." });
      const name = safeDownloadName(attachment.name);
      return new Response(file, { status: 200, headers: { "Content-Type": attachment.contentType || "application/octet-stream", "Content-Disposition": `attachment; filename="${name.replace(/[^\x20-\x7E]/g, "-")}"; filename*=UTF-8''${encodeURIComponent(name)}`, "Cache-Control": "no-store, private", "X-Content-Type-Options": "nosniff" } });
    } catch (error) {
      console.error("Admin attachment download failed", error);
      return response(503, { ok: false, message: "Attachment could not be downloaded." });
    }
  };
}

export const onRequestGet = createAdminAttachmentHandler();
