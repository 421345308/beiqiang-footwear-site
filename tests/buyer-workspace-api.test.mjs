import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { createBuyerWorkspaceAccessHandler } from "../edgeone-deploy/cloud-functions/api/buyer-workspace-access.js";
import { createBuyerWorkspaceSessionHandlers, workspaceAction } from "../edgeone-deploy/cloud-functions/api/buyer-workspace-session.js";

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
});

test("buyer workspace access rejects an external browser origin", async () => {
  const handler = createBuyerWorkspaceAccessHandler({ getStoreImpl: () => storeFrom() });
  const result = await handler({ request: new Request("https://www.beiqiang.online/api/buyer-workspace-access", { method: "POST", headers: { Origin: "https://attacker.example" }, body: JSON.stringify({ email: "buyer@example.com" }) }), env: {} });
  assert.equal(result.status, 403);
});

test("one-time link creates an eight-hour session and cannot be redeemed twice", async () => {
  const token = "ab".repeat(32); const access = storeFrom({ [`magic/${hash(token)}.json`]: { email: "buyer@example.com", emailHash: hash("buyer@example.com"), createdAt: "2026-08-24T01:00:00.000Z", expiresAt: "2026-08-24T01:15:00.000Z" } }); const inquiries = storeFrom();
  const handlers = createBuyerWorkspaceSessionHandlers({ getStoreImpl: (name) => name === "beiqiang-buyer-access" ? access : inquiries, nowImpl: () => new Date("2026-08-24T01:05:00.000Z"), randomBytesImpl: () => Buffer.alloc(32, 9) }); const makeRequest = () => new Request("https://www.beiqiang.online/api/buyer-workspace-session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
  const first = await handlers.onRequestPost({ request: makeRequest() }); const body = await first.json(); const second = await handlers.onRequestPost({ request: makeRequest() });
  assert.equal(first.status, 201); assert.match(body.sessionToken, /^[a-f0-9]{64}$/); assert.equal(body.expiresAt, "2026-08-24T09:05:00.000Z"); assert.equal(second.status, 410);
});

test("workspace session returns only buyer-safe summaries for the exact email", async () => {
  const sessionToken = "cd".repeat(32); const access = storeFrom({ [`session/${hash(sessionToken)}.json`]: { email: "buyer@example.com", expiresAt: "2026-08-24T09:05:00.000Z" } }); const inquiries = storeFrom({ "inquiries/2026-08-20/BQ-20260820-ABCDEF12.json": { reference: "BQ-20260820-ABCDEF12", email: "buyer@example.com", receivedAt: "2026-08-20T01:00:00.000Z", updatedAt: "2026-08-23T01:00:00.000Z", status: "quoted", styleCode: "BQ009", quantity: "600 pairs", deliveryDestination: "Hamburg", buyerUpdate: "Quotation ready", nextAction: "Internal margin review must not leak", quotations: [{ status: "issued", quoteNumber: "BQ-Q1" }], accessTokenHash: "must-not-leak", internalNote: "private" }, "inquiries/2026-08-21/BQ-20260821-ABCDEF13.json": { reference: "BQ-20260821-ABCDEF13", email: "other@example.com", receivedAt: "2026-08-21T01:00:00.000Z", status: "new", styleCode: "BQ001" }, "inquiries/2026-08-22/BQ-20260822-ABCDEF14.json": { reference: "BQ-20260822-ABCDEF14", email: "buyer@example.com", receivedAt: "2026-08-22T01:00:00.000Z", status: "spam", styleCode: "BQ002" } });
  const handlers = createBuyerWorkspaceSessionHandlers({ getStoreImpl: (name) => name === "beiqiang-buyer-access" ? access : inquiries, nowImpl: () => new Date("2026-08-24T01:10:00.000Z") }); const result = await handlers.onRequestGet({ request: new Request("https://www.beiqiang.online/api/buyer-workspace-session", { headers: { Authorization: `Bearer ${sessionToken}` } }) }); const body = await result.json();
  assert.equal(result.status, 200); assert.equal(body.projects.length, 1); assert.equal(body.projects[0].reference, "BQ-20260820-ABCDEF12"); assert.equal(body.projects[0].hasIssuedQuotation, true); assert.equal(body.projects[0].action.kind, "buyer_action"); assert.match(body.projects[0].action.title, /BQ-Q1/); assert.equal(JSON.stringify(body).includes("must-not-leak"), false); assert.equal(JSON.stringify(body).includes("private"), false); assert.equal(JSON.stringify(body).includes("Internal margin"), false);
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
