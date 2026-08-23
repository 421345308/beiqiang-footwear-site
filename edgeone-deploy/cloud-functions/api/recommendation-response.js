import { createHash, timingSafeEqual } from "node:crypto";
import { getStore } from "@edgeone/pages-blob";
import nodemailer from "nodemailer";

function response(status, body) { return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=UTF-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } }); }
function clean(value, max) { return typeof value === "string" ? value.trim().replace(/\0/g, "").slice(0, max) : ""; }
function safeEqual(left, right) { const a = Buffer.from(left || ""); const b = Buffer.from(right || ""); return a.length === b.length && a.length > 0 && timingSafeEqual(a, b); }
function allowedOrigin(request) { const origin = request.headers.get("origin"); if (!origin) return true; try { const host = new URL(origin).hostname.toLowerCase(); return host === "beiqiang.online" || host === "www.beiqiang.online" || /^beiqiang-footwear-[a-z0-9-]+\.edgeone\.dev$/.test(host); } catch { return false; } }

async function notifySales(record, recommendation, env, createTransportImpl) {
  if (!env?.SMTP_PASS) return false;
  const recipient = env.INQUIRY_NOTIFY_TO || "421345308@qq.com";
  const transport = createTransportImpl({ host: env.SMTP_HOST || "smtp.qq.com", port: Number(env.SMTP_PORT || 465), secure: String(env.SMTP_SECURE || "true") !== "false", auth: { user: env.SMTP_USER || "421345308@qq.com", pass: env.SMTP_PASS } });
  const text = [`Buyer responded to a product shortlist.`, "", `Reference: ${record.reference}`, `Company: ${record.company}`, `Buyer: ${record.name}`, `Recommendation: ${recommendation.title}`, `Decision: ${recommendation.buyerDecision}`, `Selected styles: ${recommendation.selectedCodes.join(", ") || "None"}`, `Buyer note: ${recommendation.buyerNote || "None"}`, "", "Open the protected inquiry dashboard and verify the next commercial action. A shortlist response is not a sample approval, quotation acceptance or order confirmation."].join("\n");
  try { await transport.sendMail({ from: env.SMTP_FROM || env.SMTP_USER || "421345308@qq.com", to: recipient, replyTo: record.email || recipient, subject: `Buyer shortlist response · ${record.reference}`, text }); return true; }
  catch (error) { console.error("Recommendation response email failed", record.reference, error); return false; }
}

export function createRecommendationResponseHandler({ getStoreImpl = getStore, createTransportImpl = nodemailer.createTransport } = {}) {
  return async function onRequestPost(context) {
    if (!allowedOrigin(context.request)) return response(403, { ok: false, message: "This request origin is not allowed." });
    let payload; try { payload = await context.request.json(); } catch { return response(400, { ok: false, message: "Invalid request." }); }
    const reference = clean(payload.reference, 40).toUpperCase(); const accessCode = clean(payload.accessCode, 40).toUpperCase(); const recommendationId = clean(payload.recommendationId, 40);
    const decision = payload.decision === "shortlist" ? "shortlist" : payload.decision === "revision" ? "revision" : ""; const note = clean(payload.note, 1200);
    const match = /^BQ-(\d{4})(\d{2})(\d{2})-([A-F0-9]{8})$/.exec(reference);
    if (!match || !/^[A-F0-9]{20}$/.test(accessCode) || !/^REC-[A-F0-9]{12}$/.test(recommendationId) || !decision) return response(400, { ok: false, message: "Check the private request and shortlist response." });
    if (decision === "revision" && note.length < 2) return response(400, { ok: false, message: "Describe what should change in the product recommendation." });
    const selectedCodes = Array.isArray(payload.selectedCodes) ? [...new Set(payload.selectedCodes.map((code) => clean(code, 20).toUpperCase()))].slice(0, 5) : [];
    try {
      const store = getStoreImpl("beiqiang-inquiries"); const date = `${match[1]}-${match[2]}-${match[3]}`; const key = `inquiries/${date}/${reference}.json`; const record = await store.get(key, { type: "json", consistency: "strong" });
      const suppliedHash = createHash("sha256").update(accessCode).digest("hex");
      if (!record?.accessTokenHash || !safeEqual(record.accessTokenHash, suppliedHash)) return response(404, { ok: false, message: "No matching request was found." });
      if (["lost", "spam", "order_confirmed"].includes(record.status)) return response(409, { ok: false, message: "This request is closed for shortlist responses. Contact Beiqiang with the reference." });
      const recommendations = Array.isArray(record.recommendationSets) ? record.recommendationSets : []; const recommendation = recommendations.find((item) => item.id === recommendationId);
      if (!recommendation || recommendation.status === "superseded") return response(404, { ok: false, message: "This product shortlist is no longer current." });
      if (recommendation.buyerRespondedAt || recommendation.status !== "issued") return response(409, { ok: false, message: "A response to this shortlist has already been recorded." });
      const allowedCodes = new Set(recommendation.items.map((item) => item.code));
      if (selectedCodes.some((code) => !allowedCodes.has(code)) || (decision === "shortlist" && !selectedCodes.length)) return response(400, { ok: false, message: "Choose at least one style from the current recommendation." });
      const respondedAt = new Date().toISOString(); const buyerDecision = decision === "shortlist" ? "shortlisted" : "revision_requested";
      const updatedRecommendation = { ...recommendation, status: buyerDecision === "shortlisted" ? "buyer_shortlisted" : "revision_requested", buyerDecision, selectedCodes: decision === "shortlist" ? selectedCodes : [], buyerNote: note, buyerRespondedAt: respondedAt, responseNotificationSent: false };
      const updated = { ...record, recommendationSets: recommendations.map((item) => item.id === recommendationId ? updatedRecommendation : item), buyerUpdate: decision === "shortlist" ? `Your interest in ${selectedCodes.join(", ")} is recorded. Add quantities, colors and sizes to request a useful quotation.` : "Your request for different product options is recorded. Beiqiang will review the stated requirements.", updatedAt: respondedAt };
      await store.setJSON(key, updated, { cacheControl: null });
      const notificationSent = await notifySales(record, updatedRecommendation, context.env || {}, createTransportImpl);
      if (notificationSent) { updated.recommendationSets = updated.recommendationSets.map((item) => item.id === recommendationId ? { ...item, responseNotificationSent: true } : item); await store.setJSON(key, updated, { cacheControl: null }); }
      return response(201, { ok: true, message: decision === "shortlist" ? "Your selected product directions were saved with this inquiry." : "Your request for different product options was saved.", notificationSent });
    } catch (error) { console.error("Recommendation response failed", error); return response(503, { ok: false, message: "Your shortlist response could not be saved." }); }
  };
}

export const onRequestPost = createRecommendationResponseHandler();
