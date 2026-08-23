import { createHash } from "node:crypto";
import { getStore } from "@edgeone/pages-blob";
import { workspaceContactCanRead } from "../_lib/workspace-access-policy.js";
import { safeRecordWorkspaceActivity } from "../_lib/workspace-activity.js";

const EVENT_MAP = { project_open: "workspace_project_open", private_project_open: "workspace_private_project_open", workspace_closed: "workspace_closed" };
function response(status, body = null) { return new Response(body ? JSON.stringify(body) : null, { status, headers: { "Content-Type": "application/json; charset=UTF-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } }); }
function hash(value) { return createHash("sha256").update(value).digest("hex"); }
function bearer(request) { const match = /^Bearer\s+([a-f0-9]{64})$/i.exec(request.headers.get("authorization") || ""); return match?.[1] || ""; }
function allowedOrigin(origin) { if (!origin) return true; try { const url = new URL(origin); return url.protocol === "https:" && (url.hostname === "www.beiqiang.online" || url.hostname === "beiqiang.online" || /^beiqiang-footwear-[a-z0-9]+\.edgeone\.dev$/.test(url.hostname)); } catch { return false; } }
async function findInquiry(store, reference) { let cursor; do { const result = await store.list({ prefix: "inquiries/", limit: 500, cursor, consistency: "strong" }); const blobs = Array.isArray(result?.blobs) ? result.blobs : []; for (const blob of blobs) { if (!blob.key.endsWith(`/${reference}.json`)) continue; return store.get(blob.key, { type: "json", consistency: "strong" }); } cursor = result?.cursor; if (!blobs.length) break; } while (cursor); return null; }

export function createBuyerWorkspaceActivityHandler({ getStoreImpl = getStore, nowImpl = () => new Date(), recordActivityImpl = safeRecordWorkspaceActivity } = {}) {
  return async function onRequestPost(context) {
    if (!allowedOrigin(context.request.headers.get("origin"))) return response(403, { ok: false });
    const sessionToken = bearer(context.request); if (!sessionToken) return response(401, { ok: false });
    let payload; try { payload = await context.request.json(); } catch { return response(400, { ok: false }); }
    const event = EVENT_MAP[payload?.event]; if (!event) return response(400, { ok: false });
    const reference = typeof payload?.reference === "string" ? payload.reference.trim().toUpperCase() : "";
    if (event !== "workspace_closed" && !/^BQ-[A-Z0-9-]{8,50}$/.test(reference)) return response(400, { ok: false });
    try {
      const accessStore = getStoreImpl("beiqiang-buyer-access"); const session = await accessStore.get(`session/${hash(sessionToken)}.json`, { type: "json", consistency: "strong" });
      if (!session?.email || Date.parse(session.expiresAt) <= nowImpl().getTime()) return response(401, { ok: false });
      if (reference) { const record = await findInquiry(getStoreImpl("beiqiang-inquiries"), reference); if (!record || !workspaceContactCanRead(record, session.email)) return response(403, { ok: false }); }
      const dedupeKey = `activity-dedupe/${hash(sessionToken)}/${event}/${reference || "workspace"}.json`;
      try { await accessStore.setJSON(dedupeKey, { recordedAt: nowImpl().toISOString() }, { onlyIfNew: true, cacheControl: null }); } catch { return response(202); }
      await recordActivityImpl(accessStore, event, { emailHash: session.emailHash, reference, analyticsExcluded: session.analyticsExcluded }, { now: nowImpl() });
      return response(202);
    } catch (error) { console.error("Buyer workspace activity failed", error); return response(503, { ok: false }); }
  };
}

export const onRequestPost = createBuyerWorkspaceActivityHandler();
