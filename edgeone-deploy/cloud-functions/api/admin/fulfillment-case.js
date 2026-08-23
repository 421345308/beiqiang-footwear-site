import { randomBytes, timingSafeEqual } from "node:crypto";
import { getStore } from "@edgeone/pages-blob";
import nodemailer from "nodemailer";

function response(status, body) { return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=UTF-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } }); }
function clean(value, max) { return typeof value === "string" ? value.trim().replace(/\0/g, "").slice(0, max) : ""; }
function authorized(request, env) { const expected = clean(env?.INQUIRY_ADMIN_TOKEN, 500); const header = request.headers.get("authorization") || ""; const supplied = header.startsWith("Bearer ") ? header.slice(7).trim() : ""; const a = Buffer.from(expected); const b = Buffer.from(supplied); return a.length === b.length && a.length > 0 && timingSafeEqual(a, b); }
function recordKey(reference, receivedAt) { const date = clean(receivedAt, 40).slice(0, 10); return /^BQ-\d{8}-[A-F0-9]{8}$/.test(reference) && /^\d{4}-\d{2}-\d{2}$/.test(date) ? `inquiries/${date}/${reference}.json` : ""; }
function adminSafeRecord(record) { const safe = { ...record }; delete safe.accessTokenHash; delete safe.pendingUploads; delete safe.pendingAttachments; delete safe.pendingOrderDocuments; safe.attachments = (record.attachments || []).map((item) => { const file = { ...item }; delete file.key; return file; }); safe.orderDocuments = (record.orderDocuments || []).map((item) => { const file = { ...item }; delete file.key; return file; }); return safe; }
const CATEGORIES = new Set(["production_delay", "quality_check", "packing_labeling", "logistics", "document", "quantity_specification", "other"]);

async function notifyBuyer(record, item, env, createTransportImpl) {
  if (!env?.SMTP_PASS || !record.email) return { sent: false, status: env?.SMTP_PASS ? "missing_buyer_email" : "smtp_not_configured" };
  const transport = createTransportImpl({ host: env.SMTP_HOST || "smtp.qq.com", port: Number(env.SMTP_PORT || 465), secure: String(env.SMTP_SECURE || "true") !== "false", auth: { user: env.SMTP_USER || "421345308@qq.com", pass: env.SMTP_PASS } });
  try { await transport.sendMail({ from: env.SMTP_FROM || env.SMTP_USER || "421345308@qq.com", to: record.email, replyTo: env.INQUIRY_NOTIFY_TO || "421345308@qq.com", subject: `[Action required] ${item.title} · ${record.orderHandoff.orderReference}`, text: [`Hello ${record.name || "buyer"},`, "", `Beiqiang recorded a fulfillment exception for order ${record.orderHandoff.orderReference}.`, `Case: ${item.id}`, `Category: ${item.category.replaceAll("_", " ")}`, `Facts: ${item.facts}`, `Affected scope: ${item.affectedScope}`, `Expected impact: ${item.impact}`, `Proposed resolution: ${item.proposedResolution}`, `Please respond by: ${item.responseDue}`, "", "Open https://www.beiqiang.online/inquiry-status/ and use your existing inquiry reference and private status access code to acknowledge the update or request a revision.", "", "This notice does not change the confirmed order, payment, delivery, specification or legal terms. Any required commercial change must be agreed in the Alibaba Trade Assurance order, signed contract or revised written document. Do not send passwords or verification codes by email."].join("\n") }); return { sent: true, status: "sent" }; }
  catch (error) { console.error("Fulfillment case buyer notification failed", record.reference, error); return { sent: false, status: "failed" }; }
}

