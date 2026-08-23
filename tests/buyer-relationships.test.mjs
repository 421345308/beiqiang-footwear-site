import assert from "node:assert/strict";
import test from "node:test";
import { buildRelationshipGroups, normalizeRelationshipCompany, normalizeRelationshipPhone, relationshipIndex } from "../app/lib/buyer-relationships.ts";

test("normalizes common phone and company variants conservatively", () => {
  assert.equal(normalizeRelationshipPhone("+86 189-5980-5256"), "8618959805256");
  assert.equal(normalizeRelationshipPhone("0086 189 5980 5256"), "8618959805256");
  assert.equal(normalizeRelationshipCompany("Example Trading Co., Ltd."), "example trading");
  assert.equal(normalizeRelationshipCompany("Unknown"), "");
});

test("links repeat records by exact contact or normalized company without deleting history", () => {
  const records = [
    { reference: "BQ-1", receivedAt: "2026-08-01T00:00:00Z", company: "Example Trading Co., Ltd.", email: "buyer@example.com", whatsapp: "+86 189 5980 5256", styleCode: "BQ001" },
    { reference: "BQ-2", receivedAt: "2026-08-20T00:00:00Z", company: "Example Trading", email: "BUYER@example.com", styleCode: "BQ009" },
    { reference: "BQ-3", receivedAt: "2026-08-22T00:00:00Z", company: "Another Buyer", whatsapp: "0086 189 5980 5256", items: [{ code: "BQ024" }] },
    { reference: "BQ-4", receivedAt: "2026-08-23T00:00:00Z", company: "Unrelated Importer", email: "new@example.net", styleCode: "BQ030" },
  ];
  const groups = buildRelationshipGroups(records); const index = relationshipIndex(groups);
  assert.equal(groups.length, 1); assert.equal(groups[0].records.length, 3); assert.deepEqual(groups[0].styleCodes.sort(), ["BQ001", "BQ009", "BQ024"]);
  assert.deepEqual(groups[0].matchBasis.sort(), ["Exact WhatsApp digits", "Exact email", "Normalized company name"].sort());
  assert.equal(index.get("BQ-1"), index.get("BQ-3")); assert.equal(index.has("BQ-4"), false); assert.equal(records.length, 4);
});

test("does not group weak or generic identity values", () => {
  const groups = buildRelationshipGroups([{ reference: "A", company: "Unknown", email: "bad", whatsapp: "123" }, { reference: "B", company: "Unknown", email: "bad", whatsapp: "123" }]);
  assert.deepEqual(groups, []);
});
