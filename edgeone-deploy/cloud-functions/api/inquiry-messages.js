import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { getStore } from "@edgeone/pages-blob";
import nodemailer from "nodemailer";

function response(status, body) { return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=UTF-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } }); }
function clean(value, max) { return typeof value === "string" ? value.trim().replace(/\0/g, "").slice(0, max) : ""; }
function safeEqual(left, right) { const a = Buffer.from(left || ""); const b = Buffer.from(right || ""); return a.length === b.length && a.length > 0 && timingSafeEqual(a, b); }
function isAllowedOrigin(origin) { if (!origin) return true; try { const { protocol, hostname } = new URL(origin); if (protocol !== "https:") return hostname === "localhost" || hostname === "127.0.0.1"; return hostname === "www.beiqiang.online" || hostname === "beiqiang.online" || /^beiqiang-footwear-[a-z0-9]+\.edgeone\.dev$/.test(hostname); } catch { return false; } }

async function notifySales(record, body, env, createTransportImpl) {
  if (!env?.SMTP_PASS) return false;
  const recipient = env.INQUIRY_NOTIFY_TO || "421345308@qq.com";
  const transport = createTransportImpl({ host: env.SMTP_HOST || "smtp.qq.com", port: Number(env.SMTP_PORT || 465), secure: String(env.SMTP_SECURE || "true") !== "false", auth: { user: env.SMTP_USER || "421345308@qq.com", pass: env.SMTP_PASS } });
  try {
    await transport.sendMail({ from: env.SMTP_FROM || env.SMTP_USER || "421345308@qq.com", to: recipient, replyTo: record.email || undefined, subject: `[Buyer message] ${record.reference} · ${record.company}`, text: [`Reference: ${record.reference}`, `Buyer: ${record.company} / ${record.name}`, `Email: ${record.email || "-"}`, `WhatsApp: ${record.whatsapp || "-"}`, "", body, "", "Reply in the protected inquiry dashboard so the message remains attached to this sourcing request."].join("\n") });
    return true;
  } catch (error) { console.error("Buyer message notification failed", record.reference, error); return false; }
}

export function createInquiryMessageHandler({ getStoreImpl = getStore, createTransportImpl = nodemailer.createTransport } = {}) {
  return async function onRequestPost(context) {
    if (!isAllowedOrigin(context.request.headers.get("origin"))) return response(403, { ok: false, message: "Request origin is not allowed." });
    const contentLength = Number(context.request.headers.get("content-length") || 0);
    if (contentLength > 10_000) return response(413, { ok: false, message: "Message request is too large." });
    let payload; try { payload = await context.request.json(); } catch { return response(400, { ok: false, message: "Invalid request." }); }
    const reference = clean(payload.reference, 40).toUpperCase(); const accessCode = clean(payload.accessCode, 40).toUpperCase(); const body = clean(payload.message, 2000);
    const match = /^BQ-(\d{4})(\d{2})(\d{2})-([A-F0-9]{8})$/.exec(reference);
    if (!match || !/^[A-F0-9]{20}$/.test(accessCode) || body.length < 2) return response(400, { ok: false, message: "Check the reference, access code and message." });
    const date = `${match[1]}-${match[2]}-${match[3]}`;
    try {
      const store = getStoreImpl("beiqiang-inquiries"); const key = `inquiries/${date}/${reference}.json`; const record = await store.get(key, { type: "json", consistency: "strong" }); const suppliedHash = createHash("sha256").update(accessCode).digest("hex");
      if (!record?.accessTokenHash || !safeEqual(record.accessTokenHash, suppliedHash)) return response(404, { ok: false, message: "No matching inquiry was found." });
      if (["lost", "spam"].includes(record.status)) return response(409, { ok: false, message: "This request is closed. Contact Beiqiang by email or WhatsApp if it should be reopened." });
      const messages = Array.isArray(record.messages) ? record.messages : [];
      if (messages.length >= 100) return response(409, { ok: false, message: "This message thread is full. Continue by email or WhatsApp using the inquiry reference." });
      const latestBuyer = [...messages].reverse().find((item) => item.sender === "buyer");
      if (latestBuyer && Date.now() - Date.parse(latestBuyer.sentAt) < 15_000) return response(429, { ok: false, message: "Please wait a moment before sending another message." });
      const sentAt = new Date().toISOString(); const message = { id: `MSG-${randomBytes(6).toString("hex").toUpperCase()}`, sender: "buyer", body, sentAt, notificationSent: false };
      const updated = { ...record, messages: [...messages, message], updatedAt: sentAt };
      await store.setJSON(key, updated, { cacheControl: null });
      const notificationSent = await notifySales(record, body, context.env || {}, createTransportImpl);
      if (notificationSent) { updated.messages = updated.messages.map((item) => item.id === message.id ? { ...item, notificationSent: true } : item); await store.setJSON(key, updated, { cacheControl: null }); }
      return response(201, { ok: true, notificationSent, message: "Your message was saved with this inquiry. Beiqiang will review it with the same reference." });
    } catch (error) { console.error("Buyer inquiry message failed", error); return response(503, { ok: false, message: "Your message could not be saved. Contact Beiqiang by email or WhatsApp." }); }
  };
}

export const onRequestPost = createInquiryMessageHandler();
