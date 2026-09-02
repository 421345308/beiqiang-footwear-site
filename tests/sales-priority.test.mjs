import assert from "node:assert/strict";
import test from "node:test";
import { buildBuyerReplyDraft, buildSalesTask } from "../app/lib/sales-priority.ts";

const baseRecord = (overrides = {}) => ({ reference: "BQ-2026-0001", receivedAt: "2026-08-26T10:00:00.000Z", status: "qualified", name: "Maria", company: "North Star Imports", buyerType: "Importer", market: "United States", styleCode: "BQ001", quantity: "500 pairs", nextActionDue: "2026-09-01", ...overrides });
const ready = { score: 90, level: "ready", missing: [] };
const now = new Date("2026-08-27T08:00:00.000Z");

test("buyer message is the first internal action even when a quote is issued", () => {
  const task = buildSalesTask(baseRecord({ messages: [{ sender: "buyer", sentAt: "2026-08-27T07:00:00.000Z", body: "Please confirm." }], quotations: [{ quoteNumber: "BQ-Q-1", status: "issued" }] }), ready, now);
  assert.equal(task.kind, "buyer_message"); assert.equal(task.score, 100); assert.equal(task.lane, "internal");
});

test("submitted order setup is critical internal work", () => {
  const task = buildSalesTask(baseRecord({ buyerOrderRequests: [{ id: "BOR-1", quoteNumber: "BQ-Q-1", status: "submitted" }] }), ready, now);
  assert.equal(task.kind, "order_setup"); assert.equal(task.urgency, "critical"); assert.equal(task.lane, "internal");
});

test("pending meeting requests become visible internal work", () => {
  const task = buildSalesTask(baseRecord({ meetingRequests: [{ id: "BMR-ABCDEF012345", status: "pending", meetingType: "quotation_review", timezone: "Europe/Berlin" }] }), ready, now);
  assert.equal(task.kind, "meeting"); assert.equal(task.lane, "internal"); assert.equal(task.score, 93); assert.match(task.title, /会议申请/);
  const draft = buildBuyerReplyDraft(baseRecord({ meetingRequests: [{ id: "BMR-ABCDEF012345", status: "pending", meetingType: "quotation_review", timezone: "Europe/Berlin" }] }), task, ready); assert.match(draft, /No calendar booking or attendance is confirmed/i);
});

test("buyer decisions are sorted by explicit project stage", () => {
  const change = buildSalesTask(baseRecord({ orderChangeRequests: [{ id: "OCR-1", status: "awaiting_buyer", changedFields: ["packing"], proposedHandoff: { orderReference: "PO-1" } }] }), ready, now);
  const sample = buildSalesTask(baseRecord({ sampleProgram: { status: "buyer_review", sampleReference: "S-1", styleCodes: "BQ001" } }), ready, now);
  const quote = buildSalesTask(baseRecord({ quotations: [{ quoteNumber: "BQ-Q-1", status: "issued", validUntil: "2026-09-10" }] }), ready, now);
  assert.equal(change.lane, "waiting_buyer"); assert.equal(change.score > sample.score, true); assert.equal(sample.score > quote.score, true);
});

test("human sourcing reviews become high-priority internal shortlist work", () => {
  const record = baseRecord({ styleCode: "CATALOG-2026", finderBrief: { mode: "human_review", buyerChannel: "amazon", priority: "lightweight", closure: "lace_up", styleCodes: [] } });
  const task = buildSalesTask(record, ready, now);
  const draft = buildBuyerReplyDraft(record, task, ready);
  assert.equal(task.kind, "sourcing_review"); assert.equal(task.score, 89); assert.equal(task.lane, "internal"); assert.match(task.title, /人工选款/);
  assert.match(draft, /human shortlist request/i); assert.match(draft, /does not confirm stock, price or manufacturing feasibility/i);
});

test("issued recommendations close the special human-review preparation task", () => {
  const task = buildSalesTask(baseRecord({ finderBrief: { mode: "human_review", buyerChannel: "wholesale", priority: "breathability", closure: "slip_on", styleCodes: ["BQ009"] }, recommendationSets: [{ id: "REC-1", status: "issued", items: [{ code: "BQ009" }] }] }), ready, now);
  assert.equal(task.kind, "recommendation"); assert.equal(task.lane, "waiting_buyer");
});

test("overdue active projects become high-priority work", () => {
  const task = buildSalesTask(baseRecord({ nextActionDue: "2026-08-20", nextAction: "Confirm destination" }), ready, now);
  assert.equal(task.kind, "overdue"); assert.equal(task.score, 88); assert.equal(task.urgency, "high");
});

test("English reply draft stays manual and commercially conservative", () => {
  const record = baseRecord({ quotations: [{ quoteNumber: "BQ-Q-1", status: "issued", validUntil: "2026-09-10" }] });
  const task = buildSalesTask(record, ready, now); const draft = buildBuyerReplyDraft(record, task, ready);
  assert.match(draft, /Hello Maria/); assert.match(draft, /BQ-Q-1/); assert.match(draft, /BQ-2026-0001/); assert.match(draft, /does not create a production order/i); assert.match(draft, /Final price, MOQ, material execution, size ratio, packing, lead time and transaction terms remain subject to written confirmation/i);
  assert.doesNotMatch(draft, /guaranteed|free shipping|best[- ]seller|confirmed stock/i);
});
