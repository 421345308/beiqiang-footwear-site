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
function authorized(request, env) {
  const expected =
    typeof env?.INQUIRY_ADMIN_TOKEN === "string"
      ? env.INQUIRY_ADMIN_TOKEN.trim()
      : "";
  const header = request.headers.get("authorization") || "";
  const supplied = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);
  return a.length === b.length && a.length > 0 && timingSafeEqual(a, b);
}
function isInternalTest(record) {
  const text =
    `${record?.name || ""} ${record?.company || ""} ${record?.requirements || ""} ${record?.quantity || ""}`.toLowerCase();
  return /internal|deployment test|smtp test|test only|\b0\s*pairs?\b/.test(
    text,
  );
}
function addDays(date, days) {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
function offsetMinutes(value) {
  const match = /^UTC\s*([+-])\s*(\d{1,2})(?::?(\d{2}))?$/i.exec(value || "");
  if (!match) return null;
  const hours = Number(match[2]);
  const minutes = Number(match[3] || 0);
  if (hours > 14 || minutes > 59 || (hours === 14 && minutes !== 0))
    return null;
  return (match[1] === "+" ? 1 : -1) * (hours * 60 + minutes);
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
function meetingStart(item) {
  if (
    item.confirmedStartUtc &&
    !Number.isNaN(new Date(item.confirmedStartUtc).getTime())
  )
    return new Date(item.confirmedStartUtc);
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(
    item.confirmedSlot || "",
  );
  if (!match) return null;
  const parts = match.slice(1).map(Number);
  const wall = Date.UTC(parts[0], parts[1] - 1, parts[2], parts[3], parts[4]);
  const fixed = item.timezone === "UTC" ? 0 : offsetMinutes(item.timezone);
  if (fixed !== null) return new Date(wall - fixed * 60_000);
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: item.timezone }).format(
      new Date(),
    );
  } catch {
    return null;
  }
  let candidate = new Date(wall);
  for (let index = 0; index < 3; index += 1) {
    const seen = zonedParts(candidate, item.timezone);
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
  const check = zonedParts(candidate, item.timezone);
  return [check.year, check.month, check.day, check.hour, check.minute].every(
    (value, index) => value === parts[index],
  )
    ? candidate
    : null;
}

async function listRecords(store, max = 5000) {
  const records = [];
  let cursor;
  let truncated = false;
  while (records.length < max) {
    const result = await store.list({
      prefix: "inquiries/",
      limit: Math.min(500, max - records.length),
      cursor,
      consistency: "strong",
    });
    const blobs = Array.isArray(result?.blobs) ? result.blobs : [];
    records.push(
      ...(
        await Promise.all(
          blobs.map(({ key }) =>
            store.get(key, { type: "json", consistency: "strong" }),
          ),
        )
      ).filter(Boolean),
    );
    if (!result?.cursor || !blobs.length) break;
    cursor = result.cursor;
  }
  if (records.length >= max) truncated = true;
  return { records, truncated };
}

