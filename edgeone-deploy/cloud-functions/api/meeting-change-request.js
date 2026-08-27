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
function validTimezone(value) {
  if (
    /^UTC(?:\s*[+-]\s*(?:\d|1[0-3])(?::?[0-5]\d)?|\s*[+-]\s*14(?::?00)?)?$/i.test(
      value,
    )
  )
    return true;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date());
    return value.includes("/");
  } catch {
    return false;
  }
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
function details(reference) {
  const normalized = clean(reference, 40).toUpperCase();
  const match = /^BQ-(\d{4})(\d{2})(\d{2})-([A-F0-9]{8})$/.exec(normalized);
  return match
    ? {
        reference: normalized,
        key: `inquiries/${match[1]}-${match[2]}-${match[3]}/${normalized}.json`,
      }
    : null;
}
function slots(value, now) {
  const today = now.toISOString().slice(0, 10);
  const latest = new Date(now);
  latest.setUTCDate(latest.getUTCDate() + 180);
  const latestDate = latest.toISOString().slice(0, 10);
  return Array.isArray(value)
    ? [
        ...new Set(
          value
            .map((item) => clean(item, 16))
            .filter(
              (item) =>
                /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(item) &&
                item.slice(0, 10) >= today &&
                item.slice(0, 10) <= latestDate,
            ),
        ),
      ].slice(0, 3)
    : [];
}

async function notifySales(record, meeting, change, env, createTransportImpl) {
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
      subject: `[Meeting ${change.action} review] ${record.reference} · ${meeting.id}`,
      text: [
        `Project: ${record.reference}`,
        `Meeting: ${meeting.id}`,
        `Buyer: ${record.name || "Not supplied"} · ${record.company || "Not supplied"}`,
        `Current confirmed time: ${meeting.confirmedSlot} (${meeting.timezone})`,
        `Requested action: ${change.action}`,
        change.action === "reschedule"
          ? `Proposed local slots: ${change.preferredSlots.join(" | ")} (${change.timezone})`
          : "",
        `Reason: ${change.reason}`,
        "",
        "This is a buyer request awaiting human review. The current confirmed meeting remains unchanged until Beiqiang approves the request.",
      ]
        .filter(Boolean)
        .join("\n"),
    });
    return "sent";
  } catch (error) {
    console.error(
      "Meeting change notification failed",
      record.reference,
      change.id,
      error,
    );
    return "delivery_failed";
  }
}

export function createMeetingChangeRequestHandler({
  getStoreImpl = getStore,
  createTransportImpl = nodemailer.createTransport,
  nowImpl = () => new Date(),
  randomBytesImpl = randomBytes,
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
    const meetingId = clean(payload.meetingId, 40).toUpperCase();
    const action = clean(payload.action, 20);
    const reason = clean(payload.reason, 600);
    const timezone = clean(payload.timezone, 120);
    const now = nowImpl();
    const preferredSlots = slots(payload.preferredSlots, now);
    if (
      !recordDetails ||
      !/^[A-F0-9]{20}$/.test(accessCode) ||
      !/^BMR-[A-F0-9]{12}$/.test(meetingId) ||
      !["reschedule", "cancel"].includes(action) ||
      reason.length < 8 ||
      payload.buyerConfirmation !== true ||
      (action === "reschedule" &&
        (!validTimezone(timezone) || preferredSlots.length < 2))
    )
      return response(400, {
        ok: false,
        message:
          "Complete the change type, reason, confirmation and, for rescheduling, a valid time zone plus at least two future local-time options.",
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
      const requests = Array.isArray(record.meetingRequests)
        ? record.meetingRequests
        : [];
      const meeting = requests.find((item) => item.id === meetingId);
      if (!meeting || meeting.status !== "confirmed")
        return response(409, {
          ok: false,
          message:
            "Only a currently confirmed meeting can receive a change request.",
        });
      const changes = Array.isArray(meeting.changeRequests)
        ? meeting.changeRequests
        : [];
      if (changes.some((item) => item.status === "pending"))
        return response(409, {
          ok: false,
          message: "A meeting change request is already awaiting review.",
        });
      if (changes.length >= 10)
        return response(409, {
          ok: false,
          message:
            "This meeting has reached its change-request history limit. Contact Beiqiang directly.",
        });
      const submittedAt = now.toISOString();
      const change = {
        id: `BMC-${randomBytesImpl(6).toString("hex").toUpperCase()}`,
        action,
        reason,
        timezone: action === "reschedule" ? timezone : "",
        preferredSlots: action === "reschedule" ? preferredSlots : [],
        status: "pending",
        submittedAt,
        reviewedAt: "",
        reviewedBy: "",
        reviewNote: "",
        notificationStatus: "pending",
        notificationAttemptedAt: "",
      };
      const savedMeeting = { ...meeting, changeRequests: [...changes, change] };
      const saved = {
        ...record,
        meetingRequests: requests.map((item) =>
          item.id === meetingId ? savedMeeting : item,
        ),
        updatedAt: submittedAt,
      };
      await store.setJSON(recordDetails.key, saved, { cacheControl: null });
      const notificationStatus = await notifySales(
        record,
        meeting,
        change,
        context.env || {},
        createTransportImpl,
      );
      const notificationAttemptedAt = nowImpl().toISOString();
      const latest =
        (await store.get(recordDetails.key, {
          type: "json",
          consistency: "strong",
        })) || saved;
      const finalRecord = {
        ...latest,
        meetingRequests: (latest.meetingRequests || []).map((item) =>
          item.id !== meetingId
            ? item
            : {
                ...item,
                changeRequests: (item.changeRequests || []).map((candidate) =>
                  candidate.id === change.id
                    ? {
                        ...candidate,
                        notificationStatus,
                        notificationAttemptedAt,
                      }
                    : candidate,
                ),
              },
        ),
      };
      await store.setJSON(recordDetails.key, finalRecord, {
        cacheControl: null,
      });
      return response(201, {
        ok: true,
        changeRequest: {
          ...change,
          notificationStatus: undefined,
          notificationAttemptedAt: undefined,
        },
        notificationSent: notificationStatus === "sent",
        message:
          "Your meeting change request was saved for human review. The current confirmed meeting remains unchanged until approval.",
      });
    } catch (error) {
      console.error(
        "Meeting change request failed",
        recordDetails?.reference,
        error,
      );
      return response(503, {
        ok: false,
        message:
          "Your meeting change request could not be saved. Contact Beiqiang by email or WhatsApp.",
      });
    }
  };
}

export const onRequestPost = createMeetingChangeRequestHandler();
