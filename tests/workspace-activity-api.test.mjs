import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { createBuyerWorkspaceActivityHandler } from "../edgeone-deploy/cloud-functions/api/buyer-workspace-activity.js";
import { recordWorkspaceActivity } from "../edgeone-deploy/cloud-functions/_lib/workspace-activity.js";

function hash(value) { return createHash("sha256").update(value).digest("hex"); }
function storeFrom(entries = {}) {
  const values = new Map(Object.entries(entries));
  return { values, get: async (key) => structuredClone(values.get(key) || null), setJSON: async (key, value, options = {}) => { if (options.onlyIfNew && values.has(key)) throw new Error("exists"); values.set(key, structuredClone(value)); }, list: async ({ prefix }) => ({ blobs: [...values.keys()].filter((key) => key.startsWith(prefix)).map((key) => ({ key })) }) };
}

test("workspace activity stores only bounded operational fields", async () => {
  const store = storeFrom(); await recordWorkspaceActivity(store, "workspace_project_open", { emailHash: hash("buyer@example.com"), reference: "bq-20260824-abcdef12", outcome: "success", projectCount: 99999, accessKind: "delegated", email: "buyer@example.com", token: "must-not-store" }, { now: new Date("2026-08-24T02:00:00.000Z"), randomUUIDImpl: () => "ACTIVITY-1" });
  const [record] = [...store.values.values()]; assert.deepEqual(Object.keys(record).sort(), ["accessKind", "analyticsExcluded", "emailHash", "event", "occurredAt", "outcome", "projectCount", "reference"].sort()); assert.equal(record.reference, "BQ-20260824-ABCDEF12"); assert.equal(record.projectCount, 5000); assert.equal(JSON.stringify(record).includes("buyer@example.com"), false); assert.equal(JSON.stringify(record).includes("must-not-store"), false);
});

test("workspace activity endpoint requires a valid session before reading inquiries", async () => {
  let reads = 0; const handler = createBuyerWorkspaceActivityHandler({ getStoreImpl: () => { reads += 1; return storeFrom(); } });
  const result = await handler({ request: new Request("https://www.beiqiang.online/api/buyer-workspace-activity", { method: "POST", body: JSON.stringify({ event: "project_open", reference: "BQ-20260824-ABCDEF12" }) }) });
  assert.equal(result.status, 401); assert.equal(reads, 0);
});

test("workspace activity records an authorized project without exposing session or email", async () => {
  const sessionToken = "ab".repeat(32); const email = "delegate@example.com"; const access = storeFrom({ [`session/${hash(sessionToken)}.json`]: { email, emailHash: hash(email), expiresAt: "2026-08-24T10:00:00.000Z" } }); const inquiries = storeFrom({ "inquiries/2026-08-24/BQ-20260824-ABCDEF12.json": { reference: "BQ-20260824-ABCDEF12", email: "primary@example.com", workspaceContacts: [{ email, status: "active" }] } });
  const handler = createBuyerWorkspaceActivityHandler({ getStoreImpl: (name) => name === "beiqiang-buyer-access" ? access : inquiries, nowImpl: () => new Date("2026-08-24T02:00:00.000Z") });
  const request = () => new Request("https://www.beiqiang.online/api/buyer-workspace-activity", { method: "POST", headers: { Authorization: `Bearer ${sessionToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ event: "project_open", reference: "BQ-20260824-ABCDEF12", email, token: sessionToken }) });
  const result = await handler({ request: request() }); const duplicate = await handler({ request: request() });
  const activities = [...access.values.entries()].filter(([key]) => key.startsWith("activity/")); const activity = activities[0]?.[1]; assert.equal(result.status, 202); assert.equal(duplicate.status, 202); assert.equal(activities.length, 1); assert.equal(activity.event, "workspace_project_open"); assert.equal(activity.reference, "BQ-20260824-ABCDEF12"); assert.equal(JSON.stringify(activity).includes(email), false); assert.equal(JSON.stringify(activity).includes(sessionToken), false);
});

test("workspace activity rejects a project the session cannot read", async () => {
  const sessionToken = "cd".repeat(32); const access = storeFrom({ [`session/${hash(sessionToken)}.json`]: { email: "buyer@example.com", emailHash: hash("buyer@example.com"), expiresAt: "2026-08-24T10:00:00.000Z" } }); const inquiries = storeFrom({ "inquiries/2026-08-24/BQ-20260824-ABCDEF12.json": { reference: "BQ-20260824-ABCDEF12", email: "other@example.com" } });
  const handler = createBuyerWorkspaceActivityHandler({ getStoreImpl: (name) => name === "beiqiang-buyer-access" ? access : inquiries, nowImpl: () => new Date("2026-08-24T02:00:00.000Z") }); const result = await handler({ request: new Request("https://www.beiqiang.online/api/buyer-workspace-activity", { method: "POST", headers: { Authorization: `Bearer ${sessionToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ event: "private_project_open", reference: "BQ-20260824-ABCDEF12" }) }) });
  assert.equal(result.status, 403); assert.equal([...access.values.keys()].some((key) => key.startsWith("activity/")), false);
});
