import { timingSafeEqual } from "node:crypto";
import { getStore } from "@edgeone/pages-blob";

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
function increment(map, key, field) {
  const label = String(key || "Direct / unknown").trim() || "Direct / unknown";
  const current = map.get(label) || { label, events: 0, inquiries: 0 };
  current[field] += 1;
  map.set(label, current);
}
function percentage(numerator, denominator) {
  return denominator > 0
    ? Math.min(100, Math.round((numerator / denominator) * 1000) / 10)
    : 0;
}
function acquisitionChannel(attribution = {}) {
  const source = String(attribution.utmSource || "").toLowerCase();
  const referrer = String(attribution.referrer || "").toLowerCase();
  const text = `${source} ${referrer}`;
  if (/linkedin/.test(text)) return "linkedin";
  if (/whatsapp|wa\.me/.test(text)) return "whatsapp";
  if (/alibaba|accio/.test(text)) return "alibaba";
  if (/google|bing|search/.test(text)) return "google";
  if (/tiktok/.test(text)) return "tiktok";
  if (/email|newsletter|outreach/.test(text)) return "email";
  if (/partner|referral|affiliate/.test(text)) return "partner";
  return source || referrer ? "other" : "direct";
}
function acquisitionRecord(map, channel) {
  const current = map.get(channel) || {
    channel,
    events: 0,
    inquiries: 0,
    qualified: 0,
    sampleDiscussion: 0,
    quoted: 0,
    quoteAccepted: 0,
    orderSetupRequested: 0,
    orders: 0,
  };
  map.set(channel, current);
  return current;
}
function comparisonCodes(value) {
  return [
    ...new Set(
      String(value || "")
        .split(",")
        .map((code) => code.trim().toUpperCase())
        .filter((code) => /^BQ\d{3}$/.test(code)),
    ),
  ]
    .slice(0, 4)
    .sort();
}
function hasIssuedQuote(record) {
  return (
    record.status === "quoted" ||
    record.status === "negotiation" ||
    record.status === "order_confirmed" ||
    record.quotations?.some((quote) =>
      [
        "issued",
        "buyer_accepted",
        "buyer_revision_requested",
        "buyer_declined",
        "superseded",
      ].includes(quote.status),
    )
  );
}
function timestamp(value) {
  const parsed = Date.parse(value || "");
  return Number.isFinite(parsed) ? parsed : null;
}
function median(values) {
  if (!values.length) return null;
  const ordered = [...values].sort((a, b) => a - b);
  const middle = Math.floor(ordered.length / 2);
  const value =
    ordered.length % 2
      ? ordered[middle]
      : (ordered[middle - 1] + ordered[middle]) / 2;
  return Math.round(value * 10) / 10;
}
function isActive(record) {
  return !["lost", "spam", "order_confirmed"].includes(record.status);
}
function firstSalesResponseHours(record) {
  const received = timestamp(record.receivedAt);
  if (received === null) return null;
  const responseTimes = (Array.isArray(record.messages) ? record.messages : [])
    .filter((item) => item?.sender === "sales")
    .map((item) => timestamp(item.sentAt))
    .filter((value) => value !== null && value >= received);
  if (!responseTimes.length) return null;
  return (Math.min(...responseTimes) - received) / 3_600_000;
}
function latestRecordedActivity(record) {
  const values = [
    record.receivedAt,
    record.updatedAt,
    ...(record.messages || []).map((item) => item.sentAt),
    ...(record.pipelineHistory || []).map((item) => item.changedAt),
    ...(record.quotations || []).flatMap((item) => [
      item.issuedAt,
      item.createdAt,
      item.buyerRespondedAt,
    ]),
    ...(record.recommendationSets || []).flatMap((item) => [
      item.issuedAt,
      item.buyerRespondedAt,
    ]),
    record.sampleProgram?.updatedAt,
    ...(record.buyerOrderRequests || []).map((item) => item.submittedAt),
  ];
  const parsed = values.map(timestamp).filter((value) => value !== null);
  return parsed.length ? Math.max(...parsed) : null;
}

