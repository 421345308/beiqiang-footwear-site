import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { createAdminRecommendationHandler } from "../edgeone-deploy/cloud-functions/api/admin/recommendation.js";
import { createRecommendationResponseHandler } from "../edgeone-deploy/cloud-functions/api/recommendation-response.js";

const reference = "BQ-20260823-ABCDEF12";
const receivedAt = "2026-08-23T08:00:00.000Z";
const accessCode = "0123456789ABCDEF0123";
const baseRecord = { reference, receivedAt, status: "qualified", company: "Buyer Co", name: "Jane", email: "jane@example.com", owner: "Sales A", accessTokenHash: createHash("sha256").update(accessCode).digest("hex"), recommendationSets: [] };

function adminRequest(overrides = {}) {
  return new Request("https://www.beiqiang.online/api/admin/recommendation", { method: "POST", headers: { Authorization: "Bearer correct", "Content-Type": "application/json" }, body: JSON.stringify({ reference, receivedAt, title: "Three product directions for your market", introduction: "These products match the stated channel and product direction for initial review.", nextStep: "Choose one or two styles and confirm quantity, colors and size ratio.", items: [{ code: "BQ001", reason: "Verified wide-toe product direction for comfort-focused buyers." }, { code: "BQ009", reason: "Athletic mesh direction with a distinct thick-sole silhouette." }], ...overrides }) });
}

test("requires the admin token before issuing a product shortlist", async () => {
  let reads = 0;
  const handler = createAdminRecommendationHandler({ getStoreImpl: () => ({ get: async () => { reads += 1; return baseRecord; } }) });
  const request = new Request("https://www.beiqiang.online/api/admin/recommendation", { method: "POST", headers: { Authorization: "Bearer wrong", "Content-Type": "application/json" }, body: "{}" });
  const result = await handler({ request, env: { INQUIRY_ADMIN_TOKEN: "correct" } });
  assert.equal(result.status, 401); assert.equal(reads, 0);
});

test("rejects duplicate or unknown styles before reading buyer data", async () => {
  let reads = 0;
  const handler = createAdminRecommendationHandler({ getStoreImpl: () => ({ get: async () => { reads += 1; return baseRecord; } }) });
  const result = await handler({ request: adminRequest({ items: [{ code: "BQ001", reason: "First valid reason." }, { code: "BQ001", reason: "Duplicate valid reason." }] }), env: { INQUIRY_ADMIN_TOKEN: "correct" } });
  assert.equal(result.status, 400); assert.equal(reads, 0);
});

test("saves an immutable shortlist before emailing the buyer", async () => {
  let saved; let savedBeforeEmail = false; const mails = [];
  const old = { id: "REC-111111111111", title: "Old", items: [], status: "issued", issuedAt: "2026-08-22T00:00:00.000Z" };
  const handler = createAdminRecommendationHandler({ getStoreImpl: () => ({ get: async () => ({ ...baseRecord, recommendationSets: [old] }), setJSON: async (key, value) => { saved = structuredClone(value); } }), createTransportImpl: () => ({ sendMail: async (mail) => { savedBeforeEmail = Boolean(saved?.recommendationSets?.at(-1)); mails.push(mail); } }) });
  const result = await handler({ request: adminRequest(), env: { INQUIRY_ADMIN_TOKEN: "correct", SMTP_PASS: "test" } }); const body = await result.json();
  assert.equal(result.status, 201); assert.equal(savedBeforeEmail, true); assert.equal(saved.recommendationSets[0].status, "superseded"); assert.equal(saved.recommendationSets.at(-1).items.length, 2); assert.deepEqual(saved.recommendationSets.at(-1).followUps, []); assert.equal(saved.recommendationSets.at(-1).notificationSent, true); assert.equal(body.record.accessTokenHash, undefined); assert.equal(mails.length, 1); assert.match(mails[0].text, /not a quotation/i);
});

function buyerRequest(overrides = {}) {
  return new Request("https://www.beiqiang.online/api/recommendation-response", { method: "POST", headers: { Origin: "https://www.beiqiang.online", "Content-Type": "application/json" }, body: JSON.stringify({ reference, accessCode, recommendationId: "REC-ABCDEF012345", decision: "shortlist", selectedCodes: ["BQ001"], note: "Please quote this option.", ...overrides }) });
}

test("records a buyer shortlist response before notifying sales", async () => {
  let saved; let savedBeforeEmail = false;
  const recommendation = { id: "REC-ABCDEF012345", title: "Two options", items: [{ code: "BQ001", reason: "Reason one" }, { code: "BQ009", reason: "Reason two" }], status: "issued", issuedAt: receivedAt };
  const handler = createRecommendationResponseHandler({ getStoreImpl: () => ({ get: async () => ({ ...baseRecord, recommendationSets: [recommendation] }), setJSON: async (key, value) => { saved = structuredClone(value); } }), createTransportImpl: () => ({ sendMail: async () => { savedBeforeEmail = saved?.recommendationSets?.[0]?.status === "buyer_shortlisted"; } }) });
  const result = await handler({ request: buyerRequest(), env: { SMTP_PASS: "test" } }); const body = await result.json();
  assert.equal(result.status, 201); assert.equal(savedBeforeEmail, true); assert.deepEqual(saved.recommendationSets[0].selectedCodes, ["BQ001"]); assert.equal(saved.recommendationSets[0].responseNotificationSent, true); assert.match(saved.nextAction, /BQ001 quantities, colors, size ratio and sample direction/i); assert.equal(saved.nextActionDue, saved.updatedAt.slice(0, 10)); assert.match(body.message, /selected product directions/i);
});

test("blocks products outside the issued recommendation and duplicate responses", async () => {
  let writes = 0; const recommendation = { id: "REC-ABCDEF012345", title: "Two options", items: [{ code: "BQ001", reason: "Reason one" }, { code: "BQ009", reason: "Reason two" }], status: "issued", issuedAt: receivedAt };
  const handler = createRecommendationResponseHandler({ getStoreImpl: () => ({ get: async () => ({ ...baseRecord, recommendationSets: [recommendation] }), setJSON: async () => { writes += 1; } }) });
  const invalid = await handler({ request: buyerRequest({ selectedCodes: ["BQ030"] }), env: {} });
  assert.equal(invalid.status, 400); assert.equal(writes, 0);
  const respondedHandler = createRecommendationResponseHandler({ getStoreImpl: () => ({ get: async () => ({ ...baseRecord, recommendationSets: [{ ...recommendation, status: "buyer_shortlisted", buyerRespondedAt: receivedAt }] }), setJSON: async () => { writes += 1; } }) });
  const duplicate = await respondedHandler({ request: buyerRequest(), env: {} });
  assert.equal(duplicate.status, 409); assert.equal(writes, 0);
});
