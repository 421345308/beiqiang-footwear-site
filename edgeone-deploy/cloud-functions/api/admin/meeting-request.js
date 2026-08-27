import { timingSafeEqual } from "node:crypto";
import { getStore } from "@edgeone/pages-blob";
import nodemailer from "nodemailer";

const CHANNELS = new Set(["video_call", "phone", "whatsapp_call"]);
function response(status, body) { return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=UTF-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } }); }
function clean(value, max) { return typeof value === "string" ? value.trim().replace(/\0/g, "").slice(0, max) : ""; }
function safeEqual(left, right) { const a = Buffer.from(left || ""); const b = Buffer.from(right || ""); return a.length > 0 && a.length === b.length && timingSafeEqual(a, b); }
function authorized(request, env) { const header = request.headers.get("authorization") || ""; return safeEqual(header.startsWith("Bearer ") ? header.slice(7).trim() : "", env?.INQUIRY_ADMIN_TOKEN || ""); }
function validMeetingLink(value) { if (!value) return true; try { const url = new URL(value); return url.protocol === "https:" && (url.hostname === "meet.google.com" || url.hostname === "teams.microsoft.com" || url.hostname === "zoom.us" || url.hostname.endsWith(".zoom.us")); } catch { return false; } }
function adminSafe(record) { const safe = { ...record }; delete safe.accessTokenHash; delete safe.pendingUploads; delete safe.pendingAttachments; delete safe.pendingOrderDocuments; safe.attachments = Array.isArray(record.attachments) ? record.attachments.map((file) => { const copy = { ...file }; delete copy.key; return copy; }) : []; safe.orderDocuments = Array.isArray(record.orderDocuments) ? record.orderDocuments.map((file) => { const copy = { ...file }; delete copy.key; return copy; }) : []; return safe; }

async function notifyBuyer(record, item, action, env, createTransportImpl) {
  if (!record.email) return "no_buyer_email";
  if (!env?.SMTP_PASS) return "smtp_not_configured";
  const headline = action === "confirm" ? "Your sourcing meeting has been confirmed" : action === "decline" ? "Update on your sourcing meeting request" : "Your sourcing meeting has been cancelled";
  const lines = action === "confirm" ? [`Confirmed local time: ${item.confirmedSlot}`, `Time zone: ${item.timezone}`, `Channel: ${item.confirmedChannel.replaceAll("_", " ")}`, item.meetingLink ? `Secure meeting link: ${item.meetingLink}` : "Connection details: Beiqiang will use the agreed phone or WhatsApp contact.", `Note: ${item.reviewNote || "Please use the private project thread for any change."}`] : [`Status: ${item.status}`, `Reason: ${item.reviewNote}`];
  try {
    const transport = createTransportImpl({ host: env.SMTP_HOST || "smtp.qq.com", port: Number(env.SMTP_PORT || 465), secure: String(env.SMTP_SECURE || "true") !== "false", auth: { user: env.SMTP_USER || "421345308@qq.com", pass: env.SMTP_PASS } });
    await transport.sendMail({ from: env.SMTP_FROM || env.SMTP_USER || "421345308@qq.com", to: record.email, replyTo: env.INQUIRY_NOTIFY_TO || "421345308@qq.com", subject: `[${action === "confirm" ? "Meeting confirmed" : "Meeting update"}] ${record.reference}`, text: [`Hello ${record.name || "Purchasing Team"},`, "", headline, `Project: ${record.reference}`, ...lines, "", "The meeting supports sourcing communication only. It does not confirm product specifications, sample results, price, availability, production, payment or an order. Formal terms remain subject to the issued quotation and agreed Alibaba Trade Assurance order or signed contract.", "", "Quanzhou Beiqiang Footwear & Apparel Co., Ltd.", "421345308@qq.com", "+86 189 5980 5256"].join("\n") });
    return "sent";
  } catch (error) { console.error("Meeting buyer notification failed", record.reference, item.id, error); return "delivery_failed"; }
}

