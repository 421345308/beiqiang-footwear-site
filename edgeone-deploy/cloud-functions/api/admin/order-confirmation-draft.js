import { randomBytes, timingSafeEqual } from "node:crypto";
import { getStore } from "@edgeone/pages-blob";
import nodemailer from "nodemailer";

const CHECKLIST_FIELDS = [
  "productSpecification",
  "sampleDecision",
  "quantitySizeRatio",
  "colorsMaterials",
  "packingLabeling",
  "priceTradeTerm",
  "paymentTerms",
  "deliveryWindow",
];
const ORDER_CHANNELS = new Set(["alibaba_trade_assurance", "contract"]);

function response(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=UTF-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}
function clean(value, max) { return typeof value === "string" ? value.trim().replace(/\0/g, "").slice(0, max) : ""; }
function safeEqual(left, right) {
  const a = Buffer.from(left || ""); const b = Buffer.from(right || "");
  return a.length > 0 && a.length === b.length && timingSafeEqual(a, b);
}
function details(value) {
  const reference = clean(value, 40).toUpperCase();
  const match = /^BQ-(\d{4})(\d{2})(\d{2})-([A-F0-9]{8})$/.exec(reference);
  return match ? { reference, key: `inquiries/${match[1]}-${match[2]}-${match[3]}/${reference}.json` } : null;
}
function sanitizeChecklist(value) {
  return Object.fromEntries(CHECKLIST_FIELDS.map((field) => [field, clean(value?.[field], 700)]));
}
function isComplete(value) {
  const normalized = clean(value, 700).toLowerCase().replace(/[.。]/g, "");
  return normalized.length >= 2 && !["tbd", "unknown", "n/a", "na", "to be confirmed", "not confirmed", "待确认", "未知"].includes(normalized);
}
function publicDraft(draft) {
  return {
    id: draft.id, version: draft.version, orderRequestId: draft.orderRequestId,
    packetId: draft.packetId, packetVersion: draft.packetVersion,
    quoteNumber: draft.quoteNumber, orderChannel: draft.orderChannel,
    orderChecklist: draft.orderChecklist, draftNote: draft.draftNote,
    status: draft.status, issuedAt: draft.issuedAt,
  };
}

async function notifyBuyer(record, draft, env, createTransportImpl) {
  if (!env?.SMTP_PASS || !record.email) return "smtp_not_configured";
  try {
    const transport = createTransportImpl({
      host: env.SMTP_HOST || "smtp.qq.com", port: Number(env.SMTP_PORT || 465),
      secure: String(env.SMTP_SECURE || "true") !== "false",
      auth: { user: env.SMTP_USER || "421345308@qq.com", pass: env.SMTP_PASS },
    });
    await transport.sendMail({
      from: env.SMTP_FROM || env.SMTP_USER || "421345308@qq.com",
      to: record.email,
      replyTo: env.INQUIRY_NOTIFY_TO || "421345308@qq.com",
      subject: `[Review required] ${record.reference} · pre-order confirmation V${draft.version}`,
      text: [
        `Project: ${record.reference}`,
        `Draft: V${draft.version} · ${draft.orderChannel.replaceAll("_", " ")}`,
        `Related quotation: ${draft.quoteNumber}`,
        `Beiqiang note: ${draft.draftNote}`,
        "",
        "Please open the private project page and compare all eight product, sample, quantity/size, color/material, packing, price/trade, payment and delivery items. Accept only when they match your understanding, or request a revision with the exact affected fields.",
        "",
        `Private status page: https://www.beiqiang.online/inquiry-status/?reference=${encodeURIComponent(record.reference)}`,
        "This website draft is not an Alibaba Trade Assurance order, signed contract, invoice, payment instruction or production authorization.",
      ].join("\n"),
    });
    return "sent";
  } catch (error) {
    console.error("Pre-order draft buyer notification failed", record.reference, draft.id, error);
    return "delivery_failed";
  }
}

