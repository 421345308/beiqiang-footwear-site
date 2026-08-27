import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { getStore } from "@edgeone/pages-blob";
import nodemailer from "nodemailer";

const MEETING_TYPES = new Set(["sourcing_review", "sample_review", "quotation_review", "technical_development", "order_handoff", "issue_resolution"]);
const CHANNELS = new Set(["video_call", "phone", "whatsapp_call"]);
const LANGUAGES = new Set(["en", "zh", "de", "fr", "es", "other"]);

function response(status, body) { return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=UTF-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } }); }
function clean(value, max) { return typeof value === "string" ? value.trim().replace(/\0/g, "").slice(0, max) : ""; }
function safeEqual(left, right) { const a = Buffer.from(left || ""); const b = Buffer.from(right || ""); return a.length > 0 && a.length === b.length && timingSafeEqual(a, b); }
function isAllowedOrigin(origin) { if (!origin) return true; try { const { protocol, hostname } = new URL(origin); if (protocol !== "https:") return hostname === "localhost" || hostname === "127.0.0.1"; return hostname === "www.beiqiang.online" || hostname === "beiqiang.online" || /^beiqiang-footwear-[a-z0-9]+\.edgeone\.dev$/.test(hostname); } catch { return false; } }
function details(reference) { const normalized = clean(reference, 40).toUpperCase(); const match = /^BQ-(\d{4})(\d{2})(\d{2})-([A-F0-9]{8})$/.exec(normalized); return match ? { reference: normalized, key: `inquiries/${match[1]}-${match[2]}-${match[3]}/${normalized}.json` } : null; }
function slots(value, now) { const today = now.toISOString().slice(0, 10); const latest = new Date(now); latest.setUTCDate(latest.getUTCDate() + 180); const latestDate = latest.toISOString().slice(0, 10); return Array.isArray(value) ? [...new Set(value.map((item) => clean(item, 16)).filter((item) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(item) && item.slice(0, 10) >= today && item.slice(0, 10) <= latestDate))].slice(0, 3) : []; }
function publicRequest(item) { return { id: item.id, meetingType: item.meetingType, preferredChannel: item.preferredChannel, timezone: item.timezone, preferredSlots: item.preferredSlots, agenda: item.agenda, attendees: item.attendees, language: item.language, status: item.status, submittedAt: item.submittedAt, confirmedSlot: item.confirmedSlot || "", confirmedChannel: item.confirmedChannel || "", meetingLink: item.status === "confirmed" ? item.meetingLink || "" : "", reviewNote: ["declined", "cancelled"].includes(item.status) ? item.reviewNote || "" : item.status === "confirmed" ? item.reviewNote || "" : "", reviewedAt: item.reviewedAt || "", completedAt: item.completedAt || "", outcomeSummary: item.status === "completed" ? item.outcomeSummary || "" : "" }; }

async function notifySales(record, item, env, createTransportImpl) {
  if (!env?.SMTP_PASS) return "smtp_not_configured";
  try {
    const transport = createTransportImpl({ host: env.SMTP_HOST || "smtp.qq.com", port: Number(env.SMTP_PORT || 465), secure: String(env.SMTP_SECURE || "true") !== "false", auth: { user: env.SMTP_USER || "421345308@qq.com", pass: env.SMTP_PASS } });
    await transport.sendMail({ from: env.SMTP_FROM || env.SMTP_USER || "421345308@qq.com", to: env.INQUIRY_NOTIFY_TO || "421345308@qq.com", replyTo: record.email || undefined, subject: `[Meeting review requested] ${record.reference} · ${item.meetingType.replaceAll("_", " ")}`, text: [`Project: ${record.reference}`, `Buyer: ${record.name || "Not supplied"} · ${record.company || "Not supplied"}`, `Purpose: ${item.meetingType.replaceAll("_", " ")}`, `Preferred channel: ${item.preferredChannel.replaceAll("_", " ")}`, `Buyer time zone: ${item.timezone}`, `Proposed local slots: ${item.preferredSlots.join(" | ")}`, `Language: ${item.language}`, `Attendees / roles: ${item.attendees || "Not supplied"}`, `Agenda: ${item.agenda}`, "", "This request is awaiting human review. It does not create a calendar booking, confirm attendance, guarantee language availability, or confirm any product, sample, quotation, order, payment or technical term."].join("\n") });
    return "sent";
  } catch (error) { console.error("Meeting request notification failed", record.reference, item.id, error); return "delivery_failed"; }
}

