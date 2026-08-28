import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { getStore } from "@edgeone/pages-blob";
import nodemailer from "nodemailer";

function response(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
function clean(value, max) {
  return typeof value === "string"
    ? value.trim().replace(/\0/g, "").slice(0, max)
    : "";
}
function safeEqual(left, right) {
  const a = Buffer.from(left || "");
  const b = Buffer.from(right || "");
  return a.length > 0 && a.length === b.length && timingSafeEqual(a, b);
}
function isAllowedOrigin(origin) {
  if (!origin) return true;
  try {
    const { protocol, hostname } = new URL(origin);
    if (protocol !== "https:")
      return hostname === "localhost" || hostname === "127.0.0.1";
    return (
      hostname === "www.beiqiang.online" ||
      hostname === "beiqiang.online" ||
      /^beiqiang-footwear-[a-z0-9]+\.edgeone\.dev$/.test(hostname)
    );
  } catch {
    return false;
  }
}
function details(value) {
  const reference = clean(value, 40).toUpperCase();
  const match = /^BQ-(\d{4})(\d{2})(\d{2})-([A-F0-9]{8})$/.exec(reference);
  return match
    ? {
        reference,
        key: `inquiries/${match[1]}-${match[2]}-${match[3]}/${reference}.json`,
      }
    : null;
}

const IMPORTER_ROLES = ["buyer", "buyer_nominated", "to_confirm"];
const SHIPPING_MODES = ["sea", "air", "express", "to_confirm"];
const DOCUMENTS = [
  "commercial_invoice",
  "packing_list",
  "certificate_of_origin_review",
  "other",
];

async function notifySales(
  record,
  packet,
  linkedNames,
  env,
  createTransportImpl,
) {
  if (!env?.SMTP_PASS) return "smtp_not_configured";
  try {
    const transport = createTransportImpl({
      host: env.SMTP_HOST || "smtp.qq.com",
      port: Number(env.SMTP_PORT || 465),
      secure: String(env.SMTP_SECURE || "true") !== "false",
      auth: { user: env.SMTP_USER || "421345308@qq.com", pass: env.SMTP_PASS },
    });
    await transport.sendMail({
      from: env.SMTP_FROM || env.SMTP_USER || "421345308@qq.com",
      to: env.INQUIRY_NOTIFY_TO || "421345308@qq.com",
      replyTo: record.email || undefined,
      subject: `[Order packet review] ${record.reference} · V${packet.version}`,
      text: [
        `Project: ${record.reference}`,
        `Order setup request: ${packet.orderRequestId}`,
        `Packet version: ${packet.version}`,
        `Billing company: ${packet.billingCompany}`,
        `Registered country: ${packet.registeredCountry}`,
        `Invoice email: ${packet.invoiceEmail}`,
        `Shipping consignee: ${packet.shippingConsignee}`,
        `Shipping country: ${packet.shippingCountry}`,
        `Importer role: ${packet.importerRole}`,
        `Shipping mode: ${packet.shippingMode}`,
        `Buyer PO reference: ${packet.purchaseOrderReference || "-"}`,
        `Requested documents: ${packet.requiredDocuments.join(", ") || "-"}`,
        `Linked files: ${linkedNames.join(", ") || "-"}`,
        `Buyer note: ${packet.notes || "-"}`,
        "",
        "Open the protected admin record to review the full addresses. This packet is not an accepted order, invoice, payment instruction or production authorization.",
      ].join("\n"),
    });
    return "sent";
  } catch (error) {
    console.error(
      "Order packet notification failed",
      record.reference,
      packet.id,
      error,
    );
    return "delivery_failed";
  }
}

export function createOrderPreparationPacketHandler({
  getStoreImpl = getStore,
  createTransportImpl = nodemailer.createTransport,
  randomBytesImpl = randomBytes,
  nowImpl = () => new Date(),
} = {}) {
  return async function onRequestPost(context) {
    if (!isAllowedOrigin(context.request.headers.get("origin")))
      return response(403, {
        ok: false,
        message: "Request origin is not allowed.",
      });
    let payload;
    try {
      payload = await context.request.json();
    } catch {
      return response(400, { ok: false, message: "Invalid request." });
    }
    const recordDetails = details(payload.reference);
    const accessCode = clean(payload.accessCode, 40).toUpperCase();
    const orderRequestId = clean(payload.orderRequestId, 40).toUpperCase();
    const billingCompany = clean(payload.billingCompany, 180);
    const registeredCountry = clean(payload.registeredCountry, 120);
    const billingAddress = clean(payload.billingAddress, 600);
    const invoiceEmail = clean(payload.invoiceEmail, 180).toLowerCase();
    const shippingConsignee = clean(payload.shippingConsignee, 180);
    const shippingCountry = clean(payload.shippingCountry, 120);
    const shippingAddress = clean(payload.shippingAddress, 600);
    const shippingContact = clean(payload.shippingContact, 180);
    const importerRole = IMPORTER_ROLES.includes(payload.importerRole)
      ? payload.importerRole
      : "";
    const shippingMode = SHIPPING_MODES.includes(payload.shippingMode)
      ? payload.shippingMode
      : "";
    const requiredDocuments = Array.isArray(payload.requiredDocuments)
      ? [
          ...new Set(
            payload.requiredDocuments.filter((item) =>
              DOCUMENTS.includes(item),
            ),
          ),
        ].slice(0, DOCUMENTS.length)
      : [];
    const purchaseOrderReference = clean(payload.purchaseOrderReference, 120);
    const attachmentIds = Array.isArray(payload.attachmentIds)
      ? [
          ...new Set(
            payload.attachmentIds
              .map((item) => clean(item, 50))
              .filter(Boolean),
          ),
        ].slice(0, 5)
      : [];
    const notes = clean(payload.notes, 1200);
    if (
      !recordDetails ||
      !/^[A-F0-9]{20}$/.test(accessCode) ||
      !/^OSR-[A-F0-9]{10}$/.test(orderRequestId) ||
      billingCompany.length < 2 ||
      registeredCountry.length < 2 ||
      billingAddress.length < 5 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invoiceEmail) ||
      shippingConsignee.length < 2 ||
      shippingCountry.length < 2 ||
      shippingAddress.length < 5 ||
      shippingContact.length < 2 ||
      !importerRole ||
      !shippingMode ||
      payload.buyerConfirmation !== true
    )
      return response(400, {
        ok: false,
        message:
          "Complete the protected billing, shipping, importer, document and buyer-confirmation fields.",
      });
    try {
      const store = getStoreImpl("beiqiang-inquiries");
      const record = await store.get(recordDetails.key, {
        type: "json",
        consistency: "strong",
      });
      const suppliedHash = createHash("sha256")
        .update(accessCode)
        .digest("hex");
      if (
        !record?.accessTokenHash ||
        !safeEqual(record.accessTokenHash, suppliedHash)
      )
        return response(404, {
          ok: false,
          message: "No matching inquiry was found.",
        });
      if (["lost", "spam"].includes(record.status))
        return response(409, {
          ok: false,
          message: "This sourcing request is closed.",
        });
      if (
        record.status === "order_confirmed" ||
        record.orderHandoff?.orderReference
      )
        return response(409, {
          ok: false,
          message:
            "A formal order handoff already exists. Use the private message thread for corrections.",
        });
      const orderRequest = Array.isArray(record.buyerOrderRequests)
        ? record.buyerOrderRequests.at(-1)
        : null;
      if (!orderRequest || orderRequest.id !== orderRequestId)
        return response(409, {
          ok: false,
          message:
            "Use the latest formal order setup request before submitting this packet.",
        });
      const quote = Array.isArray(record.quotations)
        ? [...record.quotations]
            .reverse()
            .find((item) => item.quoteNumber === orderRequest.quoteNumber)
        : null;
      if (!quote || quote.status !== "buyer_accepted")
        return response(409, {
          ok: false,
          message: "The related quotation must remain buyer accepted.",
        });
      const packets = Array.isArray(record.orderPreparationPackets)
        ? record.orderPreparationPackets
        : [];
      const latest = packets.at(-1);
      if (
        latest &&
        latest.orderRequestId === orderRequestId &&
        latest.status !== "needs_revision"
      )
        return response(409, {
          ok: false,
          message:
            "The latest order-preparation packet is already awaiting review or has been reviewed.",
        });
      const activeAttachments = (record.attachments || []).filter(
        (item) => item.status !== "revoked",
      );
      const linked = attachmentIds.map((id) =>
        activeAttachments.find((item) => item.id === id),
      );
      if (linked.some((item) => !item))
        return response(400, {
          ok: false,
          message: "One or more linked buyer files are no longer available.",
        });
      const submittedAt = nowImpl().toISOString();
      const version =
        latest?.orderRequestId === orderRequestId
          ? Number(latest.version || 0) + 1
          : 1;
      const packet = {
        id: `OPP-${randomBytesImpl(6).toString("hex").toUpperCase()}`,
        version,
        orderRequestId,
        quoteNumber: orderRequest.quoteNumber,
        billingCompany,
        registeredCountry,
        billingAddress,
        invoiceEmail,
        shippingConsignee,
        shippingCountry,
        shippingAddress,
        shippingContact,
        importerRole,
        shippingMode,
        requiredDocuments,
        purchaseOrderReference,
        attachmentIds,
        notes,
        status: "submitted",
        submittedAt,
        reviewedAt: "",
        reviewedBy: "",
        reviewNote: "",
        notificationStatus: "pending",
        notificationAttemptedAt: "",
      };
      const saved = {
        ...record,
        orderPreparationPackets: [...packets.slice(-9), packet],
        updatedAt: submittedAt,
        buyerUpdate: `Order-preparation packet V${version} was recorded for human review. It does not create an order, invoice, payment request or production authorization.`,
      };
      await store.setJSON(recordDetails.key, saved, { cacheControl: null });
      const notificationStatus = await notifySales(
        record,
        packet,
        linked.map((item) => item.name),
        context.env || {},
        createTransportImpl,
      );
      const notificationAttemptedAt = nowImpl().toISOString();
      const latestRecord =
        (await store.get(recordDetails.key, {
          type: "json",
          consistency: "strong",
        })) || saved;
      await store.setJSON(
        recordDetails.key,
        {
          ...latestRecord,
          orderPreparationPackets: (
            latestRecord.orderPreparationPackets || []
          ).map((item) =>
            item.id === packet.id
              ? { ...item, notificationStatus, notificationAttemptedAt }
              : item,
          ),
        },
        { cacheControl: null },
      );
      return response(200, {
        ok: true,
        packet: { id: packet.id, version, status: packet.status, submittedAt },
        message:
          "Your protected order-preparation packet was recorded for human review. It is not an order, invoice, payment request or production authorization.",
      });
    } catch (error) {
      console.error("Order preparation packet failed", error);
      return response(503, {
        ok: false,
        message:
          "The order-preparation packet could not be saved. Contact Beiqiang by email or WhatsApp.",
      });
    }
  };
}

export const onRequestPost = createOrderPreparationPacketHandler();