export function createAdminMeetingRequestHandler({ getStoreImpl = getStore, createTransportImpl = nodemailer.createTransport, nowImpl = () => new Date() } = {}) {
  return async function onRequestPatch(context) {
    if (!context.env?.INQUIRY_ADMIN_TOKEN) return response(503, { ok: false, message: "Inquiry dashboard access has not been configured." });
    if (!authorized(context.request, context.env)) return response(401, { ok: false, message: "Invalid access token." });
    let payload; try { payload = await context.request.json(); } catch { return response(400, { ok: false, message: "Invalid request." }); }
    const reference = clean(payload.reference, 40).toUpperCase(); const receivedAt = clean(payload.receivedAt, 40); const date = receivedAt.slice(0, 10); const requestId = clean(payload.requestId, 40).toUpperCase(); const action = clean(payload.action, 20); const actor = clean(payload.actor, 100) || "Sales team";
    if (!/^BQ-[A-Z0-9-]+$/.test(reference) || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^BMR-[A-F0-9]{12}$/.test(requestId) || !["confirm", "decline", "cancel", "complete"].includes(action)) return response(400, { ok: false, message: "Invalid meeting review request." });
    try {
      const store = getStoreImpl("beiqiang-inquiries"); const key = `inquiries/${date}/${reference}.json`; const current = await store.get(key, { type: "json", consistency: "strong" });
      if (!current) return response(404, { ok: false, message: "Inquiry record was not found." });
      const requests = Array.isArray(current.meetingRequests) ? current.meetingRequests : []; const target = requests.find((item) => item.id === requestId);
      if (!target) return response(404, { ok: false, message: "Meeting request was not found." });
      const changedAt = nowImpl().toISOString(); let reviewed;
      if (action === "confirm") {
        const confirmedSlot = clean(payload.confirmedSlot, 16); const confirmedChannel = CHANNELS.has(payload.confirmedChannel) ? payload.confirmedChannel : ""; const meetingLink = clean(payload.meetingLink, 600); const note = clean(payload.note, 600);
        if (target.status !== "pending") return response(409, { ok: false, message: "Only a pending meeting request can be confirmed." });
        if (!target.preferredSlots?.includes(confirmedSlot) || !confirmedChannel || !validMeetingLink(meetingLink) || (confirmedChannel === "video_call" && !meetingLink)) return response(400, { ok: false, message: "Choose one buyer-proposed slot, a valid channel, and an approved HTTPS meeting link for video calls." });
        reviewed = { ...target, status: "confirmed", confirmedSlot, confirmedChannel, meetingLink, reviewNote: note, reviewedAt: changedAt, reviewedBy: actor, notificationStatus: "pending", notificationAttemptedAt: "" };
      } else if (action === "decline") {
        const reason = clean(payload.note, 600); if (target.status !== "pending" || reason.length < 5) return response(409, { ok: false, message: "Only a pending request can be declined, with a buyer-safe reason." }); reviewed = { ...target, status: "declined", reviewNote: reason, reviewedAt: changedAt, reviewedBy: actor, notificationStatus: "pending", notificationAttemptedAt: "" };
      } else if (action === "cancel") {
        const reason = clean(payload.note, 600); if (!["pending", "confirmed"].includes(target.status) || reason.length < 5) return response(409, { ok: false, message: "Only a pending or confirmed meeting can be cancelled, with a buyer-safe reason." }); reviewed = { ...target, status: "cancelled", reviewNote: reason, reviewedAt: changedAt, reviewedBy: actor, notificationStatus: "pending", notificationAttemptedAt: "" };
      } else {
        const outcomeSummary = clean(payload.outcomeSummary, 1000); if (target.status !== "confirmed" || outcomeSummary.length < 8) return response(409, { ok: false, message: "Only a confirmed meeting can be completed, with a factual outcome summary." }); reviewed = { ...target, status: "completed", completedAt: changedAt, outcomeSummary, reviewedAt: changedAt, reviewedBy: actor };
      }
      const saved = { ...current, meetingRequests: requests.map((item) => item.id === requestId ? reviewed : item), updatedAt: changedAt }; await store.setJSON(key, saved, { cacheControl: null });
      if (action === "complete") return response(200, { ok: true, notificationSent: false, notificationStatus: "not_required", record: adminSafe(saved) });
      const notificationStatus = await notifyBuyer(current, reviewed, action, context.env || {}, createTransportImpl); const notificationAttemptedAt = nowImpl().toISOString(); const latest = await store.get(key, { type: "json", consistency: "strong" }) || saved; const notified = { ...latest, meetingRequests: (latest.meetingRequests || []).map((item) => item.id === requestId ? { ...item, notificationStatus, notificationAttemptedAt } : item) }; await store.setJSON(key, notified, { cacheControl: null });
      return response(200, { ok: true, notificationSent: notificationStatus === "sent", notificationStatus, record: adminSafe(notified) });
    } catch (error) { console.error("Meeting review failed", reference, requestId, error); return response(503, { ok: false, message: "Meeting review could not be saved." }); }
  };
}

export const onRequestPatch = createAdminMeetingRequestHandler();