export function createAdminOrderConfirmationDraftHandler({
  getStoreImpl = getStore,
  createTransportImpl = nodemailer.createTransport,
  randomBytesImpl = randomBytes,
  nowImpl = () => new Date(),
} = {}) {
  return async function onRequestPost(context) {
    const token = clean((context.request.headers.get("authorization") || "").replace(/^Bearer\s+/i, ""), 300);
    const expected = clean(context.env?.INQUIRY_ADMIN_TOKEN, 300);
    if (!expected || !safeEqual(token, expected)) return response(401, { ok: false, message: "Invalid admin access." });
    let payload;
    try { payload = await context.request.json(); } catch { return response(400, { ok: false, message: "Invalid request." }); }
    const recordDetails = details(payload.reference);
    const packetId = clean(payload.packetId, 50).toUpperCase();
    const orderChannel = ORDER_CHANNELS.has(payload.orderChannel) ? payload.orderChannel : "";
    const orderChecklist = sanitizeChecklist(payload.orderChecklist);
    const draftNote = clean(payload.draftNote, 1000);
    const issuedBy = clean(payload.issuedBy, 100) || "Beiqiang sales";
    if (!recordDetails || !/^OPP-[A-F0-9]{12}$/.test(packetId) || !orderChannel || draftNote.length < 5 || CHECKLIST_FIELDS.some((field) => !isComplete(orderChecklist[field]))) {
      return response(400, { ok: false, message: "Complete the reviewed packet reference, order channel, all eight written confirmation items and a buyer-safe issue note." });
    }
    try {
      const store = getStoreImpl("beiqiang-inquiries");
      const record = await store.get(recordDetails.key, { type: "json", consistency: "strong" });
      if (!record) return response(404, { ok: false, message: "Inquiry not found." });
      if (["lost", "spam", "order_confirmed"].includes(record.status) || record.orderHandoff?.orderReference) return response(409, { ok: false, message: "This project cannot receive a new pre-order confirmation draft." });
      const orderRequest = Array.isArray(record.buyerOrderRequests) ? record.buyerOrderRequests.at(-1) : null;
      const packet = Array.isArray(record.orderPreparationPackets) ? record.orderPreparationPackets.at(-1) : null;
      if (!orderRequest || !packet || packet.id !== packetId || packet.orderRequestId !== orderRequest.id || packet.status !== "reviewed") {
        return response(409, { ok: false, message: "The latest order-preparation packet must be reviewed before issuing this draft." });
      }
      const quote = Array.isArray(record.quotations) ? [...record.quotations].reverse().find((item) => item.quoteNumber === orderRequest.quoteNumber) : null;
      if (!quote || quote.status !== "buyer_accepted") return response(409, { ok: false, message: "The related quotation must remain buyer accepted." });
      const drafts = Array.isArray(record.orderConfirmationDrafts) ? record.orderConfirmationDrafts : [];
      const latest = drafts.at(-1);
      if (latest?.status === "awaiting_buyer") return response(409, { ok: false, message: "The latest pre-order confirmation draft is still awaiting the buyer." });
      const issuedAt = nowImpl().toISOString();
      const draft = {
        id: `OCD-${randomBytesImpl(6).toString("hex").toUpperCase()}`,
        version: Number(latest?.version || 0) + 1,
        orderRequestId: orderRequest.id,
        packetId: packet.id,
        packetVersion: packet.version,
        quoteNumber: quote.quoteNumber,
        orderChannel,
        orderChecklist,
        draftNote,
        status: "awaiting_buyer",
        issuedAt,
        issuedBy,
        buyerDecision: "",
        buyerNote: "",
        buyerRevisionFields: [],
        buyerRespondedAt: "",
        notificationStatus: "pending",
        notificationAttemptedAt: "",
      };
      const saved = {
        ...record,
        orderConfirmationDrafts: [...drafts.slice(-19), draft],
        nextAction: `Wait for the buyer to review pre-order confirmation draft V${draft.version}.`,
        nextActionDue: new Date(nowImpl().getTime() + 2 * 86400000).toISOString().slice(0, 10),
        updatedAt: issuedAt,
        buyerUpdate: `Pre-order confirmation draft V${draft.version} is ready for your review. It is not a formal order or production authorization.`,
      };
      await store.setJSON(recordDetails.key, saved, { cacheControl: null });
      const notificationStatus = await notifyBuyer(record, draft, context.env || {}, createTransportImpl);
      const notificationAttemptedAt = nowImpl().toISOString();
      const latestRecord = (await store.get(recordDetails.key, { type: "json", consistency: "strong" })) || saved;
      await store.setJSON(recordDetails.key, {
        ...latestRecord,
        orderConfirmationDrafts: (latestRecord.orderConfirmationDrafts || []).map((item) => item.id === draft.id ? { ...item, notificationStatus, notificationAttemptedAt } : item),
      }, { cacheControl: null });
      return response(200, { ok: true, draft: publicDraft(draft), message: "The pre-order confirmation draft was issued for buyer review; no order, invoice, payment or production authorization was created." });
    } catch (error) {
      console.error("Admin pre-order confirmation draft failed", error);
      return response(503, { ok: false, message: "The pre-order confirmation draft could not be saved." });
    }
  };
}

export const onRequestPost = createAdminOrderConfirmationDraftHandler();
