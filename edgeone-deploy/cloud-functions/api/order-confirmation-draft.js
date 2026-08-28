import { createHash, timingSafeEqual } from "node:crypto";
import { getStore } from "@edgeone/pages-blob";
import nodemailer from "nodemailer";

const REVISION_FIELDS = new Set(["productSpecification", "sampleDecision", "quantitySizeRatio", "colorsMaterials", "packingLabeling", "priceTradeTerm", "paymentTerms", "deliveryWindow"]);
function response(status, body) { return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=UTF-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } }); }
function clean(value, max) { return typeof value === "string" ? value.trim().replace(/\0/g, "").slice(0, max) : ""; }
function safeEqual(left, right) { const a = Buffer.from(left || ""); const b = Buffer.from(right || ""); return a.length > 0 && a.length === b.length && timingSafeEqual(a, b); }
function isAllowedOrigin(origin) {
  if (!origin) return true;
  try { const { protocol, hostname } = new URL(origin); if (protocol !== "https:") return hostname === "localhost" || hostname === "127.0.0.1"; return hostname === "www.beiqiang.online" || hostname === "beiqiang.online" || /^beiqiang-footwear-[a-z0-9]+\.edgeone\.dev$/.test(hostname); } catch { return false; }
}
function details(value) { const reference = clean(value, 40).toUpperCase(); const match = /^BQ-(\d{4})(\d{2})(\d{2})-([A-F0-9]{8})$/.exec(reference); return match ? { reference, key: `inquiries/${match[1]}-${match[2]}-${match[3]}/${reference}.json` } : null; }
function publicDraft(draft) { return { id: draft.id, version: draft.version, status: draft.status, buyerDecision: draft.buyerDecision, buyerNote: draft.buyerNote, buyerRevisionFields: draft.buyerRevisionFields, buyerRespondedAt: draft.buyerRespondedAt }; }

async function notifySales(record, draft, env, createTransportImpl) {
  if (!env?.SMTP_PASS) return "smtp_not_configured";
  try {
    const transport = createTransportImpl({ host: env.SMTP_HOST || "smtp.qq.com", port: Number(env.SMTP_PORT || 465), secure: String(env.SMTP_SECURE || "true") !== "false", auth: { user: env.SMTP_USER || "421345308@qq.com", pass: env.SMTP_PASS } });
    await transport.sendMail({
      from: env.SMTP_FROM || env.SMTP_USER || "421345308@qq.com",
      to: env.INQUIRY_NOTIFY_TO || "421345308@qq.com",
      replyTo: record.email || undefined,
      subject: `[Pre-order draft response] ${record.reference} · V${draft.version} ${draft.status.replaceAll("_", " ")}`,
      text: [
        `Project: ${record.reference}`,
        `Draft: V${draft.version}`,
        `Buyer decision: ${draft.buyerDecision.replaceAll("_", " ")}`,
        `Affected fields: ${draft.buyerRevisionFields.map((item) => item.replace(/([A-Z])/g, " $1").toLowerCase()).join(", ") || "-"}`,
        `Buyer note: ${draft.buyerNote || "-"}`,
        "",
        draft.status === "buyer_accepted" ? "The buyer accepted the website pre-order confirmation draft. Verify the same terms in the authoritative Trade Assurance order or signed contract before confirming the order or production." : "Prepare a corrected version. The previous draft remains in history and no commercial term was changed automatically.",
      ].join("\n"),
    });
    return "sent";
  } catch (error) { console.error("Pre-order draft sales notification failed", record.reference, draft.id, error); return "delivery_failed"; }
}

