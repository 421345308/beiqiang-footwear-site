import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { getStore } from "@edgeone/pages-blob";
import nodemailer from "nodemailer";

function response(status, body) { return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=UTF-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } }); }
function clean(value, max) { return typeof value === "string" ? value.trim().replace(/\0/g, "").slice(0, max) : ""; }
function safeEqual(left, right) { const a = Buffer.from(left || ""); const b = Buffer.from(right || ""); return a.length === b.length && a.length > 0 && timingSafeEqual(a, b); }
function isAllowedOrigin(origin) { if (!origin) return true; try { const { protocol, hostname } = new URL(origin); if (protocol !== "https:") return hostname === "localhost" || hostname === "127.0.0.1"; return hostname === "www.beiqiang.online" || hostname === "beiqiang.online" || /^beiqiang-footwear-[a-z0-9]+\.edgeone\.dev$/.test(hostname); } catch { return false; } }

async function notifySales(record, orderRequest, env, createTransportImpl) {
  if (!env?.SMTP_PASS) return false;
  const recipient = env.INQUIRY_NOTIFY_TO || "421345308@qq.com";
  const transport = createTransportImpl({ host: env.SMTP_HOST || "smtp.qq.com", port: Number(env.SMTP_PORT || 465), secure: String(env.SMTP_SECURE || "true") !== "false", auth: { user: env.SMTP_USER || "421345308@qq.com", pass: env.SMTP_PASS } });
  try {
    await transport.sendMail({
      from: env.SMTP_FROM || env.SMTP_USER || "421345308@qq.com", to: recipient, replyTo: record.email || undefined,
      subject: `[Order setup requested] ${record.reference} · ${orderRequest.legalCompanyName}`,
      text: [
        `Reference: ${record.reference}`, `Accepted quotation: ${orderRequest.quoteNumber}`, `Legal company: ${orderRequest.legalCompanyName}`,
        `Purchasing contact: ${orderRequest.purchasingContact}`, `Preferred channel: ${orderRequest.preferredOrderChannel}`,
        `Buyer PO reference: ${orderRequest.purchaseOrderReference || "-"}`, `Destination: ${orderRequest.destination}`,
        `Requested delivery / production window: ${orderRequest.requestedWindow}`, `Instructions: ${orderRequest.instructions || "-"}`,
        "This is a buyer order-setup request, not a confirmed production order. Verify all eight order-readiness items before creating or confirming the formal order.",
      ].join("\n"),
    });
    return true;
  } catch (error) { console.error("Order setup request notification failed", record.reference, error); return false; }
}

export function createOrderSetupRequestHandler({ getStoreImpl = getStore, createTransportImpl = nodemailer.createTransport, randomBytesImpl = randomBytes } = {}) {
  return async function onRequestPost(context) {
    if (!isAllowedOrigin(context.request.headers.get("origin"))) return response(403, { ok: false, message: "Request origin is not allowed." });
    let payload; try { payload = await context.request.json(); } catch { return response(400, { ok: false, message: "Invalid request." }); }
    const reference = clean(payload.reference, 40).toUpperCase(); const accessCode = clean(payload.accessCode, 40).toUpperCase(); const quoteNumber = clean(payload.quoteNumber, 80);
    const preferredOrderChannel = ["alibaba_trade_assurance", "contract", "need_guidance"].includes(payload.preferredOrderChannel) ? payload.preferredOrderChannel : "";
    const legalCompanyName = clean(payload.legalCompanyName, 160); const purchasingContact = clean(payload.purchasingContact, 120); const purchaseOrderReference = clean(payload.purchaseOrderReference, 120);
    const destination = clean(payload.destination, 240); const requestedWindow = clean(payload.requestedWindow, 240); const instructions = clean(payload.instructions, 1200);
    const match = /^BQ-(\d{4})(\d{2})(\d{2})-([A-F0-9]{8})$/.exec(reference);
    if (!match || !/^[A-F0-9]{20}$/.test(accessCode) || !quoteNumber.startsWith(`${reference}-Q`)) return response(400, { ok: false, message: "Check the order setup access details." });
    if (!preferredOrderChannel || legalCompanyName.length < 2 || purchasingContact.length < 2 || destination.length < 2 || requestedWindow.length < 2 || payload.buyerConfirmation !== true) return response(400, { ok: false, message: "Complete the legal company, purchasing contact, order channel, destination, requested timing and confirmation." });
    const date = `${match[1]}-${match[2]}-${match[3]}`;
    try {
      const store = getStoreImpl("beiqiang-inquiries"); const key = `inquiries/${date}/${reference}.json`; const record = await store.get(key, { type: "json", consistency: "strong" }); const suppliedHash = createHash("sha256").update(accessCode).digest("hex");
      if (!record?.accessTokenHash || !safeEqual(record.accessTokenHash, suppliedHash)) return response(404, { ok: false, message: "No matching inquiry was found." });
      if (["lost", "spam"].includes(record.status)) return response(409, { ok: false, message: "This sourcing request is closed. Contact Beiqiang if it should be reopened." });
      if (record.status === "order_confirmed" || record.orderHandoff?.orderReference) return response(409, { ok: false, message: "A formal order handoff already exists. Review it on this page or message Beiqiang about any mismatch." });
      const quote = Array.isArray(record.quotations) ? [...record.quotations].reverse().find((item) => ["issued", "buyer_accepted", "buyer_declined"].includes(item.status)) : null;
      if (!quote || quote.quoteNumber !== quoteNumber || quote.status !== "buyer_accepted") return response(409, { ok: false, message: "Accept the current issued quotation before requesting formal order setup." });
      const requests = Array.isArray(record.buyerOrderRequests) ? record.buyerOrderRequests : [];
      if (requests.some((item) => item.quoteNumber === quoteNumber)) return response(409, { ok: false, message: "An order setup request already exists for this quotation. Use the private message thread to add or correct information." });
      const submittedAt = new Date().toISOString();
      const orderRequest = { id: `OSR-${randomBytesImpl(5).toString("hex").toUpperCase()}`, quoteNumber, preferredOrderChannel, legalCompanyName, purchasingContact, purchaseOrderReference, destination, requestedWindow, instructions, status: "submitted", submittedAt };
      const updated = { ...record, buyerOrderRequests: [...requests.slice(-9), orderRequest], status: "negotiation", lostReason: "", buyerUpdate: `Your order setup request for ${quoteNumber} was recorded. Beiqiang will verify the final specification, quantity/size ratio, packing, price/trade term, payment and delivery terms before creating the formal Trade Assurance order or contract.`, updatedAt: submittedAt };
      await store.setJSON(key, updated, { cacheControl: null });
      const notificationSent = await notifySales(record, orderRequest, context.env || {}, createTransportImpl);
      return response(200, { ok: true, orderRequest: { ...orderRequest, notificationSent }, message: "Your order setup request was recorded. It is not yet a production order or payment request; Beiqiang will verify the written terms and create the formal Trade Assurance order or contract." });
    } catch (error) { console.error("Order setup request failed", error); return response(503, { ok: false, message: "Your order setup request could not be saved. Contact Beiqiang by email or WhatsApp." }); }
  };
}

export const onRequestPost = createOrderSetupRequestHandler();
