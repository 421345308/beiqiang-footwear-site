import test from "node:test";
import assert from "node:assert/strict";
import { assessInquiryReadiness } from "../app/lib/inquiry-readiness.ts";

test("marks a detailed sourcing brief ready without predicting an order", () => {
  const result = assessInquiryReadiness({
    company: "Example Imports", buyerType: "Importer / wholesaler", market: "Germany",
    email: "buyer@example.com", whatsapp: "+49 123 456", styleCode: "BQ001, BQ009",
    bulkQuantity: "800 pairs", sampleQuantity: "2 pairs, EU 42",
    preferredTradeTerm: "FOB", deliveryDestination: "Hamburg, Germany",
    deliveryTiming: "Required in November", requirements: "Private label box and black color review",
    items: [{ code: "BQ001", quantity: "400", colors: "Black", sizes: "EU 39-45" }],
  });
  assert.equal(result.score, 100);
  assert.equal(result.level, "ready");
  assert.match(result.summary, /verify every fact/i);
  assert.deepEqual(result.missing, []);
});

test("keeps a vague record in early qualification and lists actionable gaps", () => {
  const result = assessInquiryReadiness({ company: "Buyer Co", email: "buyer@example.com", styleCode: "BQ009", quantity: "not sure" });
  assert.equal(result.level, "early");
  assert.ok(result.score < 50);
  assert.ok(result.missing.some((item) => /bulk quantity/i.test(item)));
  assert.ok(result.missing.some((item) => /target country/i.test(item)));
  assert.ok(result.missing.some((item) => /delivery/i.test(item)));
});

test("does not treat vague quantity language as commercial readiness", () => {
  for (const quantity of ["TBD", "discuss later", "not sure", "unknown"]) {
    const result = assessInquiryReadiness({ quantity });
    assert.ok(result.missing.some((item) => /bulk quantity/i.test(item)), quantity);
  }
});

test("treats an explicit no-sample decision as useful commercial context", () => {
  for (const sampleQuantity of ["No sample needed", "Samples not required", "不需要样品"]) {
    const result = assessInquiryReadiness({ sampleQuantity });
    assert.equal(result.missing.some((item) => /samples are needed/i.test(item)), false, sampleQuantity);
  }
});

test("turns missing private-label artwork details into qualification questions", () => {
  const incomplete = assessInquiryReadiness({ projectPath: "base_style_adaptation", adaptationBrief: { intent: "private_label", artworkStatus: "not_ready" } });
  assert.ok(incomplete.missing.some((item) => /logo, insole or label placement/i.test(item))); assert.ok(incomplete.missing.some((item) => /usable logo artwork/i.test(item)));
  const complete = assessInquiryReadiness({ projectPath: "base_style_adaptation", adaptationBrief: { intent: "private_label", artworkStatus: "vector_ready", brandingPlacement: "Outer upper and insole" } });
  assert.ok(complete.strengths.includes("Branding placement target supplied")); assert.ok(complete.strengths.includes("Logo artwork readiness recorded"));
});
