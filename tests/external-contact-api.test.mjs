import assert from "node:assert/strict";
import test from "node:test";
import { createExternalContactHandler, validateExternalContact } from "../edgeone-deploy/cloud-functions/api/admin/external-contact.js";

const record = { reference: "BQ-20260827-ABCDEF12", receivedAt: "2026-08-27T08:00:00.000Z", name: "Jane", company: "Buyer Co", quantity: "600 pairs", lastContactedAt: "", accessTokenHash: "private" };
const payload = { reference: record.reference, receivedAt: record.receivedAt, channel: "whatsapp", direction: "outbound", outcome: "sent", occurredAt: "2026-08-27T09:30:00.000Z", summary: "Sent the requested BQ001 evidence link and asked for size ratio.", actor: "Amy" };
const now = new Date("2026-08-27T10:00:00.000Z");

function request(body, token = "secret") {
  return new Request("https://www.beiqiang.online/api/admin/external-contact", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
}

test("external contact endpoint rejects invalid admin access before storage", async () => {
  let opened = false; const handler = createExternalContactHandler({ getStoreImpl: () => { opened = true; return {}; } });
  const result = await handler({ request: request(payload, "wrong"), env: { INQUIRY_ADMIN_TOKEN: "secret" } });
  assert.equal(result.status, 401); assert.equal(opened, false);
});

test("appends bounded manual contact evidence and updates date-level outbound contact", async () => {
  let saved; const handler = createExternalContactHandler({ nowImpl: () => now, getStoreImpl: () => ({ get: async () => ({ ...record, externalContacts: Array.from({ length: 99 }, (_, index) => ({ ...payload, id: `OLD-${index}`, recordedAt: now.toISOString() })) }), setJSON: async (key, value) => { saved = { key, value }; } }) });
  const result = await handler({ request: request(payload), env: { INQUIRY_ADMIN_TOKEN: "secret" } }); const body = await result.json();
  assert.equal(result.status, 201); assert.match(body.contact.id, /^BQC-[A-F0-9]{8}$/); assert.equal(saved.value.externalContacts.length, 100);
  assert.equal(saved.value.lastContactedAt, "2026-08-27"); assert.equal("accessTokenHash" in body.record, false); assert.match(saved.key, /inquiries\/2026-08-27\/BQ-20260827-ABCDEF12\.json/);
});

test("never overwrites older contact evidence when the bounded timeline is full", async () => {
  let writes = 0; const handler = createExternalContactHandler({ nowImpl: () => now, getStoreImpl: () => ({ get: async () => ({ ...record, externalContacts: Array.from({ length: 100 }, (_, index) => ({ ...payload, id: `OLD-${index}` })) }), setJSON: async () => { writes += 1; } }) });
  const result = await handler({ request: request(payload), env: { INQUIRY_ADMIN_TOKEN: "secret" } }); const body = await result.json();
  assert.equal(result.status, 409); assert.match(body.message, /existing evidence was not overwritten/i); assert.equal(writes, 0);
});

test("keeps external logs as evidence notes rather than future or pre-inquiry claims", () => {
  assert.match(validateExternalContact({ ...payload, occurredAt: "2026-08-27T10:06:00.000Z" }, record, now).error, /future/i);
  assert.match(validateExternalContact({ ...payload, occurredAt: "2026-08-27T07:59:59.000Z" }, record, now).error, /predate/i);
  assert.match(validateExternalContact({ ...payload, channel: "telegram" }, record, now).error, /supported channel/i);
  assert.match(validateExternalContact({ ...payload, summary: "", actor: "" }, record, now).error, /summary/i);
});

test("an inbound record is preserved without rewriting outbound last-contact evidence", async () => {
  let saved; const handler = createExternalContactHandler({ nowImpl: () => now, getStoreImpl: () => ({ get: async () => ({ ...record, lastContactedAt: "2026-08-27" }), setJSON: async (_key, value) => { saved = value; } }) });
  const result = await handler({ request: request({ ...payload, direction: "inbound", outcome: "replied", summary: "Buyer replied with the requested quantity and market." }), env: { INQUIRY_ADMIN_TOKEN: "secret" } });
  assert.equal(result.status, 201); assert.equal(saved.lastContactedAt, "2026-08-27"); assert.equal(saved.externalContacts[0].direction, "inbound");
});
