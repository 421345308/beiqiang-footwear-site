import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { createBuyerWorkspaceAccessHandler } from "../edgeone-deploy/cloud-functions/api/buyer-workspace-access.js";
import { createBuyerWorkspaceSessionHandlers, workspaceAction, workspaceSummary } from "../edgeone-deploy/cloud-functions/api/buyer-workspace-session.js";

function hash(value) { return createHash("sha256").update(value).digest("hex"); }
function storeFrom(entries = {}) {
  const values = new Map(Object.entries(entries));
  return { values, get: async (key) => structuredClone(values.get(key) || null), setJSON: async (key, value, options = {}) => { if (options.onlyIfNew && values.has(key)) throw new Error("exists"); values.set(key, structuredClone(value)); }, delete: async (key) => { values.delete(key); }, list: async ({ prefix }) => ({ blobs: [...values.keys()].filter((key) => key.startsWith(prefix)).map((key) => ({ key })) }) };
}

test("buyer workspace access uses a generic response and emails only a matching inquiry address", async () => {
  const access = storeFrom(); const inquiries = storeFrom({ "inquiries/2026-08-20/BQ-20260820-ABCDEF12.json": { reference: "BQ-20260820-ABCDEF12", email: "buyer@example.com" } }); const mails = [];
  const handler = createBuyerWorkspaceAccessHandler({ getStoreImpl: (name) => name === "beiqiang-buyer-access" ? access : inquiries, createTransportImpl: () => ({ sendMail: async (mail) => mails.push(mail) }), nowImpl: () => new Date("2026-08-24T01:00:00.000Z"), randomBytesImpl: () => Buffer.alloc(32, 7) });
  const matching = await handler({ request: new Request("https://www.beiqiang.online/api/buyer-workspace-access", { method: "POST", body: JSON.stringify({ email: " Buyer@Example.com " }) }), env: { SMTP_PASS: "configured" } }); const matchingBody = await matching.json();
  const unknown = await handler({ request: new Request("https://www.beiqiang.online/api/buyer-workspace-access", { method: "POST", body: JSON.stringify({ email: "unknown@example.com" }) }), env: { SMTP_PASS: "configured" } }); const unknownBody = await unknown.json();
  assert.equal(matching.status, 202); assert.equal(unknown.status, 202); assert.equal(matchingBody.message, unknownBody.message); assert.equal(mails.length, 1); assert.match(mails[0].text, /buyer-workspace\/\?token=[a-f0-9]{64}/); assert.match(mails[0].text, /expires in 15 minutes/i);
  const activity = [...access.values.entries()].filter(([key]) => key.startsWith("activity/")).map(([, value]) => value); assert.deepEqual(activity.map((item) => item.outcome).sort(), ["sent", "unknown"]); assert.equal(JSON.stringify(activity).includes("buyer@example.com"), false); assert.equal(JSON.stringify(activity).includes("unknown@example.com"), false);
});

test("buyer workspace access rejects an external browser origin", async () => {
  const handler = createBuyerWorkspaceAccessHandler({ getStoreImpl: () => storeFrom() });
  const result = await handler({ request: new Request("https://www.beiqiang.online/api/buyer-workspace-access", { method: "POST", headers: { Origin: "https://attacker.example" }, body: JSON.stringify({ email: "buyer@example.com" }) }), env: {} });
  assert.equal(result.status, 403);
});

