import assert from "node:assert/strict";
import test from "node:test";
import { buildReminderSummary, createAdminReminderHandlers } from "../edgeone-deploy/cloud-functions/api/admin/reminders.js";

const today = "2026-08-23";
const records = [
  { reference: "BQ-A", company: "Buyer A", owner: "Sales A", status: "quoted", nextActionDue: "2026-08-22", nextAction: "Confirm sample address", quotations: [{ quoteNumber: "BQ-A-Q1", status: "issued", validUntil: "2026-08-24" }] },
  { reference: "BQ-B", company: "Buyer B", owner: "Sales B", status: "order_confirmed", orderHandoff: { orderReference: "TA-B", paymentCurrency: "USD", paymentMilestones: [{ label: "Balance", amount: "2000", status: "due", dueDate: "2026-08-22" }] } },
  { reference: "BQ-TEST", company: "Beiqiang Internal Test", name: "Internal", status: "quoted", nextActionDue: "2026-01-01", quotations: [{ quoteNumber: "TEST-Q1", status: "issued", validUntil: "2026-08-23" }] },
  { reference: "BQ-CLOSED", company: "Closed", status: "lost", nextActionDue: "2026-01-01" },
];

test("builds one internal action list for follow-up, quote and payment timing", () => {
  const summary = buildReminderSummary(records, today);
  assert.deepEqual(summary.counts, { followUps: 1, quotes: 1, payments: 1, total: 3 }); assert.equal(summary.followUps[0].reference, "BQ-A"); assert.equal(summary.quotes[0].timing, "expiring"); assert.equal(summary.payments[0].timing, "overdue"); assert.equal(JSON.stringify(summary).includes("BQ-TEST"), false);
});

test("protects the reminder center with the admin token", async () => {
  let reads = 0; const handlers = createAdminReminderHandlers({ getStoreImpl: () => { reads += 1; return {}; } }); const request = new Request("https://www.beiqiang.online/api/admin/reminders", { headers: { Authorization: "Bearer wrong" } }); const result = await handlers.onRequestGet({ request, env: { INQUIRY_ADMIN_TOKEN: "correct" } }); assert.equal(result.status, 401); assert.equal(reads, 0);
});

test("sends at most one reserved reminder digest per calendar day", async () => {
  const inquiryData = Object.fromEntries(records.map((record, index) => [`inquiries/${today}/${index}.json`, record])); let reminderRecord = null; const mails = [];
  const inquiryStore = { list: async () => ({ blobs: Object.keys(inquiryData).map((key) => ({ key })) }), get: async (key) => inquiryData[key] };
  const reminderStore = { get: async () => reminderRecord, setJSON: async (key, value, options = {}) => { if (options.onlyIfNew && reminderRecord) throw new Error("exists"); reminderRecord = value; }, delete: async () => { reminderRecord = null; } };
  const handlers = createAdminReminderHandlers({ getStoreImpl: (name) => name === "beiqiang-inquiries" ? inquiryStore : reminderStore, createTransportImpl: () => ({ sendMail: async (mail) => { mails.push(mail); } }), nowImpl: () => new Date("2026-08-23T10:00:00.000Z") });
  const request = () => new Request("https://www.beiqiang.online/api/admin/reminders", { method: "POST", headers: { Authorization: "Bearer correct" } }); const env = { INQUIRY_ADMIN_TOKEN: "correct", SMTP_PASS: "test" };
  const first = await handlers.onRequestPost({ request: request(), env }); const body = await first.json(); assert.equal(first.status, 200); assert.equal(body.summary.counts.total, 3); assert.equal(reminderRecord.status, "sent"); assert.equal(mails.length, 1); assert.match(mails[0].text, /not proof of payment/i);
  const duplicate = await handlers.onRequestPost({ request: request(), env }); assert.equal(duplicate.status, 409); assert.equal(mails.length, 1);
});