export function buildReminderSummary(
  records,
  today = new Date().toISOString().slice(0, 10),
  now = new Date(),
) {
  const soon = addDays(today, 3);
  const soonTime = now.getTime() + 72 * 60 * 60 * 1000;
  const active = records.filter(
    (record) =>
      !isInternalTest(record) && !["lost", "spam"].includes(record.status),
  );
  const followUps = [];
  const sourcingReviews = [];
  const recommendations = [];
  const quotes = [];
  const meetings = [];
  const orderPackets = [];
  const orderConfirmations = [];
  const orderChanges = [];
  const fulfillmentCases = [];
  const repeatOrders = [];
  const payments = [];
  active.forEach((record) => {
    const identity = {
      reference: record.reference,
      company: record.company || "Unknown company",
      owner: record.owner || "Unassigned",
    };
    if (
      record.nextActionDue &&
      record.nextActionDue < today &&
      record.status !== "order_confirmed"
    )
      followUps.push({
        ...identity,
        dueDate: record.nextActionDue,
        action: record.nextAction || "Define the next action",
      });
    const recommendation = Array.isArray(record.recommendationSets)
      ? record.recommendationSets.at(-1)
      : null;
    if (
      record.status !== "order_confirmed" &&
      record.finderBrief?.mode === "human_review" &&
      !record.recommendationSets?.some((item) => item.status === "issued")
    ) {
      const dueDate = addDays(
        String(record.receivedAt || `${today}T00:00:00Z`).slice(0, 10),
        1,
      );
      if (dueDate <= soon)
        sourcingReviews.push({
          ...identity,
          dueDate,
          timing:
            dueDate < today
              ? "overdue"
              : dueDate === today
                ? "due_today"
                : "due_soon",
          action: "prepare_human_shortlist",
          priority: record.finderBrief.priority || "not_recorded",
          buyerChannel: record.finderBrief.buyerChannel || "not_recorded",
          closure: record.finderBrief.closure || "not_recorded",
          startingStyles:
            record.finderBrief.styleCodes?.join(", ") ||
            "No starting catalog match",
        });
    }
    const recommendationFollowUps = Array.isArray(recommendation?.followUps)
      ? recommendation.followUps
      : [];
    if (
      record.status !== "order_confirmed" &&
      recommendation?.status === "issued" &&
      !recommendation.buyerRespondedAt &&
      recommendationFollowUps.length < 2
    ) {
      const stage =
        recommendationFollowUps.length === 0
          ? "selection_check"
          : "sample_or_quote";
      const base = recommendationFollowUps.length
        ? recommendationFollowUps.at(-1).sentAt
        : recommendation.issuedAt;
      const dueDate = base
        ? addDays(
            String(base).slice(0, 10),
            recommendationFollowUps.length ? 4 : 2,
          )
        : "";
      if (dueDate && dueDate <= soon)
        recommendations.push({
          ...identity,
          recommendationId: recommendation.id,
          styles:
            recommendation.items?.map((item) => item.code).join(", ") ||
            "Recommended styles",
          dueDate,
          stage,
          timing:
            dueDate < today
              ? "overdue"
              : dueDate === today
                ? "due_today"
                : "due_soon",
        });
    }
    (record.quotations || [])
      .filter(
        (quote) =>
          quote.status === "issued" &&
          quote.validUntil &&
          quote.validUntil <= soon,
      )
      .forEach((quote) =>
        quotes.push({
          ...identity,
          quoteNumber: quote.quoteNumber,
          validUntil: quote.validUntil,
          timing: quote.validUntil < today ? "expired" : "expiring",
        }),
      );
    (record.meetingRequests || [])
      .filter((item) => ["pending", "confirmed"].includes(item.status))
      .forEach((item) => {
        if (item.status === "pending") {
          const dueDate = addDays(
            String(item.submittedAt || `${today}T00:00:00Z`).slice(0, 10),
            1,
          );
          if (dueDate <= soon)
            meetings.push({
              ...identity,
              requestId: item.id,
              meetingType: item.meetingType,
              action: "review_request",
              dueDate,
              timing:
                dueDate < today
                  ? "overdue"
                  : dueDate === today
                    ? "due_today"
                    : "due_soon",
              confirmedSlot: "",
              timezone: item.timezone || "",
              channel: item.preferredChannel || "",
              notificationStatus: item.notificationStatus || "not_recorded",
            });
          return;
        }
        const pendingChange = Array.isArray(item.changeRequests)
          ? item.changeRequests.find((change) => change.status === "pending")
          : null;
        const start = meetingStart(item);
        const duration = [30, 45, 60, 90].includes(Number(item.durationMinutes))
          ? Number(item.durationMinutes)
          : 30;
        const end = start
          ? new Date(start.getTime() + duration * 60_000)
          : null;
        let action = "";
        let timing = "";
        let dueDate = today;
        if (pendingChange) {
          action = "review_change";
          dueDate = addDays(
            String(pendingChange.submittedAt || `${today}T00:00:00Z`).slice(
              0,
              10,
            ),
            1,
          );
          timing =
            dueDate < today
              ? "overdue"
              : dueDate === today
                ? "due_today"
                : "due_soon";
        } else if (!start) {
          action = "reconfirm_timezone";
          timing = "needs_correction";
        } else if ((item.notificationStatus || "not_recorded") !== "sent") {
          action = "verify_notification";
          timing = "delivery_not_confirmed";
          dueDate = start.toISOString().slice(0, 10);
        } else if (end && end.getTime() < now.getTime()) {
          action = "record_outcome";
          timing = "overdue";
          dueDate = end.toISOString().slice(0, 10);
        } else if (start && start.getTime() <= soonTime) {
          action = "prepare_meeting";
          timing =
            start.getTime() - now.getTime() <= 24 * 60 * 60 * 1000
              ? "within_24_hours"
              : "within_72_hours";
          dueDate = start.toISOString().slice(0, 10);
        }
        if (action)
          meetings.push({
            ...identity,
            requestId: item.id,
            meetingType: item.meetingType,
            action,
            dueDate,
            timing,
            confirmedSlot: item.confirmedSlot || "",
            timezone: item.timezone || "",
            channel: item.confirmedChannel || "",
            notificationStatus: item.notificationStatus || "not_recorded",
          });
      });
    (record.orderChangeRequests || [])
      .filter((item) => item.status === "awaiting_buyer" && item.createdAt)
      .forEach((item) => {
        const dueDate = addDays(String(item.createdAt).slice(0, 10), 2);
        if (dueDate <= soon)
          orderChanges.push({
            ...identity,
            changeId: item.id,
            orderReference:
              record.orderHandoff?.orderReference ||
              "Order reference unavailable",
            baseVersion: item.baseVersion,
            changedFields: item.changedFields || [],
            reason: item.reason || "Reason not recorded",
            notificationStatus: item.notificationStatus || "not_recorded",
            dueDate,
            timing:
              dueDate < today
                ? "overdue"
                : dueDate === today
                  ? "due_today"
                  : "due_soon",
          });
      });
    const latestPacket = Array.isArray(record.orderPreparationPackets)
      ? record.orderPreparationPackets.at(-1)
      : null;
    if (latestPacket?.status === "submitted" && latestPacket.submittedAt) {
      const dueDate = addDays(String(latestPacket.submittedAt).slice(0, 10), 1);
      if (dueDate <= soon)
        orderPackets.push({
          ...identity,
          packetId: latestPacket.id,
          version: latestPacket.version,
          quoteNumber: latestPacket.quoteNumber,
          dueDate,
          timing:
            dueDate < today
              ? "overdue"
              : dueDate === today
                ? "due_today"
                : "due_soon",
          action: "review_order_packet",
        });
    }
    const latestConfirmation = Array.isArray(record.orderConfirmationDrafts)
      ? record.orderConfirmationDrafts.at(-1)
      : null;
    if (latestConfirmation && !record.orderHandoff) {
      let action = "";
      let dueDate = String(latestConfirmation.issuedAt || today).slice(0, 10);
      if (latestConfirmation.status === "buyer_revision_requested") action = "issue_revised_confirmation";
      if (latestConfirmation.status === "buyer_accepted") action = "create_authoritative_order";
      if (latestConfirmation.status === "awaiting_buyer") {
        dueDate = addDays(dueDate, 2);
        action = ["delivery_failed", "smtp_not_configured"].includes(latestConfirmation.notificationStatus)
          ? "verify_confirmation_delivery"
          : "follow_up_confirmation";
      }
      if (action && dueDate <= soon)
        orderConfirmations.push({
          ...identity,
          draftId: latestConfirmation.id,
          version: latestConfirmation.version,
          status: latestConfirmation.status,
          action,
          dueDate,
          timing: dueDate < today ? "overdue" : dueDate === today ? "due_today" : "due_soon",
        });
    }
    (record.fulfillmentCases || [])
      .filter((item) =>
        [
          "awaiting_buyer",
          "buyer_revision_requested",
          "open_internal",
        ].includes(item.status),
      )
      .forEach((item) => {
        const dueDate =
          item.status === "awaiting_buyer"
            ? item.responseDue
            : String(item.buyerRespondedAt || item.createdAt || today).slice(
                0,
                10,
              );
        if (dueDate && dueDate <= soon)
          fulfillmentCases.push({
            ...identity,
            caseId: item.id,
            orderReference:
              record.orderHandoff?.orderReference ||
              "Order reference unavailable",
            category: item.category,
            title: item.title,
            status: item.status,
            dueDate,
            timing:
              dueDate < today
                ? "overdue"
                : dueDate === today
                  ? "due_today"
                  : "due_soon",
          });
      });
    (record.repeatOrderOpportunities || [])
      .filter(
        (item) =>
          !["converted", "closed"].includes(item.status) &&
          item.nextActionDue &&
          item.nextActionDue <= soon,
      )
      .forEach((item) =>
        repeatOrders.push({
          ...identity,
          opportunityId: item.id,
          sourceOrderReference: item.sourceOrderReference,
          intent: item.intent,
          status: item.status,
          styles: item.styleCodes || [],
          indicativeQuantity: item.indicativeQuantity,
          dueDate: item.nextActionDue,
          timing:
            item.nextActionDue < today
              ? "overdue"
              : item.nextActionDue === today
                ? "due_today"
                : "due_soon",
          action: item.nextAction,
        }),
      );
    (record.orderHandoff?.paymentMilestones || [])
      .filter(
        (item) =>
          ["planned", "due"].includes(item.status) &&
          item.dueDate &&
          item.dueDate <= soon,
      )
      .forEach((item) =>
        payments.push({
          ...identity,
          orderReference: record.orderHandoff.orderReference,
          label: item.label,
          amount: item.amount,
          currency: record.orderHandoff.paymentCurrency || "USD",
          dueDate: item.dueDate,
          timing: item.dueDate < today ? "overdue" : "due_soon",
        }),
      );
  });
  const byDate = (a, b) =>
    String(a.dueDate || a.validUntil).localeCompare(
      String(b.dueDate || b.validUntil),
    );
  followUps.sort(byDate);
  sourcingReviews.sort(byDate);
  recommendations.sort(byDate);
  quotes.sort(byDate);
  meetings.sort(byDate);
  orderPackets.sort(byDate);
  orderConfirmations.sort(byDate);
  orderChanges.sort(byDate);
  fulfillmentCases.sort(byDate);
  repeatOrders.sort(byDate);
  payments.sort(byDate);
  return {
    today,
    windowEnds: soon,
    counts: {
      followUps: followUps.length,
      sourcingReviews: sourcingReviews.length,
      recommendations: recommendations.length,
      quotes: quotes.length,
      meetings: meetings.length,
      orderPackets: orderPackets.length,
      orderConfirmations: orderConfirmations.length,
      orderChanges: orderChanges.length,
      fulfillmentCases: fulfillmentCases.length,
      repeatOrders: repeatOrders.length,
      payments: payments.length,
      total:
        followUps.length +
        sourcingReviews.length +
        recommendations.length +
        quotes.length +
        meetings.length +
        orderPackets.length +
        orderConfirmations.length +
        orderChanges.length +
        fulfillmentCases.length +
        repeatOrders.length +
        payments.length,
    },
    followUps,
    sourcingReviews,
    recommendations,
    quotes,
    meetings,
    orderPackets,
    orderConfirmations,
    orderChanges,
    fulfillmentCases,
    repeatOrders,
    payments,
  };
}

