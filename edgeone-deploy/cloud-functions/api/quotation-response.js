import { createHash, timingSafeEqual } from "node:crypto";
import { getStore } from "@edgeone/pages-blob";
import nodemailer from "nodemailer";

function response(status, body) { return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=UTF-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } }); }
function clean(value, max) { return typeof value === "string" ? value.trim().replace(/\0/g, "").slice(0, max) : ""; }
function safeEqual(left, right) { const a = Buffer.from(left || ""); const b = Buffer.from(right || ""); return a.length === b.length && a.length > 0 && timingSafeEqual(a, b); }
function isAllowedOrigin(origin) { if (!origin) return true; try { const { protocol, hostname } = new URL(origin); if (protocol !== "https:") return hostname === "localhost" || hostname === "127.0.0.1"; return hostname === "www.beiqiang.online" || hostname === "beiqiang.online" || /^beiqiang-footwear-[a-z0-9]+\.edgeone\.dev$/.test(hostname); } catch { return false; } }

const REVISION_REASONS = new Set(["unit_price", "quantity_moq", "trade_term_freight", "lead_time", "payment_terms", "packing_labeling", "sample_terms", "product_specification", "other"]);
const TRADE_TERMS = new Set(["FOB", "EXW", "FCA", "DDP"]);

function sanitizeRevisionBrief(value, quote) {
  if (!value || typeof value !== "object") return null;
  const reasons = Array.isArray(value.reasons) ? [...new Set(value.reasons.filter((item) => REVISION_REASONS.has(item)))].slice(0, 9) : [];
  const allowedCodes = new Set((quote.lines || []).map((line) => line.code));
  const affectedCodes = Array.isArray(value.affectedCodes) ? [...new Set(value.affectedCodes.map((item) => clean(item, 40)).filter((item) => allowedCodes.has(item)))].slice(0, 20) : [];
  const brief = { reasons, affectedCodes, targetQuantity: clean(value.targetQuantity, 160), targetUnitPrice: clean(value.targetUnitPrice, 100), targetTradeTerm: TRADE_TERMS.has(value.targetTradeTerm) ? value.targetTradeTerm : "", requestedDelivery: clean(value.requestedDelivery, 240), requestedPayment: clean(value.requestedPayment, 300), requestedPacking: clean(value.requestedPacking, 400), requestedSample: clean(value.requestedSample, 400) };
  if (!reasons.length || ![...affectedCodes, brief.targetQuantity, brief.targetUnitPrice, brief.targetTradeTerm, brief.requestedDelivery, brief.requestedPayment, brief.requestedPacking, brief.requestedSample].some(Boolean)) return { error: "Choose at least one revision area and provide the requested commercial target or affected style." };
  return { brief };
}

async function notifySales(record, quote, decision, note, revisionBrief, env, createTransportImpl) {
  if (!env?.SMTP_PASS) return false;
  const recipient = env.INQUIRY_NOTIFY_TO || "421345308@qq.com"; const transport = createTransportImpl({ host: env.SMTP_HOST || "smtp.qq.com", port: Number(env.SMTP_PORT || 465), secure: String(env.SMTP_SECURE || "true") !== "false", auth: { user: env.SMTP_USER || "421345308@qq.com", pass: env.SMTP_PASS } });
  const revisionLines = revisionBrief ? ["", "STRUCTURED REVISION BRIEF", `Areas: ${revisionBrief.reasons.join(", ")}`, `Affected styles: ${revisionBrief.affectedCodes.join(", ") || "All / not specified"}`, `Buyer quantity target: ${revisionBrief.targetQuantity || "-"}`, `Buyer unit-price target: ${revisionBrief.targetUnitPrice || "-"}`, `Requested trade term: ${revisionBrief.targetTradeTerm || "-"}`, `Requested delivery: ${revisionBrief.requestedDelivery || "-"}`, `Requested payment: ${revisionBrief.requestedPayment || "-"}`, `Requested packing: ${revisionBrief.requestedPacking || "-"}`, `Requested sample change: ${revisionBrief.requestedSample || "-"}`, "", "These are buyer targets only. Review feasibility and issue a new quotation version before confirming any term."] : [];
  try { await transport.sendMail({ from: env.SMTP_FROM || env.SMTP_USER || "421345308@qq.com", to: recipient, replyTo: record.email || undefined, subject: `[Quotation ${decision}] ${quote.quoteNumber} · ${record.company}`, text: [`Reference: ${record.reference}`, `Buyer: ${record.company} / ${record.name}`, `Quotation: ${quote.quoteNumber}`, `Decision: ${decision}`, `Buyer note: ${note || "-"}`, ...revisionLines, `Email: ${record.email || "-"}`, `WhatsApp: ${record.whatsapp || "-"}`].join("\n") }); return true; } catch (error) { console.error("Quotation response notification failed", record.reference, error); return false; }
}

