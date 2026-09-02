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
  const result = validateInquiry(validPayload({ preferredContactMethod: "whatsapp", preferredResponseLanguage: "de", buyerTimezone: "Berlin CET / UTC+1", preferredContactWindow: "Weekdays 09:00-12:00" }));
  assert.equal(result.error, undefined);
  assert.equal(result.inquiry.styleCode, "BQ001");
  assert.equal(result.inquiry.attribution.utmSource, "linkedin");
  assert.equal(result.inquiry.preferredContactMethod, "whatsapp");
  assert.equal(result.inquiry.preferredResponseLanguage, "de");
  assert.equal(result.inquiry.buyerTimezone, "Berlin CET / UTC+1");
});

test("keeps a bounded product-finder brief only for styles in the submitted quote", () => {
  const result = validateInquiry(validPayload({ styleCode: "BQ001, BQ009", finderBrief: { buyerChannel: "online_seller", priority: "easy_on", closure: "Slip-On", styleCodes: ["bq001", "BQ999", "BQ009"], inventedCapability: "confirmed" } }));
  assert.equal(result.error, undefined);
  assert.deepEqual(result.inquiry.finderBrief, { buyerChannel: "online_seller", priority: "easy_on", closure: "Slip-On", styleCodes: ["BQ001", "BQ009"] });
  assert.equal("inventedCapability" in result.inquiry.finderBrief, false);
  const unsafe = validateInquiry(validPayload({ finderBrief: { buyerChannel: "consumer", priority: "bestseller", closure: "zip", styleCodes: ["BQ001"] } }));
  assert.equal(unsafe.inquiry.finderBrief, null);
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

test("preserves an approved sourcing-resource origin in the commercial record", () => {
  const result = validateInquiry(validPayload({ sourcingProgram: "resource-footwear-rfq-checklist" }));
  assert.equal(result.error, undefined); assert.equal(result.inquiry.sourcingProgram, "resource-footwear-rfq-checklist");
  const unsafe = validateInquiry(validPayload({ sourcingProgram: "resource-invented-page" })); assert.equal(unsafe.inquiry.sourcingProgram, "");
});

test("preserves only approved collection origins in the commercial record", () => {
  const result = validateInquiry(validPayload({ sourcingProgram: "collection-knit-slip-on" }));
  assert.equal(result.error, undefined); assert.equal(result.inquiry.sourcingProgram, "collection-knit-slip-on");
  const unsafe = validateInquiry(validPayload({ sourcingProgram: "collection-invented" })); assert.equal(unsafe.inquiry.sourcingProgram, "");
});

test("sanitizes a buyer-target adaptation brief without confirming feasibility", () => {
  const result = validateInquiry(validPayload({ projectPath: "base_style_adaptation", adaptationBrief: { intent: "private_label", artworkStatus: "vector_ready", brandingPlacement: "Outer upper and insole\0", colorDirection: "Buyer target: navy reference", packingLabeling: "Buyer target: branded box and barcode", untrustedCapability: "confirmed" } }));
  assert.equal(result.error, undefined); assert.deepEqual(result.inquiry.adaptationBrief, { intent: "private_label", artworkStatus: "vector_ready", brandingPlacement: "Outer upper and insole", colorDirection: "Buyer target: navy reference", packingLabeling: "Buyer target: branded box and barcode" }); assert.equal("untrustedCapability" in result.inquiry.adaptationBrief, false);
  const unsafe = validateInquiry(validPayload({ projectPath: "base_style_adaptation", adaptationBrief: { intent: "guaranteed_customization", artworkStatus: "approved" } })); assert.equal(unsafe.inquiry.adaptationBrief.intent, "not_sure"); assert.equal(unsafe.inquiry.adaptationBrief.artworkStatus, "not_applicable");
  const standard = validateInquiry(validPayload({ projectPath: "standard_inquiry", adaptationBrief: { intent: "private_label", artworkStatus: "vector_ready" } })); assert.equal(standard.inquiry.adaptationBrief, null);
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
  assert.match(validateInquiry(validPayload({ email: "", preferredContactMethod: "email" })).error, /provide an email address/i);
  assert.match(validateInquiry(validPayload({ whatsapp: "", preferredContactMethod: "whatsapp" })).error, /provide a WhatsApp number/i);
});

test("drops unsupported response-preference enum values while keeping optional buyer scheduling notes bounded", () => {
  const result = validateInquiry(validPayload({ preferredContactMethod: "telegram", preferredResponseLanguage: "invented", buyerTimezone: `UTC${"x".repeat(100)}`, preferredContactWindow: `morning${"y".repeat(200)}` }));
  assert.equal(result.error, undefined);
  assert.equal(result.inquiry.preferredContactMethod, "");
  assert.equal(result.inquiry.preferredResponseLanguage, "");
  assert.equal(result.inquiry.buyerTimezone.length, 80);
  assert.equal(result.inquiry.preferredContactWindow.length, 160);
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
  const request = new Request("https://www.beiqiang.online/api/inquiries", { method: "POST", headers: { "Content-Type": "application/json", Origin: "https://www.beiqiang.online" }, body: JSON.stringify(validPayload({ preferredContactMethod: "email", preferredResponseLanguage: "en", buyerTimezone: "New York ET", preferredContactWindow: "Weekdays after 10:00" })) });
  const result = await handler({ request, env: { SMTP_PASS: "test", SMTP_USER: "421345308@qq.com" }, clientIp: "127.0.0.1" });
  const body = await result.json();
  assert.equal(result.status, 201); assert.equal(mails.length, 2); assert.equal(body.buyerConfirmationSent, true);
  assert.match(mails[1].text, /confirms receipt only/i); assert.match(mails[1].text, /remain subject to review and written confirmation/i);
  assert.match(mails[0].text, /Trade-term preference:/i); assert.match(mails[0].text, /Delivery destination:/i);
  assert.match(mails[0].text, /Preferred contact: email/i); assert.match(mails[0].text, /Buyer time zone \/ city: New York ET/i);
  assert.equal(writes.at(-1).value.buyerConfirmationSent, true);
});
