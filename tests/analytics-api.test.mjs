import assert from "node:assert/strict";
import test from "node:test";
import { buildCommercialAnalytics, createAdminAnalyticsHandler } from "../edgeone-deploy/cloud-functions/api/admin/analytics.js";

const events = [
  { event: "product_view", receivedAt: "2026-08-23T08:00:00.000Z", details: { styleCode: "BQ009" }, attribution: { utmSource: "linkedin" } },
  { event: "product_compare", receivedAt: "2026-08-23T08:00:30.000Z", details: { styleCode: "BQ009" }, attribution: { utmSource: "linkedin" } },
  { event: "product_spec_sheet_print", receivedAt: "2026-08-23T08:00:45.000Z", details: { styleCode: "BQ009", context: "product_spec_sheet" }, attribution: { utmSource: "linkedin" } },
  { event: "quote_list_add", receivedAt: "2026-08-23T08:01:00.000Z", details: { styleCode: "BQ009" }, attribution: { utmSource: "linkedin" } },
  { event: "quote_request_submit", receivedAt: "2026-08-23T08:02:00.000Z", details: { styleCode: "BQ009" }, attribution: { utmSource: "linkedin" } },
  { event: "line_sheet_download", receivedAt: "2026-08-23T08:03:00.000Z", details: { context: "line_sheet" }, attribution: { utmSource: "linkedin" } },
  { event: "sourcing_program_view", receivedAt: "2026-08-23T08:04:00.000Z", details: { context: "wholesale-walking-shoes" }, attribution: { utmSource: "linkedin" } },
  { event: "sourcing_program_cta", receivedAt: "2026-08-23T08:05:00.000Z", details: { context: "wholesale-walking-shoes" }, attribution: { utmSource: "linkedin" } },
  { event: "mobile_nav_open", receivedAt: "2026-08-23T08:06:00.000Z", details: { context: "site_header" }, attribution: { utmSource: "linkedin" } },
  { event: "mobile_nav_link", receivedAt: "2026-08-23T08:06:10.000Z", details: { context: "site_header", linkType: "All 30 products" }, attribution: { utmSource: "linkedin" } },
  { event: "product_view", receivedAt: "2025-01-01T08:00:00.000Z", details: { styleCode: "OLD" } },
];
const inquiries = [
  { reference: "BQ-20260823-AAA", receivedAt: "2026-08-23T09:00:00.000Z", status: "quoted", company: "Buyer Co", name: "Jane", styleCode: "BQ009", attribution: { utmSource: "linkedin" }, messages: [{ id: "1" }], attachments: [{ id: "2" }], orderDocuments: [{ id: "3" }], quotations: [{ status: "issued" }], buyerOrderRequests: [{ id: "OSR-1" }], pipelineHistory: [{ from: "qualified", to: "quoted", changedAt: "2026-08-23T09:30:00.000Z" }] },
  { reference: "BQ-20260823-LOST", receivedAt: "2026-08-23T10:00:00.000Z", status: "lost", lostReason: "price", company: "Other Buyer", name: "Joe", styleCode: "BQ001", pipelineHistory: [{ from: "negotiation", to: "lost", changedAt: "2026-08-23T10:30:00.000Z" }] },
  { reference: "BQ-20260823-CAT", receivedAt: "2026-08-23T10:10:00.000Z", status: "new", context: "line_sheet", company: "Catalogue Buyer", name: "Ann", styleCode: "CATALOG-2026", attribution: { utmSource: "linkedin" } },
  { reference: "BQ-20260823-TEST", receivedAt: "2026-08-23T09:00:00.000Z", status: "order_confirmed", company: "Beiqiang Internal Test", name: "Internal", quantity: "0 pairs" },
];

test("builds a consent-aware commercial funnel without counting internal tests", () => {
  const result = buildCommercialAnalytics(events, inquiries, { days: 30, now: new Date("2026-08-23T12:00:00.000Z") });
  assert.equal(result.funnel.productViews, 1); assert.equal(result.funnel.quoteAdds, 1); assert.equal(result.funnel.inquiries, 2); assert.equal(result.funnel.quoted, 1); assert.equal(result.funnel.orderSetupRequested, 1); assert.equal(result.funnel.orders, 0); assert.equal(result.supporting.mobileMenuOpens, 1); assert.equal(result.supporting.mobileMenuLinks, 1); assert.equal(result.supporting.sourcingProgramViews, 1); assert.equal(result.supporting.sourcingProgramCtas, 1); assert.equal(result.supporting.lineSheetLeads, 1); assert.equal(result.supporting.lineSheetDownloads, 1); assert.equal(result.supporting.productSpecSheets, 1); assert.equal(result.supporting.buyerMessages, 1); assert.equal(result.supporting.buyerDocuments, 1); assert.equal(result.products[0].code, "BQ009"); assert.equal(result.products[0].compares, 1); assert.equal(result.products[0].specSheets, 1); assert.equal(result.products.some((item) => item.code === "CATALOG-2026"), false); assert.equal(result.sources[0].label, "linkedin"); assert.equal(result.stageActivity.find((item) => item.stage === "lost").count, 1); assert.deepEqual(result.lossReasons[0], { reason: "price", count: 1 }); assert.match(result.period.consentNote, /accepted optional/i);
});

test("protects commercial analytics with the configured admin token", async () => {
  let reads = 0; const handler = createAdminAnalyticsHandler({ getStoreImpl: () => { reads += 1; return {}; } });
  const request = new Request("https://www.beiqiang.online/api/admin/analytics?days=30", { headers: { Authorization: "Bearer wrong" } });
  const result = await handler({ request, env: { INQUIRY_ADMIN_TOKEN: "correct" } });
  assert.equal(result.status, 401); assert.equal(reads, 0);
});

test("returns only an aggregated analytics summary", async () => {
  const datasets = { "beiqiang-events": Object.fromEntries(events.slice(0, 10).map((value, index) => [`events/2026-08-23/08/${index}.json`, value])), "beiqiang-inquiries": { "inquiries/2026-08-23/BQ.json": inquiries[0] } };
  const handler = createAdminAnalyticsHandler({ getStoreImpl: (name) => ({ list: async () => ({ blobs: Object.keys(datasets[name]).map((key) => ({ key })) }), get: async (key) => datasets[name][key] }) });
  const request = new Request("https://www.beiqiang.online/api/admin/analytics?days=30", { headers: { Authorization: "Bearer correct" } });
  const result = await handler({ request, env: { INQUIRY_ADMIN_TOKEN: "correct" } }); const body = await result.json();
  assert.equal(result.status, 200); assert.equal(body.analytics.funnel.inquiries, 1); assert.equal(body.analytics.coverage.eventsLoaded, 10); assert.equal(JSON.stringify(body).includes("Buyer Co"), false); assert.equal(JSON.stringify(body).includes("jane"), false);
});
