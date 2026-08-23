import { createHash, randomBytes } from "node:crypto";
import { getStore } from "@edgeone/pages-blob";

const PUBLIC_STATUS = { new: ["received", "Request received", 1], qualified: ["under_review", "Requirements under review", 2], sample_discussion: ["sample_discussion", "Sample discussion", 3], quoted: ["quotation_stage", "Quotation stage", 4], negotiation: ["commercial_discussion", "Commercial discussion", 5], order_confirmed: ["order_confirmed", "Order confirmed", 6], lost: ["closed", "Request closed", 0], spam: ["closed", "Request closed", 0] };
function response(status, body) { return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=UTF-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } }); }
function hash(value) { return createHash("sha256").update(value).digest("hex"); }
function bearer(request) { const match = /^Bearer\s+([a-f0-9]{64})$/i.exec(request.headers.get("authorization") || ""); return match?.[1] || ""; }
async function listRecords(store, max = 5000) { const records = []; let cursor; while (records.length < max) { const result = await store.list({ prefix: "inquiries/", limit: Math.min(500, max - records.length), cursor, consistency: "strong" }); const blobs = Array.isArray(result?.blobs) ? result.blobs : []; records.push(...(await Promise.all(blobs.map(({ key }) => store.get(key, { type: "json", consistency: "strong" })))).filter(Boolean)); if (!result?.cursor || !blobs.length) break; cursor = result.cursor; } return records; }
function summary(record) { const status = PUBLIC_STATUS[record.status] || PUBLIC_STATUS.new; const codes = Array.from(new Set([...(Array.isArray(record.items) ? record.items.map((item) => item.code) : []), record.styleCode].filter(Boolean).flatMap((value) => String(value).match(/BQ\d{3}/gi) || []))).map((code) => code.toUpperCase()); const quote = Array.isArray(record.quotations) ? record.quotations.at(-1) : null; const repeat = Array.isArray(record.repeatOrderOpportunities) ? [...record.repeatOrderOpportunities].reverse().find((item) => !["converted", "closed"].includes(item.status)) : null; return { reference: record.reference, receivedAt: record.receivedAt, updatedAt: record.updatedAt || record.receivedAt, status: { code: status[0], label: status[1], step: status[2] }, styleCodes: codes, styleLabel: record.styleLabel || "Sourcing project", quantity: record.bulkQuantity || record.quantity || "To confirm", destination: record.deliveryDestination || "To confirm", buyerUpdate: record.buyerUpdate || "Beiqiang is reviewing this sourcing request.", nextAction: record.nextAction || "Continue the sourcing discussion with Beiqiang.", hasIssuedQuotation: Boolean(quote && ["issued", "buyer_accepted", "buyer_revision_requested", "buyer_declined"].includes(quote.status)), hasOrder: Boolean(record.orderHandoff), hasOpenRepeatProject: Boolean(repeat) }; }

export function createBuyerWorkspaceSessionHandlers({ getStoreImpl = getStore, nowImpl = () => new Date(), randomBytesImpl = randomBytes } = {}) {
  async function onRequestPost(context) {
    let payload; try { payload = await context.request.json(); } catch { return response(400, { ok: false, message: "This workspace link is invalid or expired." }); }
    const token = typeof payload?.token === "string" ? payload.token.trim().toLowerCase() : "";
    if (!/^[a-f0-9]{64}$/.test(token)) return response(400, { ok: false, message: "This workspace link is invalid or expired." });
    try {
      const store = getStoreImpl("beiqiang-buyer-access"); const tokenHash = hash(token); const key = `magic/${tokenHash}.json`;
      const grant = await store.get(key, { type: "json", consistency: "strong" }); const now = nowImpl();
      if (!grant?.email || Date.parse(grant.expiresAt) <= now.getTime()) return response(410, { ok: false, message: "This workspace link is invalid or expired. Request a new one." });
      try { await store.setJSON(`consumed/${tokenHash}.json`, { consumedAt: now.toISOString() }, { onlyIfNew: true, cacheControl: null }); } catch { return response(410, { ok: false, message: "This workspace link has already been used. Request a new one." }); }
      try { await store.delete(key); } catch { /* consumed marker remains authoritative */ }
      const sessionToken = randomBytesImpl(32).toString("hex"); const expiresAt = new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString();
      await store.setJSON(`session/${hash(sessionToken)}.json`, { email: grant.email, emailHash: grant.emailHash, createdAt: now.toISOString(), expiresAt }, { onlyIfNew: true, cacheControl: null });
      return response(201, { ok: true, sessionToken, expiresAt });
    } catch (error) { console.error("Buyer workspace link redemption failed", error); return response(503, { ok: false, message: "The buyer workspace is temporarily unavailable." }); }
  }
  async function onRequestGet(context) {
    const sessionToken = bearer(context.request); if (!sessionToken) return response(401, { ok: false, message: "Request a new secure workspace link." });
    try {
      const accessStore = getStoreImpl("beiqiang-buyer-access"); const session = await accessStore.get(`session/${hash(sessionToken)}.json`, { type: "json", consistency: "strong" });
      if (!session?.email || Date.parse(session.expiresAt) <= nowImpl().getTime()) return response(401, { ok: false, message: "Your workspace session has expired. Request a new link." });
      const records = (await listRecords(getStoreImpl("beiqiang-inquiries"))).filter((record) => String(record.email || "").trim().toLowerCase() === session.email).filter((record) => record.status !== "spam").sort((a, b) => String(b.updatedAt || b.receivedAt || "").localeCompare(String(a.updatedAt || a.receivedAt || "")));
      return response(200, { ok: true, expiresAt: session.expiresAt, projects: records.map(summary) });
    } catch (error) { console.error("Buyer workspace read failed", error); return response(503, { ok: false, message: "The buyer workspace is temporarily unavailable." }); }
  }
  return { onRequestPost, onRequestGet };
}

const handlers = createBuyerWorkspaceSessionHandlers();
export const onRequestPost = handlers.onRequestPost;
export const onRequestGet = handlers.onRequestGet;
