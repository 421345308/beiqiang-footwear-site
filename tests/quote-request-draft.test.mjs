import assert from "node:assert/strict";
import test from "node:test";
import { clearQuoteRequestDraft, EMPTY_QUOTE_REQUEST_DRAFT, normalizeQuoteRequestDraft, readQuoteRequestDraft, saveQuoteRequestDraft } from "../app/lib/quote-request-draft.ts";

function memoryStorage() {
  const values = new Map();
  return { values, getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: (key) => values.delete(key) };
}

test("keeps a bounded quote form draft in tab storage without consent or private access data", () => {
  const storage = memoryStorage();
  saveQuoteRequestDraft({ ...EMPTY_QUOTE_REQUEST_DRAFT, company: "Buyer Co", email: "buyer@example.com", market: "Germany", bulkQuantity: "600 pairs", buyerTargetCost: "USD 9.50/pair FOB target", preferredTradeTerm: "FOB", requirements: "Private label review", consent: true, accessCode: "MUST-NOT-STORE", website: "honeypot" }, storage);
  const raw = [...storage.values.values()][0];
  assert.doesNotMatch(raw, /MUST-NOT-STORE|honeypot|consent/);
  assert.deepEqual(readQuoteRequestDraft(storage), { ...EMPTY_QUOTE_REQUEST_DRAFT, company: "Buyer Co", email: "buyer@example.com", market: "Germany", bulkQuantity: "600 pairs", buyerTargetCost: "USD 9.50/pair FOB target", preferredTradeTerm: "FOB", requirements: "Private label review" });
});

test("normalizes draft enums and bounds free text before restoring it", () => {
  const draft = normalizeQuoteRequestDraft({ ...EMPTY_QUOTE_REQUEST_DRAFT, buyerType: "Retail shopper", projectPath: "instant_checkout", preferredTradeTerm: "FREE", buyerTargetCost: `USD\0${"9".repeat(200)}`, ndaRequired: "maybe", sourcingProgram: "../unsafe", requirements: `A${"x".repeat(3000)}`, contactPreferences: { preferredContactMethod: "sms", preferredResponseLanguage: "xx", buyerTimezone: "UTC+1", preferredContactWindow: "Morning" }, adaptationBrief: { intent: "guaranteed", artworkStatus: "approved", brandingPlacement: "Tongue", colorDirection: "Blue", packingLabeling: "Box" } });
  assert.equal(draft.buyerType, "Importer / wholesaler"); assert.equal(draft.projectPath, "base_style_adaptation"); assert.equal(draft.preferredTradeTerm, "not_sure"); assert.equal(draft.ndaRequired, "No"); assert.equal(draft.sourcingProgram, "");
  assert.equal(draft.requirements.length, 2000); assert.equal(draft.buyerTargetCost.length, 120); assert.doesNotMatch(draft.buyerTargetCost, /\0/); assert.equal(draft.contactPreferences.preferredContactMethod, ""); assert.equal(draft.adaptationBrief.intent, "not_sure"); assert.equal(draft.adaptationBrief.artworkStatus, "not_applicable");
});

test("removes empty or explicitly cleared quote drafts", () => {
  const storage = memoryStorage();
  saveQuoteRequestDraft({ ...EMPTY_QUOTE_REQUEST_DRAFT, company: "Buyer Co" }, storage); assert.equal(storage.values.size, 1);
  saveQuoteRequestDraft(EMPTY_QUOTE_REQUEST_DRAFT, storage); assert.equal(storage.values.size, 0);
  saveQuoteRequestDraft({ ...EMPTY_QUOTE_REQUEST_DRAFT, company: "Buyer Co" }, storage); clearQuoteRequestDraft(storage); assert.equal(storage.values.size, 0);
});