export function buildSalesExecution(
  cohortInquiries,
  businessInquiries,
  funnel,
  { now = new Date(), today = now.toISOString().slice(0, 10) } = {},
) {
  const exactDurations = cohortInquiries
    .map(firstSalesResponseHours)
    .filter((value) => value !== null);
  const dateOnlyRecorded = cohortInquiries.filter(
    (record) =>
      firstSalesResponseHours(record) === null &&
      timestamp(record.lastContactedAt) !== null,
  ).length;
  const awaitingFirstResponse = cohortInquiries.filter(
    (record) =>
      isActive(record) &&
      firstSalesResponseHours(record) === null &&
      timestamp(record.lastContactedAt) === null,
  ).length;
  const active = businessInquiries.filter(isActive);
  const staleCutoff = now.getTime() - 14 * 86_400_000;
  const ownerAssigned = active.filter(
    (record) =>
      String(record.owner || "").trim() &&
      !/^unassigned$/i.test(String(record.owner).trim()),
  ).length;
  const actionScheduled = active.filter(
    (record) =>
      String(record.nextAction || "").trim() &&
      timestamp(record.nextActionDue) !== null,
  ).length;
  const overdue = active.filter(
    (record) => record.nextActionDue && record.nextActionDue < today,
  ).length;
  const buyerRepliesAwaiting = active.filter(
    (record) => record.messages?.at(-1)?.sender === "buyer",
  ).length;
  const stale14Days = active.filter((record) => {
    const latest = latestRecordedActivity(record);
    return latest !== null && latest < staleCutoff;
  }).length;
  const denominator = cohortInquiries.length;
  return {
    response: {
      cohort: denominator,
      exactMeasured: exactDurations.length,
      dateOnlyRecorded,
      awaitingFirstResponse,
      exactCoverageRate: percentage(exactDurations.length, denominator),
      recordedContactRate: percentage(
        exactDurations.length + dateOnlyRecorded,
        denominator,
      ),
      medianHours: median(exactDurations),
      within24Hours: exactDurations.filter((hours) => hours <= 24).length,
      within24HourRate: percentage(
        exactDurations.filter((hours) => hours <= 24).length,
        exactDurations.length,
      ),
    },
    pipeline: {
      active: active.length,
      ownerAssigned,
      ownerCoverageRate: percentage(ownerAssigned, active.length),
      actionScheduled,
      actionCoverageRate: percentage(actionScheduled, active.length),
      overdue,
      overdueRate: percentage(overdue, active.length),
      buyerRepliesAwaiting,
      stale14Days,
      staleRate: percentage(stale14Days, active.length),
    },
    stageRates: {
      qualified: percentage(funnel.qualified, denominator),
      sampleDiscussion: percentage(funnel.sampleDiscussion, denominator),
      quoted: percentage(funnel.quoted, denominator),
      quoteAccepted: percentage(funnel.quoteAccepted, denominator),
      orderSetupRequested: percentage(funnel.orderSetupRequested, denominator),
      orders: percentage(funnel.orders, denominator),
    },
    definition:
      "First-response timing uses the earliest timestamped sales message after the website inquiry. lastContactedAt proves only a date-level contact record and is excluded from response-time calculations. Stage rates are current verified states for inquiries received in the selected period, not a same-week causal sequence or revenue forecast.",
  };
}

async function listRecords(store, prefix, max = 5000) {
  const records = [];
  let cursor;
  let truncated = false;
  while (records.length < max) {
    const result = await store.list({
      prefix,
      limit: Math.min(500, max - records.length),
      cursor,
      consistency: "strong",
    });
    const blobs = Array.isArray(result?.blobs) ? result.blobs : [];
    const page = (
      await Promise.all(
        blobs.map(({ key }) =>
          store.get(key, { type: "json", consistency: "strong" }),
        ),
      )
    ).filter(Boolean);
    records.push(...page);
    if (!result?.cursor || !blobs.length) break;
    cursor = result.cursor;
  }
  if (records.length >= max) truncated = true;
  return { records, truncated };
}

