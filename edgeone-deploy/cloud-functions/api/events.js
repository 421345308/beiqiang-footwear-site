import { randomUUID } from "node:crypto";
import { getStore } from "@edgeone/pages-blob";

const ALLOWED_EVENTS = new Set(["product_view", "product_select", "form_start", "form_submit", "whatsapp_click", "email_click", "alibaba_click"]);

function clean(value, max = 300) {
  return typeof value === "string" ? value.trim().replace(/\0/g, "").slice(0, max) : "";
}

export async function onRequestPost(context) {
  if (Number(context.request.headers.get("content-length") || 0) > 12_288) return new Response(null, { status: 413 });
  try {
    const payload = await context.request.json();
    if (!ALLOWED_EVENTS.has(payload.event)) return new Response(null, { status: 400 });
    const receivedAt = new Date().toISOString();
    const record = {
      event: payload.event,
      page: clean(payload.page),
      occurredAt: clean(payload.occurredAt, 50),
      receivedAt,
      requestId: context.uuid || "",
      details: {
        context: clean(payload.details?.context, 40),
        styleCode: clean(payload.details?.styleCode, 40),
        channel: clean(payload.details?.channel, 40),
        reference: clean(payload.details?.reference, 80),
      },
      attribution: {
        utmSource: clean(payload.attribution?.utmSource, 100),
        utmMedium: clean(payload.attribution?.utmMedium, 100),
        utmCampaign: clean(payload.attribution?.utmCampaign, 150),
        utmContent: clean(payload.attribution?.utmContent, 150),
        utmTerm: clean(payload.attribution?.utmTerm, 150),
        landingPage: clean(payload.attribution?.landingPage),
        referrer: clean(payload.attribution?.referrer),
      },
    };
    const key = `events/${receivedAt.slice(0, 10)}/${receivedAt.slice(11, 13)}/${randomUUID()}.json`;
    await getStore("beiqiang-events").setJSON(key, record, { onlyIfNew: true, cacheControl: null });
    return new Response(null, { status: 202, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Event persistence failed", error);
    return new Response(null, { status: 503 });
  }
}