export function createQuotationResponseHandler({ getStoreImpl = getStore, createTransportImpl = nodemailer.createTransport } = {}) {
  return async function onRequestPost(context) {
    if (!isAllowedOrigin(context.request.headers.get("origin"))) return response(403, { ok: false, message: "Request origin is not allowed." });
    let payload; try { payload = await context.request.json(); } catch { return response(400, { ok: false, message: "Invalid request." }); }
    const reference = clean(payload.reference, 40).toUpperCase(); const accessCode = clean(payload.accessCode, 40).toUpperCase(); const quoteNumber = clean(payload.quoteNumber, 80); const decision = payload.decision === "accept" ? "accepted" : payload.decision === "revise" ? "revision_requested" : payload.decision === "decline" ? "declined" : ""; const note = clean(payload.note, 1200);
    const match = /^BQ-(\d{4})(\d{2})(\d{2})-([A-F0-9]{8})$/.exec(reference);
    if (!match || !/^[A-F0-9]{20}$/.test(accessCode) || !decision || !quoteNumber.startsWith(`${reference}-Q`)) return response(400, { ok: false, message: "Check the quotation response details." });
    if (decision === "declined" && !note) return response(400, { ok: false, message: "Add the reason for declining this quotation." });
    const date = `${match[1]}-${match[2]}-${match[3]}`;
    try {
      const store = getStoreImpl("beiqiang-inquiries"); const key = `inquiries/${date}/${reference}.json`; const record = await store.get(key, { type: "json", consistency: "strong" }); const suppliedHash = createHash("sha256").update(accessCode).digest("hex");
      if (!record?.accessTokenHash || !safeEqual(record.accessTokenHash, suppliedHash)) return response(404, { ok: false, message: "No matching inquiry was found." });
      const quote = record.quotations?.find((item) => item.quoteNumber === quoteNumber);
      if (!quote || quote.status !== "issued") return response(409, { ok: false, message: "This quotation is not open for a response. Contact Beiqiang if you need a new version." });
      if (quote.validUntil && quote.validUntil < new Date().toISOString().slice(0, 10)) return response(409, { ok: false, message: "This quotation has expired. Ask Beiqiang for a current version." });
      const revisionResult = decision === "revision_requested" ? sanitizeRevisionBrief(payload.revisionBrief, quote) : null; if (revisionResult?.error) return response(400, { ok: false, message: revisionResult.error });
      const respondedAt = new Date().toISOString(); const quotations = record.quotations.map((item) => item.quoteNumber === quoteNumber ? { ...item, status: `buyer_${decision}`, buyerDecision: decision, buyerNote: note, buyerRespondedAt: respondedAt, revisionBrief: revisionResult?.brief || null } : item);
      const history = Array.isArray(record.pipelineHistory) ? record.pipelineHistory : [{ from: "", to: record.status || "new", changedAt: record.receivedAt || respondedAt, actor: "system", reason: "Legacy record" }];
      const pipelineHistory = record.status !== "negotiation" ? [...history.slice(-98), { from: record.status || "quoted", to: "negotiation", changedAt: respondedAt, actor: "Buyer", reason: `Quotation ${decision}: ${quoteNumber}` }] : history;
      const nextAction = decision === "accepted" ? `Review accepted quotation ${quoteNumber} and prepare the formal order handoff after all order-readiness items are verified.` : decision === "revision_requested" ? `Review the structured buyer targets for ${quoteNumber}, confirm feasibility and prepare a new quotation version.` : `Review why the buyer declined ${quoteNumber}; decide whether to revise, continue personally or close with a verified lost reason.`;
      const updated = { ...record, quotations, status: "negotiation", pipelineHistory, lostReason: "", buyerUpdate: decision === "accepted" ? `You accepted quotation ${quoteNumber}. Beiqiang will confirm the formal order handoff and remaining order details.` : decision === "revision_requested" ? `Your requested changes for quotation ${quoteNumber} are recorded as buyer targets. Beiqiang will review feasibility before issuing any revised terms.` : `You declined quotation ${quoteNumber}. Beiqiang will review your reason and contact you if a relevant next option exists.`, nextAction, nextActionDue: respondedAt.slice(0, 10), updatedAt: respondedAt };
      await store.setJSON(key, updated, { cacheControl: null });
      const notificationSent = await notifySales(record, quote, decision, note, revisionResult?.brief || null, context.env || {}, createTransportImpl);
      return response(200, { ok: true, decision, notificationSent, message: decision === "accepted" ? "Your acceptance was recorded. This is not yet a production order; Beiqiang will confirm the formal order handoff." : decision === "revision_requested" ? "Your requested changes were recorded as buyer targets. Beiqiang will review them before issuing a new quotation version." : "Your decline was recorded. Beiqiang will review the reason." });
    } catch (error) { console.error("Quotation response failed", error); return response(503, { ok: false, message: "Your response could not be saved. Contact Beiqiang by email or WhatsApp." }); }
  };
}

export const onRequestPost = createQuotationResponseHandler();
