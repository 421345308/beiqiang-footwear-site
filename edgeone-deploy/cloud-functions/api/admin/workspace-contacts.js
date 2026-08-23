import { randomBytes, timingSafeEqual } from "node:crypto";
import { getStore } from "@edgeone/pages-blob";
import nodemailer from "nodemailer";
import { activeWorkspaceContacts, normalizeWorkspaceEmail } from "../../_lib/workspace-access-policy.js";

const ROLES = new Set(["purchasing", "merchandising", "operations", "finance", "management", "sourcing_agent", "other"]);
const MAX_ACTIVE_CONTACTS = 10;
function response(status, body) { return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=UTF-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } }); }
function clean(value, max) { return typeof value === "string" ? value.trim().replace(/\0/g, "").slice(0, max) : ""; }
function authorized(request, env) { const expected = clean(env?.INQUIRY_ADMIN_TOKEN, 1000); const header = request.headers.get("authorization") || ""; const supplied = header.startsWith("Bearer ") ? header.slice(7).trim() : ""; const a = Buffer.from(expected); const b = Buffer.from(supplied); return a.length > 0 && a.length === b.length && timingSafeEqual(a, b); }
function details(payload) { const reference = clean(payload?.reference, 40).toUpperCase(); const date = clean(payload?.receivedAt, 40).slice(0, 10); return /^BQ-[A-Z0-9-]+$/.test(reference) && /^\d{4}-\d{2}-\d{2}$/.test(date) ? { reference, date, key: `inquiries/${date}/${reference}.json` } : null; }
function isInternalTest(record) { const text = `${record?.name || ""} ${record?.company || ""} ${record?.requirements || ""} ${record?.quantity || ""}`.toLowerCase(); return /internal|deployment test|smtp test|test only|\b0\s*pairs?\b/.test(text); }
function safeRecord(record) { const safe = { ...record }; delete safe.accessTokenHash; delete safe.pendingUploads; delete safe.pendingAttachments; delete safe.pendingOrderDocuments; safe.attachments = (record.attachments || []).map((item) => { const copy = { ...item }; delete copy.key; return copy; }); safe.orderDocuments = (record.orderDocuments || []).map((item) => { const copy = { ...item }; delete copy.key; return copy; }); return { ...safe, internalTest: isInternalTest(record) }; }
function transport(env, createTransportImpl) { return createTransportImpl({ host: env.SMTP_HOST || "smtp.qq.com", port: Number(env.SMTP_PORT || 465), secure: String(env.SMTP_SECURE || "true") !== "false", auth: { user: env.SMTP_USER || "421345308@qq.com", pass: env.SMTP_PASS } }); }

async function notifyGrant(record, contact, env, createTransportImpl) {
  if (!env?.SMTP_PASS) return "smtp_not_configured";
  try {
    await transport(env, createTransportImpl).sendMail({
      from: env.SMTP_FROM || env.SMTP_USER || "421345308@qq.com", to: contact.email, replyTo: env.INQUIRY_NOTIFY_TO || "421345308@qq.com",
      subject: `Beiqiang buyer workspace access · ${record.reference}`,
      text: [`Hello ${contact.name || "Purchasing Team"},`, "", `${contact.grantedBy} recorded you as an authorized ${contact.role.replaceAll("_", " ")} contact for Beiqiang sourcing project ${record.reference}.`, "", "To request your own one-time email link, open:", "https://www.beiqiang.online/buyer-workspace/", "", "The workspace shows buyer-safe project summaries only. Prices, payment details, files, messages and all quotation, sample or order decisions remain behind the project's separate 20-character access code. This authorization is not a quotation, purchase order, payment request or production authorization.", "", "Do not forward workspace links or project access codes. Contact Beiqiang if you do not recognize this authorization.", "", "Quanzhou Beiqiang Footwear & Apparel Co., Ltd.", "421345308@qq.com", "+86 189 5980 5256"].join("\n"),
    });
    return "sent";
  } catch (error) { console.error("Workspace contact grant notification failed", record.reference, contact.id, error); return "delivery_failed"; }
}

