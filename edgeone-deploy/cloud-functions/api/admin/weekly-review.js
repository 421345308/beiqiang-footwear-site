import { timingSafeEqual } from "node:crypto";
import { getStore } from "@edgeone/pages-blob";
import { createAdminAnalyticsHandler } from "./analytics.js";

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
function safeNumber(value, nullable = false) {
  if (nullable && value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : nullable ? null : 0;
}
function safeDays(value) {
  const parsed = Number(value);
  return [7, 30, 90].includes(parsed) ? parsed : 30;
}
const CHANNELS = new Set([
  "email",
  "linkedin",
  "whatsapp",
  "alibaba",
  "google",
  "tiktok",
  "partner",
  "direct",
  "other",
]);
function safeChannels(value) {
  return (Array.isArray(value) ? value : [])
    .slice(0, 9)
    .map((item) => ({
      channel: CHANNELS.has(item?.channel) ? item.channel : "other",
      events: safeNumber(item?.events),
      inquiries: safeNumber(item?.inquiries),
      qualified: safeNumber(item?.qualified),
      sampleDiscussion: safeNumber(item?.sampleDiscussion),
      quoted: safeNumber(item?.quoted),
      quoteAccepted: safeNumber(item?.quoteAccepted),
      orderSetupRequested: safeNumber(item?.orderSetupRequested),
      orders: safeNumber(item?.orders),
      inquiryToQualifiedRate: safeNumber(item?.inquiryToQualifiedRate),
      inquiryToQuotedRate: safeNumber(item?.inquiryToQuotedRate),
    }));
}
function safeProducts(value) {
  return (Array.isArray(value) ? value : [])
    .slice(0, 15)
    .map((item) => ({
      code: String(item?.code || "")
        .toUpperCase()
        .trim(),
      views: safeNumber(item?.views),
      compares: safeNumber(item?.compares),
      specSheets: safeNumber(item?.specSheets),
      shares: safeNumber(item?.shares),
      comparisonShares: safeNumber(item?.comparisonShares),
      comparisonOpens: safeNumber(item?.comparisonOpens),
      comparisonPrints: safeNumber(item?.comparisonPrints),
      quoteAdds: safeNumber(item?.quoteAdds),
      inquiries: safeNumber(item?.inquiries),
    }))
    .filter((item) => /^BQ\d{3}$/.test(item.code));
}
function safeComparisons(value) {
  return (Array.isArray(value) ? value : [])
    .slice(0, 12)
    .map((item) => {
      const codes = [
        ...new Set(
          String(item?.codes || "")
            .split(/[·,]/)
            .map((code) => code.trim().toUpperCase())
            .filter((code) => /^BQ\d{3}$/.test(code)),
        ),
      ]
        .slice(0, 4)
        .sort();
      return {
        codes: codes.join(" · "),
        shares: safeNumber(item?.shares),
        opens: safeNumber(item?.opens),
        prints: safeNumber(item?.prints),
      };
    })
    .filter((item) => item.codes.split(" · ").length >= 2);
}
const COLLECTIONS = new Set([
  "wide-toe-box",
  "knit-slip-on",
  "breathable-lace-up",
]);
function safeCollectionJourneys(value) {
  return (Array.isArray(value) ? value : [])
    .slice(0, 3)
    .map((item) => ({
      slug: COLLECTIONS.has(item?.slug) ? item.slug : "",
      views: safeNumber(item?.views),
      productOpens: safeNumber(item?.productOpens),
      quoteHandoffs: safeNumber(item?.quoteHandoffs),
      inquiries: safeNumber(item?.inquiries),
      qualified: safeNumber(item?.qualified),
      sampleDiscussion: safeNumber(item?.sampleDiscussion),
      quoted: safeNumber(item?.quoted),
      orders: safeNumber(item?.orders),
    }))
    .filter((item) => item.slug);
}

export function sanitizeWeeklyReviewSnapshot(source) {
  if (
    !source ||
    typeof source !== "object" ||
    !source.capturedAt ||
    !source.period ||
    !source.salesExecution
  )
    return null;
  const responseData = source.salesExecution.response || {};
  const pipeline = source.salesExecution.pipeline || {};
  const stages = source.salesExecution.stageRates || {};
  const funnel = source.funnel || {};
  const coverage = source.coverage || {};
  return {
    version:
      source.version >= 11 ||
      source.supporting?.humanSourcingReviewMedianHours !== undefined
        ? 11
        : source.version >= 10 ||
      source.supporting?.humanSourcingReviewsSubmitted !== undefined
        ? 10
        : source.version >= 9 ||
      source.supporting?.productFinderViews !== undefined
        ? 9
        : source.version >= 8 ||
      source.supporting?.privateLabelStudioViews !== undefined
        ? 8
        : source.version >= 7 ||
      source.supporting?.orderConfirmationsIssued !== undefined
        ? 7
        : source.version >= 6 ||
      source.supporting?.meetingChangesSubmitted !== undefined
        ? 6
        : source.version >= 5 ||
      source.supporting?.meetingRequestsSubmitted !== undefined
        ? 5
        : source.version >= 4 || source.comparisonJourneys
          ? 4
          : source.version >= 3 || source.collectionJourneys
            ? 3
            : source.version >= 2 ||
                source.acquisitionChannels ||
                source.products
              ? 2
              : 1,
    id: String(source.id || "").slice(0, 80),
    capturedAt: String(source.capturedAt).slice(0, 40),
    period: {
      days: safeDays(source.period.days),
      from: String(source.period.from || "").slice(0, 10),
      to: String(source.period.to || "").slice(0, 10),
    },
    salesExecution: {
      response: {
        cohort: safeNumber(responseData.cohort),
        exactMeasured: safeNumber(responseData.exactMeasured),
        dateOnlyRecorded: safeNumber(responseData.dateOnlyRecorded),
        awaitingFirstResponse: safeNumber(responseData.awaitingFirstResponse),
        exactCoverageRate: safeNumber(responseData.exactCoverageRate),
        recordedContactRate: safeNumber(responseData.recordedContactRate),
        medianHours: safeNumber(responseData.medianHours, true),
        within24Hours: safeNumber(responseData.within24Hours),
        within24HourRate: safeNumber(responseData.within24HourRate),
      },
      pipeline: {
        active: safeNumber(pipeline.active),
        ownerAssigned: safeNumber(pipeline.ownerAssigned),
        ownerCoverageRate: safeNumber(pipeline.ownerCoverageRate),
        actionScheduled: safeNumber(pipeline.actionScheduled),
        actionCoverageRate: safeNumber(pipeline.actionCoverageRate),
        overdue: safeNumber(pipeline.overdue),
        overdueRate: safeNumber(pipeline.overdueRate),
        buyerRepliesAwaiting: safeNumber(pipeline.buyerRepliesAwaiting),
        stale14Days: safeNumber(pipeline.stale14Days),
        staleRate: safeNumber(pipeline.staleRate),
      },
      stageRates: {
        qualified: safeNumber(stages.qualified),
        sampleDiscussion: safeNumber(stages.sampleDiscussion),
        quoted: safeNumber(stages.quoted),
        quoteAccepted: safeNumber(stages.quoteAccepted),
        orderSetupRequested: safeNumber(stages.orderSetupRequested),
        orders: safeNumber(stages.orders),
      },
      definition: String(source.salesExecution.definition || "").slice(0, 1200),
    },
    funnel: {
      productViews: safeNumber(funnel.productViews),
      quoteAdds: safeNumber(funnel.quoteAdds),
      quoteRequests: safeNumber(funnel.quoteRequests),
      inquiries: safeNumber(funnel.inquiries),
      qualified: safeNumber(funnel.qualified),
      sampleDiscussion: safeNumber(funnel.sampleDiscussion),
      quoted: safeNumber(funnel.quoted),
      quoteAccepted: safeNumber(funnel.quoteAccepted),
      orderSetupRequested: safeNumber(funnel.orderSetupRequested),
      orders: safeNumber(funnel.orders),
    },
    acquisitionChannels: safeChannels(source.acquisitionChannels),
    products: safeProducts(source.products),
    comparisonJourneys: safeComparisons(source.comparisonJourneys),
    collectionJourneys: safeCollectionJourneys(source.collectionJourneys),
    supporting: {
      whatsappClicks: safeNumber(source.supporting?.whatsappClicks),
      emailClicks: safeNumber(source.supporting?.emailClicks),
      contextualContactClicks: safeNumber(source.supporting?.contextualContactClicks),
      resourceViews: safeNumber(source.supporting?.resourceViews),
      resourceProductOpens: safeNumber(source.supporting?.resourceProductOpens),
      resourceCtas: safeNumber(source.supporting?.resourceCtas),
      productShares: safeNumber(source.supporting?.productShares),
      comparisonShares: safeNumber(source.supporting?.comparisonShares),
      comparisonOpens: safeNumber(source.supporting?.comparisonOpens),
      lineSheetLeads: safeNumber(source.supporting?.lineSheetLeads),
      privateLabelStudioViews: safeNumber(source.supporting?.privateLabelStudioViews),
      privateLabelConceptDownloads: safeNumber(source.supporting?.privateLabelConceptDownloads),
      privateLabelConceptQuoteHandoffs: safeNumber(source.supporting?.privateLabelConceptQuoteHandoffs),
      productFinderViews: safeNumber(source.supporting?.productFinderViews),
      productFinderResults: safeNumber(source.supporting?.productFinderResults),
      productFinderComparisonHandoffs: safeNumber(source.supporting?.productFinderComparisonHandoffs),
      productFinderQuoteHandoffs: safeNumber(source.supporting?.productFinderQuoteHandoffs),
      humanSourcingReviewsSubmitted: safeNumber(source.supporting?.humanSourcingReviewsSubmitted),
      humanSourcingReviewsAwaitingShortlist: safeNumber(source.supporting?.humanSourcingReviewsAwaitingShortlist),
      humanSourcingReviewsShortlisted: safeNumber(source.supporting?.humanSourcingReviewsShortlisted),
      humanSourcingReviewExactMeasured: safeNumber(source.supporting?.humanSourcingReviewExactMeasured),
      humanSourcingReviewMedianHours: safeNumber(source.supporting?.humanSourcingReviewMedianHours, true),
      humanSourcingReviewWithin48Hours: safeNumber(source.supporting?.humanSourcingReviewWithin48Hours),
      humanSourcingReviewWithin48HourRate: safeNumber(source.supporting?.humanSourcingReviewWithin48HourRate),
      humanSourcingReviewsOverdue48Hours: safeNumber(source.supporting?.humanSourcingReviewsOverdue48Hours),
      meetingRequestsSubmitted: safeNumber(
        source.supporting?.meetingRequestsSubmitted,
      ),
      meetingsPending: safeNumber(source.supporting?.meetingsPending),
      meetingsConfirmed: safeNumber(source.supporting?.meetingsConfirmed),
      meetingsCompleted: safeNumber(source.supporting?.meetingsCompleted),
      meetingCalendarDownloads: safeNumber(
        source.supporting?.meetingCalendarDownloads,
      ),
      meetingProjectsWithCalendarDownload: safeNumber(
        source.supporting?.meetingProjectsWithCalendarDownload,
      ),
      meetingChangesSubmitted: safeNumber(
        source.supporting?.meetingChangesSubmitted,
      ),
      meetingChangesPending: safeNumber(
        source.supporting?.meetingChangesPending,
      ),
      meetingChangesApproved: safeNumber(
        source.supporting?.meetingChangesApproved,
      ),
      orderPacketsSubmitted: safeNumber(
        source.supporting?.orderPacketsSubmitted,
      ),
      orderPacketsPending: safeNumber(source.supporting?.orderPacketsPending),
      orderPacketsReviewed: safeNumber(
        source.supporting?.orderPacketsReviewed,
      ),
      orderConfirmationsIssued: safeNumber(source.supporting?.orderConfirmationsIssued),
      orderConfirmationsAwaitingBuyer: safeNumber(source.supporting?.orderConfirmationsAwaitingBuyer),
      orderConfirmationsAccepted: safeNumber(source.supporting?.orderConfirmationsAccepted),
      orderConfirmationsRevisionRequested: safeNumber(source.supporting?.orderConfirmationsRevisionRequested),
    },
    coverage: {
      eventsLoaded: safeNumber(coverage.eventsLoaded),
      inquiriesLoaded: safeNumber(coverage.inquiriesLoaded),
      workspaceActivityLoaded: safeNumber(coverage.workspaceActivityLoaded),
      truncated: coverage.truncated === true,
    },
    dataBoundary:
      "Aggregate website operating snapshot only. No buyer identity, contact detail, message, file, quotation line, payment detail, access code or administrator token is stored.",
  };
}

async function listSnapshots(store, limit) {
  const snapshots = [];
  let cursor;
  while (snapshots.length < 100) {
    const result = await store.list({
      prefix: "weekly-reviews/",
      limit: Math.min(100, 100 - snapshots.length),
      cursor,
      consistency: "strong",
    });
    const blobs = Array.isArray(result?.blobs) ? result.blobs : [];
    const page = await Promise.all(
      blobs.map(({ key }) =>
        store.get(key, { type: "json", consistency: "strong" }),
      ),
    );
    page
      .map(sanitizeWeeklyReviewSnapshot)
      .filter(Boolean)
      .forEach((item) => snapshots.push(item));
    if (!result?.cursor || !blobs.length) break;
    cursor = result.cursor;
  }
  return snapshots
    .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt))
    .slice(0, limit);
}

