import { randomBytes, timingSafeEqual } from "node:crypto";
import { getStore } from "@edgeone/pages-blob";
import nodemailer from "nodemailer";

function response(status, body) { return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=UTF-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } }); }
function clean(value, max) { return typeof value === "string" ? value.trim().replace(/\0/g, "").slice(0, max) : ""; }
function authorized(request, env) { const expected = typeof env?.INQUIRY_ADMIN_TOKEN === "string" ? env.INQUIRY_ADMIN_TOKEN.trim() : ""; const header = request.headers.get("authorization") || ""; const supplied = header.startsWith("Bearer ") ? header.slice(7).trim() : ""; const a = Buffer.from(expected); const b = Buffer.from(supplied); return a.length === b.length && a.length > 0 && timingSafeEqual(a, b); }
function adminSafeRecord(record) { const safe = { ...record }; delete safe.accessTokenHash; delete safe.pendingUploads; delete safe.pendingAttachments; delete safe.pendingOrderDocuments; safe.attachments = Array.isArray(record.attachments) ? record.attachments.map((file) => { const copy = { ...file }; delete copy.key; return copy; }) : []; safe.orderDocuments = Array.isArray(record.orderDocuments) ? record.orderDocuments.map((document) => { const copy = { ...document }; delete copy.key; return copy; }) : []; return safe; }

async function notifyBuyer(record, body, env, createTransportImpl) {
  if (!record.email || !env?.SMTP_PASS) return false;
  const replyTo = env.INQUIRY_NOTIFY_TO || "421345308@qq.com";
  const transport = createTransportImpl({ host: env.SMTP_HOST || "smtp.qq.com", port: Number(env.SMTP_PORT || 465), secure: String(env.SMTP_SECURE || "true") !== "false", auth: { user: env.SMTP_USER || "421345308@qq.com", pass: env.SMTP_PASS } });
  try {
    await transport.sendMail({ from: env.SMTP_FROM || env.SMTP_USER || "421345308@qq.com", to: record.email, replyTo, subject: `Beiqiang message · ${record.reference}`, text: [`Hello ${record.name},`, "", "Beiqiang added a message to your sourcing request:", "", body, "", `Inquiry reference: ${record.reference}`, "Private status page: https://www.beiqiang.online/inquiry-status/", "", "Use your original private access code to read the full thread and reply. This message does not change quotation or order terms unless separately confirmed in writing.", "", "Quanzhou Beiqiang Footwear & Apparel Co., Ltd.", "421345308@qq.com", "WhatsApp: +86 189 5980 5256"].join("\n") });
    return true;
  } catch (error) { console.error("Buyer message email failed", record.reference, error); return false; }
}

export function createAdminInquiryMessageHandler({ getStoreImpl = getStore, createTransportImpl = nodemailer.createTransport } = {}) {
  return async function onRequestPost(context) {
    if (!context.env?.INQUIRY_ADMIN_TOKEN) return response(503, { ok: false, message: "Inquiry dashboard access has not been configured." });
    if (!authorized(context.request, context.env)) return response(401, { ok: false, message: "Invalid access token." });
    let payload; try { payload = await context.request.json(); } catch { return response(400, { ok: false, message: "Invalid request." }); }
    const reference = clean(payload.reference, 40).toUpperCase(); const receivedAt = clean(payload.receivedAt, 40); const body = clean(payload.message, 2000); const date = receivedAt.slice(0, 10);
    if (!/^BQ-[A-Z0-9-]+$/.test(reference) || !/^\d{4}-\d{2}-\d{2}$/.test(date) || body.length < 2) return response(400, { ok: false, message: "Check the inquiry and message." });
    try {
      const store = getStoreImpl("beiqiang-inquiries"); const key = `inquiries/${date}/${reference}.json`; const record = await store.get(key, { type: "json", consistency: "strong" });
      if (!record) return response(404, { ok: false, message: "Inquiry record was not found." });
      const messages = Array.isArray(record.messages) ? record.messages : [];
      if (messages.length >= 100) return response(409, { ok: false, message: "This message thread is full. Continue using email or WhatsApp." });
      const sentAt = new Date().toISOString(); const message = { id: `MSG-${randomBytes(6).toString("hex").toUpperCase()}`, sender: "sales", body, sentAt, notificationSent: false };
      const updated = { ...record, messages: [...messages, message], lastContactedAt: sentAt.slice(0, 10), updatedAt: sentAt };
      await store.setJSON(key, updated, { cacheControl: null });
      const notificationSent = await notifyBuyer(record, body, context.env || {}, createTransportImpl);
      if (notificationSent) { updated.messages = updated.messages.map((item) => item.id === message.id ? { ...item, notificationSent: true } : item); await store.setJSON(key, updated, { cacheControl: null }); }
      return response(201, { ok: true, record: adminSafeRecord(updated), notificationSent });
    } catch (error) { console.error("Admin inquiry message failed", error); return response(503, { ok: false, message: "Message could not be saved." }); }
  };
}

export const onRequestPost = createAdminInquiryMessageHandler();