async function notifyRevocation(record, contact, env, createTransportImpl) {
  if (!env?.SMTP_PASS) return "smtp_not_configured";
  try {
    await transport(env, createTransportImpl).sendMail({
      from: env.SMTP_FROM || env.SMTP_USER || "421345308@qq.com", to: contact.email, replyTo: env.INQUIRY_NOTIFY_TO || "421345308@qq.com",
      subject: `Beiqiang buyer workspace access removed · ${record.reference}`,
      text: [`Hello ${contact.name || "Purchasing Team"},`, "", `Your delegated email access to the buyer-safe workspace summary for project ${record.reference} has been removed. Any existing workspace session will no longer return this project.`, "", "This does not cancel or amend any quotation, sample, Trade Assurance order or signed contract. Contact Beiqiang through a verified company channel if this change is unexpected.", "", "Quanzhou Beiqiang Footwear & Apparel Co., Ltd.", "421345308@qq.com", "+86 189 5980 5256"].join("\n"),
    });
    return "sent";
  } catch (error) { console.error("Workspace contact revocation notification failed", record.reference, contact.id, error); return "delivery_failed"; }
}

async function notifyPrimaryRestored(record, state, env, createTransportImpl) {
  if (!record.email || !env?.SMTP_PASS) return env?.SMTP_PASS ? "no_primary_email" : "smtp_not_configured";
  try {
    await transport(env, createTransportImpl).sendMail({
      from: env.SMTP_FROM || env.SMTP_USER || "421345308@qq.com", to: record.email, replyTo: env.INQUIRY_NOTIFY_TO || "421345308@qq.com",
      subject: `Beiqiang buyer workspace access restored · ${record.reference}`,
      text: [`Hello ${record.name || "Purchasing Team"},`, "", `Primary-email access to the buyer-safe workspace summary for project ${record.reference} has been restored after a verified review by ${state.changedBy}.`, "", "Request a new one-time link at:", "https://www.beiqiang.online/buyer-workspace/", "", "This restoration does not approve a quotation, sample, order change or payment. Sensitive details and decisions still require the separate project access code.", "", "Quanzhou Beiqiang Footwear & Apparel Co., Ltd.", "421345308@qq.com", "+86 189 5980 5256"].join("\n"),
    }); return "sent";
  } catch (error) { console.error("Workspace primary restoration notification failed", record.reference, error); return "delivery_failed"; }
}

