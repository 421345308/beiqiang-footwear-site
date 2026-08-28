import assert from "node:assert/strict";
import test from "node:test";
import { products } from "../app/data/products.ts";
import { addConceptProductToQuote, PRIVATE_LABEL_CONCEPT_KEY, readPrivateLabelConcept, savePrivateLabelConcept } from "../app/lib/private-label-concept.ts";

function browserStorage() {
  const values = new Map();
  globalThis.window = { dispatchEvent() {} };
  globalThis.CustomEvent = class { constructor(type) { this.type = type; } };
  globalThis.localStorage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: (key) => values.delete(key) };
  return values;
}

test("stores only a bounded private-label concept summary and never a logo file", () => {
  const values = browserStorage();
  savePrivateLabelConcept({ styleCode: "BQ001", styleSlug: "bq001", sourceModel: "BQ-001", styleName: "Wide Toe Box Knit Slip-On Walking Shoes", placement: "Outer upper", artworkStatus: "vector_ready", brandText: "BUYER BRAND", notes: "Reference color only", createdAt: "2026-08-28T10:00:00.000Z", logoData: "must-not-store" });
  const raw = values.get(PRIVATE_LABEL_CONCEPT_KEY);
  assert.doesNotMatch(raw, /must-not-store/);
  assert.deepEqual(readPrivateLabelConcept(), { styleCode: "BQ001", styleSlug: "bq001", sourceModel: "BQ-001", styleName: "Wide Toe Box Knit Slip-On Walking Shoes", placement: "Outer upper", artworkStatus: "vector_ready", brandText: "BUYER BRAND", notes: "Reference color only", createdAt: "2026-08-28T10:00:00.000Z" });
});

test("adds the selected product and buyer-target summary to the existing RFQ list", () => {
  const values = browserStorage();
  const concept = { styleCode: "BQ009", styleSlug: "bq009", sourceModel: "L1026", styleName: products[8].name, placement: "Tongue label", artworkStatus: "reference_only", brandText: "TEST", notes: "Buyer target only", createdAt: "2026-08-28T10:00:00.000Z" };
  addConceptProductToQuote(products[8], concept);
  const lines = JSON.parse(values.get("beiqiang_quote_list_v1"));
  assert.equal(lines.length, 1); assert.equal(lines[0].code, "BQ009"); assert.match(lines[0].notes, /Private-label concept target: Tongue label/); assert.match(lines[0].notes, /Buyer target only/);
});
