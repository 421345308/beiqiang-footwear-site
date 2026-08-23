import { createHash, timingSafeEqual } from "node:crypto";
import { getStore } from "@edgeone/pages-blob";
import nodemailer from "nodemailer";

function response(status, body) { return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=UTF-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } }); }
function clean(value, max) { return typeof value === "string" ? value.trim().replace(/\0/g, "").slice(0, max) : ""; }
function safeEqual(left, right) { const a = Buffer.from(left || ""); const b = Buffer.from(right || ""); return a.length === b.length && a.length > 0 && timingSafeEqual(a, b); }
function isAllowedOrigin(origin) { if (!origin) return true; try { const { protocol, hostname } = new URL(origin); if (protocol !== "https:") return hostname === "localhost" || hostname === "127.0.0.1"; return hostname === "www.beiqiang.online" || hostname === "beiqiang.online" || /^beiqiang-footwear-[a-z0-9]+\.edgeone\.dev$/.test(hostname); } catch { return false; } }

function applyAcceptedCriticalTerms(current, proposed, respondedAt) {
  const currentPayments = new Map((current?.paymentMilestones || []).map((item) => [item.id, item]));
  const paymentMilestones = (proposed?.paymentMilestones || []).map((item) => { const actual = currentPayments.get(item.id); return actual ? { ...item, status: actual.status, paidAt: actual.paidAt, reference: actual.reference, note: actual.note } : item; });
  return { ...proposed, note: current?.note || proposed?.note || "", fulfillmentStatus: current?.fulfillmentStatus || proposed?.fulfillmentStatus || "order_documents", carrier: current?.carrier || "", trackingNumber: current?.trackingNumber || "", paymentMilestones, updatedAt: respondedAt };
}

async function notifySales(record, change, decision, note, env, createTransportImpl) {
  if (!env?.SMTP_PASS) return false;
  const transport = createTransportImpl({ host: env.SMTP_HOST || "smtp.qq.com", port: Number(env.SMTP_PORT || 465), secure: String(env.SMTP_SECURE || "true") !== "false", auth: { user: env.SMTP_USER || "421345308@qq.com", pass: env.SMTP_PASS } });
  try { await transport.sendMail({ from: env.SMTP_FROM || env.SMTP_USER || "421345308@qq.com", to: env.INQUIRY_NOTIFY_TO || "421345308@qq.com", replyTo: record.email || undefined, subject: `[Order change ${decision}] ${change.id} · ${record.company}`, text: [`Inquiry: ${record.reference}`, `Order: ${record.orderHandoff?.orderReference || "-"}`, `Change request: ${change.id}`, `Base version: ${change.baseVersion}`, `Changed fields: ${change.changedFields.join(", ")}`, `Business reason: ${change.reason}`, `Buyer decision: ${decision}`, `Buyer note: ${note || "-"}`, "", decision === "accepted" ? "Accepted critical terms are now the current website order version. Verify the same change in the authoritative Trade Assurance order or signed contract before production action." : "The current confirmed website order version remains unchanged. Resolve the mismatch in the authoritative Trade Assurance order or signed contract before any affected production action."].join("\n") }); return true; } catch (error) { console.error("Order change notification failed", record.reference, error); return false; }
}

