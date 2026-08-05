import assert from "node:assert/strict";
import test from "node:test";
import { createInquiryHandler, validateInquiry } from "../edgeone-deploy/cloud-functions/api/inquiries.js";

function validPayload(overrides = {}) {
  return {
    name: "Jane Buyer",
    company: "Example Imports",
    buyerType: "Importer / wholesaler",
    market: "United States / wholesale",
    quantity: "600 pairs",
    email: "jane@example.com",
    whatsapp: "+1 555 0100",
    requirements: "Please discuss white and black samples.",
    website: "",
    consent: true,
    styleCode: "BQ001",
    styleLabel: "BQ001 — Wide Toe Box Knit Slip-On",
    context: "product",
    page: "/products/bq001/",
    formStartedAt: Date.now() - 5000,
    attribution: { utmSource: "linkedin", utmMedium: "outreach", utmCampaign: "us_importers" },
    ...overrides,
  };
}

test("validates a qualified B2B inquiry", () => {
  const result = validateInquiry(validPayload());
  assert.equal(result.error, undefined);
  assert.equal(result.inquiry.styleCode, "BQ001");
  assert.equal(result.inquiry.attribution.utmSource, "linkedin");
});

test("rejects requests without a reply channel or consent", () => {
  assert.match(validateInquiry(validPayload({ email: "", whatsapp: "" })).error, /email address or WhatsApp/i);
  assert.match(validateInquiry(validPayload({ consent: false })).error, /agree/i);
});

test("quietly accepts the honeypot without storing a lead", async () => {
  let writes = 0;
  const handler = createInquiryHandler({ getStoreImpl: () => ({ setJSON: async () => { writes += 1; } }) });
  const request = new Request("https://www.beiqiang.online/api/inquiries", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://www.beiqiang.online" },
    body: JSON.stringify(validPayload({ website: "spam.example" })),
  });
  const result = await handler({ request, env: {}, clientIp: "127.0.0.1", uuid: "test" });
  assert.equal(result.status, 202);
  assert.equal(writes, 0);
});

test("persists a valid inquiry before returning success", async () => {
  const writes = [];
  const handler = createInquiryHandler({ getStoreImpl: () => ({ setJSON: async (key, value) => writes.push({ key, value }) }) });
  const request = new Request("https://www.beiqiang.online/api/inquiries", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://www.beiqiang.online" },
    body: JSON.stringify(validPayload()),
  });
  const result = await handler({ request, env: {}, clientIp: "127.0.0.1", uuid: "test-request" });
  const body = await result.json();
  assert.equal(result.status, 201);
  assert.equal(body.ok, true);
  assert.match(body.reference, /^BQ-\d{8}-[A-F0-9]{8}$/);
  assert.equal(writes.length, 1);
  assert.equal(writes[0].value.company, "Example Imports");
  assert.equal(writes[0].value.status, "new");
});
