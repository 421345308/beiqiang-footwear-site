import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { getStore } from "@edgeone/pages-blob";
import nodemailer from "nodemailer";

const SAMPLE_TYPES = new Set(["existing_style", "branding_adaptation", "technical_development"]);

function response(status, body) { return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=UTF-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } }); }
function clean(value, max) { return typeof value === "string" ? value.trim().replace(/\0/g, "").slice(0, max) : ""; }
function safeEqual(left, right) { const a = Buffer.from(left || ""); const b = Buffer.from(right || ""); return a.length > 0 && a.length === b.length && timingSafeEqual(a, b); }
function isAllowedOrigin(origin) { if (!origin) return true; try { const { protocol, hostname } = new URL(origin); if (protocol !== "https:") return hostname === "localhost" || hostname === "127.0.0.1"; return hostname === "www.beiqiang.online" || hostname === "beiqiang.online" || /^beiqiang-footwear-[a-z0-9]+\.edgeone\.dev$/.test(hostname); } catch { return false; } }
function details(reference) { const normalized = clean(reference, 40).toUpperCase(); const match = /^BQ-(\d{4})(\d{2})(\d{2})-([A-F0-9]{8})$/.exec(normalized); return match ? { reference: normalized, key: `inquiries/${match[1]}-${match[2]}-${match[3]}/${normalized}.json` } : null; }
function codes(value) { return Array.isArray(value) ? [...new Set(value.map((item) => clean(item, 20).toUpperCase()).filter((item) => /^BQ\d{3}$/.test(item)))].slice(0, 6) : []; }
function recordCodes(record) { const values = [record.styleCode, ...(Array.isArray(record.items) ? record.items.map((item) => item?.code) : []), ...(Array.isArray(record.recommendationSets) ? record.recommendationSets.flatMap((set) => set?.items?.map((item) => item?.code) || []) : [])]; return new Set(values.flatMap((value) => String(value || "").split(",")).map((value) => value.trim().toUpperCase()).filter((value) => /^BQ\d{3}$/.test(value))); }
function publicRequest(item) { return { id: item.id, styleCodes: item.styleCodes, sampleType: item.sampleType, quantity: item.quantity, sizes: item.sizes, colors: item.colors, evaluationPurpose: item.evaluationPurpose, customizationTarget: item.customizationTarget, acceptanceFocus: item.acceptanceFocus, targetBulkQuantity: item.targetBulkQuantity, shippingCountry: item.shippingCountry, shippingCity: item.shippingCity, courierAccountAvailable: item.courierAccountAvailable, requestedTiming: item.requestedTiming, status: item.status, submittedAt: item.submittedAt, reviewedAt: item.reviewedAt || "", reviewNote: item.status === "rejected" ? item.reviewNote || "" : "", sampleReference: item.sampleReference || "" }; }

async function notifySales(record, item, env, createTransportImpl) {
  if (!env?.SMTP_PASS) return "smtp_not_configured";
  try {
    const transport = createTransportImpl({ host: env.SMTP_HOST || "smtp.qq.com", port: Number(env.SMTP_PORT || 465), secure: String(env.SMTP_SECURE || "true") !== "false", auth: { user: env.SMTP_USER || "421345308@qq.com", pass: env.SMTP_PASS } });
    await transport.sendMail({
      from: env.SMTP_FROM || env.SMTP_USER || "421345308@qq.com", to: env.INQUIRY_NOTIFY_TO || "421345308@qq.com", replyTo: record.email || undefined,
      subject: `[Sample review requested] ${record.reference} · ${item.styleCodes.join(", ")}`,
      text: [`Project: ${record.reference}`, `Buyer: ${record.name || "Not supplied"} · ${record.company || "Not supplied"}`, `Styles: ${item.styleCodes.join(", ")}`, `Sample type: ${item.sampleType.replaceAll("_", " ")}`, `Quantity / sizes / colors: ${item.quantity} · ${item.sizes} · ${item.colors}`, `Evaluation purpose: ${item.evaluationPurpose}`, `Acceptance focus: ${item.acceptanceFocus}`, `Customization target: ${item.customizationTarget || "None supplied"}`, `Indicative bulk quantity: ${item.targetBulkQuantity}`, `Shipping destination: ${item.shippingCity ? `${item.shippingCity}, ` : ""}${item.shippingCountry}`, `Courier account available: ${item.courierAccountAvailable ? "Yes" : "No / not stated"}`, `Requested timing: ${item.requestedTiming}`, "", "This is a buyer request for sample feasibility and terms review. It does not confirm sample availability, cost, freight, preparation time, specifications, test results or a production order. Review the request in the inquiry dashboard before creating a sample project."].join("\n"),
    });
    return "sent";
  } catch (error) { console.error("Sample request notification failed", record.reference, item.id, error); return "delivery_failed"; }
}