function digestText(summary) {
  const lines = [
    `Beiqiang sales reminder digest · ${summary.today}`,
    `Window: through ${summary.windowEnds}`,
    "",
    `Overdue follow-ups: ${summary.counts.followUps}`,
    `Human sourcing reviews awaiting shortlist: ${summary.counts.sourcingReviews}`,
    `Product-shortlist follow-ups: ${summary.counts.recommendations}`,
    `Expired / expiring quotations: ${summary.counts.quotes}`,
    `Sourcing-meeting actions: ${summary.counts.meetings}`,
    `Order-preparation packets awaiting review: ${summary.counts.orderPackets}`,
    `Pre-order confirmation actions: ${summary.counts.orderConfirmations}`,
    `Confirmed-order changes awaiting buyer: ${summary.counts.orderChanges}`,
    `Open fulfillment exceptions: ${summary.counts.fulfillmentCases}`,
    `Repeat-order / next-project actions: ${summary.counts.repeatOrders}`,
    `Overdue / due-soon payments: ${summary.counts.payments}`,
  ];
  if (summary.followUps.length) {
    lines.push("", "OVERDUE FOLLOW-UPS");
    summary.followUps.forEach((item) =>
      lines.push(
        `${item.dueDate} · ${item.reference} · ${item.company} · ${item.owner} · ${item.action}`,
      ),
    );
  }
  if (summary.sourcingReviews.length) {
    lines.push("", "HUMAN SOURCING REVIEWS AWAITING SHORTLIST");
    summary.sourcingReviews.forEach((item) =>
      lines.push(
        `${item.dueDate} · ${item.timing} · ${item.reference} · ${item.company} · ${item.owner} · ${item.buyerChannel} / ${item.priority} / ${item.closure} · ${item.startingStyles} · ${item.action}`,
      ),
    );
  }
  if (summary.recommendations.length) {
    lines.push("", "PRODUCT SHORTLIST FOLLOW-UPS");
    summary.recommendations.forEach((item) =>
      lines.push(
        `${item.dueDate} · ${item.timing} · ${item.reference} · ${item.company} · ${item.styles} · ${item.stage}`,
      ),
    );
  }
  if (summary.quotes.length) {
    lines.push("", "QUOTATIONS");
    summary.quotes.forEach((item) =>
      lines.push(
        `${item.validUntil} · ${item.timing} · ${item.quoteNumber} · ${item.company} · ${item.owner}`,
      ),
    );
  }
  if (summary.meetings.length) {
    lines.push("", "SOURCING MEETINGS");
    summary.meetings.forEach((item) =>
      lines.push(
        `${item.dueDate} · ${item.timing} · ${item.requestId} · ${item.reference} · ${item.company} · ${item.action} · ${item.confirmedSlot || "time awaiting review"} ${item.timezone} · ${item.owner}`,
      ),
    );
  }
  if (summary.orderChanges.length) {
    lines.push("", "CONFIRMED-ORDER CHANGES AWAITING BUYER");
    summary.orderChanges.forEach((item) =>
      lines.push(
        `${item.dueDate} · ${item.timing} · ${item.changeId} · ${item.reference} / ${item.orderReference} · version ${item.baseVersion} · ${item.changedFields.join(", ")} · buyer email ${item.notificationStatus} · ${item.owner}`,
      ),
    );
  }
  if (summary.orderPackets.length) {
    lines.push("", "ORDER-PREPARATION PACKETS");
    summary.orderPackets.forEach((item) =>
      lines.push(
        `${item.dueDate} · ${item.reference} · ${item.company} · V${item.version} · ${item.quoteNumber}`,
      ),
    );
  }
  if (summary.orderConfirmations.length) {
    lines.push("", "PRE-ORDER CONFIRMATION ACTIONS");
    summary.orderConfirmations.forEach((item) =>
      lines.push(`${item.dueDate} · ${item.timing} · ${item.draftId} · ${item.reference} · V${item.version} · ${item.status} · ${item.action} · ${item.owner}`),
    );
  }
  if (summary.fulfillmentCases.length) {
    lines.push("", "FULFILLMENT EXCEPTIONS");
    summary.fulfillmentCases.forEach((item) =>
      lines.push(
        `${item.dueDate} · ${item.timing} · ${item.caseId} · ${item.reference} / ${item.orderReference} · ${item.category} · ${item.status} · ${item.owner}`,
      ),
    );
  }
  if (summary.repeatOrders.length) {
    lines.push("", "REPEAT-ORDER / NEXT-PROJECT ACTIONS");
    summary.repeatOrders.forEach((item) =>
      lines.push(
        `${item.dueDate} · ${item.timing} · ${item.opportunityId} · ${item.reference} / ${item.sourceOrderReference} · ${item.intent} · ${item.status} · ${item.indicativeQuantity} · ${item.owner} · ${item.action}`,
      ),
    );
  }
  if (summary.payments.length) {
    lines.push("", "PAYMENT MILESTONES");
    summary.payments.forEach((item) =>
      lines.push(
        `${item.dueDate} · ${item.timing} · ${item.reference} / ${item.orderReference} · ${item.label} · ${item.currency} ${item.amount} · ${item.owner}`,
      ),
    );
  }
  lines.push(
    "",
    "Open https://www.beiqiang.online/admin/inquiries/ and verify each record before contacting a buyer or changing any commercial status.",
    "This digest is an internal operating reminder, not proof of payment, quotation acceptance or order confirmation.",
  );
  return lines.join("\n");
}

