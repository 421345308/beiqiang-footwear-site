import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { getStore } from "@edgeone/pages-blob";
import nodemailer from "nodemailer";
import { activeWorkspaceContacts, normalizeWorkspaceEmail } from "../_lib/workspace-access-policy.js";

const ROLES = new Set(["purchasing", "merchandising", "operations", "finance", "management", "sourcing_agent", "other"]);
const MAX_REQUESTS = 20;
const MAX_PENDING = 5;

function response(status, body) { return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=UTF-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } }); }
function clean(value, max) { return typeof value === "string" ? value.trim().replace(/\0/g, "").slice(0, max) : ""; }
function safeEqual(left, right) { const a = Buffer.from(left || ""); const b = Buffer.from(right || ""); return a.length > 0 && a.length === b.length && timingSafeEqual(a, b); }
function isAllowedOrigin(origin) { if (!origin) return true; try { const { protocol, hostname } = new URL(origin); if (protocol !== "https:") return hostname === "localhost" || hostname === "127.0.0.1"; return hostname === "www.beiqiang.online" || hostname === "beiqiang.online" || /^beiqiang-footwear-[a-z0-9]+\.edgeone\.dev$/.test(hostname); } catch { return false; } }
function details(reference) { const normalized = clean(reference, 40).toUpperCase(); const match = /^BQ-(\d{4})(\d{2})(\d{2})-([A-F0-9]{8})$/.exec(normalized); return match ? { reference: normalized, date: `${match[1]}-${match[2]}-${match[3]}`, key: `inquiries/${match[1]}-${match[2]}-${match[3]}/${normalized}.json` } : null; }
function publicRequest(item) { return { id: item.id, name: item.name, email: item.email, role: item.role, purpose: item.purpose, status: item.status, requestedAt: item.requestedAt, reviewedAt: item.reviewedAt || "", reviewNote: item.status === "rejected" ? item.reviewNote || "" : "" }; }
function transport(env, createTransportImpl) { return createTransportImpl({ host: env.SMTP_HOST || "smtp.qq.com", port: Number(env.SMTP_PORT || 465), secure: String(env.SMTP_SECURE || "true") !== "false", auth: { user: env.SMTP_USER || "421345308@qq.com", pass: env.SMTP_PASS } }); }

async function notifySales(record, requestItem, env, createTransportImpl) {
  if (!env?.SMTP_PASS) return "smtp_not_configured";
  try {
    await transport(env, createTransportImpl).sendMail({
      from: env.SMTP_FROM || env.SMTP_USER || "421345308@qq.com", to: env.INQUIRY_NOTIFY_TO || "421345308@qq.com", replyTo: env.SMTP_USER || "421345308@qq.com",
      subject: `Buyer requests colleague review · ${record.reference}`,
      text: [`Project: ${record.reference}`, `Company: ${record.company || "Not supplied"}`, `Requested contact: ${requestItem.name} <${requestItem.email}>`, `Requested role: ${requestItem.role.replaceAll("_", " ")}`, `Purpose: ${requestItem.purpose}`, "", "This request does not grant access. Verify authority through a known buyer-company channel, then approve or reject it in the inquiry dashboard. Matching names or email domains are not sufficient evidence."].join("\n"),
    });
    return "sent";
  } catch (error) { console.error("Workspace access request notification failed", record.reference, requestItem.id, error); return "delivery_failed"; }
}

export function createWorkspaceAccessRequestHandler({ getStoreImpl = getStore, createTransportImpl = nodemailer.createTransport, nowImpl = () => new Date(), randomBytesImpl = randomBytes } = {}) {
  return async function onRequestPost(context) {
    if (!isAllowedOrigin(context.request.headers.get("origin"))) return response(403, { ok: false, message: "Request origin is not allowed." });
    let payload; try { payload = await context.request.json(); } catch { return response(400, { ok: false, message: "Invalid request." }); }
    const recordDetails = details(payload.reference); const accessCode = clean(payload.accessCode, 40).toUpperCase(); const email = normalizeWorkspaceEmail(payload.email); const name = clean(payload.name, 120); const role = ROLES.has(payload.role) ? payload.role : ""; const purpose = clean(payload.purpose, 500);
    if (!recordDetails || !/^[A-F0-9]{20}$/.test(accessCode) || !email || name.length < 2 || !role || purpose.length < 8 || payload.confirmed !== true) return response(400, { ok: false, message: "Provide the colleague name, business email, role and project purpose, then confirm that Beiqiang must verify access." });
    try {
      const store = getStoreImpl("beiqiang-inquiries"); const record = await store.get(recordDetails.key, { type: "json", consistency: "strong" }); const suppliedHash = createHash("sha256").update(accessCode).digest("hex");
      if (!record?.accessTokenHash || !safeEqual(record.accessTokenHash, suppliedHash)) return response(404, { ok: false, message: "No matching inquiry was found." });
      if (["lost", "spam"].includes(record.status)) return response(409, { ok: false, message: "This project is closed. Contact Beiqiang before requesting another reviewer." });
      if (normalizeWorkspaceEmail(record.email) === email) return response(409, { ok: false, message: "This is already the project's primary inquiry email." });
      if (activeWorkspaceContacts(record).some((item) => normalizeWorkspaceEmail(item.email) === email)) return response(409, { ok: false, message: "This email already has active workspace access." });
      const requests = Array.isArray(record.workspaceAccessRequests) ? record.workspaceAccessRequests : []; const pending = requests.filter((item) => item.status === "pending");
      if (pending.some((item) => normalizeWorkspaceEmail(item.email) === email)) return response(409, { ok: false, message: "A pending access request already exists for this email." });
      if (pending.length >= MAX_PENDING || requests.length >= MAX_REQUESTS) return response(409, { ok: false, message: "This project has reached its workspace access-request limit. Contact Beiqiang directly." });
      const requestedAt = nowImpl().toISOString(); const item = { id: `BWR-${randomBytesImpl(6).toString("hex").toUpperCase()}`, name, email, role, purpose, status: "pending", requestedAt, reviewedAt: "", reviewedBy: "", reviewNote: "", contactId: "", notificationStatus: "pending", notificationAttemptedAt: "" };
      const saved = { ...record, workspaceAccessRequests: [...requests, item], updatedAt: requestedAt }; await store.setJSON(recordDetails.key, saved, { cacheControl: null });
      const notificationStatus = await notifySales(record, item, context.env || {}, createTransportImpl); const notificationAttemptedAt = nowImpl().toISOString(); const latest = await store.get(recordDetails.key, { type: "json", consistency: "strong" }) || saved; const finalRecord = { ...latest, workspaceAccessRequests: (latest.workspaceAccessRequests || []).map((candidate) => candidate.id === item.id ? { ...candidate, notificationStatus, notificationAttemptedAt } : candidate) }; await store.setJSON(recordDetails.key, finalRecord, { cacheControl: null });
      return response(201, { ok: true, request: publicRequest(finalRecord.workspaceAccessRequests.find((candidate) => candidate.id === item.id)), notificationSent: notificationStatus === "sent", message: "The colleague access request was saved for Beiqiang verification. No access has been granted yet." });
    } catch (error) { console.error("Workspace access request failed", recordDetails?.reference, error); return response(503, { ok: false, message: "The colleague access request could not be saved." }); }
  };
}

export const onRequestPost = createWorkspaceAccessRequestHandler();