export function createMeetingRequestHandler({ getStoreImpl = getStore, createTransportImpl = nodemailer.createTransport, nowImpl = () => new Date(), randomBytesImpl = randomBytes } = {}) {
  return async function onRequestPost(context) {
    if (!isAllowedOrigin(context.request.headers.get("origin"))) return response(403, { ok: false, message: "Request origin is not allowed." });
    let payload; try { payload = await context.request.json(); } catch { return response(400, { ok: false, message: "Invalid request." }); }
    const recordDetails = details(payload.reference); const accessCode = clean(payload.accessCode, 40).toUpperCase(); const now = nowImpl(); const preferredSlots = slots(payload.preferredSlots, now); const meetingType = MEETING_TYPES.has(payload.meetingType) ? payload.meetingType : ""; const preferredChannel = CHANNELS.has(payload.preferredChannel) ? payload.preferredChannel : ""; const timezone = clean(payload.timezone, 120); const agenda = clean(payload.agenda, 1000); const attendees = clean(payload.attendees, 400); const language = LANGUAGES.has(payload.language) ? payload.language : "";
    if (!recordDetails || !/^[A-F0-9]{20}$/.test(accessCode) || !meetingType || !preferredChannel || timezone.length < 2 || preferredSlots.length < 2 || agenda.length < 10 || !language || payload.buyerConfirmation !== true) return response(400, { ok: false, message: "Complete the purpose, channel, time zone, at least two valid future time options, agenda, language and confirmation." });
    try {
      const store = getStoreImpl("beiqiang-inquiries"); const record = await store.get(recordDetails.key, { type: "json", consistency: "strong" }); const suppliedHash = createHash("sha256").update(accessCode).digest("hex");
      if (!record?.accessTokenHash || !safeEqual(record.accessTokenHash, suppliedHash)) return response(404, { ok: false, message: "No matching inquiry was found." });
      if (["lost", "spam"].includes(record.status)) return response(409, { ok: false, message: "This project cannot create a meeting request here. Contact Beiqiang with the project reference." });
      if (!record.email && !record.whatsapp) return response(409, { ok: false, message: "This project has no verified reply channel. Contact Beiqiang directly with the project reference." });
      const requests = Array.isArray(record.meetingRequests) ? record.meetingRequests : [];
      if (requests.some((item) => ["pending", "confirmed"].includes(item.status))) return response(409, { ok: false, message: "A meeting request or confirmed meeting is already active. Use the private message thread for changes." });
      if (requests.length >= 20) return response(409, { ok: false, message: "This project has reached its meeting-request history limit. Contact Beiqiang directly." });
      const submittedAt = now.toISOString(); const item = { id: `BMR-${randomBytesImpl(6).toString("hex").toUpperCase()}`, meetingType, preferredChannel, timezone, preferredSlots, agenda, attendees, language, status: "pending", submittedAt, confirmedSlot: "", confirmedChannel: "", meetingLink: "", reviewNote: "", reviewedAt: "", reviewedBy: "", completedAt: "", outcomeSummary: "", notificationStatus: "pending", notificationAttemptedAt: "" };
      const saved = { ...record, meetingRequests: [...requests, item], updatedAt: submittedAt }; await store.setJSON(recordDetails.key, saved, { cacheControl: null });
      const notificationStatus = await notifySales(record, item, context.env || {}, createTransportImpl); const notificationAttemptedAt = nowImpl().toISOString(); const latest = await store.get(recordDetails.key, { type: "json", consistency: "strong" }) || saved; const finalRecord = { ...latest, meetingRequests: (latest.meetingRequests || []).map((candidate) => candidate.id === item.id ? { ...candidate, notificationStatus, notificationAttemptedAt } : candidate) }; await store.setJSON(recordDetails.key, finalRecord, { cacheControl: null });
      return response(201, { ok: true, meetingRequest: publicRequest(finalRecord.meetingRequests.find((candidate) => candidate.id === item.id)), notificationSent: notificationStatus === "sent", message: "Your meeting request was saved for human review. No calendar booking or attendance has been confirmed yet." });
    } catch (error) { console.error("Meeting request failed", recordDetails?.reference, error); return response(503, { ok: false, message: "Your meeting request could not be saved. Contact Beiqiang by email or WhatsApp." }); }
  };
}

export const onRequestPost = createMeetingRequestHandler();
