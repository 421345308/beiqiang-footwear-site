import { randomUUID } from "node:crypto";

export const WORKSPACE_ACTIVITY_EVENTS = new Set([
  "workspace_access_request",
  "workspace_link_redeemed",
  "workspace_loaded",
  "workspace_project_open",
  "workspace_private_project_open",
  "workspace_closed",
]);

function clean(value, max = 80) { return typeof value === "string" ? value.trim().replace(/\0/g, "").slice(0, max) : ""; }

export function isWorkspaceInternalTest(record) {
  const text = `${record?.name || ""} ${record?.company || ""} ${record?.requirements || ""} ${record?.quantity || ""}`.toLowerCase();
  return /internal|deployment test|smtp test|test only|\b0\s*pairs?\b/.test(text);
}

export async function recordWorkspaceActivity(store, event, details = {}, { now = new Date(), randomUUIDImpl = randomUUID } = {}) {
  if (!store || !WORKSPACE_ACTIVITY_EVENTS.has(event)) return false;
  const occurredAt = now.toISOString();
  const record = {
    event,
    occurredAt,
    emailHash: /^[a-f0-9]{64}$/i.test(details.emailHash || "") ? String(details.emailHash).toLowerCase() : "",
    outcome: clean(details.outcome, 40),
    reference: /^BQ-[A-Z0-9-]{8,50}$/i.test(details.reference || "") ? String(details.reference).toUpperCase() : "",
    projectCount: Math.max(0, Math.min(5000, Number(details.projectCount) || 0)),
    accessKind: ["primary", "delegated", "mixed"].includes(details.accessKind) ? details.accessKind : "",
    analyticsExcluded: details.analyticsExcluded === true,
  };
  await store.setJSON(`activity/${occurredAt.slice(0, 10)}/${occurredAt.slice(11, 13)}/${randomUUIDImpl()}.json`, record, { onlyIfNew: true, cacheControl: null });
  return true;
}

export async function safeRecordWorkspaceActivity(...args) {
  try { return await recordWorkspaceActivity(...args); } catch (error) { console.error("Buyer workspace activity persistence failed", error); return false; }
}
