import { timingSafeEqual } from "node:crypto";
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

async function notifyBuyer(record, packet, env, createTransportImpl) {
  if (!env?.SMTP_PASS || !record.email) return "smtp_not_configured";
  try {
    const transport = createTransportImpl({
      host: env.SMTP_HOST || "smtp.qq.com",
      port: Number(env.SMTP_PORT || 465),
      secure: String(env.SMTP_SECURE || "true") !== "false",
      auth: { user: env.SMTP_USER || "421345308@qq.com", pass: env.SMTP_PASS },
    });
    await transport.sendMail({
      from: env.SMTP_FROM || env.SMTP_USER || "421345308@qq.com",
      to: record.email,
      replyTo: env.INQUIRY_NOTIFY_TO || "421345308@qq.com",
      subject: `[Beiqiang order packet] ${record.reference} · V${packet.version} ${packet.status.replaceAll("_", " ")}`,
      text: [
        `Project: ${record.reference}`,
        `Packet: V${packet.version} · ${packet.status.replaceAll("_", " ")}`,
        `Beiqiang note: ${packet.reviewNote}`,
        "",
        packet.status === "reviewed"
          ? "The packet has been reviewed for formal-order preparation. It is still not an order, invoice, payment request or production authorization."
          : "Please reopen your private project page and submit a new packet version. The previous version remains in the history. This is not an order, invoice, payment request or production authorization.",
        "",
        `Private status page: https://www.beiqiang.online/inquiry-status/?reference=${encodeURIComponent(record.reference)}`,
        "Do not send passwords, verification codes or payment credentials by email.",
      ].join("\n"),
    });
    return "sent";
  } catch (error) {
    console.error(
      "Order packet buyer notification failed",
      record.reference,
      packet.id,
      error,
    );
    return "delivery_failed";
  }
}

export function createAdminOrderPreparationPacketHandler({
  getStoreImpl = getStore,
  createTransportImpl = nodemailer.createTransport,
  nowImpl = () => new Date(),
} = {}) {
  return async function onRequestPatch(context) {
    const token = clean(
      (context.request.headers.get("authorization") || "").replace(
        /^Bearer\s+/i,
        "",
      ),
      300,
    );
    const expected = clean(context.env?.INQUIRY_ADMIN_TOKEN, 300);
    if (!expected || !safeEqual(token, expected))
      return response(401, { ok: false, message: "Invalid admin access." });
    let payload;
    try {
      payload = await context.request.json();
    } catch {
      return response(400, { ok: false, message: "Invalid request." });
    }
    const recordDetails = details(payload.reference);
    const packetId = clean(payload.packetId, 50).toUpperCase();
    const action = clean(payload.action, 30);
    const reviewNote = clean(payload.reviewNote, 1000);
    const reviewedBy = clean(payload.reviewedBy, 100) || "Beiqiang sales";
    if (
      !recordDetails ||
      !/^OPP-[A-F0-9]{12}$/.test(packetId) ||
      !["review", "request_revision"].includes(action) ||
      reviewNote.length < 5
    )
      return response(400, {
        ok: false,
        message: "Complete the packet action and a buyer-safe review note.",
      });
    try {
      const store = getStoreImpl("beiqiang-inquiries");
      const record = await store.get(recordDetails.key, {
        type: "json",
        consistency: "strong",
      });
      const packets = Array.isArray(record?.orderPreparationPackets)
        ? record.orderPreparationPackets
        : [];
      const latest = packets.at(-1);
      if (
        !record ||
        !latest ||
        latest.id !== packetId ||
        latest.status !== "submitted"
      )
        return response(409, {
          ok: false,
          message: "Only the latest submitted packet can be reviewed.",
        });
      const reviewedAt = nowImpl().toISOString();
      const status = action === "review" ? "reviewed" : "needs_revision";
      const packet = {
        ...latest,
        status,
        reviewNote,
        reviewedBy,
        reviewedAt,
        buyerNotificationStatus: "pending",
        buyerNotificationAttemptedAt: "",
      };
      const saved = {
        ...record,
        orderPreparationPackets: packets.map((item) =>
          item.id === packetId ? packet : item,
        ),
        updatedAt: reviewedAt,
        buyerUpdate:
          status === "reviewed"
            ? `Order-preparation packet V${packet.version} was reviewed. Formal order terms still require the final Trade Assurance order or signed contract.`
            : `Order-preparation packet V${packet.version} needs revision. Review Beiqiang's note and submit a new version.`,
      };
      await store.setJSON(recordDetails.key, saved, { cacheControl: null });
      const buyerNotificationStatus = await notifyBuyer(
        record,
        packet,
        context.env || {},
        createTransportImpl,
      );
      const buyerNotificationAttemptedAt = nowImpl().toISOString();
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
            item.id === packetId
              ? {
                  ...item,
                  buyerNotificationStatus,
                  buyerNotificationAttemptedAt,
                }
              : item,
          ),
        },
        { cacheControl: null },
      );
      return response(200, {
        ok: true,
        packet: {
          id: packetId,
          version: packet.version,
          status,
          reviewNote,
          reviewedAt,
        },
        message:
          status === "reviewed"
            ? "The packet was marked reviewed for formal-order preparation; no order or payment was created."
            : "A buyer revision was requested and the previous version remains preserved.",
      });
    } catch (error) {
      console.error("Admin order packet review failed", error);
      return response(503, {
        ok: false,
        message: "The packet review could not be saved.",
      });
    }
  };
}

export const onRequestPatch = createAdminOrderPreparationPacketHandler();
