import { randomBytes, timingSafeEqual } from "node:crypto";
import { getStore } from "@edgeone/pages-blob";
import nodemailer from "nodemailer";

function response(status, body) { return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=UTF-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } }); }
function clean(value, max) { return typeof value === "string" ? value.trim().replace(/\0/g, "").slice(0, max) : ""; }
function authorized(request, env) {
  const expected = typeof env?.INQUIRY_ADMIN_TOKEN === "string" ? env.INQUIRY_ADMIN_TOKEN.trim() : "";
  const header = request.headers.get("authorization") || ""; const supplied = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const a = Buffer.from(expected); const b = Buffer.from(supplied); return a.length === b.length && a.length > 0 && timingSafeEqual(a, b);
}
function escapeHtml(value) { return String(value || "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]); }
function adminSafeRecord(record) { const safe = { ...record }; delete safe.accessTokenHash; delete safe.pendingUploads; delete safe.pendingAttachments; delete safe.pendingOrderDocuments; safe.attachments = Array.isArray(record.attachments) ? record.attachments.map((file) => { const copy = { ...file }; delete copy.key; return copy; }) : []; safe.orderDocuments = Array.isArray(record.orderDocuments) ? record.orderDocuments.map((document) => { const copy = { ...document }; delete copy.key; return copy; }) : []; return safe; }

const VALID_STYLES = new Set(Array.from({ length: 30 }, (_, index) => `BQ${String(index + 1).padStart(3, "0")}`));

function sanitizeItems(value) {
  if (!Array.isArray(value) || value.length < 2 || value.length > 5) return { error: "Choose 2 to 5 products for a focused buyer shortlist." };
  const items = value.map((item) => ({ code: clean(item?.code, 20).toUpperCase(), reason: clean(item?.reason, 600) }));
  if (new Set(items.map((item) => item.code)).size !== items.length || items.some((item) => !VALID_STYLES.has(item.code) || item.reason.length < 8)) return { error: "Use unique BQ001–BQ030 products and write a buyer-safe reason for each one." };
  return { items };
}

async function notifyBuyer(record, recommendation, env, createTransportImpl) {
  if (!record.email || !env?.SMTP_PASS) return false;
  const replyTo = env.INQUIRY_NOTIFY_TO || "421345308@qq.com";
  const transport = createTransportImpl({ host: env.SMTP_HOST || "smtp.qq.com", port: Number(env.SMTP_PORT || 465), secure: String(env.SMTP_SECURE || "true") !== "false", auth: { user: env.SMTP_USER || "421345308@qq.com", pass: env.SMTP_PASS } });
  const productLines = recommendation.items.map((item) => `- ${item.code}: ${item.reason}`).join("\n");
  const text = [`Hello ${record.name},`, "", "Beiqiang prepared a focused product shortlist for your sourcing request.", `Recommendation: ${recommendation.title}`, "", recommendation.introduction, "", productLines, "", `Suggested next step: ${recommendation.nextStep}`, "", `Inquiry reference: ${record.reference}`, "Private status page: https://www.beiqiang.online/inquiry-status/", "", "Use your original private access code to review the product pages and record which styles interest you. These recommendations are product directions, not a quotation, stock promise or technical-capability confirmation.", "", "Quanzhou Beiqiang Footwear & Apparel Co., Ltd.", "421345308@qq.com", "WhatsApp: +86 189 5980 5256"].join("\n");
  try { await transport.sendMail({ from: env.SMTP_FROM || env.SMTP_USER || "421345308@qq.com", to: record.email, replyTo, subject: `Beiqiang product shortlist · ${record.reference}`, text, html: `<h2>Your Beiqiang product shortlist is ready</h2><pre style="font:14px/1.6 Arial,sans-serif;white-space:pre-wrap">${escapeHtml(text)}</pre>` }); return true; }
  catch (error) { console.error("Buyer recommendation email failed", record.reference, error); return false; }
}

export function createAdminRecommendationHandler({ getStoreImpl = getStore, createTransportImpl = nodemailer.createTransport } = {}) {
  return async function onRequestPost(context) {
    if (!context.env?.INQUIRY_ADMIN_TOKEN) return response(503, { ok: false, message: "Inquiry dashboard access has not been configured." });
    if (!authorized(context.request, context.env)) return response(401, { ok: false, message: "Invalid access token." });
    let payload; try { payload = await context.request.json(); } catch { return response(400, { ok: false, message: "Invalid request." }); }
    const reference = clean(payload.reference, 40).toUpperCase(); const receivedAt = clean(payload.receivedAt, 40); const date = receivedAt.slice(0, 10);
    const title = clean(payload.title, 160); const introduction = clean(payload.introduction, 1200); const nextStep = clean(payload.nextStep, 600); const itemResult = sanitizeItems(payload.items);
    if (!/^BQ-[A-Z0-9-]+$/.test(reference) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return response(400, { ok: false, message: "Invalid inquiry reference." });
    if (title.length < 5 || introduction.length < 10 || nextStep.length < 8) return response(400, { ok: false, message: "Complete the recommendation title, buyer context and suggested next step." });
    if (itemResult.error) return response(400, { ok: false, message: itemResult.error });
    try {
      const store = getStoreImpl("beiqiang-inquiries"); const key = `inquiries/${date}/${reference}.json`; const record = await store.get(key, { type: "json", consistency: "strong" });
      if (!record) return response(404, { ok: false, message: "Inquiry record was not found." });
      if (["lost", "spam", "order_confirmed"].includes(record.status)) return response(409, { ok: false, message: "Reopen or verify this opportunity before issuing a new product shortlist." });
      const issuedAt = new Date().toISOString(); const current = Array.isArray(record.recommendationSets) ? record.recommendationSets : [];
      const recommendation = { id: `REC-${randomBytes(6).toString("hex").toUpperCase()}`, title, introduction, items: itemResult.items, nextStep, status: "issued", issuedAt, issuedBy: clean(payload.issuedBy, 100) || record.owner || "Sales team", buyerDecision: "", selectedCodes: [], buyerNote: "", buyerRespondedAt: "", notificationSent: false };
      const prior = current.map((item) => item.status === "superseded" ? item : { ...item, status: "superseded" }).slice(-19);
      const updated = { ...record, recommendationSets: [...prior, recommendation], buyerUpdate: `A focused ${recommendation.items.length}-style product shortlist is ready for your review.`, lastContactedAt: issuedAt.slice(0, 10), updatedAt: issuedAt };
      await store.setJSON(key, updated, { cacheControl: null });
      const notificationSent = await notifyBuyer(record, recommendation, context.env || {}, createTransportImpl);
      if (notificationSent) { updated.recommendationSets = updated.recommendationSets.map((item) => item.id === recommendation.id ? { ...item, notificationSent: true } : item); await store.setJSON(key, updated, { cacheControl: null }); }
      return response(201, { ok: true, record: adminSafeRecord(updated), recommendationId: recommendation.id, notificationSent });
    } catch (error) { console.error("Product recommendation issue failed", error); return response(503, { ok: false, message: "The product shortlist could not be issued." }); }
  };
}

export const onRequestPost = createAdminRecommendationHandler();
