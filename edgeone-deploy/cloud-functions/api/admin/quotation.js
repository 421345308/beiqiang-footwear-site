import { timingSafeEqual } from "node:crypto";
import { getStore } from "@edgeone/pages-blob";
import nodemailer from "nodemailer";

function response(status, body) { return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=UTF-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } }); }
function clean(value, max) { return typeof value === "string" ? value.trim().replace(/\0/g, "").slice(0, max) : ""; }
function authorized(request, env) {
  const expected = typeof env?.INQUIRY_ADMIN_TOKEN === "string" ? env.INQUIRY_ADMIN_TOKEN.trim() : ""; const header = request.headers.get("authorization") || ""; const supplied = header.startsWith("Bearer ") ? header.slice(7).trim() : ""; const a = Buffer.from(expected); const b = Buffer.from(supplied); return a.length === b.length && a.length > 0 && timingSafeEqual(a, b);
}
function escapeHtml(value) { return String(value || "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]); }
function adminSafeRecord(record) { const safe = { ...record }; delete safe.accessTokenHash; delete safe.pendingUploads; delete safe.pendingAttachments; delete safe.pendingOrderDocuments; safe.attachments = Array.isArray(record.attachments) ? record.attachments.map((file) => { const copy = { ...file }; delete copy.key; return copy; }) : []; safe.orderDocuments = Array.isArray(record.orderDocuments) ? record.orderDocuments.map((document) => { const copy = { ...document }; delete copy.key; return copy; }) : []; return safe; }

async function sendQuotationEmail(record, quote, env, createTransportImpl) {
  if (!record.email || !env?.SMTP_PASS) return false;
  const recipient = env.INQUIRY_NOTIFY_TO || "421345308@qq.com";
  const transport = createTransportImpl({ host: env.SMTP_HOST || "smtp.qq.com", port: Number(env.SMTP_PORT || 465), secure: String(env.SMTP_SECURE || "true") !== "false", auth: { user: env.SMTP_USER || "421345308@qq.com", pass: env.SMTP_PASS } });
  const lines = [`Hello ${record.name},`, "", `Quotation ${quote.quoteNumber} is ready for your review.`, `Inquiry reference: ${record.reference}`, `Status page: https://www.beiqiang.online/inquiry-status/`, "", "Use the private status access code from your original inquiry receipt to review the quotation and respond.", "", "A quotation is not a production order. Specifications, approved sample, payment and shipping terms remain subject to the stated quotation and final written order confirmation.", "", "Quanzhou Beiqiang Footwear & Apparel Co., Ltd.", "421345308@qq.com", "WhatsApp: +86 189 5980 5256"];
  try { await transport.sendMail({ from: env.SMTP_FROM || env.SMTP_USER || "421345308@qq.com", to: record.email, replyTo: recipient, subject: `Beiqiang quotation ready · ${quote.quoteNumber}`, text: lines.join("\n"), html: `<h2>Quotation ready for review</h2><pre style="font:14px/1.6 Arial,sans-serif;white-space:pre-wrap">${escapeHtml(lines.join("\n"))}</pre>` }); return true; } catch (error) { console.error("Buyer quotation email failed", record.reference, error); return false; }
}

export function createAdminQuotationHandler({ getStoreImpl = getStore, createTransportImpl = nodemailer.createTransport } = {}) {
  return async function onRequestPost(context) {
    if (!context.env?.INQUIRY_ADMIN_TOKEN) return response(503, { ok: false, message: "Inquiry dashboard access has not been configured." });
    if (!authorized(context.request, context.env)) return response(401, { ok: false, message: "Invalid access token." });
    let payload; try { payload = await context.request.json(); } catch { return response(400, { ok: false, message: "Invalid request." }); }
    const reference = clean(payload.reference, 40).toUpperCase(); const receivedAt = clean(payload.receivedAt, 40); const quoteNumber = clean(payload.quoteNumber, 80); const date = receivedAt.slice(0, 10);
    if (!/^BQ-[A-Z0-9-]+$/.test(reference) || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !quoteNumber.startsWith(`${reference}-Q`)) return response(400, { ok: false, message: "Invalid quotation request." });
    try {
      const store = getStoreImpl("beiqiang-inquiries"); const key = `inquiries/${date}/${reference}.json`; const record = await store.get(key, { type: "json", consistency: "strong" });
      if (!record) return response(404, { ok: false, message: "Inquiry record was not found." });
      const quote = record.quotations?.find((item) => item.quoteNumber === quoteNumber);
      if (!quote) return response(404, { ok: false, message: "Quotation version was not found." });
      if (["buyer_accepted", "buyer_revision_requested", "buyer_declined"].includes(quote.status)) return response(409, { ok: false, message: "The buyer has already responded to this version. Save and issue a new version for changed terms." });
      const today = new Date().toISOString().slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(quote.validUntil || "") || quote.validUntil < today) return response(409, { ok: false, message: "Set a current quotation validity date before issuing this version." });
      const issuedAt = new Date().toISOString();
      const quotations = record.quotations.map((item) => item.quoteNumber === quoteNumber ? { ...item, status: "issued", issuedAt, buyerDecision: "", buyerNote: "", buyerRespondedAt: "", revisionBrief: null } : ["issued", "buyer_revision_requested"].includes(item.status) ? { ...item, status: "superseded" } : item);
      const issuedQuote = quotations.find((item) => item.quoteNumber === quoteNumber);
      const nextStatus = ["lost", "spam", "order_confirmed"].includes(record.status) ? record.status : "quoted"; const history = Array.isArray(record.pipelineHistory) ? record.pipelineHistory : [{ from: "", to: record.status || "new", changedAt: record.receivedAt || issuedAt, actor: "system", reason: "Legacy record" }];
      const pipelineHistory = nextStatus !== record.status ? [...history.slice(-98), { from: record.status || "new", to: nextStatus, changedAt: issuedAt, actor: record.owner || "Sales team", reason: `Issued ${quoteNumber}` }] : history;
      const updated = { ...record, quotations, status: nextStatus, pipelineHistory, lostReason: nextStatus === "lost" ? record.lostReason || "legacy_unspecified" : "", buyerUpdate: `Quotation ${quoteNumber} is ready for review. Check the commercial terms and send your decision or questions.`, updatedAt: issuedAt };
      await store.setJSON(key, updated, { cacheControl: null });
      const quoteEmailSent = await sendQuotationEmail(record, issuedQuote, context.env || {}, createTransportImpl);
      if (quoteEmailSent) { updated.quotations = updated.quotations.map((item) => item.quoteNumber === quoteNumber ? { ...item, quoteEmailSent: true } : item); await store.setJSON(key, updated, { cacheControl: null }); }
      return response(200, { ok: true, record: adminSafeRecord(updated), quoteEmailSent });
    } catch (error) { console.error("Quotation issue failed", error); return response(503, { ok: false, message: "Quotation could not be issued." }); }
  };
}

export const onRequestPost = createAdminQuotationHandler();