export function createAdminFulfillmentCaseHandlers({ getStoreImpl = getStore, createTransportImpl = nodemailer.createTransport, nowImpl = () => new Date(), randomBytesImpl = randomBytes } = {}) {
  async function prepare(context) {
    if (!context.env?.INQUIRY_ADMIN_TOKEN) return { error: response(503, { ok: false, message: "Inquiry dashboard access has not been configured." }) };
    if (!authorized(context.request, context.env)) return { error: response(401, { ok: false, message: "Invalid access token." }) };
    let payload; try { payload = await context.request.json(); } catch { return { error: response(400, { ok: false, message: "Invalid request." }) }; }
    const reference = clean(payload.reference, 40).toUpperCase(); const key = recordKey(reference, payload.receivedAt); if (!key) return { error: response(400, { ok: false, message: "Check the inquiry reference and received date." }) };
    const store = getStoreImpl("beiqiang-inquiries"); const record = await store.get(key, { type: "json", consistency: "strong" }); if (!record) return { error: response(404, { ok: false, message: "Inquiry record was not found." }) };
    if (record.status !== "order_confirmed" || !record.orderHandoff) return { error: response(409, { ok: false, message: "Fulfillment cases require a confirmed order." }) };
    return { payload, key, store, record };
  }
  async function onRequestPost(context) {
    try {
      const prepared = await prepare(context); if (prepared.error) return prepared.error; const { payload, key, store, record } = prepared;
      const category = clean(payload.category, 40); const title = clean(payload.title, 160); const facts = clean(payload.facts, 1200); const affectedScope = clean(payload.affectedScope, 600); const impact = clean(payload.impact, 600); const proposedResolution = clean(payload.proposedResolution, 1200); const responseDue = clean(payload.responseDue, 10);
      if (!CATEGORIES.has(category) || title.length < 3 || facts.length < 3 || affectedScope.length < 2 || impact.length < 2 || proposedResolution.length < 3 || !/^\d{4}-\d{2}-\d{2}$/.test(responseDue)) return response(400, { ok: false, message: "Complete the category, buyer-safe facts, affected scope, impact, proposed resolution and response date." });
      const cases = Array.isArray(record.fulfillmentCases) ? record.fulfillmentCases : []; if (cases.some((item) => item.status === "awaiting_buyer")) return response(409, { ok: false, message: "Another fulfillment case is already awaiting this buyer's response." });
      const createdAt = nowImpl().toISOString(); if (responseDue < createdAt.slice(0, 10)) return response(400, { ok: false, message: "The buyer response date cannot be in the past." });
      const item = { id: `FLC-${randomBytesImpl(6).toString("hex").toUpperCase()}`, source: "beiqiang", status: "awaiting_buyer", category, title, facts, affectedScope, impact, proposedResolution, responseDue, createdAt, createdBy: clean(payload.createdBy, 100) || record.owner || "Sales team", buyerDecision: "", buyerNote: "", buyerRespondedAt: "", notificationSent: false, notificationStatus: "pending", notificationAttemptedAt: "", resolvedAt: "", resolvedBy: "", resolutionNote: "" };
      const updated = { ...record, fulfillmentCases: [...cases.slice(-29), item], nextAction: `Wait for buyer response to fulfillment case ${item.id}; pause the affected action if necessary.`, nextActionDue: responseDue, buyerUpdate: `Fulfillment case ${item.id} requires your review. Open this private page to acknowledge the proposed resolution or request a revision.`, updatedAt: createdAt };
      await store.setJSON(key, updated, { cacheControl: null });
      const notification = await notifyBuyer(record, item, context.env || {}, createTransportImpl); const attemptedAt = nowImpl().toISOString(); const finalItem = { ...item, notificationSent: notification.sent, notificationStatus: notification.status, notificationAttemptedAt: attemptedAt }; const finalRecord = { ...updated, fulfillmentCases: updated.fulfillmentCases.map((candidate) => candidate.id === item.id ? finalItem : candidate) }; await store.setJSON(key, finalRecord, { cacheControl: null });
      return response(201, { ok: true, case: finalItem, notificationSent: notification.sent, record: adminSafeRecord(finalRecord) });
    } catch (error) { console.error("Fulfillment case creation failed", error); return response(503, { ok: false, message: "The fulfillment case could not be saved." }); }
  }
  async function onRequestPatch(context) {
    try {
      const prepared = await prepare(context); if (prepared.error) return prepared.error; const { payload, key, store, record } = prepared; const caseId = clean(payload.caseId, 40).toUpperCase(); const resolutionNote = clean(payload.resolutionNote, 1200);
      if (!/^FLC-[A-F0-9]{12}$/.test(caseId) || resolutionNote.length < 3) return response(400, { ok: false, message: "Choose a fulfillment case and record the verified resolution." });
      const cases = Array.isArray(record.fulfillmentCases) ? record.fulfillmentCases : []; const item = cases.find((candidate) => candidate.id === caseId); if (!item || !["buyer_acknowledged", "buyer_revision_requested", "open_internal"].includes(item.status)) return response(409, { ok: false, message: "This fulfillment case is not ready to be resolved." });
      const resolvedAt = nowImpl().toISOString(); const fulfillmentCases = cases.map((candidate) => candidate.id === caseId ? { ...candidate, status: "resolved", resolvedAt, resolvedBy: clean(payload.resolvedBy, 100) || record.owner || "Sales team", resolutionNote } : candidate); const updated = { ...record, fulfillmentCases, nextAction: `Verify the resolution of fulfillment case ${caseId} in the formal order channel and continue the agreed fulfillment plan.`, nextActionDue: resolvedAt.slice(0, 10), buyerUpdate: `Fulfillment case ${caseId} was marked resolved: ${resolutionNote}`, updatedAt: resolvedAt }; await store.setJSON(key, updated, { cacheControl: null });
      return response(200, { ok: true, record: adminSafeRecord(updated) });
    } catch (error) { console.error("Fulfillment case resolution failed", error); return response(503, { ok: false, message: "The fulfillment case resolution could not be saved." }); }
  }
  return { onRequestPost, onRequestPatch };
}

const handlers = createAdminFulfillmentCaseHandlers(); export const onRequestPost = handlers.onRequestPost; export const onRequestPatch = handlers.onRequestPatch;
