import { timingSafeEqual } from "node:crypto";
import { getStore } from "@edgeone/pages-blob";

function response(status, body) { return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=UTF-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } }); }
function authorized(request, env) { const expected = typeof env?.INQUIRY_ADMIN_TOKEN === "string" ? env.INQUIRY_ADMIN_TOKEN.trim() : ""; const header = request.headers.get("authorization") || ""; const supplied = header.startsWith("Bearer ") ? header.slice(7).trim() : ""; const a = Buffer.from(expected); const b = Buffer.from(supplied); return a.length === b.length && a.length > 0 && timingSafeEqual(a, b); }
function isInternalTest(record) { const text = `${record?.name || ""} ${record?.company || ""} ${record?.requirements || ""} ${record?.quantity || ""}`.toLowerCase(); return /internal|deployment test|smtp test|test only|\b0\s*pairs?\b/.test(text); }
function increment(map, key, field) { const label = String(key || "Direct / unknown").trim() || "Direct / unknown"; const current = map.get(label) || { label, events: 0, inquiries: 0 }; current[field] += 1; map.set(label, current); }

async function listRecords(store, prefix, max = 5000) {
  const records = []; let cursor; let truncated = false;
  while (records.length < max) {
    const result = await store.list({ prefix, limit: Math.min(500, max - records.length), cursor, consistency: "strong" });
    const blobs = Array.isArray(result?.blobs) ? result.blobs : [];
    const page = (await Promise.all(blobs.map(({ key }) => store.get(key, { type: "json", consistency: "strong" })))).filter(Boolean);
    records.push(...page);
    if (!result?.cursor || !blobs.length) break;
    cursor = result.cursor;
  }
  if (records.length >= max) truncated = true;
  return { records, truncated };
}

