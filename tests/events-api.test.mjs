import assert from "node:assert/strict";
import test from "node:test";
import { ALLOWED_EVENTS, sanitizeEventPayload } from "../edgeone-deploy/cloud-functions/api/events.js";

test("accepts the commercial funnel events used by the website", () => {
  for (const event of ["product_view", "product_compare", "product_spec_sheet_print", "quote_list_add", "quote_builder_view", "quote_list_remove", "quote_request_submit", "form_submit", "alibaba_click", "line_sheet_form_start", "line_sheet_request", "line_sheet_download", "sourcing_program_view", "sourcing_program_cta", "resource_view", "resource_cta", "resource_product_open", "mobile_nav_open", "mobile_nav_link"]) assert.equal(ALLOWED_EVENTS.has(event), true, `${event} should be accepted`);
  const record = sanitizeEventPayload({ event: "quote_request_submit", page: "/request-quote/", details: { reference: "BQ-20260823-ABCDEF12", styleCount: 3, projectPath: "technical_development" }, attribution: { utmSource: "linkedin" } }, "2026-08-23T10:00:00.000Z");
  assert.equal(record.details.styleCount, 3); assert.equal(record.details.projectPath, "technical_development"); assert.equal(record.attribution.utmSource, "linkedin");
  const resource = sanitizeEventPayload({ event: "resource_cta", details: { context: "private-label-walking-shoes-sourcing-guide", linkType: "quote", unsafe: "must not persist" } }, "2026-08-23T10:00:00.000Z");
  assert.equal(resource.details.context, "private-label-walking-shoes-sourcing-guide"); assert.equal(resource.details.linkType, "quote"); assert.equal("unsafe" in resource.details, false);
});

test("rejects unknown analytics events", () => {
  assert.equal(sanitizeEventPayload({ event: "collect_everything" }), null);
});