export function createWeeklyReviewHandlers({
  getStoreImpl = getStore,
  analyticsHandlerImpl,
  nowImpl = () => new Date(),
} = {}) {
  const analyticsHandler =
    analyticsHandlerImpl || createAdminAnalyticsHandler({ getStoreImpl });
  function guard(context) {
    if (!context.env?.INQUIRY_ADMIN_TOKEN)
      return response(503, {
        ok: false,
        message: "Inquiry dashboard access has not been configured.",
      });
    if (!authorized(context.request, context.env))
      return response(401, { ok: false, message: "Invalid access token." });
    return null;
  }
  async function onRequestGet(context) {
    const denied = guard(context);
    if (denied) return denied;
    const limit = Math.max(
      1,
      Math.min(
        12,
        Number(new URL(context.request.url).searchParams.get("limit") || 8),
      ),
    );
    try {
      const snapshots = await listSnapshots(
        getStoreImpl("beiqiang-sales-reviews"),
        limit,
      );
      return response(200, {
        ok: true,
        snapshots,
        dataBoundary:
          "Only whitelisted aggregate weekly-review snapshots are returned.",
      });
    } catch (error) {
      console.error("Weekly review history failed", error);
      return response(503, {
        ok: false,
        message: "Weekly review history could not be loaded.",
      });
    }
  }
  async function onRequestPost(context) {
    const denied = guard(context);
    if (denied) return denied;
    const days = safeDays(
      new URL(context.request.url).searchParams.get("days"),
    );
    const capturedAt = nowImpl().toISOString();
    const date = capturedAt.slice(0, 10);
    const key = `weekly-reviews/${date}/${days}.json`;
    const store = getStoreImpl("beiqiang-sales-reviews");
    try {
      const existing = await store.get(key, {
        type: "json",
        consistency: "strong",
      });
      if (existing)
        return response(409, {
          ok: false,
          message: `A ${days}-day aggregate snapshot was already saved today.`,
          snapshot: sanitizeWeeklyReviewSnapshot(existing),
        });
      const analyticsUrl = new URL(context.request.url);
      analyticsUrl.pathname = "/api/admin/analytics";
      analyticsUrl.search = `?days=${days}`;
      const analyticsResponse = await analyticsHandler({
        ...context,
        request: new Request(analyticsUrl, {
          headers: {
            Authorization: context.request.headers.get("authorization") || "",
          },
        }),
      });
      const body = await analyticsResponse.json().catch(() => ({}));
      if (!analyticsResponse.ok || !body.ok || !body.analytics)
        return response(analyticsResponse.status || 503, {
          ok: false,
          message: body.message || "Current analytics could not be calculated.",
        });
      const snapshot = sanitizeWeeklyReviewSnapshot({
        version: 11,
        id: `WR-${date.replaceAll("-", "")}-${days}D`,
        capturedAt,
        period: body.analytics.period,
        salesExecution: body.analytics.salesExecution,
        funnel: body.analytics.funnel,
        acquisitionChannels: body.analytics.acquisitionChannels,
        products: body.analytics.products,
        comparisonJourneys: body.analytics.comparisonJourneys,
        collectionJourneys: body.analytics.workspace?.collectionJourneys,
        supporting: body.analytics.supporting,
        coverage: body.analytics.coverage,
      });
      if (!snapshot)
        return response(503, {
          ok: false,
          message:
            "Current analytics did not contain the required aggregate fields.",
        });
      await store.setJSON(key, snapshot, {
        onlyIfNew: true,
        cacheControl: null,
      });
      return response(201, {
        ok: true,
        snapshot,
        message: `${days}-day aggregate snapshot saved.`,
      });
    } catch (error) {
      console.error("Weekly review snapshot failed", error);
      return response(503, {
        ok: false,
        message: "Weekly review snapshot could not be saved.",
      });
    }
  }
  return { onRequestGet, onRequestPost };
}

const handlers = createWeeklyReviewHandlers();
export const onRequestGet = handlers.onRequestGet;
export const onRequestPost = handlers.onRequestPost;