export function buildCommercialAnalytics(events, inquiries, { days = 30, now = new Date() } = {}) {
  const to = now.toISOString().slice(0, 10); const fromDate = new Date(now); fromDate.setUTCDate(fromDate.getUTCDate() - days + 1); fromDate.setUTCHours(0, 0, 0, 0); const from = fromDate.toISOString().slice(0, 10); const cutoff = fromDate.getTime();
  const periodEvents = events.filter((event) => Date.parse(event.receivedAt || event.occurredAt || 0) >= cutoff);
  const periodInquiries = inquiries.filter((record) => !isInternalTest(record) && Date.parse(record.receivedAt || 0) >= cutoff);
  const lineSheetLeads = periodInquiries.filter((record) => record.context === "line_sheet");
  const sourcingInquiries = periodInquiries.filter((record) => record.context !== "line_sheet");
  const countEvent = (name) => periodEvents.filter((event) => event.event === name).length;
  const successfulQuoteAdds = periodEvents.filter((event) => event.event === "quote_list_add" && event.details?.inserted !== false).length;
  const qualifiedStages = new Set(["qualified", "sample_discussion", "quoted", "negotiation", "order_confirmed"]); const sampleStages = new Set(["sample_discussion", "quoted", "negotiation", "order_confirmed"]);
  const withIssuedQuote = sourcingInquiries.filter((record) => record.status === "quoted" || record.status === "negotiation" || record.status === "order_confirmed" || record.quotations?.some((quote) => ["issued", "buyer_accepted", "buyer_declined", "superseded"].includes(quote.status))).length;
  const acceptedQuotes = sourcingInquiries.filter((record) => record.quotations?.some((quote) => quote.status === "buyer_accepted")).length;
  const funnel = { productViews: countEvent("product_view"), quoteAdds: successfulQuoteAdds, quoteBuilderViews: countEvent("quote_builder_view"), quoteRequests: countEvent("quote_request_submit") + countEvent("form_submit"), inquiries: sourcingInquiries.length, qualified: sourcingInquiries.filter((record) => qualifiedStages.has(record.status)).length, sampleDiscussion: sourcingInquiries.filter((record) => sampleStages.has(record.status)).length, quoted: withIssuedQuote, quoteAccepted: acceptedQuotes, orderSetupRequested: sourcingInquiries.filter((record) => record.buyerOrderRequests?.length).length, orders: sourcingInquiries.filter((record) => record.status === "order_confirmed").length };
  const sourceMap = new Map(); periodEvents.forEach((event) => increment(sourceMap, event.attribution?.utmSource, "events")); periodInquiries.forEach((record) => increment(sourceMap, record.attribution?.utmSource, "inquiries"));
  const productMap = new Map(); const product = (code) => { const label = String(code || "Unknown").trim().toUpperCase() || "Unknown"; const current = productMap.get(label) || { code: label, views: 0, compares: 0, specSheets: 0, quoteAdds: 0, inquiries: 0 }; productMap.set(label, current); return current; };
  periodEvents.forEach((event) => { const code = event.details?.styleCode; if (!code) return; if (event.event === "product_view") product(code).views += 1; if (event.event === "product_compare") product(code).compares += 1; if (event.event === "product_spec_sheet_print") product(code).specSheets += 1; if (event.event === "quote_list_add" && event.details?.inserted !== false) product(code).quoteAdds += 1; });
  sourcingInquiries.forEach((record) => { const codes = Array.isArray(record.items) && record.items.length ? record.items.map((item) => item.code) : String(record.styleCode || "").split(","); [...new Set(codes.map((code) => String(code).trim()).filter(Boolean))].forEach((code) => { product(code).inquiries += 1; }); });
  const dayMap = new Map(); for (let index = 0; index < days; index += 1) { const date = new Date(fromDate); date.setUTCDate(date.getUTCDate() + index); const key = date.toISOString().slice(0, 10); dayMap.set(key, { date: key, productViews: 0, quoteAdds: 0, quoteRequests: 0, inquiries: 0, orders: 0 }); }
  periodEvents.forEach((event) => { const day = dayMap.get(String(event.receivedAt || event.occurredAt || "").slice(0, 10)); if (!day) return; if (event.event === "product_view") day.productViews += 1; if (event.event === "quote_list_add" && event.details?.inserted !== false) day.quoteAdds += 1; if (["quote_request_submit", "form_submit"].includes(event.event)) day.quoteRequests += 1; });
  periodInquiries.forEach((record) => { const day = dayMap.get(String(record.receivedAt || "").slice(0, 10)); if (!day) return; day.inquiries += 1; if (record.status === "order_confirmed") day.orders += 1; });
  const businessInquiries = inquiries.filter((record) => !isInternalTest(record)); const stageMap = new Map(); businessInquiries.flatMap((record) => Array.isArray(record.pipelineHistory) ? record.pipelineHistory : []).filter((event) => Date.parse(event.changedAt || 0) >= cutoff).forEach((event) => stageMap.set(event.to, (stageMap.get(event.to) || 0) + 1));
  const lossMap = new Map(); periodInquiries.filter((record) => record.status === "lost").forEach((record) => { const reason = record.lostReason || "legacy_unspecified"; lossMap.set(reason, (lossMap.get(reason) || 0) + 1); });
  return { period: { days, from, to, consentNote: "Website event counts include only visitors who accepted optional first-party analytics. Inquiry stages are the current state of business inquiries received within the selected period; line-sheet leads are reported separately." }, funnel, supporting: { mobileMenuOpens: countEvent("mobile_nav_open"), mobileMenuLinks: countEvent("mobile_nav_link"), sourcingProgramViews: countEvent("sourcing_program_view"), sourcingProgramCtas: countEvent("sourcing_program_cta"), lineSheetLeads: lineSheetLeads.length, lineSheetDownloads: countEvent("line_sheet_download"), productSpecSheets: countEvent("product_spec_sheet_print"), buyerMessages: periodInquiries.reduce((sum, record) => sum + (record.messages?.length || 0), 0), buyerFiles: periodInquiries.reduce((sum, record) => sum + (record.attachments?.length || 0), 0), buyerDocuments: periodInquiries.reduce((sum, record) => sum + (record.orderDocuments?.length || 0), 0), overdue: periodInquiries.filter((record) => record.nextActionDue && record.nextActionDue < to && !["lost", "spam", "order_confirmed"].includes(record.status)).length }, stageActivity: [...stageMap.entries()].map(([stage, count]) => ({ stage, count })).sort((a, b) => b.count - a.count), lossReasons: [...lossMap.entries()].map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count), sources: [...sourceMap.values()].sort((a, b) => b.inquiries - a.inquiries || b.events - a.events).slice(0, 12), products: [...productMap.values()].sort((a, b) => b.inquiries - a.inquiries || b.quoteAdds - a.quoteAdds || b.specSheets - a.specSheets || b.compares - a.compares || b.views - a.views).slice(0, 15), daily: [...dayMap.values()] };
}

export function createAdminAnalyticsHandler({ getStoreImpl = getStore } = {}) {
  return async function onRequestGet(context) {
    if (!context.env?.INQUIRY_ADMIN_TOKEN) return response(503, { ok: false, message: "Inquiry dashboard access has not been configured." });
    if (!authorized(context.request, context.env)) return response(401, { ok: false, message: "Invalid access token." });
    const rawDays = Number(new URL(context.request.url).searchParams.get("days") || 30); const days = [7, 30, 90].includes(rawDays) ? rawDays : 30;
    try {
      const [eventResult, inquiryResult] = await Promise.all([listRecords(getStoreImpl("beiqiang-events"), "events/"), listRecords(getStoreImpl("beiqiang-inquiries"), "inquiries/")]);
      return response(200, { ok: true, analytics: { ...buildCommercialAnalytics(eventResult.records, inquiryResult.records, { days }), coverage: { eventsLoaded: eventResult.records.length, inquiriesLoaded: inquiryResult.records.length, truncated: eventResult.truncated || inquiryResult.truncated } } });
    } catch (error) { console.error("Commercial analytics read failed", error); return response(503, { ok: false, message: "Commercial analytics could not be loaded." }); }
  };
}

export const onRequestGet = createAdminAnalyticsHandler();
