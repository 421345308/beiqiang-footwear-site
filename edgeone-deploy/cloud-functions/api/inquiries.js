import { createHash, randomUUID } from "node:crypto";
import { getStore } from "@edgeone/pages-blob";
import nodemailer from "nodemailer";

const BUYER_TYPES = new Set(["Importer / wholesaler", "Amazon / TikTok seller", "Brand / private label", "Sourcing agent"]);
const PROJECT_PATHS = new Set(["base_style_adaptation", "technical_development"]);
const TRADE_TERM_PREFERENCES = new Set(["not_sure", "EXW", "FOB", "FCA", "DDP_request"]);
const SOURCING_PROGRAMS = new Set(["wholesale-walking-shoes", "private-label-walking-shoes", "oem-knit-shoes", "resource-footwear-rfq-checklist", "resource-shoe-sample-approval-checklist", "resource-private-label-walking-shoes-sourcing-guide"]);

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

  const items = Array.isArray(payload.items) ? payload.items.slice(0, 12).map((item) => ({
    code: clean(item?.code, 40), sourceModel: clean(item?.sourceModel, 80), name: clean(item?.name, 200),
    quantity: clean(item?.quantity, 80), colors: clean(item?.colors, 160), sizes: clean(item?.sizes, 160), notes: clean(item?.notes, 500),
  })).filter((item) => item.code) : [];
  const inquiry = {
    name: clean(payload.name, 100),
    company: clean(payload.company, 160),
    buyerType: BUYER_TYPES.has(payload.buyerType) ? payload.buyerType : "Other B2B buyer",
    market: clean(payload.market, 120),
    quantity: clean(payload.quantity, 80),
    email: clean(payload.email, 180).toLowerCase(),
    whatsapp: clean(payload.whatsapp, 80),
    requirements: clean(payload.requirements, 3000),
    styleCode: clean(payload.styleCode, 300),
    styleLabel: clean(payload.styleLabel, 2000),
    context: clean(payload.context, 40),
    projectPath: PROJECT_PATHS.has(payload.projectPath) ? payload.projectPath : "standard_inquiry",
    sampleQuantity: clean(payload.sampleQuantity, 80),
    bulkQuantity: clean(payload.bulkQuantity, 80),
    preferredTradeTerm: TRADE_TERM_PREFERENCES.has(payload.preferredTradeTerm) ? payload.preferredTradeTerm : "not_sure",
    deliveryDestination: clean(payload.deliveryDestination, 240),
    deliveryTiming: clean(payload.deliveryTiming, 160),
    sourcingProgram: SOURCING_PROGRAMS.has(payload.sourcingProgram) ? payload.sourcingProgram : "",
    existingSole: clean(payload.existingSole, 100),
    changesRequired: clean(payload.changesRequired, 1200),
    targetValues: clean(payload.targetValues, 1600),
    ndaRequired: clean(payload.ndaRequired, 20),
    items,
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
  if (inquiry.preferredTradeTerm === "DDP_request" && !inquiry.deliveryDestination) return { error: "Please provide the delivery destination for a DDP review." };

  return { inquiry };
}

