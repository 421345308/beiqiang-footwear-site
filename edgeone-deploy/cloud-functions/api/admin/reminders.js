import { timingSafeEqual } from "node:crypto";
import { getStore } from "@edgeone/pages-blob";
import nodemailer from "nodemailer";

function response(status, body) { return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=UTF-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } }); }
function authorized(request, env) { const expected = typeof env?.INQUIRY_ADMIN_TOKEN === "string" ? env.INQUIRY_ADMIN_TOKEN.trim() : ""; const header = request.headers.get("authorization") || ""; const supplied = header.startsWith("Bearer ") ? header.slice(7).trim() : ""; const a = Buffer.from(expected); const b = Buffer.from(supplied); return a.length === b.length && a.length > 0 && timingSafeEqual(a, b); }
function isInternalTest(record) { const text = `${record?.name || ""} ${record?.company || ""} ${record?.requirements || ""} ${record?.quantity || ""}`.toLowerCase(); return /internal|deployment test|smtp test|test only|\b0\s*pairs?\b/.test(text); }
function addDays(date, days) { const value = new Date(`${date}T00:00:00.000Z`); value.setUTCDate(value.getUTCDate() + days); return value.toISOString().slice(0, 10); }

async function listRecords(store, max = 5000) { const records = []; let cursor; let truncated = false; while (records.length < max) { const result = await store.list({ prefix: "inquiries/", limit: Math.min(500, max - records.length), cursor, consistency: "strong" }); const blobs = Array.isArray(result?.blobs) ? result.blobs : []; records.push(...(await Promise.all(blobs.map(({ key }) => store.get(key, { type: "json", consistency: "strong" })))).filter(Boolean)); if (!result?.cursor || !blobs.length) break; cursor = result.cursor; } if (records.length >= max) truncated = true; return { records, truncated }; }

export function buildReminderSummary(records, today = new Date().toISOString().slice(0, 10)) {
  const soon = addDays(today, 3); const active = records.filter((record) => !isInternalTest(record) && !["lost", "spam"].includes(record.status)); const followUps = []; const quotes = []; const payments = [];
  active.forEach((record) => {
    const identity = { reference: record.reference, company: record.company || "Unknown company", owner: record.owner || "Unassigned" };
    if (record.nextActionDue && record.nextActionDue < today && record.status !== "order_confirmed") followUps.push({ ...identity, dueDate: record.nextActionDue, action: record.nextAction || "Define the next action" });
    (record.quotations || []).filter((quote) => quote.status === "issued" && quote.validUntil && quote.validUntil <= soon).forEach((quote) => quotes.push({ ...identity, quoteNumber: quote.quoteNumber, validUntil: quote.validUntil, timing: quote.validUntil < today ? "expired" : "expiring" }));
    (record.orderHandoff?.paymentMilestones || []).filter((item) => ["planned", "due"].includes(item.status) && item.dueDate && item.dueDate <= soon).forEach((item) => payments.push({ ...identity, orderReference: record.orderHandoff.orderReference, label: item.label, amount: item.amount, currency: record.orderHandoff.paymentCurrency || "USD", dueDate: item.dueDate, timing: item.dueDate < today ? "overdue" : "due_soon" }));
  });
  const byDate = (a, b) => String(a.dueDate || a.validUntil).localeCompare(String(b.dueDate || b.validUntil)); followUps.sort(byDate); quotes.sort(byDate); payments.sort(byDate);
  return { today, windowEnds: soon, counts: { followUps: followUps.length, quotes: quotes.length, payments: payments.length, total: followUps.length + quotes.length + payments.length }, followUps, quotes, payments };
}

