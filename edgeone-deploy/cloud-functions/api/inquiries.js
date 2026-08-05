import { createHash, randomUUID } from "node:crypto";
import { getStore } from "@edgeone/pages-blob";
import nodemailer from "nodemailer";

const BUYER_TYPES = new Set(["Importer / wholesaler", "Amazon / TikTok seller", "Brand / private label", "Sourcing agent"]);

function clean(value, max) {
  return typeof value === "string" ? value.trim().replace(/\0/g, "").slice(0, max) : "";
}

function response(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=UTF-8", "Cache-Control": "no-store" } });
}

export function isAllowedOrigin(origin) {
  if (!origin) return true;
  try {
    const { protocol, hostname } = new URL(origin);
    if (protocol !== "https:") return hostname === "localhost" || hostname === "127.0.0.1";
    return hostname === "www.beiqiang.online" || hostname === "beiqiang.online" || /^beiqiang-footwear-[a-z0-9]+\.edgeone\.dev$/.test(hostname);
  } catch {
    return false;
  }
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]);
}

export function validateInquiry(payload, now = Date.now()) {
  if (!payload || typeof payload !== "object") return { error: "Invalid request." };
  if (clean(payload.website, 200)) return { spam: true };

  const startedAt = Number(payload.formStartedAt);
  if (!Number.isFinite(startedAt) || now - startedAt < 1800 || now - startedAt > 86_400_000) return { error: "Please review the form and submit again." };

  const inquiry = {
    name: clean(payload.name, 100),
    company: clean(payload.company, 160),
    buyerType: BUYER_TYPES.has(payload.buyerType) ? payload.buyerType : "Other B2B buyer",
    market: clean(payload.market, 120),
    quantity: clean(payload.quantity, 80),
    email: clean(payload.email, 180).toLowerCase(),
    whatsapp: clean(payload.whatsapp, 80),
    requirements: clean(payload.requirements, 2000),
    styleCode: clean(payload.styleCode, 40),
    styleLabel: clean(payload.styleLabel, 200),
    context: clean(payload.context, 40),
    page: clean(payload.page, 300),
    attribution: {
      utmSource: clean(payload.attribution?.utmSource, 100),
      utmMedium: clean(payload.attribution?.utmMedium, 100),
      utmCampaign: clean(payload.attribution?.utmCampaign, 150),
      utmContent: clean(payload.attribution?.utmContent, 150),
      utmTerm: clean(payload.attribution?.utmTerm, 150),
      landingPage: clean(payload.attribution?.landingPage, 300),
      referrer: clean(payload.attribution?.referrer, 300),
    },
  };

  if (!inquiry.name || !inquiry.company || !inquiry.market || !inquiry.quantity || !inquiry.styleCode) return { error: "Please complete the required sourcing details." };
  if (!payload.consent) return { error: "Please agree to the inquiry follow-up notice." };
  if (!inquiry.email && !inquiry.whatsapp) return { error: "Please provide an email address or WhatsApp number." };
  if (inquiry.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inquiry.email)) return { error: "Please provide a valid email address." };

  return { inquiry };
}

async function sendNotification(inquiry, reference, env, createTransportImpl) {
  if (!env?.SMTP_PASS) return false;
  const recipient = env.INQUIRY_NOTIFY_TO || "421345308@qq.com";
  const transport = createTransportImpl({
    host: env.SMTP_HOST || "smtp.qq.com",
    port: Number(env.SMTP_PORT || 465),
    secure: String(env.SMTP_SECURE || "true") !== "false",
    auth: { user: env.SMTP_USER || "421345308@qq.com", pass: env.SMTP_PASS },
  });
  const lines = [
    `Reference: ${reference}`, `Style: ${inquiry.styleLabel}`, `Name: ${inquiry.name}`,
    `Company: ${inquiry.company}`, `Buyer type: ${inquiry.buyerType}`, `Market: ${inquiry.market}`,
    `Quantity: ${inquiry.quantity}`, `Email: ${inquiry.email || "-"}`, `WhatsApp: ${inquiry.whatsapp || "-"}`,
    `Requirements: ${inquiry.requirements || "-"}`, `Source: ${inquiry.attribution.utmSource || "direct"} / ${inquiry.attribution.utmMedium || "website"}`,
    `Campaign: ${inquiry.attribution.utmCampaign || "-"}`, `Landing page: ${inquiry.attribution.landingPage || inquiry.page}`,
  ];
  await transport.sendMail({
    from: env.SMTP_FROM || env.SMTP_USER || "421345308@qq.com",
    to: recipient,
    replyTo: inquiry.email || undefined,
    subject: `[Beiqiang Inquiry] ${inquiry.styleCode} · ${inquiry.company} · ${reference}`,
    text: lines.join("\n"),
    html: `<h2>New Beiqiang sourcing inquiry</h2><pre style="font:14px/1.6 Arial,sans-serif;white-space:pre-wrap">${escapeHtml(lines.join("\n"))}</pre>`,
  });
  return true;
}

export function createInquiryHandler({ getStoreImpl = getStore, createTransportImpl = nodemailer.createTransport } = {}) {
  return async function onRequestPost(context) {
    const request = context.request;
    const origin = request.headers.get("origin");
    if (!isAllowedOrigin(origin)) return response(403, { ok: false, message: "Request origin is not allowed." });
    if (Number(request.headers.get("content-length") || 0) > 32_768) return response(413, { ok: false, message: "Request is too large." });

    let payload;
    try { payload = await request.json(); } catch { return response(400, { ok: false, message: "Invalid request." }); }
    const validation = validateInquiry(payload);
    if (validation.spam) return response(202, { ok: true, reference: "received" });
    if (validation.error) return response(400, { ok: false, message: validation.error });

    const receivedAt = new Date().toISOString();
    const reference = `BQ-${receivedAt.slice(0, 10).replaceAll("-", "")}-${randomUUID().slice(0, 8).toUpperCase()}`;
    const ipHash = createHash("sha256").update(`${receivedAt.slice(0, 10)}:${context.clientIp || "unknown"}`).digest("hex").slice(0, 16);
    const record = { ...validation.inquiry, reference, receivedAt, status: "new", notificationSent: false, requestId: context.uuid || "", ipHash };

    try {
      const store = getStoreImpl("beiqiang-inquiries");
      const key = `inquiries/${receivedAt.slice(0, 10)}/${reference}.json`;
      await store.setJSON(key, record, { onlyIfNew: true, cacheControl: null });
      try {
        record.notificationSent = await sendNotification(validation.inquiry, reference, context.env || {}, createTransportImpl);
        if (record.notificationSent) await store.setJSON(key, record, { cacheControl: null });
      } catch (notificationError) {
        console.error("Inquiry saved but notification failed", reference, notificationError);
      }
      return response(201, { ok: true, reference });
    } catch (storageError) {
      console.error("Inquiry persistence failed", storageError);
      return response(503, { ok: false, message: "We could not save your request. Please contact us by WhatsApp or email." });
    }
  };
}

export const onRequestPost = createInquiryHandler();