export function createSampleRequestHandler({ getStoreImpl = getStore, createTransportImpl = nodemailer.createTransport, nowImpl = () => new Date(), randomBytesImpl = randomBytes } = {}) {
  return async function onRequestPost(context) {
    if (!isAllowedOrigin(context.request.headers.get("origin"))) return response(403, { ok: false, message: "Request origin is not allowed." });
    let payload; try { payload = await context.request.json(); } catch { return response(400, { ok: false, message: "Invalid request." }); }
    const recordDetails = details(payload.reference); const accessCode = clean(payload.accessCode, 40).toUpperCase(); const styleCodes = codes(payload.styleCodes); const sampleType = SAMPLE_TYPES.has(payload.sampleType) ? payload.sampleType : "";
    const quantity = clean(payload.quantity, 120); const sizes = clean(payload.sizes, 240); const colors = clean(payload.colors, 240); const evaluationPurpose = clean(payload.evaluationPurpose, 600); const customizationTarget = clean(payload.customizationTarget, 800); const acceptanceFocus = clean(payload.acceptanceFocus, 1000); const targetBulkQuantity = clean(payload.targetBulkQuantity, 120); const shippingCountry = clean(payload.shippingCountry, 120); const shippingCity = clean(payload.shippingCity, 120); const requestedTiming = clean(payload.requestedTiming, 240); const courierAccountAvailable = payload.courierAccountAvailable === true;
    if (!recordDetails || !/^[A-F0-9]{20}$/.test(accessCode) || !styleCodes.length || !sampleType || [quantity, sizes, colors, evaluationPurpose, acceptanceFocus, targetBulkQuantity, shippingCountry, requestedTiming].some((value) => value.length < 2) || (["branding_adaptation", "technical_development"].includes(sampleType) && customizationTarget.length < 2) || payload.buyerConfirmation !== true) return response(400, { ok: false, message: "Complete the styles, sample type, quantity, sizes, colors, evaluation standard, expected bulk quantity, destination, timing and confirmation." });
    try {
      const store = getStoreImpl("beiqiang-inquiries"); const record = await store.get(recordDetails.key, { type: "json", consistency: "strong" }); const suppliedHash = createHash("sha256").update(accessCode).digest("hex");
      if (!record?.accessTokenHash || !safeEqual(record.accessTokenHash, suppliedHash)) return response(404, { ok: false, message: "No matching inquiry was found." });
      if (["lost", "spam", "order_confirmed"].includes(record.status) || record.orderHandoff?.orderReference) return response(409, { ok: false, message: "This project cannot start a new sample request here. Contact Beiqiang with the project reference." });
      if (record.sampleProgram && record.sampleProgram.status !== "closed") return response(409, { ok: false, message: "A sample project already exists. Use the private message thread for changes or another round." });
      const allowed = recordCodes(record); if (styleCodes.some((code) => !allowed.has(code))) return response(409, { ok: false, message: "Choose only styles already associated with this sourcing project." });
      const requests = Array.isArray(record.sampleRequests) ? record.sampleRequests : []; if (requests.some((item) => item.status === "pending")) return response(409, { ok: false, message: "A sample request is already awaiting Beiqiang review. Use the private message thread to add information." });
      if (requests.length >= 10) return response(409, { ok: false, message: "This project has reached its sample-request history limit. Contact Beiqiang directly." });
      const submittedAt = nowImpl().toISOString(); const item = { id: `BSR-${randomBytesImpl(6).toString("hex").toUpperCase()}`, styleCodes, sampleType, quantity, sizes, colors, evaluationPurpose, customizationTarget, acceptanceFocus, targetBulkQuantity, shippingCountry, shippingCity, courierAccountAvailable, requestedTiming, status: "pending", submittedAt, reviewedAt: "", reviewedBy: "", reviewNote: "", sampleReference: "", notificationStatus: "pending", notificationAttemptedAt: "" };
      const saved = { ...record, sampleRequests: [...requests, item], updatedAt: submittedAt }; await store.setJSON(recordDetails.key, saved, { cacheControl: null });
      const notificationStatus = await notifySales(record, item, context.env || {}, createTransportImpl); const notificationAttemptedAt = nowImpl().toISOString(); const latest = await store.get(recordDetails.key, { type: "json", consistency: "strong" }) || saved; const finalRecord = { ...latest, sampleRequests: (latest.sampleRequests || []).map((candidate) => candidate.id === item.id ? { ...candidate, notificationStatus, notificationAttemptedAt } : candidate) }; await store.setJSON(recordDetails.key, finalRecord, { cacheControl: null });
      return response(201, { ok: true, sampleRequest: publicRequest(finalRecord.sampleRequests.find((candidate) => candidate.id === item.id)), notificationSent: notificationStatus === "sent", message: "Your sample request was saved for feasibility and commercial review. No sample, cost, freight or preparation time has been confirmed yet." });
    } catch (error) { console.error("Sample request failed", recordDetails?.reference, error); return response(503, { ok: false, message: "Your sample request could not be saved. Contact Beiqiang by email or WhatsApp." }); }
  };
}

export const onRequestPost = createSampleRequestHandler();
