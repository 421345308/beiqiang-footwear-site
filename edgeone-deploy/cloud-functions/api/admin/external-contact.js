import { randomUUID, timingSafeEqual } from "node:crypto";
import { getStore } from "@edgeone/pages-blob";

const CHANNELS = new Set(["email", "whatsapp", "alibaba", "phone", "video_call", "other"]);
const DIRECTIONS = new Set(["outbound", "inbound"]);
const OUTCOMES = new Set(["sent", "replied", "no_answer", "meeting_scheduled", "information_requested", "other"]);

function response(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=UTF-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}

function clean(value, max) {
  return typeof value === "string" ? value.trim().replace(/\0/g, "").slice(0, max) : "";
}

function authorized(request, env) {
  const expected = typeof env?.INQUIRY_ADMIN_TOKEN === "string" ? env.INQUIRY_ADMIN_TOKEN.trim() : "";
  const header = request.headers.get("authorization") || "";
  const supplied = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!expected || !supplied) return false;
  const expectedBytes = Buffer.from(expected); const suppliedBytes = Buffer.from(supplied);
  return expectedBytes.length === suppliedBytes.length && timingSafeEqual(expectedBytes, suppliedBytes);
}

function isInternalTest(record) {
  const text = `${record?.name || ""} ${record?.company || ""} ${record?.requirements || ""} ${record?.quantity || ""}`.toLowerCase();
  return /internal|deployment test|smtp test|test only|\b0\s*pairs?\b/.test(text);
}

function adminSafeRecord(record) {
  const safe = { ...record };
  delete safe.accessTokenHash; delete safe.pendingUploads; delete safe.pendingAttachments; delete safe.pendingOrderDocuments;
  safe.attachments = Array.isArray(record.attachments) ? record.attachments.map((file) => { const copy = { ...file }; delete copy.key; return copy; }) : [];
  safe.orderDocuments = Array.isArray(record.orderDocuments) ? record.orderDocuments.map((document) => { const copy = { ...document }; delete copy.key; return copy; }) : [];
  return { ...safe, internalTest: isInternalTest(record) };
}

export function validateExternalContact(payload, record, now = new Date()) {
  const reference = clean(payload?.reference, 40); const receivedAt = clean(payload?.receivedAt, 40);
  const channel = CHANNELS.has(payload?.channel) ? payload.channel : "";
  const direction = DIRECTIONS.has(payload?.direction) ? payload.direction : "";
  const outcome = OUTCOMES.has(payload?.outcome) ? payload.outcome : "";
  const occurredAt = clean(payload?.occurredAt, 40); const occurred = new Date(occurredAt);
  const summary = clean(payload?.summary, 800); const actor = clean(payload?.actor, 100);
  if (!reference || !receivedAt || reference !== record?.reference || receivedAt !== record?.receivedAt) return { error: "Inquiry identity does not match the stored record." };
  if (!channel || !direction || !outcome) return { error: "Choose a supported channel, direction and outcome." };
  if (!Number.isFinite(occurred.getTime())) return { error: "Enter the actual contact date and time." };
  if (occurred.getTime() < new Date(record.receivedAt).getTime()) return { error: "Contact evidence cannot predate this inquiry." };
  if (occurred.getTime() > now.getTime() + 300_000) return { error: "Contact evidence cannot be recorded in the future." };
  if (summary.length < 2 || actor.length < 2) return { error: "Record a concise evidence summary and the responsible salesperson." };
  return { contact: { id: `BQC-${randomUUID().slice(0, 8).toUpperCase()}`, channel, direction, outcome, occurredAt: occurred.toISOString(), summary, actor, recordedAt: now.toISOString() } };
}

export function createExternalContactHandler({ getStoreImpl = getStore, nowImpl = () => new Date() } = {}) {
  return async function onRequestPost(context) {
    if (!context.env?.INQUIRY_ADMIN_TOKEN) return response(503, { ok: false, message: "Inquiry dashboard access has not been configured." });
    if (!authorized(context.request, context.env)) return response(401, { ok: false, message: "Invalid access token." });
    let payload; try { payload = await context.request.json(); } catch { return response(400, { ok: false, message: "Invalid request." }); }
    const reference = clean(payload.reference, 40); const receivedAt = clean(payload.receivedAt, 40); const date = receivedAt.slice(0, 10);
    if (!/^BQ-[A-Z0-9-]+$/.test(reference) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return response(400, { ok: false, message: "Invalid inquiry reference." });
    try {
      const store = getStoreImpl("beiqiang-inquiries"); const key = `inquiries/${date}/${reference}.json`;
      const current = await store.get(key, { type: "json", consistency: "strong" });
      if (!current) return response(404, { ok: false, message: "Inquiry record was not found." });
      const validation = validateExternalContact(payload, current, nowImpl());
      if (validation.error) return response(400, { ok: false, message: validation.error });
      const existing = Array.isArray(current.externalContacts) ? current.externalContacts : [];
      if (existing.length >= 100) return response(409, { ok: false, message: "This inquiry has reached the 100-entry website contact-log limit. Export and review the project record before deciding the next retention step; existing evidence was not overwritten." });
      const updated = { ...current, externalContacts: [...existing, validation.contact], updatedAt: nowImpl().toISOString() };
      if (validation.contact.direction === "outbound") {
        const dateOnly = validation.contact.occurredAt.slice(0, 10);
        updated.lastContactedAt = !current.lastContactedAt || dateOnly > current.lastContactedAt ? dateOnly : current.lastContactedAt;
      }
      await store.setJSON(key, updated, { cacheControl: null });
      return response(201, { ok: true, record: adminSafeRecord(updated), contact: validation.contact });
    } catch (error) {
      console.error("External contact evidence save failed", error);
      return response(503, { ok: false, message: "The contact evidence could not be saved." });
    }
  };
}

export const onRequestPost = createExternalContactHandler();