export function createAdminWorkspaceContactHandlers({ getStoreImpl = getStore, createTransportImpl = nodemailer.createTransport, nowImpl = () => new Date(), randomBytesImpl = randomBytes } = {}) {
  function guard(context) { if (!context.env?.INQUIRY_ADMIN_TOKEN) return response(503, { ok: false, message: "Inquiry dashboard access has not been configured." }); if (!authorized(context.request, context.env)) return response(401, { ok: false, message: "Invalid access token." }); return null; }

  async function onRequestPost(context) {
    const denied = guard(context); if (denied) return denied;
    let payload; try { payload = await context.request.json(); } catch { return response(400, { ok: false, message: "Invalid request." }); }
    const recordDetails = details(payload); const email = normalizeWorkspaceEmail(payload.email); const name = clean(payload.name, 120); const role = ROLES.has(payload.role) ? payload.role : ""; const reason = clean(payload.authorizationBasis, 500); const actor = clean(payload.actor, 120) || "Beiqiang sales team";
    if (!recordDetails || !email || name.length < 2 || !role || reason.length < 8 || payload.authorizationConfirmed !== true) return response(400, { ok: false, message: "Verify the project, contact, role and written authorization basis before granting access." });
    try {
      const store = getStoreImpl("beiqiang-inquiries"); const record = await store.get(recordDetails.key, { type: "json", consistency: "strong" }); if (!record) return response(404, { ok: false, message: "Inquiry record was not found." }); if (record.status === "spam") return response(409, { ok: false, message: "Workspace access cannot be granted from a spam record." });
      if (normalizeWorkspaceEmail(record.email) === email) return response(409, { ok: false, message: "This is already the project's primary inquiry email." });
      const contacts = Array.isArray(record.workspaceContacts) ? record.workspaceContacts : []; if (contacts.some((item) => item.status === "active" && normalizeWorkspaceEmail(item.email) === email)) return response(409, { ok: false, message: "This email already has active access to the project." });
      if (activeWorkspaceContacts(record).length >= MAX_ACTIVE_CONTACTS) return response(409, { ok: false, message: `A project can have at most ${MAX_ACTIVE_CONTACTS} active delegated contacts.` });
      const changedAt = nowImpl().toISOString(); const id = `BWC-${randomBytesImpl(6).toString("hex").toUpperCase()}`;
      const contact = { id, email, name, role, status: "active", grantedAt: changedAt, grantedBy: actor, authorizationBasis: reason, notificationStatus: "pending", notificationAttemptedAt: "", revokedAt: "", revokedBy: "", revocationReason: "", revocationNotificationStatus: "" };
      const audit = { id: `BWA-${randomBytesImpl(6).toString("hex").toUpperCase()}`, contactId: id, action: "granted", email, role, actor, reason, changedAt };
      const saved = { ...record, workspaceContacts: [...contacts, contact], workspaceContactAudit: [...(Array.isArray(record.workspaceContactAudit) ? record.workspaceContactAudit : []), audit], updatedAt: changedAt };
      await store.setJSON(recordDetails.key, saved, { cacheControl: null });
      const notificationStatus = await notifyGrant(record, contact, context.env || {}, createTransportImpl); const notificationAttemptedAt = nowImpl().toISOString();
      const latest = await store.get(recordDetails.key, { type: "json", consistency: "strong" }) || saved; const finalRecord = { ...latest, workspaceContacts: (latest.workspaceContacts || []).map((item) => item.id === id ? { ...item, notificationStatus, notificationAttemptedAt } : item) };
      await store.setJSON(recordDetails.key, finalRecord, { cacheControl: null });
      return response(201, { ok: true, contact: finalRecord.workspaceContacts.find((item) => item.id === id), notificationSent: notificationStatus === "sent", record: safeRecord(finalRecord) });
    } catch (error) { console.error("Workspace contact grant failed", recordDetails?.reference, error); return response(503, { ok: false, message: "Workspace contact access could not be granted." }); }
  }

  async function onRequestPatch(context) {
    const denied = guard(context); if (denied) return denied;
    let payload; try { payload = await context.request.json(); } catch { return response(400, { ok: false, message: "Invalid request." }); }
    const recordDetails = details(payload); const contactId = clean(payload.contactId, 40).toUpperCase(); const action = payload.action === "restore" ? "restore" : "revoke"; const reason = clean(payload.reason || payload.revocationReason, 500); const actor = clean(payload.actor, 120) || "Beiqiang sales team";
    if (!recordDetails || !(contactId === "PRIMARY" || /^BWC-[A-F0-9]{12}$/.test(contactId)) || reason.length < 5) return response(400, { ok: false, message: "Select a workspace contact and record the access-change reason." });
    try {
      const store = getStoreImpl("beiqiang-inquiries"); const record = await store.get(recordDetails.key, { type: "json", consistency: "strong" }); if (!record) return response(404, { ok: false, message: "Inquiry record was not found." });
      if (contactId === "PRIMARY") {
        if (!normalizeWorkspaceEmail(record.email)) return response(409, { ok: false, message: "This project has no valid primary email to manage." });
        const currentStatus = record.workspacePrimaryAccess?.status === "revoked" ? "revoked" : "active"; if ((action === "revoke" && currentStatus === "revoked") || (action === "restore" && currentStatus === "active")) return response(409, { ok: false, message: `Primary workspace access is already ${currentStatus}.` });
        const changedAt = nowImpl().toISOString(); const status = action === "revoke" ? "revoked" : "active"; const state = { status, changedAt, changedBy: actor, reason, notificationStatus: "pending" };
        const audit = { id: `BWA-${randomBytesImpl(6).toString("hex").toUpperCase()}`, contactId: "PRIMARY", action: action === "revoke" ? "primary_revoked" : "primary_restored", email: normalizeWorkspaceEmail(record.email), role: "primary", actor, reason, changedAt };
        const saved = { ...record, workspacePrimaryAccess: state, workspaceContactAudit: [...(Array.isArray(record.workspaceContactAudit) ? record.workspaceContactAudit : []), audit], updatedAt: changedAt };
        await store.setJSON(recordDetails.key, saved, { cacheControl: null });
        const notificationStatus = action === "revoke" ? await notifyRevocation(record, { id: "PRIMARY", email: record.email, name: record.name }, context.env || {}, createTransportImpl) : await notifyPrimaryRestored(record, state, context.env || {}, createTransportImpl);
        const latest = await store.get(recordDetails.key, { type: "json", consistency: "strong" }) || saved; const finalRecord = { ...latest, workspacePrimaryAccess: { ...(latest.workspacePrimaryAccess || state), notificationStatus } }; await store.setJSON(recordDetails.key, finalRecord, { cacheControl: null });
        return response(200, { ok: true, primaryAccess: finalRecord.workspacePrimaryAccess, notificationSent: notificationStatus === "sent", record: safeRecord(finalRecord) });
      }
      if (action === "restore") return response(400, { ok: false, message: "Re-authorize a delegated contact as a new grant so the audit history remains explicit." });
      const contacts = Array.isArray(record.workspaceContacts) ? record.workspaceContacts : []; const contact = contacts.find((item) => item.id === contactId); if (!contact) return response(404, { ok: false, message: "Workspace contact was not found." }); if (contact.status !== "active") return response(409, { ok: false, message: "This workspace contact is already revoked." });
      const changedAt = nowImpl().toISOString(); const revokedContact = { ...contact, status: "revoked", revokedAt: changedAt, revokedBy: actor, revocationReason: reason, revocationNotificationStatus: "pending" };
      const audit = { id: `BWA-${randomBytesImpl(6).toString("hex").toUpperCase()}`, contactId, action: "revoked", email: contact.email, role: contact.role, actor, reason, changedAt };
      const saved = { ...record, workspaceContacts: contacts.map((item) => item.id === contactId ? revokedContact : item), workspaceContactAudit: [...(Array.isArray(record.workspaceContactAudit) ? record.workspaceContactAudit : []), audit], updatedAt: changedAt };
      await store.setJSON(recordDetails.key, saved, { cacheControl: null });
      const revocationNotificationStatus = await notifyRevocation(record, revokedContact, context.env || {}, createTransportImpl); const latest = await store.get(recordDetails.key, { type: "json", consistency: "strong" }) || saved; const finalRecord = { ...latest, workspaceContacts: (latest.workspaceContacts || []).map((item) => item.id === contactId ? { ...item, revocationNotificationStatus } : item) };
      await store.setJSON(recordDetails.key, finalRecord, { cacheControl: null });
      return response(200, { ok: true, contact: finalRecord.workspaceContacts.find((item) => item.id === contactId), notificationSent: revocationNotificationStatus === "sent", record: safeRecord(finalRecord) });
    } catch (error) { console.error("Workspace contact revocation failed", recordDetails?.reference, error); return response(503, { ok: false, message: "Workspace contact access could not be revoked." }); }
  }
  return { onRequestPost, onRequestPatch };
}

const handlers = createAdminWorkspaceContactHandlers();
export const onRequestPost = handlers.onRequestPost;
export const onRequestPatch = handlers.onRequestPatch;
