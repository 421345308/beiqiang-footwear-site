import { createHash, timingSafeEqual } from "node:crypto";
import { getStore } from "@edgeone/pages-blob";
import nodemailer from "nodemailer";

function response(status, body) { return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=UTF-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } }); }
function clean(value, max) { return typeof value === "string" ? value.trim().replace(/\0/g, "").slice(0, max) : ""; }
function safeEqual(left, right) { const a = Buffer.from(left || ""); const b = Buffer.from(right || ""); return a.length === b.length && a.length > 0 && timingSafeEqual(a, b); }
function isAllowedOrigin(origin) { if (!origin) return true; try { const { protocol, hostname } = new URL(origin); if (protocol !== "https:") return hostname === "localhost" || hostname === "127.0.0.1"; return hostname === "www.beiqiang.online" || hostname === "beiqiang.online" || /^beiqiang-footwear-[a-z0-9]+\.edgeone\.dev$/.test(hostname); } catch { return false; } }

async function notifySales(record, decision, note, env, createTransportImpl) {
  if (!env?.SMTP_PASS) return false;
  const transport = createTransportImpl({ host: env.SMTP_HOST || "smtp.qq.com", port: Number(env.SMTP_PORT || 465), secure: String(env.SMTP_SECURE || "true") !== "false", auth: { user: env.SMTP_USER || "421345308@qq.com", pass: env.SMTP_PASS } });
  try { await transport.sendMail({ from: env.SMTP_FROM || env.SMTP_USER || "421345308@qq.com", to: env.INQUIRY_NOTIFY_TO || "421345308@qq.com", replyTo: record.email || undefined, subject: `[Sample ${decision}] ${record.reference} · ${record.company}`, text: [`Reference: ${record.reference}`, `Buyer: ${record.company} / ${record.name}`, `Sample: ${record.sampleProgram?.styleCodes || "-"}`, `Decision: ${decision}`, `Buyer note: ${note || "-"}`, "", "The response applies only to the referenced sample review scope. Verify bulk specifications, quotation and order documents separately."].join("\n") }); return true; }
  catch (error) { console.error("Sample response notification failed", record.reference, error); return false; }
}

export function createSampleResponseHandler({ getStoreImpl = getStore, createTransportImpl = nodemailer.createTransport } = {}) {
  return async function onRequestPost(context) {
    if (!isAllowedOrigin(context.request.headers.get("origin"))) return response(403, { ok: false, message: "Request origin is not allowed." });
    let payload; try { payload = await context.request.json(); } catch { return response(400, { ok: false, message: "Invalid request." }); }
    const reference = clean(payload.reference, 40).toUpperCase(); const accessCode = clean(payload.accessCode, 40).toUpperCase(); const decision = payload.decision === "approve" ? "approved" : payload.decision === "revision" ? "revision_requested" : ""; const note = clean(payload.note, 1200);
    const match = /^BQ-(\d{4})(\d{2})(\d{2})-([A-F0-9]{8})$/.exec(reference);
    if (!match || !/^[A-F0-9]{20}$/.test(accessCode) || !decision) return response(400, { ok: false, message: "Check the inquiry access and sample decision." });
    if (decision === "revision_requested" && note.length < 2) return response(400, { ok: false, message: "Describe the required sample revision before submitting." });
    const date = `${match[1]}-${match[2]}-${match[3]}`; const key = `inquiries/${date}/${reference}.json`;
    try {
      const store = getStoreImpl("beiqiang-inquiries"); const record = await store.get(key, { type: "json", consistency: "strong" }); const suppliedHash = createHash("sha256").update(accessCode).digest("hex");
      if (!record?.accessTokenHash || !safeEqual(record.accessTokenHash, suppliedHash)) return response(404, { ok: false, message: "No matching inquiry was found." });
      if (record.sampleProgram?.status !== "buyer_review") return response(409, { ok: false, message: "This sample is not currently awaiting a buyer decision." });
      const respondedAt = new Date().toISOString(); const targetStatus = decision === "approved" ? "buyer_approved" : "revision_requested"; const history = Array.isArray(record.sampleProgram.history) ? record.sampleProgram.history : [];
      const sampleProgram = { ...record.sampleProgram, status: targetStatus, buyerDecision: decision, buyerNote: note, buyerRespondedAt: respondedAt, updatedAt: respondedAt, history: [...history.slice(-48), { from: "buyer_review", to: targetStatus, changedAt: respondedAt, actor: "Buyer" }] };
      const updated = { ...record, sampleProgram, updatedAt: respondedAt }; await store.setJSON(key, updated, { cacheControl: null });
      const notificationSent = await notifySales(record, decision, note, context.env || {}, createTransportImpl);
      return response(200, { ok: true, notificationSent, message: decision === "approved" ? "Your approval was saved for this referenced sample. Bulk specifications and order terms still require separate written confirmation." : "Your revision request was saved with this sample project." });
    } catch (error) { console.error("Sample response failed", error); return response(503, { ok: false, message: "Your sample response could not be saved. Contact Beiqiang with the inquiry reference." }); }
  };
}

export const onRequestPost = createSampleResponseHandler();