export function createAdminReminderHandlers({
  getStoreImpl = getStore,
  createTransportImpl = nodemailer.createTransport,
  nowImpl = () => new Date(),
} = {}) {
  async function prepare(context) {
    if (!context.env?.INQUIRY_ADMIN_TOKEN)
      return {
        response: response(503, {
          ok: false,
          message: "Inquiry dashboard access has not been configured.",
        }),
      };
    if (!authorized(context.request, context.env))
      return {
        response: response(401, {
          ok: false,
          message: "Invalid access token.",
        }),
      };
    try {
      const result = await listRecords(getStoreImpl("beiqiang-inquiries"));
      const now = nowImpl();
      return {
        summary: buildReminderSummary(
          result.records,
          now.toISOString().slice(0, 10),
          now,
        ),
        truncated: result.truncated,
      };
    } catch (error) {
      console.error("Reminder summary failed", error);
      return {
        response: response(503, {
          ok: false,
          message: "Sales reminders could not be calculated.",
        }),
      };
    }
  }
  async function onRequestGet(context) {
    const prepared = await prepare(context);
    return (
      prepared.response ||
      response(200, {
        ok: true,
        summary: prepared.summary,
        truncated: prepared.truncated,
      })
    );
  }
  async function onRequestPost(context) {
    const prepared = await prepare(context);
    if (prepared.response) return prepared.response;
    if (!context.env?.SMTP_PASS)
      return response(503, {
        ok: false,
        message: "SMTP is not configured for reminder email.",
      });
    const reminderStore = getStoreImpl("beiqiang-reminders");
    const key = `digests/${prepared.summary.today}.json`;
    const existing = await reminderStore.get(key, {
      type: "json",
      consistency: "strong",
    });
    if (existing)
      return response(409, {
        ok: false,
        message: existing.sentAt
          ? `Today's reminder digest was already sent at ${existing.sentAt}.`
          : "Today's reminder digest is already being prepared.",
        summary: prepared.summary,
      });
    try {
      await reminderStore.setJSON(
        key,
        {
          date: prepared.summary.today,
          status: "sending",
          startedAt: nowImpl().toISOString(),
          counts: prepared.summary.counts,
        },
        { onlyIfNew: true, cacheControl: null },
      );
    } catch {
      return response(409, {
        ok: false,
        message: "Today's reminder digest is already being prepared.",
        summary: prepared.summary,
      });
    }
    try {
      const recipient = context.env.INQUIRY_NOTIFY_TO || "421345308@qq.com";
      const transport = createTransportImpl({
        host: context.env.SMTP_HOST || "smtp.qq.com",
        port: Number(context.env.SMTP_PORT || 465),
        secure: String(context.env.SMTP_SECURE || "true") !== "false",
        auth: {
          user: context.env.SMTP_USER || "421345308@qq.com",
          pass: context.env.SMTP_PASS,
        },
      });
      await transport.sendMail({
        from:
          context.env.SMTP_FROM || context.env.SMTP_USER || "421345308@qq.com",
        to: recipient,
        subject: `[Beiqiang follow-up digest] ${prepared.summary.today} · ${prepared.summary.counts.total} actions`,
        text: digestText(prepared.summary),
      });
      const sentAt = nowImpl().toISOString();
      await reminderStore.setJSON(
        key,
        {
          date: prepared.summary.today,
          status: "sent",
          sentAt,
          counts: prepared.summary.counts,
        },
        { cacheControl: null },
      );
      return response(200, { ok: true, sentAt, summary: prepared.summary });
    } catch (error) {
      try {
        await reminderStore.delete(key);
      } catch {
        /* allow the next manual attempt after a transient SMTP failure */
      }
      console.error("Reminder digest delivery failed", error);
      return response(503, {
        ok: false,
        message: "Reminder digest could not be sent.",
      });
    }
  }
  return { onRequestGet, onRequestPost };
}

const handlers = createAdminReminderHandlers();
export const onRequestGet = handlers.onRequestGet;
export const onRequestPost = handlers.onRequestPost;
