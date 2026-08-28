import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { createOrderPreparationPacketHandler } from "../edgeone-deploy/cloud-functions/api/order-preparation-packet.js";
import { createAdminOrderPreparationPacketHandler } from "../edgeone-deploy/cloud-functions/api/admin/order-preparation-packet.js";

const reference = "BQ-20260823-ABCDEF12";
const accessCode = "0123456789ABCDEF0123";
const orderRequestId = "OSR-0102030405";
const quoteNumber = `${reference}-Q1`;
const baseRecord = {
  reference,
  email: "buyer@example.com",
  company: "Buyer Co",
  status: "negotiation",
  accessTokenHash: createHash("sha256").update(accessCode).digest("hex"),
  quotations: [{ quoteNumber, status: "buyer_accepted" }],
  buyerOrderRequests: [
    { id: orderRequestId, quoteNumber, status: "submitted" },
  ],
  attachments: [
    {
      id: "abcdef0123456789abcd",
      name: "PO-2026.pdf",
      status: "active",
      size: 100,
    },
  ],
};
const payload = {
  reference,
  accessCode,
  orderRequestId,
  billingCompany: "Buyer Legal Ltd",
  registeredCountry: "Germany",
  billingAddress: "Example Street 8, Hamburg",
  invoiceEmail: "finance@buyer.example",
  shippingConsignee: "Buyer Warehouse",
  shippingCountry: "Germany",
  shippingAddress: "Warehouse Road 10, Hamburg",
  shippingContact: "Jane +49 123",
  importerRole: "buyer",
  shippingMode: "sea",
  requiredDocuments: ["commercial_invoice", "packing_list"],
  purchaseOrderReference: "PO-2026",
  attachmentIds: ["abcdef0123456789abcd"],
  notes: "Use buyer PO",
  buyerConfirmation: true,
};
function publicRequest(value = payload) {
  return new Request(
    "https://www.beiqiang.online/api/order-preparation-packet",
    {
      method: "POST",
      headers: {
        Origin: "https://www.beiqiang.online",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(value),
    },
  );
}

test("records a protected order-preparation packet and links only active inquiry files", async () => {
  let state = structuredClone(baseRecord);
  const mails = [];
  const handler = createOrderPreparationPacketHandler({
    getStoreImpl: () => ({
      get: async () => structuredClone(state),
      setJSON: async (_key, value) => {
        state = structuredClone(value);
      },
    }),
    createTransportImpl: () => ({ sendMail: async (mail) => mails.push(mail) }),
    randomBytesImpl: () => Buffer.from("010203040506", "hex"),
    nowImpl: () => new Date("2026-08-28T10:00:00.000Z"),
  });
  const result = await handler({
    request: publicRequest(),
    env: { SMTP_PASS: "configured" },
  });
  const body = await result.json();
  assert.equal(result.status, 200);
  assert.equal(body.ok, true);
  assert.equal(state.orderPreparationPackets[0].id, "OPP-010203040506");
  assert.equal(state.orderPreparationPackets[0].version, 1);
  assert.deepEqual(state.orderPreparationPackets[0].attachmentIds, [
    "abcdef0123456789abcd",
  ]);
  assert.equal(state.orderHandoff, undefined);
  assert.match(body.message, /not an order/i);
  assert.equal(mails.length, 1);
  assert.doesNotMatch(mails[0].text, /Example Street|Warehouse Road/);
  assert.match(mails[0].text, /PO-2026\.pdf/);
});

test("rejects missing confirmation, unrelated files and replacement before human revision request", async () => {
  let reads = 0;
  const invalid = createOrderPreparationPacketHandler({
    getStoreImpl: () => {
      reads += 1;
      return {};
    },
  });
  const first = await invalid({
    request: publicRequest({ ...payload, buyerConfirmation: false }),
    env: {},
  });
  assert.equal(first.status, 400);
  assert.equal(reads, 0);
  const unrelated = createOrderPreparationPacketHandler({
    getStoreImpl: () => ({ get: async () => structuredClone(baseRecord) }),
  });
  const second = await unrelated({
    request: publicRequest({ ...payload, attachmentIds: ["unknown"] }),
    env: {},
  });
  assert.equal(second.status, 400);
  const existing = {
    ...baseRecord,
    orderPreparationPackets: [
      {
        id: "OPP-AAAAAAAAAAAA",
        version: 1,
        orderRequestId,
        status: "submitted",
      },
    ],
  };
  const duplicate = createOrderPreparationPacketHandler({
    getStoreImpl: () => ({ get: async () => existing }),
  });
  const third = await duplicate({ request: publicRequest(), env: {} });
  assert.equal(third.status, 409);
});

test("admin review preserves packet history and does not create a formal order", async () => {
  const packet = {
    ...payload,
    id: "OPP-010203040506",
    version: 1,
    quoteNumber,
    status: "submitted",
    submittedAt: "2026-08-28T10:00:00.000Z",
    attachmentIds: payload.attachmentIds,
  };
  let state = { ...baseRecord, orderPreparationPackets: [packet] };
  const mails = [];
  const handler = createAdminOrderPreparationPacketHandler({
    getStoreImpl: () => ({
      get: async () => structuredClone(state),
      setJSON: async (_key, value) => {
        state = structuredClone(value);
      },
    }),
    createTransportImpl: () => ({ sendMail: async (mail) => mails.push(mail) }),
    nowImpl: () => new Date("2026-08-28T11:00:00.000Z"),
  });
  const request = new Request(
    "https://www.beiqiang.online/api/admin/order-preparation-packet",
    {
      method: "PATCH",
      headers: {
        Authorization: "Bearer admin-secret",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reference,
        packetId: packet.id,
        action: "request_revision",
        reviewNote: "Please add the nominated importer company.",
        reviewedBy: "Sales A",
      }),
    },
  );
  const result = await handler({
    request,
    env: { INQUIRY_ADMIN_TOKEN: "admin-secret", SMTP_PASS: "configured" },
  });
  const body = await result.json();
  assert.equal(result.status, 200);
  assert.equal(body.packet.status, "needs_revision");
  assert.equal(state.orderPreparationPackets.length, 1);
  assert.equal(state.orderPreparationPackets[0].reviewedBy, "Sales A");
  assert.equal(state.orderHandoff, undefined);
  assert.equal(mails.length, 1);
  assert.match(mails[0].text, /not an order/i);
});

test("admin packet review requires a valid token and only the latest submitted packet", async () => {
  let reads = 0;
  const handler = createAdminOrderPreparationPacketHandler({
    getStoreImpl: () => {
      reads += 1;
      return {};
    },
  });
  const request = new Request(
    "https://www.beiqiang.online/api/admin/order-preparation-packet",
    {
      method: "PATCH",
      headers: {
        Authorization: "Bearer wrong",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reference,
        packetId: "OPP-010203040506",
        action: "review",
        reviewNote: "Packet checked.",
      }),
    },
  );
  const result = await handler({
    request,
    env: { INQUIRY_ADMIN_TOKEN: "admin-secret" },
  });
  assert.equal(result.status, 401);
  assert.equal(reads, 0);
});
