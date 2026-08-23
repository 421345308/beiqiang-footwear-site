import { randomUUID } from "node:crypto";
import { getStore } from "@edgeone/pages-blob";

export const ALLOWED_EVENTS = new Set(["product_view", "product_select", "product_compare", "product_spec_sheet_print", "form_start", "form_submit", "whatsapp_click", "email_click", "alibaba_click", "quote_builder_view", "quote_list_add", "quote_list_remove", "quote_request_submit", "line_sheet_form_start", "line_sheet_request", "line_sheet_download", "sourcing_program_view", "sourcing_program_cta", "mobile_nav_open", "mobile_nav_link"]);

function clean(value, max = 300) {
  return typeof value === "string" ? value.trim().replace(/\0/g, "").slice(0, max) : "";
}

function isAllowedOrigin(origin) {
  if (!origin) return true;
  try { const { protocol, hostname } = new URL(origin); if (protocol !== "https:") return hostname === "localhost" || hostname === "127.0.0.1"; return hostname === "www.beiqiang.online" || hostname === "beiqiang.online" || /^beiqiang-footwear-[a-z0-9]+\.edgeone\.dev$/.test(hostname); } catch { return false; }
}

export function sanitizeEventPayload(payload, receivedAt = new Date().toISOString()) {
  if (!payload || !ALLOWED_EVENTS.has(payload.event)) return null;
  return {
    event: payload.event, page: clean(payload.page), occurredAt: clean(payload.occurredAt, 50), receivedAt,
    details: { context: clean(payload.details?.context, 40), styleCode: clean(payload.details?.styleCode, 40), channel: clean(payload.details?.channel, 40), reference: clean(payload.details?.reference, 80), linkType: clean(payload.details?.linkType, 40), projectPath: clean(payload.details?.projectPath, 60), styleCount: Math.max(0, Math.min(12, Number(payload.details?.styleCount) || 0)), inserted: payload.details?.inserted === true },
    attribution: { utmSource: clean(payload.attribution?.utmSource, 100), utmMedium: clean(payload.attribution?.utmMedium, 100), utmCampaign: clean(payload.attribution?.utmCampaign, 150), utmContent: clean(payload.attribution?.utmContent, 150), utmTerm: clean(payload.attribution?.utmTerm, 150), landingPage: clean(payload.attribution?.landingPage), referrer: clean(payload.attribution?.referrer) },
  };
}

export async function onRequestPost(context) {
  if (Number(context.request.headers.get("content-length") || 0) > 12_288) return new Response(null, { status: 413 });
  if (!isAllowedOrigin(context.request.headers.get("origin"))) return new Response(null, { status: 403 });
  try {
    const payload = await context.request.json();
    const receivedAt = new Date().toISOString();
    const sanitized = sanitizeEventPayload(payload, receivedAt);
    if (!sanitized) return new Response(null, { status: 400 });
    const record = { ...sanitized, requestId: context.uuid || "" };
    const key = `events/${receivedAt.slice(0, 10)}/${receivedAt.slice(11, 13)}/${randomUUID()}.json`;
    await getStore("beiqiang-events").setJSON(key, record, { onlyIfNew: true, cacheControl: null });
    return new Response(null, { status: 202, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Event persistence failed", error);
    return new Response(null, { status: 503 });
  }
}