export function createOrderConfirmationDraftHandler({ getStoreImpl = getStore, createTransportImpl = nodemailer.createTransport, nowImpl = () => new Date() } = {}) {
  return async function onRequestPatch(context) {
    if (!isAllowedOrigin(context.request.headers.get("origin"))) return response(403, { ok: false, message: "Request origin is not allowed." });
    let payload;
    try { payload = await context.request.json(); } catch { return response(400, { ok: false, message: "Invalid request." }); }
    const recordDetails = details(payload.reference);
    const accessCode = clean(payload.accessCode, 40).toUpperCase();
    const draftId = clean(payload.draftId, 50).toUpperCase();
    const action = clean(payload.action, 30);
    const buyerNote = clean(payload.buyerNote, 1200);
    const buyerRevisionFields = Array.isArray(payload.buyerRevisionFields) ? [...new Set(payload.buyerRevisionFields.filter((item) => REVISION_FIELDS.has(item)))].slice(0, REVISION_FIELDS.size) : [];
    if (!recordDetails || !/^[A-F0-9]{20}$/.test(accessCode) || !/^OCD-[A-F0-9]{12}$/.test(draftId) || !["accept", "request_revision"].includes(action) || payload.buyerConfirmation !== true || (action === "request_revision" && (buyerNote.length < 5 || buyerRevisionFields.length === 0))) {
      return response(400, { ok: false, message: "Complete the draft decision, confirmation and any requested revision fields." });
    }
    try {
      const store = getStoreImpl("beiqiang-inquiries");
      const record = await store.get(recordDetails.key, { type: "json", consistency: "strong" });
      const suppliedHash = createHash("sha256").update(accessCode).digest("hex");
      if (!record?.accessTokenHash || !safeEqual(record.accessTokenHash, suppliedHash)) return response(404, { ok: false, message: "No matching inquiry was found." });
      if (["lost", "spam", "order_confirmed"].includes(record.status) || record.orderHandoff?.orderReference) return response(409, { ok: false, message: "This project no longer accepts a pre-order draft response." });
      const drafts = Array.isArray(record.orderConfirmationDrafts) ? record.orderConfirmationDrafts : [];
      const latest = drafts.at(-1);
      if (!latest || latest.id !== draftId || latest.status !== "awaiting_buyer") return response(409, { ok: false, message: "Only the current draft awaiting your decision can be answered." });
      const respondedAt = nowImpl().toISOString();
      const status = action === "accept" ? "buyer_accepted" : "buyer_revision_requested";
      const draft = { ...latest, status, buyerDecision: action, buyerNote, buyerRevisionFields: action === "request_revision" ? buyerRevisionFields : [], buyerRespondedAt: respondedAt, salesNotificationStatus: "pending", salesNotificationAttemptedAt: "" };
      const saved = {
        ...record,
        orderConfirmationDrafts: drafts.map((item) => item.id === draftId ? draft : item),
        nextAction: status === "buyer_accepted" ? `Verify draft V${draft.version} against the formal Trade Assurance order or signed contract, then record the authoritative order handoff.` : `Prepare a revised pre-order confirmation draft addressing the buyer's selected fields.`,
        nextActionDue: respondedAt.slice(0, 10),
        updatedAt: respondedAt,
        buyerUpdate: status === "buyer_accepted" ? `Your acceptance of pre-order confirmation draft V${draft.version} was recorded. The formal order still requires Trade Assurance or a signed contract.` : `Your revision request for pre-order confirmation draft V${draft.version} was recorded for human review.`,
      };
      await store.setJSON(recordDetails.key, saved, { cacheControl: null });
      const salesNotificationStatus = await notifySales(record, draft, context.env || {}, createTransportImpl);
      const salesNotificationAttemptedAt = nowImpl().toISOString();
      const latestRecord = (await store.get(recordDetails.key, { type: "json", consistency: "strong" })) || saved;
      await store.setJSON(recordDetails.key, { ...latestRecord, orderConfirmationDrafts: (latestRecord.orderConfirmationDrafts || []).map((item) => item.id === draftId ? { ...item, salesNotificationStatus, salesNotificationAttemptedAt } : item) }, { cacheControl: null });
      return response(200, { ok: true, draft: publicDraft(draft), message: status === "buyer_accepted" ? "Your pre-order confirmation was recorded. It does not create a formal order, invoice, payment or production authorization." : "Your revision request was recorded; the previous draft remains preserved." });
    } catch (error) {
      console.error("Buyer pre-order confirmation response failed", error);
      return response(503, { ok: false, message: "Your draft response could not be saved. Contact Beiqiang by email or WhatsApp." });
    }
  };
}

export const onRequestPatch = createOrderConfirmationDraftHandler();
