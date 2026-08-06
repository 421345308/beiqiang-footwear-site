import assert from "node:assert/strict";
import test from "node:test";
import { createAdminInquiriesHandler } from "../edgeone-deploy/cloud-functions/api/admin/inquiries.js";

function request(token = "correct-token") {
  return new Request("https://www.beiqiang.online/api/admin/inquiries", { headers: { Authorization: `Bearer ${token}` } });
}

test("requires an explicitly configured admin token", async () => {
  const handler = createAdminInquiriesHandler();
  assert.equal((await handler({ request: request(), env: {} })).status, 503);
});

test("rejects an invalid admin token without reading storage", async () => {
  let reads = 0;
  const handler = createAdminInquiriesHandler({ getStoreImpl: () => { reads += 1; return {}; } });
  const result = await handler({ request: request("wrong-token"), env: { INQUIRY_ADMIN_TOKEN: "correct-token" } });
  assert.equal(result.status, 401);
  assert.equal(reads, 0);
});

test("returns newest inquiries and marks internal tests", async () => {
  const records = {
    "inquiries/2026-08-05/BQ-OLD.json": { reference: "BQ-OLD", receivedAt: "2026-08-05T10:00:00.000Z", company: "Buyer Co", name: "Jane", quantity: "500 pairs" },
    "inquiries/2026-08-06/BQ-TEST.json": { reference: "BQ-TEST", receivedAt: "2026-08-06T10:00:00.000Z", company: "Beiqiang Internal Deployment Test", name: "Internal", quantity: "0 pairs - test only" },
  };
  const handler = createAdminInquiriesHandler({ getStoreImpl: () => ({
    list: async () => ({ blobs: Object.keys(records).map((key) => ({ key })) }),
    get: async (key) => records[key],
  }) });
  const result = await handler({ request: request(), env: { INQUIRY_ADMIN_TOKEN: "correct-token" } });
  const body = await result.json();
  assert.equal(result.status, 200);
  assert.equal(body.records[0].reference, "BQ-TEST");
  assert.equal(body.records[0].internalTest, true);
  assert.equal(body.records[1].internalTest, false);
});
