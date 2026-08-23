import { createHash, randomBytes } from "node:crypto";
import { getStore } from "@edgeone/pages-blob";
import nodemailer from "nodemailer";
import { normalizeWorkspaceEmail, workspaceContactCanRead } from "../_lib/workspace-access-policy.js";
import { isWorkspaceInternalTest, safeRecordWorkspaceActivity } from "../_lib/workspace-activity.js";

const GENERIC_MESSAGE = "If that email matches a Beiqiang sourcing record, a secure workspace link will arrive shortly. Check spam or contact us if it does not arrive.";

function response(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=UTF-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}

function normalizeEmail(value) {
  return normalizeWorkspaceEmail(value);
}

function hash(value) { return createHash("sha256").update(value).digest("hex"); }
function allowedOrigin(origin) { if (!origin) return true; try { const url = new URL(origin); return url.protocol === "https:" && (url.hostname === "www.beiqiang.online" || url.hostname === "beiqiang.online" || /^beiqiang-footwear-[a-z0-9]+\.edgeone\.dev$/.test(url.hostname)); } catch { return false; } }

async function listRecords(store, max = 5000) {
  const records = []; let cursor;
  while (records.length < max) {
    const result = await store.list({ prefix: "inquiries/", limit: Math.min(500, max - records.length), cursor, consistency: "strong" });
    const blobs = Array.isArray(result?.blobs) ? result.blobs : [];
    records.push(...(await Promise.all(blobs.map(({ key }) => store.get(key, { type: "json", consistency: "strong" })))).filter(Boolean));
    if (!result?.cursor || !blobs.length) break;
    cursor = result.cursor;
  }
  return records;
}

export function createBuyerWorkspaceAccessHandler({ getStoreImpl = getStore, createTransportImpl = nodemailer.createTransport, nowImpl = () => new Date(), randomBytesImpl = randomBytes, recordActivityImpl = safeRecordWorkspaceActivity } = {}) {
  return async function onRequestPost(context) {
    if (!allowedOrigin(context.request.headers.get("origin"))) return response(403, { ok: false, message: "This request is not allowed." });
    let payload;
    try { payload = await context.request.json(); } catch { return response(202, { ok: true, message: GENERIC_MESSAGE }); }
    const email = normalizeEmail(payload?.email);
    if (!email) return response(202, { ok: true, message: GENERIC_MESSAGE });
    try {
      const now = nowImpl(); const nowMs = now.getTime(); const emailHash = hash(email);
      const accessStore = getStoreImpl("beiqiang-buyer-access");
      const rateKey = `rate/email/${emailHash}.json`;
      const rate = await accessStore.get(rateKey, { type: "json", consistency: "strong" });
      const windowStart = Number(rate?.windowStart) || nowMs;
      const count = nowMs - windowStart < 30 * 60 * 1000 ? Number(rate?.count || 0) : 0;
      if (count >= 3) { await recordActivityImpl(accessStore, "workspace_access_request", { emailHash, outcome: "rate_limited" }, { now }); return response(202, { ok: true, message: GENERIC_MESSAGE }); }
      await accessStore.setJSON(rateKey, { windowStart: count ? windowStart : nowMs, count: count + 1, updatedAt: now.toISOString() }, { cacheControl: null });

      const inquiryStore = getStoreImpl("beiqiang-inquiries");
      const records = await listRecords(inquiryStore);
      const matchingRecords = records.filter((record) => workspaceContactCanRead(record, email));
      if (!matchingRecords.length) { await recordActivityImpl(accessStore, "workspace_access_request", { emailHash, outcome: "unknown" }, { now }); return response(202, { ok: true, message: GENERIC_MESSAGE }); }
      const analyticsExcluded = matchingRecords.every(isWorkspaceInternalTest);
      const primary = matchingRecords.some((record) => normalizeEmail(record.email) === email); const delegated = matchingRecords.some((record) => normalizeEmail(record.email) !== email);
      const accessKind = primary && delegated ? "mixed" : delegated ? "delegated" : "primary";
      if (!context.env?.SMTP_PASS) { await recordActivityImpl(accessStore, "workspace_access_request", { emailHash, outcome: "smtp_unavailable", accessKind, analyticsExcluded }, { now }); return response(202, { ok: true, message: GENERIC_MESSAGE }); }

      const token = randomBytesImpl(32).toString("hex"); const tokenHash = hash(token);
      const expiresAt = new Date(nowMs + 15 * 60 * 1000).toISOString();
      await accessStore.setJSON(`magic/${tokenHash}.json`, { email, emailHash, createdAt: now.toISOString(), expiresAt, analyticsExcluded }, { onlyIfNew: true, cacheControl: null });
      const transport = createTransportImpl({ host: context.env.SMTP_HOST || "smtp.qq.com", port: Number(context.env.SMTP_PORT || 465), secure: String(context.env.SMTP_SECURE || "true") !== "false", auth: { user: context.env.SMTP_USER || "421345308@qq.com", pass: context.env.SMTP_PASS } });
      try {
        await transport.sendMail({
          from: context.env.SMTP_FROM || context.env.SMTP_USER || "421345308@qq.com", to: email,
          replyTo: context.env.INQUIRY_NOTIFY_TO || "421345308@qq.com", subject: "Your secure Beiqiang buyer workspace link",
          text: ["Hello Purchasing Team,", "", "Use this one-time link to view the Beiqiang sourcing projects associated with this email:", `https://www.beiqiang.online/buyer-workspace/?token=${token}`, "", "The link expires in 15 minutes and can be used once. The resulting workspace session lasts up to 8 hours on the same browser.", "", "For security, project-level actions such as quotation, sample or order decisions still require that project's private access code. This email is not a quotation, order, payment request, stock confirmation or production authorization.", "", "If you did not request this link, you can ignore this email.", "", "Quanzhou Beiqiang Footwear & Apparel Co., Ltd.", "421345308@qq.com", "+86 189 5980 5256"].join("\n"),
        });
        await recordActivityImpl(accessStore, "workspace_access_request", { emailHash, outcome: "sent", accessKind, analyticsExcluded }, { now });
      } catch (error) { console.error("Buyer workspace email delivery failed", error); await recordActivityImpl(accessStore, "workspace_access_request", { emailHash, outcome: "delivery_failed", accessKind, analyticsExcluded }, { now }); }
    } catch (error) { console.error("Buyer workspace access request failed", error); }
    return response(202, { ok: true, message: GENERIC_MESSAGE });
  };
}

export const onRequestPost = createBuyerWorkspaceAccessHandler();