export function createOrderChangeResponseHandler({ getStoreImpl = getStore, createTransportImpl = nodemailer.createTransport, nowImpl = () => new Date() } = {}) {
  return async function onRequestPost(context) {
    if (!isAllowedOrigin(context.request.headers.get("origin"))) return response(403, { ok: false, message: "Request origin is not allowed." });
    let payload; try { payload = await context.request.json(); } catch { return response(400, { ok: false, message: "Invalid request." }); }
    const reference = clean(payload.reference, 40).toUpperCase(); const accessCode = clean(payload.accessCode, 40).toUpperCase(); const changeId = clean(payload.changeId, 40).toUpperCase(); const decision = payload.decision === "accept" ? "accepted" : payload.decision === "reject" ? "rejected" : ""; const note = clean(payload.note, 1200);
    const match = /^BQ-(\d{4})(\d{2})(\d{2})-([A-F0-9]{8})$/.exec(reference);
    if (!match || !/^[A-F0-9]{20}$/.test(accessCode) || !/^OCR-[A-F0-9]{12}$/.test(changeId) || !decision) return response(400, { ok: false, message: "Check the inquiry access and order-change decision." });
    if (decision === "rejected" && note.length < 2) return response(400, { ok: false, message: "Explain the mismatch before rejecting this order change." });
    const date = `${match[1]}-${match[2]}-${match[3]}`; const key = `inquiries/${date}/${reference}.json`;
    try {
      const store = getStoreImpl("beiqiang-inquiries"); const record = await store.get(key, { type: "json", consistency: "strong" }); const suppliedHash = createHash("sha256").update(accessCode).digest("hex");
      if (!record?.accessTokenHash || !safeEqual(record.accessTokenHash, suppliedHash)) return response(404, { ok: false, message: "No matching inquiry was found." });
      if (record.status !== "order_confirmed" || !record.orderHandoff) return response(409, { ok: false, message: "This inquiry has no confirmed order version available for a change decision." });
      const requests = Array.isArray(record.orderChangeRequests) ? record.orderChangeRequests : []; const change = requests.find((item) => item.id === changeId);
      if (!change || change.status !== "awaiting_buyer") return response(409, { ok: false, message: "This order change is not awaiting a buyer decision." });
      const respondedAt = nowImpl().toISOString(); const orderChangeRequests = requests.map((item) => item.id === changeId ? { ...item, status: `buyer_${decision}`, buyerDecision: decision, buyerNote: note, buyerRespondedAt: respondedAt } : item);
      const existingVersions = Array.isArray(record.orderVersions) && record.orderVersions.length ? record.orderVersions : [{ version: 1, orderHandoff: record.orderHandoff, acceptedAt: record.orderHandoff.confirmedAt || record.updatedAt || record.receivedAt, acceptedBy: "Legacy / initial confirmation", source: "baseline" }];
      const orderHandoff = decision === "accepted" ? applyAcceptedCriticalTerms(record.orderHandoff, change.proposedHandoff, respondedAt) : record.orderHandoff;
      const orderVersions = decision === "accepted" ? [...existingVersions.slice(-19), { version: (existingVersions.at(-1)?.version || 0) + 1, orderHandoff, acceptedAt: respondedAt, acceptedBy: "Buyer", source: change.id }] : existingVersions;
      const nextAction = decision === "accepted" ? `Verify accepted order change ${change.id} against the authoritative Trade Assurance order or signed contract before affected production action.` : `Resolve rejected order change ${change.id}; keep current version ${existingVersions.at(-1).version} active and pause any affected action.`;
      const buyerUpdate = decision === "accepted" ? `You accepted order change ${change.id}. Website order version ${orderVersions.at(-1).version} is recorded; the matching Trade Assurance order or signed contract must still be verified.` : `You rejected order change ${change.id}. The previous confirmed website order version remains active while Beiqiang reviews the mismatch.`;
      const updated = { ...record, orderHandoff, orderVersions, orderChangeRequests, nextAction, nextActionDue: respondedAt.slice(0, 10), buyerUpdate, updatedAt: respondedAt }; await store.setJSON(key, updated, { cacheControl: null });
      const notificationSent = await notifySales(record, change, decision, note, context.env || {}, createTransportImpl);
      return response(200, { ok: true, decision, notificationSent, message: decision === "accepted" ? "The order change was accepted and recorded as a new website version. Verify the same terms in Trade Assurance or the signed contract." : "The change was rejected. The previous confirmed website order version remains active." });
    } catch (error) { console.error("Order change response failed", error); return response(503, { ok: false, message: "Your order-change response could not be saved. Contact Beiqiang with the inquiry reference." }); }
  };
}

export const onRequestPost = createOrderChangeResponseHandler();