function digestText(summary) {
  const lines = [`Beiqiang sales reminder digest · ${summary.today}`, `Window: through ${summary.windowEnds}`, "", `Overdue follow-ups: ${summary.counts.followUps}`, `Expired / expiring quotations: ${summary.counts.quotes}`, `Overdue / due-soon payments: ${summary.counts.payments}`];
  if (summary.followUps.length) { lines.push("", "OVERDUE FOLLOW-UPS"); summary.followUps.forEach((item) => lines.push(`${item.dueDate} · ${item.reference} · ${item.company} · ${item.owner} · ${item.action}`)); }
  if (summary.quotes.length) { lines.push("", "QUOTATIONS"); summary.quotes.forEach((item) => lines.push(`${item.validUntil} · ${item.timing} · ${item.quoteNumber} · ${item.company} · ${item.owner}`)); }
  if (summary.payments.length) { lines.push("", "PAYMENT MILESTONES"); summary.payments.forEach((item) => lines.push(`${item.dueDate} · ${item.timing} · ${item.reference} / ${item.orderReference} · ${item.label} · ${item.currency} ${item.amount} · ${item.owner}`)); }
  lines.push("", "Open https://www.beiqiang.online/admin/inquiries/ and verify each record before contacting a buyer or changing any commercial status.", "This digest is an internal operating reminder, not proof of payment, quotation acceptance or order confirmation."); return lines.join("\n");
}

export function createAdminReminderHandlers({ getStoreImpl = getStore, createTransportImpl = nodemailer.createTransport, nowImpl = () => new Date() } = {}) {
  async function prepare(context) { if (!context.env?.INQUIRY_ADMIN_TOKEN) return { response: response(503, { ok: false, message: "Inquiry dashboard access has not been configured." }) }; if (!authorized(context.request, context.env)) return { response: response(401, { ok: false, message: "Invalid access token." }) }; try { const result = await listRecords(getStoreImpl("beiqiang-inquiries")); return { summary: buildReminderSummary(result.records, nowImpl().toISOString().slice(0, 10)), truncated: result.truncated }; } catch (error) { console.error("Reminder summary failed", error); return { response: response(503, { ok: false, message: "Sales reminders could not be calculated." }) }; } }
  async function onRequestGet(context) { const prepared = await prepare(context); return prepared.response || response(200, { ok: true, summary: prepared.summary, truncated: prepared.truncated }); }
  async function onRequestPost(context) {
    const prepared = await prepare(context); if (prepared.response) return prepared.response; if (!context.env?.SMTP_PASS) return response(503, { ok: false, message: "SMTP is not configured for reminder email." }); const reminderStore = getStoreImpl("beiqiang-reminders"); const key = `digests/${prepared.summary.today}.json`;
    const existing = await reminderStore.get(key, { type: "json", consistency: "strong" }); if (existing) return response(409, { ok: false, message: existing.sentAt ? `Today's reminder digest was already sent at ${existing.sentAt}.` : "Today's reminder digest is already being prepared.", summary: prepared.summary });
    try { await reminderStore.setJSON(key, { date: prepared.summary.today, status: "sending", startedAt: nowImpl().toISOString(), counts: prepared.summary.counts }, { onlyIfNew: true, cacheControl: null }); } catch { return response(409, { ok: false, message: "Today's reminder digest is already being prepared.", summary: prepared.summary }); }
    try { const recipient = context.env.INQUIRY_NOTIFY_TO || "421345308@qq.com"; const transport = createTransportImpl({ host: context.env.SMTP_HOST || "smtp.qq.com", port: Number(context.env.SMTP_PORT || 465), secure: String(context.env.SMTP_SECURE || "true") !== "false", auth: { user: context.env.SMTP_USER || "421345308@qq.com", pass: context.env.SMTP_PASS } }); await transport.sendMail({ from: context.env.SMTP_FROM || context.env.SMTP_USER || "421345308@qq.com", to: recipient, subject: `[Beiqiang follow-up digest] ${prepared.summary.today} · ${prepared.summary.counts.total} actions`, text: digestText(prepared.summary) }); const sentAt = nowImpl().toISOString(); await reminderStore.setJSON(key, { date: prepared.summary.today, status: "sent", sentAt, counts: prepared.summary.counts }, { cacheControl: null }); return response(200, { ok: true, sentAt, summary: prepared.summary }); } catch (error) { try { await reminderStore.delete(key); } catch { /* allow the next manual attempt after a transient SMTP failure */ } console.error("Reminder digest delivery failed", error); return response(503, { ok: false, message: "Reminder digest could not be sent." }); }
  }
  return { onRequestGet, onRequestPost };
}

const handlers = createAdminReminderHandlers(); export const onRequestGet = handlers.onRequestGet; export const onRequestPost = handlers.onRequestPost;