async function listPeriodRecords(
  store,
  prefix,
  days,
  now = new Date(),
  max = 5000,
) {
  const records = [];
  let truncated = false;
  for (let offset = 0; offset < days && records.length < max; offset += 1) {
    const date = new Date(now);
    date.setUTCDate(date.getUTCDate() - offset);
    const result = await listRecords(
      store,
      `${prefix}${date.toISOString().slice(0, 10)}/`,
      max - records.length,
    );
    records.push(...result.records);
    truncated = truncated || result.truncated;
  }
  return { records, truncated: truncated || records.length >= max };
}

export function buildCommercialAnalytics(
  events,
  inquiries,
  { days = 30, now = new Date(), workspaceActivity = [] } = {},
) {
  const to = now.toISOString().slice(0, 10);
  const fromDate = new Date(now);
  fromDate.setUTCDate(fromDate.getUTCDate() - days + 1);
  fromDate.setUTCHours(0, 0, 0, 0);
  const from = fromDate.toISOString().slice(0, 10);
  const cutoff = fromDate.getTime();
  const periodEvents = events.filter(
    (event) => Date.parse(event.receivedAt || event.occurredAt || 0) >= cutoff,
  );
  const periodInquiries = inquiries.filter(
    (record) =>
      !isInternalTest(record) && Date.parse(record.receivedAt || 0) >= cutoff,
  );
  const periodWorkspace = workspaceActivity.filter(
    (event) =>
      event?.analyticsExcluded !== true &&
      Date.parse(event.occurredAt || 0) >= cutoff,
  );
  const lineSheetLeads = periodInquiries.filter(
    (record) => record.context === "line_sheet",
  );
  const sourcingInquiries = periodInquiries.filter(
    (record) => record.context !== "line_sheet",
  );
  const countEvent = (name) =>
    periodEvents.filter((event) => event.event === name).length;
  const successfulQuoteAdds = periodEvents.filter(
    (event) =>
      event.event === "quote_list_add" && event.details?.inserted !== false,
  ).length;
  const qualifiedStages = new Set([
    "qualified",
    "sample_discussion",
    "quoted",
    "negotiation",
    "order_confirmed",
  ]);
  const sampleStages = new Set([
    "sample_discussion",
    "quoted",
    "negotiation",
    "order_confirmed",
  ]);
  const withIssuedQuote = sourcingInquiries.filter(hasIssuedQuote).length;
  const acceptedQuotes = sourcingInquiries.filter((record) =>
    record.quotations?.some((quote) => quote.status === "buyer_accepted"),
  ).length;
  const funnel = {
    productViews: countEvent("product_view"),
    quoteAdds: successfulQuoteAdds,
    quoteBuilderViews: countEvent("quote_builder_view"),
    quoteRequests:
      countEvent("quote_request_submit") + countEvent("form_submit"),
    inquiries: sourcingInquiries.length,
    qualified: sourcingInquiries.filter((record) =>
      qualifiedStages.has(record.status),
    ).length,
    sampleDiscussion: sourcingInquiries.filter((record) =>
      sampleStages.has(record.status),
    ).length,
    quoted: withIssuedQuote,
    quoteAccepted: acceptedQuotes,
    orderSetupRequested: sourcingInquiries.filter(
      (record) => record.buyerOrderRequests?.length,
    ).length,
    orders: sourcingInquiries.filter(
      (record) => record.status === "order_confirmed",
    ).length,
  };
  const sourceMap = new Map();
  periodEvents.forEach((event) =>
    increment(sourceMap, event.attribution?.utmSource, "events"),
  );
  periodInquiries.forEach((record) =>
    increment(sourceMap, record.attribution?.utmSource, "inquiries"),
  );
  const acquisitionMap = new Map();
  periodEvents.forEach((event) => {
    acquisitionRecord(
      acquisitionMap,
      acquisitionChannel(event.attribution),
    ).events += 1;
  });
  sourcingInquiries.forEach((record) => {
    const current = acquisitionRecord(
      acquisitionMap,
      acquisitionChannel(record.attribution),
    );
    current.inquiries += 1;
    if (qualifiedStages.has(record.status)) current.qualified += 1;
    if (sampleStages.has(record.status)) current.sampleDiscussion += 1;
    if (hasIssuedQuote(record)) current.quoted += 1;
    if (record.quotations?.some((quote) => quote.status === "buyer_accepted"))
      current.quoteAccepted += 1;
    if (record.buyerOrderRequests?.length) current.orderSetupRequested += 1;
    if (record.status === "order_confirmed") current.orders += 1;
  });
  const productMap = new Map();
  const product = (code) => {
    const label =
      String(code || "Unknown")
        .trim()
        .toUpperCase() || "Unknown";
    const current = productMap.get(label) || {
      code: label,
      views: 0,
      compares: 0,
      specSheets: 0,
      shares: 0,
      comparisonShares: 0,
      comparisonOpens: 0,
      comparisonPrints: 0,
      quoteAdds: 0,
      inquiries: 0,
    };
    productMap.set(label, current);
    return current;
  };
  periodEvents.forEach((event) => {
    const code = event.details?.styleCode;
    if (!code) return;
    if (event.event === "product_view") product(code).views += 1;
    if (event.event === "product_compare") product(code).compares += 1;
    if (event.event === "product_spec_sheet_print")
      product(code).specSheets += 1;
    if (event.event === "product_share") product(code).shares += 1;
    if (event.event === "quote_list_add" && event.details?.inserted !== false)
      product(code).quoteAdds += 1;
  });
  const comparisonMap = new Map();
  periodEvents
    .filter((event) =>
      ["comparison_share", "comparison_open", "comparison_print"].includes(
        event.event,
      ),
    )
    .forEach((event) => {
      const codes = comparisonCodes(event.details?.styleCodes);
      if (codes.length < 2) return;
      const label = codes.join(" · ");
      const current = comparisonMap.get(label) || {
        codes: label,
        shares: 0,
        opens: 0,
        prints: 0,
      };
      if (event.event === "comparison_share") current.shares += 1;
      else if (event.event === "comparison_open") current.opens += 1;
      else current.prints += 1;
      codes.forEach((code) => {
        if (event.event === "comparison_share")
          product(code).comparisonShares += 1;
        else if (event.event === "comparison_open")
          product(code).comparisonOpens += 1;
        else product(code).comparisonPrints += 1;
      });
      comparisonMap.set(label, current);
    });
  sourcingInquiries.forEach((record) => {
    const codes =
      Array.isArray(record.items) && record.items.length
        ? record.items.map((item) => item.code)
        : String(record.styleCode || "").split(",");
    [
      ...new Set(codes.map((code) => String(code).trim()).filter(Boolean)),
    ].forEach((code) => {
      product(code).inquiries += 1;
    });
  });
  const collectionSlugs = [
    "wide-toe-box",
    "knit-slip-on",
    "breathable-lace-up",
  ];
  const collectionJourneys = collectionSlugs.map((slug) => {
    const cohort = sourcingInquiries.filter(
      (record) => record.sourcingProgram === `collection-${slug}`,
    );
    const collectionEvents = periodEvents.filter(
      (event) => event.details?.context === slug,
    );
    return {
      slug,
      views: collectionEvents.filter(
        (event) => event.event === "collection_view",
      ).length,
      productOpens: collectionEvents.filter(
        (event) => event.event === "collection_product_open",
      ).length,
      quoteHandoffs: collectionEvents.filter(
        (event) => event.event === "collection_quote_cta",
      ).length,
      inquiries: cohort.length,
      qualified: cohort.filter((record) => qualifiedStages.has(record.status))
        .length,
      sampleDiscussion: cohort.filter((record) =>
        sampleStages.has(record.status),
      ).length,
      quoted: cohort.filter(hasIssuedQuote).length,
      orders: cohort.filter((record) => record.status === "order_confirmed")
        .length,
    };
  });
  const dayMap = new Map();
  for (let index = 0; index < days; index += 1) {
    const date = new Date(fromDate);
    date.setUTCDate(date.getUTCDate() + index);
    const key = date.toISOString().slice(0, 10);
    dayMap.set(key, {
      date: key,
      productViews: 0,
      quoteAdds: 0,
      quoteRequests: 0,
      inquiries: 0,
      orders: 0,
    });
  }
  periodEvents.forEach((event) => {
    const day = dayMap.get(
      String(event.receivedAt || event.occurredAt || "").slice(0, 10),
    );
    if (!day) return;
    if (event.event === "product_view") day.productViews += 1;
    if (event.event === "quote_list_add" && event.details?.inserted !== false)
      day.quoteAdds += 1;
    if (["quote_request_submit", "form_submit"].includes(event.event))
      day.quoteRequests += 1;
  });
  periodInquiries.forEach((record) => {
    const day = dayMap.get(String(record.receivedAt || "").slice(0, 10));
    if (!day) return;
    day.inquiries += 1;
    if (record.status === "order_confirmed") day.orders += 1;
  });
  const businessInquiries = inquiries.filter(
    (record) => !isInternalTest(record),
  );
  const meetingRequests = businessInquiries.flatMap((record) =>
    Array.isArray(record.meetingRequests) ? record.meetingRequests : [],
  );
  const meetingChangeRequests = meetingRequests.flatMap((item) =>
    Array.isArray(item.changeRequests) ? item.changeRequests : [],
  );
  const orderChangeRequests = businessInquiries.flatMap((record) =>
    Array.isArray(record.orderChangeRequests) ? record.orderChangeRequests : [],
  );
  const fulfillmentCases = businessInquiries.flatMap((record) =>
    Array.isArray(record.fulfillmentCases) ? record.fulfillmentCases : [],
  );
  const deliveryFeedback = businessInquiries.flatMap((record) =>
    Array.isArray(record.deliveryFeedback) ? record.deliveryFeedback : [],
  );
  const repeatOrders = businessInquiries.flatMap((record) =>
    Array.isArray(record.repeatOrderOpportunities)
      ? record.repeatOrderOpportunities
      : [],
  );
  const stageMap = new Map();
  businessInquiries
    .flatMap((record) =>
      Array.isArray(record.pipelineHistory) ? record.pipelineHistory : [],
    )
    .filter((event) => Date.parse(event.changedAt || 0) >= cutoff)
    .forEach((event) =>
      stageMap.set(event.to, (stageMap.get(event.to) || 0) + 1),
    );
  const lossMap = new Map();
  periodInquiries
    .filter((record) => record.status === "lost")
    .forEach((record) => {
      const reason = record.lostReason || "legacy_unspecified";
      lossMap.set(reason, (lossMap.get(reason) || 0) + 1);
    });
  const workspaceCount = (event, outcome = null) =>
    periodWorkspace.filter(
      (item) =>
        item.event === event && (outcome === null || item.outcome === outcome),
    ).length;
  const requestEvents = periodWorkspace.filter(
    (item) => item.event === "workspace_access_request",
  );
  const eligibleRequests = requestEvents.filter((item) =>
    ["sent", "smtp_unavailable", "delivery_failed"].includes(item.outcome),
  ).length;
  const linksSent = requestEvents.filter(
    (item) => item.outcome === "sent",
  ).length;
  const successfulRedemptions = periodWorkspace.filter(
    (item) =>
      item.event === "workspace_link_redeemed" && item.outcome === "success",
  );
  const loadedEvents = periodWorkspace.filter(
    (item) => item.event === "workspace_loaded" && item.outcome === "success",
  );
  const projectOpenEvents = periodWorkspace.filter(
    (item) => item.event === "workspace_project_open",
  );
  const unique = (items) =>
    new Set(items.map((item) => item.emailHash).filter(Boolean)).size;
  const projectMap = new Map();
  periodWorkspace
    .filter(
      (item) =>
        ["workspace_project_open", "workspace_private_project_open"].includes(
          item.event,
        ) && item.reference,
    )
    .forEach((item) => {
      const current = projectMap.get(item.reference) || {
        reference: item.reference,
        summaryOpens: 0,
        privateHandoffs: 0,
      };
      if (item.event === "workspace_project_open") current.summaryOpens += 1;
      else current.privateHandoffs += 1;
      projectMap.set(item.reference, current);
    });
  const workspace = {
    accessRequests: requestEvents.length,
    eligibleRequests,
    linksSent,
    deliveryFailures: requestEvents.filter((item) =>
      ["smtp_unavailable", "delivery_failed"].includes(item.outcome),
    ).length,
    unknownRequests: requestEvents.filter((item) => item.outcome === "unknown")
      .length,
    rateLimitedRequests: requestEvents.filter(
      (item) => item.outcome === "rate_limited",
    ).length,
    linkRedemptions: successfulRedemptions.length,
    redemptionFailures:
      workspaceCount("workspace_link_redeemed") - successfulRedemptions.length,
    workspaceLoads: loadedEvents.length,
    uniqueRedeemedBuyers: unique(successfulRedemptions),
    uniqueActiveBuyers: unique(loadedEvents),
    projectSummaryOpens: projectOpenEvents.length,
    uniqueProjectReaders: unique(projectOpenEvents),
    privateProjectHandoffs: workspaceCount("workspace_private_project_open"),
    signOuts: workspaceCount("workspace_closed"),
    linkDeliveryRate: percentage(linksSent, eligibleRequests),
    linkRedemptionRate: percentage(successfulRedemptions.length, linksSent),
    workspaceAdoptionRate: percentage(
      unique(loadedEvents),
      unique(successfulRedemptions),
    ),
    projectEngagementRate: percentage(
      unique(projectOpenEvents),
      unique(loadedEvents),
    ),
    projects: [...projectMap.values()]
      .sort(
        (a, b) =>
          b.privateHandoffs - a.privateHandoffs ||
          b.summaryOpens - a.summaryOpens,
      )
      .slice(0, 20),
    privacyNote:
      "Operational workspace metrics use hashed email identifiers and project references only. They do not store email addresses, magic-link tokens, session tokens, project access codes, prices, files or message text.",
    collectionJourneys,
  };
  const salesExecution = buildSalesExecution(
    sourcingInquiries,
    businessInquiries,
    funnel,
    { now, today: to },
  );
  const acquisitionChannels = [...acquisitionMap.values()]
    .map((item) => ({
      ...item,
      inquiryToQualifiedRate: percentage(item.qualified, item.inquiries),
      inquiryToQuotedRate: percentage(item.quoted, item.inquiries),
    }))
    .sort(
      (a, b) =>
        b.inquiries - a.inquiries ||
        b.qualified - a.qualified ||
        b.quoted - a.quoted ||
        b.events - a.events,
    );
  const comparisonJourneys = [...comparisonMap.values()]
    .sort(
      (a, b) =>
        b.prints - a.prints ||
        b.opens - a.opens ||
        b.shares - a.shares ||
        a.codes.localeCompare(b.codes),
    )
    .slice(0, 12);
  return {
    period: {
      days,
      from,
      to,
      consentNote:
        "Website marketing-event counts include only visitors who accepted optional first-party analytics. Buyer-workspace operational events are recorded as necessary service and security activity with hashed identifiers. Inquiry stages are the current state of business inquiries received within the selected period; line-sheet leads are reported separately.",
    },
    funnel,
    salesExecution,
    workspace,
    supporting: {
      mobileMenuOpens: countEvent("mobile_nav_open"),
      mobileMenuLinks: countEvent("mobile_nav_link"),
      sourcingProgramViews: countEvent("sourcing_program_view"),
      sourcingProgramCtas: countEvent("sourcing_program_cta"),
      resourceViews: countEvent("resource_view"),
      resourceCtas: countEvent("resource_cta"),
      resourceProductOpens: countEvent("resource_product_open"),
      lineSheetLeads: lineSheetLeads.length,
      lineSheetDownloads: countEvent("line_sheet_download"),
      productSpecSheets: countEvent("product_spec_sheet_print"),
      productShares: countEvent("product_share"),
      comparisonShares: countEvent("comparison_share"),
      comparisonOpens: countEvent("comparison_open"),
      buyerMessages: periodInquiries.reduce(
        (sum, record) => sum + (record.messages?.length || 0),
        0,
      ),
      buyerFiles: periodInquiries.reduce(
        (sum, record) => sum + (record.attachments?.length || 0),
        0,
      ),
      buyerDocuments: periodInquiries.reduce(
        (sum, record) => sum + (record.orderDocuments?.length || 0),
        0,
      ),
      meetingRequestsSubmitted: meetingRequests.filter(
        (item) => Date.parse(item.submittedAt || 0) >= cutoff,
      ).length,
      meetingsPending: meetingRequests.filter(
        (item) => item.status === "pending",
      ).length,
      meetingsConfirmed: meetingRequests.filter(
        (item) => item.status === "confirmed",
      ).length,
      meetingsCompleted: meetingRequests.filter(
        (item) =>
          item.status === "completed" &&
          Date.parse(item.completedAt || 0) >= cutoff,
      ).length,
      meetingCalendarDownloads: meetingRequests.reduce(
        (sum, item) =>
          sum +
          (Array.isArray(item.calendarDownloads)
            ? item.calendarDownloads.filter(
                (value) => Date.parse(value || 0) >= cutoff,
              ).length
            : 0),
        0,
      ),
      meetingProjectsWithCalendarDownload: businessInquiries.filter((record) =>
        record.meetingRequests?.some((item) =>
          item.calendarDownloads?.some(
            (value) => Date.parse(value || 0) >= cutoff,
          ),
        ),
      ).length,
      meetingChangesSubmitted: meetingChangeRequests.filter(
        (item) => Date.parse(item.submittedAt || 0) >= cutoff,
      ).length,
      meetingChangesPending: meetingChangeRequests.filter(
        (item) => item.status === "pending",
      ).length,
      meetingChangesApproved: meetingChangeRequests.filter(
        (item) =>
          item.status === "approved" &&
          Date.parse(item.reviewedAt || 0) >= cutoff,
      ).length,
      quoteRevisions: periodInquiries.filter((record) =>
        record.quotations?.some(
          (quote) => quote.buyerDecision === "revision_requested",
        ),
      ).length,
      quoteDeclines: periodInquiries.filter((record) =>
        record.quotations?.some((quote) => quote.buyerDecision === "declined"),
      ).length,
      orderChangesProposed: orderChangeRequests.filter(
        (item) => Date.parse(item.createdAt || 0) >= cutoff,
      ).length,
      orderChangesAccepted: orderChangeRequests.filter(
        (item) =>
          item.status === "buyer_accepted" &&
          Date.parse(item.buyerRespondedAt || 0) >= cutoff,
      ).length,
      orderChangesRejected: orderChangeRequests.filter(
        (item) =>
          item.status === "buyer_rejected" &&
          Date.parse(item.buyerRespondedAt || 0) >= cutoff,
      ).length,
      orderChangesAwaitingBuyer: orderChangeRequests.filter(
        (item) => item.status === "awaiting_buyer",
      ).length,
      fulfillmentCasesOpened: fulfillmentCases.filter(
        (item) => Date.parse(item.createdAt || 0) >= cutoff,
      ).length,
      fulfillmentCasesResolved: fulfillmentCases.filter(
        (item) =>
          item.status === "resolved" &&
          Date.parse(item.resolvedAt || 0) >= cutoff,
      ).length,
      fulfillmentCasesOpen: fulfillmentCases.filter(
        (item) => item.status !== "resolved",
      ).length,
      repeatOrdersSubmitted: repeatOrders.filter(
        (item) => Date.parse(item.submittedAt || 0) >= cutoff,
      ).length,
      repeatOrdersQualified: repeatOrders.filter(
        (item) =>
          item.status === "qualified" &&
          Date.parse(item.updatedAt || 0) >= cutoff,
      ).length,
      repeatOrdersConverted: repeatOrders.filter(
        (item) =>
          item.status === "converted" &&
          Date.parse(item.updatedAt || 0) >= cutoff,
      ).length,
      repeatOrdersOpen: repeatOrders.filter(
        (item) => !["converted", "closed"].includes(item.status),
      ).length,
      deliveriesConfirmed: deliveryFeedback.filter(
        (item) =>
          item.action === "received_as_expected" &&
          Date.parse(item.createdAt || 0) >= cutoff,
      ).length,
      deliveryIssuesReported: deliveryFeedback.filter(
        (item) =>
          item.action === "report_issue" &&
          Date.parse(item.createdAt || 0) >= cutoff,
      ).length,
      overdue: periodInquiries.filter(
        (record) =>
          record.nextActionDue &&
          record.nextActionDue < to &&
          !["lost", "spam", "order_confirmed"].includes(record.status),
      ).length,
    },
    comparisonJourneys,
    stageActivity: [...stageMap.entries()]
      .map(([stage, count]) => ({ stage, count }))
      .sort((a, b) => b.count - a.count),
    lossReasons: [...lossMap.entries()]
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count),
    sources: [...sourceMap.values()]
      .sort((a, b) => b.inquiries - a.inquiries || b.events - a.events)
      .slice(0, 12),
    acquisitionChannels,
    products: [...productMap.values()]
      .sort(
        (a, b) =>
          b.inquiries - a.inquiries ||
          b.quoteAdds - a.quoteAdds ||
          b.comparisonOpens - a.comparisonOpens ||
          b.comparisonShares - a.comparisonShares ||
          b.shares - a.shares ||
          b.specSheets - a.specSheets ||
          b.compares - a.compares ||
          b.views - a.views,
      )
      .slice(0, 15),
    daily: [...dayMap.values()],
  };
}

