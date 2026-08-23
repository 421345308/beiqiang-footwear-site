import assert from "node:assert/strict";
import test from "node:test";
import { createInquiryHandler, isAllowedOrigin, validateInquiry } from "../edgeone-deploy/cloud-functions/api/inquiries.js";

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

test("sanitizes a multi-style technical quote request", () => {
  const result = validateInquiry(validPayload({
    styleCode: "BQ001, BQ009", context: "quote_list", projectPath: "technical_development",
    sampleQuantity: "2 pairs", bulkQuantity: "800 pairs", existingSole: "No, new tooling may be required",
    preferredTradeTerm: "DDP_request", deliveryDestination: "US, CA 92335 / FBA code pending", deliveryTiming: "Arrival before 2026-11-15",
    sourcingProgram: "oem-knit-shoes",
    changesRequired: "New last and outsole review", targetValues: "Buyer target only; hardness to be reviewed", ndaRequired: "Yes",
    items: [{ code: "BQ001", sourceModel: "BQ-001", name: "Wide Toe Box Knit Slip-On", quantity: "400", colors: "Black", sizes: "EU 36-46", notes: "Logo discussion" }, { code: "BQ009", quantity: "400" }],
  }));
  assert.equal(result.error, undefined);
  assert.equal(result.inquiry.projectPath, "technical_development");
  assert.equal(result.inquiry.items.length, 2);
  assert.equal(result.inquiry.items[0].quantity, "400");
  assert.equal(result.inquiry.preferredTradeTerm, "DDP_request");
  assert.match(result.inquiry.deliveryDestination, /CA 92335/);
  assert.equal(result.inquiry.sourcingProgram, "oem-knit-shoes");
});

test("allows only Beiqiang production and EdgeOne deployment origins", () => {
  assert.equal(isAllowedOrigin("https://www.beiqiang.online"), true);
  assert.equal(isAllowedOrigin("https://beiqiang-footwear-dpuc92ktg97f.edgeone.dev"), true);
  assert.equal(isAllowedOrigin("https://example.com"), false);
});

test("rejects requests without a reply channel or consent", () => {
  assert.match(validateInquiry(validPayload({ email: "", whatsapp: "" })).error, /email address or WhatsApp/i);
  assert.match(validateInquiry(validPayload({ consent: false })).error, /agree/i);
  assert.match(validateInquiry(validPayload({ preferredTradeTerm: "DDP_request", deliveryDestination: "" })).error, /delivery destination/i);
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
  assert.match(body.accessCode, /^[A-F0-9]{20}$/);
  assert.equal(writes.length, 1);
  assert.equal(writes[0].value.company, "Example Imports");
  assert.equal(writes[0].value.status, "new");
  assert.equal(writes[0].value.pipelineHistory[0].to, "new");
  assert.equal(writes[0].value.accessTokenHash.length, 64);
  assert.notEqual(writes[0].value.accessTokenHash, body.accessCode);
});

test("sends separate internal and buyer receipt messages without confirming commercial terms", async () => {
  const mails = []; const writes = [];
  const handler = createInquiryHandler({
    getStoreImpl: () => ({ setJSON: async (key, value) => writes.push({ key, value: { ...value } }) }),
    createTransportImpl: () => ({ sendMail: async (mail) => { mails.push(mail); } }),
  });
  const request = new Request("https://www.beiqiang.online/api/inquiries", { method: "POST", headers: { "Content-Type": "application/json", Origin: "https://www.beiqiang.online" }, body: JSON.stringify(validPayload()) });
  const result = await handler({ request, env: { SMTP_PASS: "test", SMTP_USER: "421345308@qq.com" }, clientIp: "127.0.0.1" });
  const body = await result.json();
  assert.equal(result.status, 201); assert.equal(mails.length, 2); assert.equal(body.buyerConfirmationSent, true);
  assert.match(mails[1].text, /confirms receipt only/i); assert.match(mails[1].text, /remain subject to review and written confirmation/i);
  assert.match(mails[0].text, /Trade-term preference:/i); assert.match(mails[0].text, /Delivery destination:/i);
  assert.equal(writes.at(-1).value.buyerConfirmationSent, true);
});
