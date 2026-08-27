import { createHash, timingSafeEqual } from "node:crypto";
import { getStore } from "@edgeone/pages-blob";

function json(status, body) {
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
function escapeIcs(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}
function formatUtc(value) {
  return value
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}
function offsetMinutes(value) {
  const match = /^UTC\s*([+-])\s*(\d{1,2})(?::?(\d{2}))?$/i.exec(value);
  if (!match) return null;
  const hours = Number(match[2]);
  const minutes = Number(match[3] || 0);
  if (hours > 14 || minutes > 59 || (hours === 14 && minutes !== 0))
    return null;
  return (match[1] === "+" ? 1 : -1) * (hours * 60 + minutes);
}
function isIanaZone(value) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date());
    return value.includes("/") || value === "UTC";
  } catch {
    return false;
  }
}
function zonedParts(date, timeZone) {
  const values = {};
  for (const part of new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date))
    if (part.type !== "literal") values[part.type] = Number(part.value);
  return values;
}
function localToUtc(local, timezone) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!match) return null;
  const parts = match.slice(1).map(Number);
  const wall = Date.UTC(parts[0], parts[1] - 1, parts[2], parts[3], parts[4]);
  const fixed = timezone === "UTC" ? 0 : offsetMinutes(timezone);
  if (fixed !== null) return new Date(wall - fixed * 60_000);
  if (!isIanaZone(timezone)) return null;
  let candidate = new Date(wall);
  for (let index = 0; index < 3; index += 1) {
    const seen = zonedParts(candidate, timezone);
    const represented = Date.UTC(
      seen.year,
      seen.month - 1,
      seen.day,
      seen.hour,
      seen.minute,
      seen.second,
    );
    candidate = new Date(candidate.getTime() + wall - represented);
  }
  const check = zonedParts(candidate, timezone);
  return [check.year, check.month, check.day, check.hour, check.minute].every(
    (value, index) => value === parts[index],
  )
    ? candidate
    : null;
}
function buildCalendar(record, item) {
  const start = localToUtc(item.confirmedSlot, item.timezone);
  if (!start) return null;
  const duration = [30, 45, 60, 90].includes(Number(item.durationMinutes))
    ? Number(item.durationMinutes)
    : 30;
  const end = new Date(start.getTime() + duration * 60_000);
  const type = item.meetingType.replaceAll("_", " ");
  const channel = item.confirmedChannel.replaceAll("_", " ");
  const description = [
    `Project: ${record.reference}`,
    `Purpose: ${type}`,
    `Current confirmed time: ${item.confirmedSlot} (${item.timezone})`,
    `Channel: ${channel}`,
    `Agenda: ${item.agenda}`,
    item.reviewNote ? `Preparation note: ${item.reviewNote}` : "",
    item.meetingLink ? `Secure meeting link: ${item.meetingLink}` : "",
    "",
    "This meeting supports sourcing communication only. Product specifications, sample results, price, payment and orders require separate written confirmation.",
  ]
    .filter(Boolean)
    .join("\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Beiqiang Footwear//Sourcing Meeting//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${escapeIcs(item.id)}@beiqiang.online`,
    `DTSTAMP:${formatUtc(new Date(item.reviewedAt || item.submittedAt))}`,
    `LAST-MODIFIED:${formatUtc(new Date(item.reviewedAt || item.submittedAt))}`,
    `SEQUENCE:${Array.isArray(item.scheduleHistory) ? item.scheduleHistory.length : 0}`,
    `DTSTART:${formatUtc(start)}`,
    `DTEND:${formatUtc(end)}`,
    `SUMMARY:${escapeIcs(`Beiqiang sourcing meeting · ${record.reference}`)}`,
    `DESCRIPTION:${escapeIcs(description)}`,
    `LOCATION:${escapeIcs(channel)}`,
    item.meetingLink ? `URL:${escapeIcs(item.meetingLink)}` : "",
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ]
    .filter((line) => line !== "")
    .join("\r\n");
}

export function createMeetingCalendarHandler({
  getStoreImpl = getStore,
  nowImpl = () => new Date(),
} = {}) {
  return async function onRequestPost(context) {
    if (!isAllowedOrigin(context.request.headers.get("origin")))
      return json(403, {
        ok: false,
        message: "Request origin is not allowed.",
      });
    let payload;
    try {
      payload = await context.request.json();
    } catch {
      return json(400, { ok: false, message: "Invalid request." });
    }
    const recordDetails = details(payload.reference);
    const accessCode = clean(payload.accessCode, 40).toUpperCase();
    const requestId = clean(payload.requestId, 40).toUpperCase();
    if (
      !recordDetails ||
      !/^[A-F0-9]{20}$/.test(accessCode) ||
      !/^BMR-[A-F0-9]{12}$/.test(requestId)
    )
      return json(400, {
        ok: false,
        message: "Check the project and meeting details.",
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
        return json(404, {
          ok: false,
          message: "No matching project was found.",
        });
      const item = (record.meetingRequests || []).find(
        (candidate) => candidate.id === requestId,
      );
      if (!item || item.status !== "confirmed")
        return json(409, {
          ok: false,
          message:
            "Only a currently confirmed meeting can be added to a calendar.",
        });
      const calendar = buildCalendar(record, item);
      if (!calendar)
        return json(409, {
          ok: false,
          message:
            "The confirmed time zone cannot be converted safely. Ask Beiqiang to reconfirm the meeting time.",
        });
      try {
        const downloadedAt = nowImpl().toISOString();
        const downloads = [
          ...(Array.isArray(item.calendarDownloads)
            ? item.calendarDownloads
            : []),
          downloadedAt,
        ].slice(-20);
        const updated = {
          ...record,
          meetingRequests: record.meetingRequests.map((candidate) =>
            candidate.id === requestId
              ? {
                  ...candidate,
                  calendarDownloads: downloads,
                  calendarLastDownloadedAt: downloadedAt,
                }
              : candidate,
          ),
          updatedAt: downloadedAt,
        };
        await store.setJSON(recordDetails.key, updated, { cacheControl: null });
      } catch (error) {
        console.error(
          "Meeting calendar activity could not be recorded",
          recordDetails.reference,
          requestId,
          error,
        );
      }
      return new Response(calendar, {
        status: 200,
        headers: {
          "Content-Type": "text/calendar; charset=UTF-8",
          "Content-Disposition": `attachment; filename="beiqiang-${item.id.toLowerCase()}.ics"`,
          "Cache-Control": "no-store, private",
          "X-Content-Type-Options": "nosniff",
        },
      });
    } catch (error) {
      console.error(
        "Meeting calendar generation failed",
        recordDetails?.reference,
        requestId,
        error,
      );
      return json(503, {
        ok: false,
        message: "The calendar file is temporarily unavailable.",
      });
    }
  };
}

export const onRequestPost = createMeetingCalendarHandler();