export function createAdminAnalyticsHandler({ getStoreImpl = getStore } = {}) {
  return async function onRequestGet(context) {
    if (!context.env?.INQUIRY_ADMIN_TOKEN)
      return response(503, {
        ok: false,
        message: "Inquiry dashboard access has not been configured.",
      });
    if (!authorized(context.request, context.env))
      return response(401, { ok: false, message: "Invalid access token." });
    const rawDays = Number(
      new URL(context.request.url).searchParams.get("days") || 30,
    );
    const days = [7, 30, 90].includes(rawDays) ? rawDays : 30;
    try {
      const now = new Date();
      const [eventResult, inquiryResult, workspaceResult] = await Promise.all([
        listPeriodRecords(
          getStoreImpl("beiqiang-events"),
          "events/",
          days,
          now,
        ),
        listRecords(getStoreImpl("beiqiang-inquiries"), "inquiries/"),
        listPeriodRecords(
          getStoreImpl("beiqiang-buyer-access"),
          "activity/",
          days,
          now,
        ),
      ]);
      return response(200, {
        ok: true,
        analytics: {
          ...buildCommercialAnalytics(
            eventResult.records,
            inquiryResult.records,
            { days, now, workspaceActivity: workspaceResult.records },
          ),
          coverage: {
            eventsLoaded: eventResult.records.length,
            inquiriesLoaded: inquiryResult.records.length,
            workspaceActivityLoaded: workspaceResult.records.length,
            truncated:
              eventResult.truncated ||
              inquiryResult.truncated ||
              workspaceResult.truncated,
          },
        },
      });
    } catch (error) {
      console.error("Commercial analytics read failed", error);
      return response(503, {
        ok: false,
        message: "Commercial analytics could not be loaded.",
      });
    }
  };
}

// Keep the route export alias separate from the local binding name. The weekly-review
// function imports this module for its aggregate calculator, and EdgeOne's production
// function bundler flattens imported modules before generating the route entry. A local
// binding also named `onRequestGet` collides with the weekly-review route's own binding.
const adminAnalyticsRouteHandler = createAdminAnalyticsHandler();
export { adminAnalyticsRouteHandler as onRequestGet };