test("an explicitly active delegated contact can request a workspace link", async () => {
  const access = storeFrom(); const inquiries = storeFrom({ "inquiries/2026-08-20/BQ-20260820-ABCDEF12.json": { reference: "BQ-20260820-ABCDEF12", email: "primary@example.com", workspaceContacts: [{ email: "delegate@example.com", status: "active" }] } }); const mails = [];
  const handler = createBuyerWorkspaceAccessHandler({ getStoreImpl: (name) => name === "beiqiang-buyer-access" ? access : inquiries, createTransportImpl: () => ({ sendMail: async (mail) => mails.push(mail) }), nowImpl: () => new Date("2026-08-24T01:00:00.000Z"), randomBytesImpl: () => Buffer.alloc(32, 8) });
  const result = await handler({ request: new Request("https://www.beiqiang.online/api/buyer-workspace-access", { method: "POST", body: JSON.stringify({ email: "Delegate@Example.com" }) }), env: { SMTP_PASS: "configured" } });
  assert.equal(result.status, 202); assert.equal(mails.length, 1); assert.equal(mails[0].to, "delegate@example.com");
});

test("one-time link creates an eight-hour session and cannot be redeemed twice", async () => {
  const token = "ab".repeat(32); const access = storeFrom({ [`magic/${hash(token)}.json`]: { email: "buyer@example.com", emailHash: hash("buyer@example.com"), createdAt: "2026-08-24T01:00:00.000Z", expiresAt: "2026-08-24T01:15:00.000Z" } }); const inquiries = storeFrom();
  const handlers = createBuyerWorkspaceSessionHandlers({ getStoreImpl: (name) => name === "beiqiang-buyer-access" ? access : inquiries, nowImpl: () => new Date("2026-08-24T01:05:00.000Z"), randomBytesImpl: () => Buffer.alloc(32, 9) }); const makeRequest = () => new Request("https://www.beiqiang.online/api/buyer-workspace-session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
  const first = await handlers.onRequestPost({ request: makeRequest() }); const body = await first.json(); const second = await handlers.onRequestPost({ request: makeRequest() });
  assert.equal(first.status, 201); assert.match(body.sessionToken, /^[a-f0-9]{64}$/); assert.equal(body.expiresAt, "2026-08-24T09:05:00.000Z"); assert.equal(second.status, 410); assert.equal([...access.values.values()].some((item) => item.event === "workspace_link_redeemed" && item.outcome === "success"), true);
});

test("workspace session returns only buyer-safe summaries for the exact email", async () => {
  const sessionToken = "cd".repeat(32); const access = storeFrom({ [`session/${hash(sessionToken)}.json`]: { email: "buyer@example.com", emailHash: hash("buyer@example.com"), expiresAt: "2026-08-24T09:05:00.000Z" } }); const inquiries = storeFrom({ "inquiries/2026-08-20/BQ-20260820-ABCDEF12.json": { reference: "BQ-20260820-ABCDEF12", email: "buyer@example.com", receivedAt: "2026-08-20T01:00:00.000Z", updatedAt: "2026-08-23T01:00:00.000Z", status: "quoted", styleCode: "BQ009", quantity: "600 pairs", deliveryDestination: "Hamburg", buyerUpdate: "Quotation ready", nextAction: "Internal margin review must not leak", quotations: [{ status: "issued", quoteNumber: "BQ-Q1" }], accessTokenHash: "must-not-leak", internalNote: "private" }, "inquiries/2026-08-21/BQ-20260821-ABCDEF13.json": { reference: "BQ-20260821-ABCDEF13", email: "other@example.com", receivedAt: "2026-08-21T01:00:00.000Z", status: "new", styleCode: "BQ001" }, "inquiries/2026-08-22/BQ-20260822-ABCDEF14.json": { reference: "BQ-20260822-ABCDEF14", email: "buyer@example.com", receivedAt: "2026-08-22T01:00:00.000Z", status: "spam", styleCode: "BQ002" } });
  const handlers = createBuyerWorkspaceSessionHandlers({ getStoreImpl: (name) => name === "beiqiang-buyer-access" ? access : inquiries, nowImpl: () => new Date("2026-08-24T01:10:00.000Z") }); const result = await handlers.onRequestGet({ request: new Request("https://www.beiqiang.online/api/buyer-workspace-session", { headers: { Authorization: `Bearer ${sessionToken}` } }) }); const body = await result.json();
  assert.equal(result.status, 200); assert.equal(body.projects.length, 1); assert.equal(body.projects[0].reference, "BQ-20260820-ABCDEF12"); assert.equal(body.projects[0].hasIssuedQuotation, true); assert.equal(body.projects[0].action.kind, "buyer_action"); assert.match(body.projects[0].action.title, /BQ-Q1/); assert.equal(body.projects[0].items[0].code, "BQ009"); assert.equal(body.projects[0].quotation.quoteNumber, "BQ-Q1"); assert.equal(JSON.stringify(body).includes("must-not-leak"), false); assert.equal(JSON.stringify(body).includes("private"), false); assert.equal(JSON.stringify(body).includes("Internal margin"), false); assert.equal([...access.values.values()].some((item) => item.event === "workspace_loaded" && item.projectCount === 1), true);
});

test("delegated project access is project-specific and revocation affects an existing session immediately", async () => {
  const sessionToken = "12".repeat(32); const access = storeFrom({ [`session/${hash(sessionToken)}.json`]: { email: "delegate@example.com", expiresAt: "2026-08-24T09:05:00.000Z" } });
  const delegatedKey = "inquiries/2026-08-20/BQ-20260820-ABCDEF12.json"; const otherKey = "inquiries/2026-08-21/BQ-20260821-ABCDEF13.json"; const inquiries = storeFrom({ [delegatedKey]: { reference: "BQ-20260820-ABCDEF12", email: "primary@example.com", receivedAt: "2026-08-20T01:00:00.000Z", status: "qualified", styleCode: "BQ001", workspaceContacts: [{ id: "BWC-1", email: "delegate@example.com", status: "active" }] }, [otherKey]: { reference: "BQ-20260821-ABCDEF13", email: "other@example.com", receivedAt: "2026-08-21T01:00:00.000Z", status: "qualified", styleCode: "BQ002", company: "Same Buyer Co" } });
  const handlers = createBuyerWorkspaceSessionHandlers({ getStoreImpl: (name) => name === "beiqiang-buyer-access" ? access : inquiries, nowImpl: () => new Date("2026-08-24T01:10:00.000Z") }); const request = () => new Request("https://www.beiqiang.online/api/buyer-workspace-session", { headers: { Authorization: `Bearer ${sessionToken}` } });
  const before = await handlers.onRequestGet({ request: request() }); const beforeBody = await before.json(); assert.deepEqual(beforeBody.projects.map((item) => item.reference), ["BQ-20260820-ABCDEF12"]);
  const delegated = await inquiries.get(delegatedKey); delegated.workspaceContacts[0].status = "revoked"; await inquiries.setJSON(delegatedKey, delegated);
  const after = await handlers.onRequestGet({ request: request() }); const afterBody = await after.json(); assert.deepEqual(afterBody.projects, []);
});

test("a revoked primary inquiry email no longer returns that project", async () => {
  const sessionToken = "34".repeat(32); const access = storeFrom({ [`session/${hash(sessionToken)}.json`]: { email: "primary@example.com", expiresAt: "2026-08-24T09:05:00.000Z" } }); const inquiries = storeFrom({ "inquiries/2026-08-20/BQ-20260820-ABCDEF12.json": { reference: "BQ-20260820-ABCDEF12", email: "primary@example.com", receivedAt: "2026-08-20T01:00:00.000Z", status: "qualified", styleCode: "BQ001", workspacePrimaryAccess: { status: "revoked" } } });
  const handlers = createBuyerWorkspaceSessionHandlers({ getStoreImpl: (name) => name === "beiqiang-buyer-access" ? access : inquiries, nowImpl: () => new Date("2026-08-24T01:10:00.000Z") }); const result = await handlers.onRequestGet({ request: new Request("https://www.beiqiang.online/api/buyer-workspace-session", { headers: { Authorization: `Bearer ${sessionToken}` } }) }); const body = await result.json();
  assert.equal(result.status, 200); assert.deepEqual(body.projects, []);
});

test("workspace summary exposes a useful whitelist while withholding sensitive project details", () => {
  const result = workspaceSummary({
    reference: "BQ-20260820-ABCDEF12", receivedAt: "2026-08-20T01:00:00.000Z", updatedAt: "2026-08-23T01:00:00.000Z", status: "order_confirmed",
    styleCode: "BQ001", styleLabel: "Breathable knit walking shoe", bulkQuantity: "600 pairs", preferredTradeTerm: "fob", deliveryDestination: "Hamburg", deliveryTiming: "October 2026",
    items: [{ code: "BQ001", name: "Breathable knit walking shoe", quantity: "400 pairs", colors: "Black / Grey", sizes: "EU 36-46", notes: "SECRET-ITEM-NOTE" }, { code: "BQ009", name: "Stretch textile slip-on", quantity: "200 pairs", colors: "Navy", sizes: "EU 39-46" }],
    quotations: [{ quoteNumber: "BQ-Q1", version: 2, status: "buyer_accepted", currency: "USD", tradeTerm: "FOB Xiamen", validUntil: "2026-09-10", lines: [{ unitPrice: "SECRET-PRICE-9.80" }], paymentTerms: "SECRET-PAYMENT-TERM" }],
    sampleProgram: { status: "buyer_review", sampleReference: "SAMPLE-2", styleCodes: "BQ001, BQ009", quantity: 2, updatedAt: "2026-08-22T01:00:00.000Z", trackingNumber: "SECRET-SAMPLE-TRACKING", acceptanceCriteria: "SECRET-CRITERIA" },
    orderHandoff: { method: "alibaba_trade_assurance", orderReference: "TA-123", fulfillmentStatus: "production", confirmedAt: "2026-08-21T01:00:00.000Z", orderUrl: "SECRET-ORDER-URL", trackingNumber: "SECRET-ORDER-TRACKING", paymentMilestones: [{ amount: "SECRET-AMOUNT" }] },
    recommendationSets: [{ id: "REC-1", status: "buyer_shortlisted", items: [{ code: "BQ001", reason: "SECRET-REASON" }], selectedCodes: ["BQ009"], introduction: "SECRET-INTRO" }],
    attachments: [{ id: "A1", name: "SECRET-FILE-NAME" }, { id: "A2", revokedAt: "2026-08-23" }], orderDocuments: [{ id: "D1", name: "SECRET-DOCUMENT-NAME" }], messages: [{ body: "SECRET-MESSAGE-BODY" }],
    buyerUpdate: "Production status shared with buyer.", nextAction: "SECRET-INTERNAL-NEXT-ACTION", internalNote: "SECRET-INTERNAL-NOTE", accessTokenHash: "SECRET-TOKEN-HASH",
  });
  assert.deepEqual(result.items, [{ code: "BQ001", name: "Breathable knit walking shoe", quantity: "400 pairs", colors: "Black / Grey", sizes: "EU 36-46" }, { code: "BQ009", name: "Stretch textile slip-on", quantity: "200 pairs", colors: "Navy", sizes: "EU 39-46" }]);
  assert.deepEqual(result.quotation, { quoteNumber: "BQ-Q1", version: "2", status: "Accepted on website", validUntil: "2026-09-10", currency: "USD", tradeTerm: "FOB Xiamen" });
  assert.deepEqual(result.sample, { reference: "SAMPLE-2", status: "Ready for buyer review", styleCodes: ["BQ001", "BQ009"], quantity: "2", updatedAt: "2026-08-22T01:00:00.000Z" });
  assert.deepEqual(result.order, { reference: "TA-123", method: "Alibaba Trade Assurance", status: "In production", confirmedAt: "2026-08-21T01:00:00.000Z" });
  assert.deepEqual(result.activity, { buyerFiles: 1, sharedDocuments: 1, messages: 1 });
  assert.deepEqual(Object.keys(result).sort(), ["action", "activity", "buyerUpdate", "deliveryTiming", "destination", "hasIssuedQuotation", "hasOpenRepeatProject", "hasOrder", "items", "order", "quantity", "quotation", "receivedAt", "recommendation", "reference", "sample", "status", "styleCodes", "styleLabel", "tradeTerm", "updatedAt"].sort());
  const serialized = JSON.stringify(result);
  for (const secret of ["SECRET-ITEM-NOTE", "SECRET-PRICE", "SECRET-PAYMENT", "SECRET-SAMPLE-TRACKING", "SECRET-CRITERIA", "SECRET-ORDER-URL", "SECRET-ORDER-TRACKING", "SECRET-AMOUNT", "SECRET-REASON", "SECRET-INTRO", "SECRET-FILE-NAME", "SECRET-DOCUMENT-NAME", "SECRET-MESSAGE-BODY", "SECRET-INTERNAL-NEXT-ACTION", "SECRET-INTERNAL-NOTE", "SECRET-TOKEN-HASH"]) assert.equal(serialized.includes(secret), false, `${secret} must not be exposed`);
});

test("workspace action priority separates buyer decisions, Beiqiang review, formal orders and closed projects", () => {
  const orderChange = workspaceAction({ orderChangeRequests: [{ id: "OCR-1", status: "awaiting_buyer" }], orderHandoff: { orderReference: "TA-1" } }, "order_confirmed");
  const review = workspaceAction({ quotations: [{ status: "buyer_revision_requested", quoteNumber: "Q1" }] }, "commercial_discussion");
  const order = workspaceAction({ orderHandoff: { orderReference: "TA-1", fulfillmentStatus: "production" }, quotations: [{ status: "issued", quoteNumber: "OLD-Q1" }] }, "order_confirmed");
  const closed = workspaceAction({}, "closed");
  assert.equal(orderChange.kind, "buyer_action"); assert.equal(orderChange.rank, 0); assert.match(orderChange.title, /OCR-1/);
  assert.equal(review.kind, "beiqiang_review"); assert.match(review.summary, /checking feasibility/i);
  assert.equal(order.kind, "formal_order"); assert.match(order.summary, /Trade Assurance order or signed contract/i);
  assert.equal(closed.kind, "closed"); assert.equal(closed.rank, 4);
});

test("workspace action prioritizes delivery and sample decisions before general progress", () => {
  const delivery = workspaceAction({ orderHandoff: { orderReference: "TA-1", fulfillmentStatus: "shipped" } }, "order_confirmed");
  const sample = workspaceAction({ sampleProgram: { status: "buyer_review" }, quotations: [{ status: "issued", quoteNumber: "Q1" }] }, "sample_discussion");
  const repeat = workspaceAction({ repeatOrderOpportunities: [{ id: "ROP-1", status: "qualified" }] }, "commercial_discussion");
  assert.equal(delivery.anchor, "delivery-feedback"); assert.equal(sample.anchor, "sample-review"); assert.equal(repeat.kind, "beiqiang_review");
});

test("expired or missing workspace sessions are rejected", async () => {
  const sessionToken = "ef".repeat(32); const access = storeFrom({ [`session/${hash(sessionToken)}.json`]: { email: "buyer@example.com", expiresAt: "2026-08-24T01:00:00.000Z" } }); const inquiries = storeFrom(); const handlers = createBuyerWorkspaceSessionHandlers({ getStoreImpl: (name) => name === "beiqiang-buyer-access" ? access : inquiries, nowImpl: () => new Date("2026-08-24T01:10:00.000Z") });
  assert.equal((await handlers.onRequestGet({ request: new Request("https://www.beiqiang.online/api/buyer-workspace-session") })).status, 401); assert.equal((await handlers.onRequestGet({ request: new Request("https://www.beiqiang.online/api/buyer-workspace-session", { headers: { Authorization: `Bearer ${sessionToken}` } }) })).status, 401);
});