async function sendNotifications(inquiry, reference, accessCode, env, createTransportImpl) {
  if (!env?.SMTP_PASS) return { notificationSent: false, buyerConfirmationSent: false };
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
    `Project path: ${inquiry.projectPath}`, `Sample quantity: ${inquiry.sampleQuantity || "-"}`, `Bulk quantity: ${inquiry.bulkQuantity || "-"}`,
    `Sourcing program: ${inquiry.sourcingProgram || "Direct / catalogue"}`, `Trade-term preference: ${inquiry.preferredTradeTerm}`, `Delivery destination: ${inquiry.deliveryDestination || "-"}`, `Requested delivery timing: ${inquiry.deliveryTiming || "-"}`,
    `Quote lines: ${inquiry.items.length ? inquiry.items.map((item) => `${item.code}: ${item.quantity || "qty TBD"}; colors ${item.colors || "TBD"}; sizes ${item.sizes || "TBD"}; ${item.notes || ""}`).join(" | ") : "-"}`,
    `Existing sole: ${inquiry.existingSole || "-"}`, `Changes required: ${inquiry.changesRequired || "-"}`, `Buyer target / tests: ${inquiry.targetValues || "-"}`, `NDA / tech pack: ${inquiry.ndaRequired || "No"}`,
    `Requirements: ${inquiry.requirements || "-"}`, `Source: ${inquiry.attribution.utmSource || "direct"} / ${inquiry.attribution.utmMedium || "website"}`,
    `Campaign: ${inquiry.attribution.utmCampaign || "-"}`, `Landing page: ${inquiry.attribution.landingPage || inquiry.page}`,
  ];
  let notificationSent = false;
  let buyerConfirmationSent = false;
  try {
    await transport.sendMail({
      from: env.SMTP_FROM || env.SMTP_USER || "421345308@qq.com", to: recipient, replyTo: inquiry.email || undefined,
      subject: `[Beiqiang Inquiry] ${inquiry.styleCode} · ${inquiry.company} · ${reference}`,
      text: [...lines, `Buyer status access code: ${accessCode}`].join("\n"),
      html: `<h2>New Beiqiang sourcing inquiry</h2><pre style="font:14px/1.6 Arial,sans-serif;white-space:pre-wrap">${escapeHtml([...lines, `Buyer status access code: ${accessCode}`].join("\n"))}</pre>`,
    });
    notificationSent = true;
  } catch (error) { console.error("Internal inquiry notification failed", reference, error); }

  if (inquiry.email) {
    const buyerLines = [
      `Hello ${inquiry.name},`, "", "We received your Beiqiang B2B sourcing request.",
      `Reference: ${reference}`, `Status access code: ${accessCode}`, "Status page: https://www.beiqiang.online/inquiry-status/", "",
      `Styles: ${inquiry.styleCode}`, `Quantity direction: ${inquiry.quantity}`, `Trade-term preference: ${inquiry.preferredTradeTerm}`, `Delivery destination: ${inquiry.deliveryDestination || "To be discussed"}`, "",
      "This confirms receipt only. Product specifications, sample arrangement, price, MOQ, lead time, technical targets and order terms remain subject to review and written confirmation.", "",
      "Quanzhou Beiqiang Footwear & Apparel Co., Ltd.", "421345308@qq.com", "WhatsApp: +86 189 5980 5256",
    ];
    try {
      await transport.sendMail({
        from: env.SMTP_FROM || env.SMTP_USER || "421345308@qq.com", to: inquiry.email, replyTo: recipient,
        subject: `Beiqiang request received · ${reference}`,
        text: buyerLines.join("\n"),
        html: `<h2>Your sourcing request has been received</h2><pre style="font:14px/1.6 Arial,sans-serif;white-space:pre-wrap">${escapeHtml(buyerLines.join("\n"))}</pre>`,
      });
      buyerConfirmationSent = true;
    } catch (error) { console.error("Buyer inquiry confirmation failed", reference, error); }
  }
  return { notificationSent, buyerConfirmationSent };
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
    const accessCode = randomUUID().replaceAll("-", "").slice(0, 20).toUpperCase();
    const accessTokenHash = createHash("sha256").update(accessCode).digest("hex");
    const ipHash = createHash("sha256").update(`${receivedAt.slice(0, 10)}:${context.clientIp || "unknown"}`).digest("hex").slice(0, 16);
    const record = { ...validation.inquiry, reference, receivedAt, status: "new", pipelineHistory: [{ from: "", to: "new", changedAt: receivedAt, actor: "system", reason: "Inquiry saved" }], lostReason: "", owner: "", nextAction: "", internalNote: "", buyerUpdate: "", lastContactedAt: "", notificationSent: false, buyerConfirmationSent: false, accessTokenHash, requestId: context.uuid || "", ipHash };

    try {
      const store = getStoreImpl("beiqiang-inquiries");
      const key = `inquiries/${receivedAt.slice(0, 10)}/${reference}.json`;
      await store.setJSON(key, record, { onlyIfNew: true, cacheControl: null });
      try {
        const notification = await sendNotifications(validation.inquiry, reference, accessCode, context.env || {}, createTransportImpl);
        record.notificationSent = notification.notificationSent;
        record.buyerConfirmationSent = notification.buyerConfirmationSent;
        if (record.notificationSent || record.buyerConfirmationSent) await store.setJSON(key, record, { cacheControl: null });
      } catch (notificationError) {
        console.error("Inquiry saved but notification failed", reference, notificationError);
      }
      return response(201, { ok: true, reference, accessCode, buyerConfirmationSent: record.buyerConfirmationSent });
    } catch (storageError) {
      console.error("Inquiry persistence failed", storageError);
      return response(503, { ok: false, message: "We could not save your request. Please contact us by WhatsApp or email." });
    }
  };
}

export const onRequestPost = createInquiryHandler();
