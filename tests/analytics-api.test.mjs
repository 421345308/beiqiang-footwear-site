import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCommercialAnalytics,
  createAdminAnalyticsHandler,
} from "../edgeone-deploy/cloud-functions/api/admin/analytics.js";

const events = [
  {
    event: "product_view",
    receivedAt: "2026-08-23T08:00:00.000Z",
    details: { styleCode: "BQ009" },
    attribution: { utmSource: "linkedin" },
  },
  {
    event: "product_compare",
    receivedAt: "2026-08-23T08:00:30.000Z",
    details: { styleCode: "BQ009" },
    attribution: { utmSource: "linkedin" },
  },
  {
    event: "product_spec_sheet_print",
    receivedAt: "2026-08-23T08:00:45.000Z",
    details: { styleCode: "BQ009", context: "product_spec_sheet" },
    attribution: { utmSource: "linkedin" },
  },
  {
    event: "product_share",
    receivedAt: "2026-08-23T08:00:50.000Z",
    details: {
      styleCode: "BQ009",
      channel: "whatsapp",
      context: "product_detail",
    },
    attribution: { utmSource: "linkedin" },
  },
  {
    event: "comparison_share",
    receivedAt: "2026-08-23T08:00:55.000Z",
    details: {
      styleCodes: "BQ009,BQ001",
      channel: "whatsapp",
      context: "catalog_en",
    },
    attribution: { utmSource: "linkedin" },
  },
  {
    event: "comparison_open",
    receivedAt: "2026-08-23T08:00:57.000Z",
    details: { styleCodes: "BQ001,BQ009", context: "catalog_en" },
    attribution: { utmSource: "linkedin" },
  },
  {
    event: "comparison_print",
    receivedAt: "2026-08-23T08:00:59.000Z",
    details: { styleCodes: "BQ009,BQ001", context: "catalog_en" },
    attribution: { utmSource: "linkedin" },
  },
  {
    event: "quote_list_add",
    receivedAt: "2026-08-23T08:01:00.000Z",
    details: { styleCode: "BQ009" },
    attribution: { utmSource: "linkedin" },
  },
  {
    event: "quote_request_submit",
    receivedAt: "2026-08-23T08:02:00.000Z",
    details: { styleCode: "BQ009" },
    attribution: { utmSource: "linkedin" },
  },
  {
    event: "line_sheet_download",
    receivedAt: "2026-08-23T08:03:00.000Z",
    details: { context: "line_sheet" },
    attribution: { utmSource: "linkedin" },
  },
  {
    event: "sourcing_program_view",
    receivedAt: "2026-08-23T08:04:00.000Z",
    details: { context: "wholesale-walking-shoes" },
    attribution: { utmSource: "linkedin" },
  },
  {
    event: "sourcing_program_cta",
    receivedAt: "2026-08-23T08:05:00.000Z",
    details: { context: "wholesale-walking-shoes" },
    attribution: { utmSource: "linkedin" },
  },
  {
    event: "resource_view",
    receivedAt: "2026-08-23T08:05:10.000Z",
    details: { context: "footwear-rfq-checklist" },
    attribution: { utmSource: "linkedin" },
  },
  {
    event: "resource_product_open",
    receivedAt: "2026-08-23T08:05:20.000Z",
    details: { context: "footwear-rfq-checklist", styleCode: "BQ001" },
    attribution: { utmSource: "linkedin" },
  },
  {
    event: "resource_cta",
    receivedAt: "2026-08-23T08:05:30.000Z",
    details: { context: "footwear-rfq-checklist", linkType: "quote" },
    attribution: { utmSource: "linkedin" },
  },
  {
    event: "mobile_nav_open",
    receivedAt: "2026-08-23T08:06:00.000Z",
    details: { context: "site_header" },
    attribution: { utmSource: "linkedin" },
  },
  {
    event: "mobile_nav_link",
    receivedAt: "2026-08-23T08:06:10.000Z",
    details: { context: "site_header", linkType: "All 30 products" },
    attribution: { utmSource: "linkedin" },
  },
  {
    event: "collection_view",
    receivedAt: "2026-08-23T08:07:00.000Z",
    details: { context: "wide-toe-box" },
    attribution: { utmSource: "linkedin" },
  },
  {
    event: "collection_product_open",
    receivedAt: "2026-08-23T08:07:10.000Z",
    details: { context: "wide-toe-box", styleCode: "BQ009" },
    attribution: { utmSource: "linkedin" },
  },
  {
    event: "collection_quote_cta",
    receivedAt: "2026-08-23T08:07:20.000Z",
    details: { context: "wide-toe-box", linkType: "quote" },
    attribution: { utmSource: "linkedin" },
  },
  { event: "private_label_studio_view", receivedAt: "2026-08-23T08:08:00.000Z", details: { context: "private_label_concept", styleCode: "BQ001" }, attribution: { utmSource: "linkedin" } },
  { event: "private_label_concept_download", receivedAt: "2026-08-23T08:08:10.000Z", details: { context: "private_label_concept", styleCode: "BQ001" }, attribution: { utmSource: "linkedin" } },
  { event: "private_label_concept_to_quote", receivedAt: "2026-08-23T08:08:20.000Z", details: { context: "private_label_concept", styleCode: "BQ001" }, attribution: { utmSource: "linkedin" } },
  { event: "product_finder_view", receivedAt: "2026-08-23T08:08:30.000Z", details: { context: "finder_en" }, attribution: { utmSource: "linkedin" } },
  { event: "product_finder_result", receivedAt: "2026-08-23T08:08:40.000Z", details: { context: "finder_en", styleCodes: "BQ001,BQ002", styleCount: 2 }, attribution: { utmSource: "linkedin" } },
  { event: "product_finder_to_compare", receivedAt: "2026-08-23T08:08:50.000Z", details: { context: "finder_en", styleCodes: "BQ001,BQ002", styleCount: 2 }, attribution: { utmSource: "linkedin" } },
  { event: "product_finder_to_quote", receivedAt: "2026-08-23T08:09:00.000Z", details: { context: "finder_en", styleCodes: "BQ001,BQ002", styleCount: 2 }, attribution: { utmSource: "linkedin" } },
  {
    event: "product_view",
    receivedAt: "2025-01-01T08:00:00.000Z",
    details: { styleCode: "OLD" },
  },
];
const workspaceActivity = [
  {
    event: "workspace_access_request",
    outcome: "sent",
    occurredAt: "2026-08-23T08:10:00.000Z",
    emailHash: "a".repeat(64),
  },
  {
    event: "workspace_access_request",
    outcome: "delivery_failed",
    occurredAt: "2026-08-23T08:11:00.000Z",
    emailHash: "b".repeat(64),
  },
  {
    event: "workspace_access_request",
    outcome: "unknown",
    occurredAt: "2026-08-23T08:12:00.000Z",
    emailHash: "c".repeat(64),
  },
  {
    event: "workspace_link_redeemed",
    outcome: "success",
    occurredAt: "2026-08-23T08:13:00.000Z",
    emailHash: "a".repeat(64),
  },
  {
    event: "workspace_loaded",
    outcome: "success",
    occurredAt: "2026-08-23T08:14:00.000Z",
    emailHash: "a".repeat(64),
    projectCount: 1,
  },
  {
    event: "workspace_project_open",
    occurredAt: "2026-08-23T08:15:00.000Z",
    emailHash: "a".repeat(64),
    reference: "BQ-20260823-AAA",
  },
  {
    event: "workspace_private_project_open",
    occurredAt: "2026-08-23T08:16:00.000Z",
    emailHash: "a".repeat(64),
    reference: "BQ-20260823-AAA",
  },
  {
    event: "workspace_loaded",
    outcome: "success",
    occurredAt: "2026-08-23T08:17:00.000Z",
    emailHash: "d".repeat(64),
    analyticsExcluded: true,
  },
];
const inquiries = [
  {
    reference: "BQ-20260823-AAA",
    receivedAt: "2026-08-23T09:00:00.000Z",
    status: "quoted",
    company: "Buyer Co",
    name: "Jane",
    styleCode: "BQ009",
    owner: "Sales A",
    nextAction: "Review buyer decision",
    nextActionDue: "2026-08-24",
    attribution: { utmSource: "linkedin" },
    messages: [
      { id: "1", sender: "sales", sentAt: "2026-08-23T15:00:00.000Z" },
      { id: "2", sender: "buyer", sentAt: "2026-08-23T16:00:00.000Z" },
    ],
    attachments: [{ id: "2" }],
    orderDocuments: [{ id: "3" }],
    quotations: [
      {
        status: "buyer_revision_requested",
        buyerDecision: "revision_requested",
      },
      { status: "buyer_declined", buyerDecision: "declined" },
    ],
    buyerOrderRequests: [{ id: "OSR-1" }],
    orderConfirmationDrafts: [
      { id: "OCD-1", version: 1, status: "buyer_revision_requested", issuedAt: "2026-08-22T09:00:00.000Z", buyerRespondedAt: "2026-08-23T09:05:00.000Z" },
      { id: "OCD-2", version: 2, status: "awaiting_buyer", issuedAt: "2026-08-23T10:00:00.000Z" },
    ],
    orderChangeRequests: [
      {
        id: "OCR-1",
        status: "awaiting_buyer",
        createdAt: "2026-08-23T09:10:00.000Z",
      },
      {
        id: "OCR-2",
        status: "buyer_accepted",
        createdAt: "2026-08-22T09:10:00.000Z",
        buyerRespondedAt: "2026-08-23T09:20:00.000Z",
      },
      {
        id: "OCR-3",
        status: "buyer_rejected",
        createdAt: "2026-08-22T09:10:00.000Z",
        buyerRespondedAt: "2026-08-23T09:25:00.000Z",
      },
    ],
    pipelineHistory: [
      {
        from: "qualified",
        to: "quoted",
        changedAt: "2026-08-23T09:30:00.000Z",
      },
    ],
  },
  {
    reference: "BQ-20260823-LOST",
    receivedAt: "2026-08-23T10:00:00.000Z",
    status: "lost",
    lostReason: "price",
    company: "Other Buyer",
    name: "Joe",
    styleCode: "BQ001",
    pipelineHistory: [
      {
        from: "negotiation",
        to: "lost",
        changedAt: "2026-08-23T10:30:00.000Z",
      },
    ],
  },
  {
    reference: "BQ-20260823-CAT",
    receivedAt: "2026-08-23T10:10:00.000Z",
    status: "new",
    context: "line_sheet",
    company: "Catalogue Buyer",
    name: "Ann",
    styleCode: "CATALOG-2026",
    attribution: { utmSource: "linkedin" },
  },
  {
    reference: "BQ-20260823-TEST",
    receivedAt: "2026-08-23T09:00:00.000Z",
    status: "order_confirmed",
    company: "Beiqiang Internal Test",
    name: "Internal",
    quantity: "0 pairs",
  },
];
inquiries[0].sourcingProgram = "collection-wide-toe-box";
inquiries[0].repeatOrderOpportunities = [
  {
    id: "ROP-1",
    status: "submitted",
    submittedAt: "2026-08-23T10:40:00.000Z",
    updatedAt: "2026-08-23T10:40:00.000Z",
  },
  {
    id: "ROP-2",
    status: "qualified",
    submittedAt: "2026-08-22T10:40:00.000Z",
    updatedAt: "2026-08-23T10:50:00.000Z",
  },
  {
    id: "ROP-3",
    status: "converted",
    submittedAt: "2026-08-21T10:40:00.000Z",
    updatedAt: "2026-08-23T11:00:00.000Z",
  },
];
inquiries[0].meetingRequests = [
  { id: "BMR-1", status: "pending", submittedAt: "2026-08-23T10:00:00.000Z" },
  {
    id: "BMR-2",
    status: "confirmed",
    submittedAt: "2026-08-22T10:00:00.000Z",
    calendarDownloads: ["2026-08-23T10:30:00.000Z", "2026-08-23T10:35:00.000Z"],
    changeRequests: [
      { id: "BMC-1", status: "pending", submittedAt: "2026-08-23T10:40:00.000Z" },
      { id: "BMC-2", status: "approved", submittedAt: "2026-08-22T10:40:00.000Z", reviewedAt: "2026-08-23T10:50:00.000Z" },
    ],
  },
  {
    id: "BMR-3",
    status: "completed",
    submittedAt: "2026-08-21T10:00:00.000Z",
    completedAt: "2026-08-23T11:30:00.000Z",
  },
];

test("builds a consent-aware commercial funnel without counting internal tests", () => {
  const result = buildCommercialAnalytics(events, inquiries, {
    days: 30,
    now: new Date("2026-08-23T12:00:00.000Z"),
    workspaceActivity,
  });
  assert.equal(result.funnel.productViews, 1);
  assert.equal(result.funnel.quoteAdds, 1);
  assert.equal(result.funnel.inquiries, 2);
  assert.equal(result.funnel.quoted, 1);
  assert.equal(result.funnel.orderSetupRequested, 1);
  assert.equal(result.funnel.orders, 0);
  assert.equal(result.supporting.mobileMenuOpens, 1);
  assert.equal(result.supporting.mobileMenuLinks, 1);
  assert.equal(result.supporting.sourcingProgramViews, 1);
  assert.equal(result.supporting.sourcingProgramCtas, 1);
  assert.equal(result.supporting.lineSheetLeads, 1);
  assert.equal(result.supporting.lineSheetDownloads, 1);
  assert.equal(result.supporting.productSpecSheets, 1);
  assert.equal(result.supporting.buyerMessages, 2);
  assert.equal(result.supporting.buyerDocuments, 1);
  assert.equal(result.supporting.quoteRevisions, 1);
  assert.equal(result.supporting.quoteDeclines, 1);
  assert.equal(result.supporting.orderChangesProposed, 3);
  assert.equal(result.supporting.orderChangesAccepted, 1);
  assert.equal(result.supporting.orderChangesRejected, 1);
  assert.equal(result.supporting.orderChangesAwaitingBuyer, 1);
  assert.equal(result.supporting.orderConfirmationsIssued, 2);
  assert.equal(result.supporting.orderConfirmationsAwaitingBuyer, 1);
  assert.equal(result.supporting.orderConfirmationsAccepted, 0);
  assert.equal(result.supporting.orderConfirmationsRevisionRequested, 1);
  assert.equal(result.products[0].code, "BQ009");
  assert.equal(result.products[0].compares, 1);
  assert.equal(result.products[0].specSheets, 1);
  assert.equal(
    result.products.some((item) => item.code === "CATALOG-2026"),
    false,
  );
  assert.equal(result.sources[0].label, "linkedin");
  assert.equal(
    result.stageActivity.find((item) => item.stage === "lost").count,
    1,
  );
  assert.deepEqual(result.lossReasons[0], { reason: "price", count: 1 });
  assert.match(result.period.consentNote, /accepted optional/i);
  assert.equal(result.supporting.resourceViews, 1);
  assert.equal(result.supporting.resourceProductOpens, 1);
  assert.equal(result.supporting.resourceCtas, 1);
  assert.equal(result.supporting.productShares, 1);
  assert.equal(result.supporting.comparisonShares, 1);
  assert.equal(result.supporting.comparisonOpens, 1);
  assert.equal(result.supporting.privateLabelStudioViews, 1);
  assert.equal(result.supporting.privateLabelConceptDownloads, 1);
  assert.equal(result.supporting.privateLabelConceptQuoteHandoffs, 1);
  assert.equal(result.supporting.productFinderViews, 1);
  assert.equal(result.supporting.productFinderResults, 1);
  assert.equal(result.supporting.productFinderComparisonHandoffs, 1);
  assert.equal(result.supporting.productFinderQuoteHandoffs, 1);
  assert.equal(result.products[0].shares, 1);
  assert.equal(result.products[0].comparisonShares, 1);
  assert.equal(result.products[0].comparisonOpens, 1);
  assert.equal(result.products[0].comparisonPrints, 1);
  assert.deepEqual(result.comparisonJourneys[0], {
    codes: "BQ001 · BQ009",
    shares: 1,
    opens: 1,
    prints: 1,
  });
  assert.equal(result.supporting.repeatOrdersSubmitted, 3);
  assert.equal(result.supporting.repeatOrdersQualified, 1);
  assert.equal(result.supporting.repeatOrdersConverted, 1);
  assert.equal(result.supporting.repeatOrdersOpen, 2);
  assert.equal(result.supporting.meetingRequestsSubmitted, 3);
  assert.equal(result.supporting.meetingsPending, 1);
  assert.equal(result.supporting.meetingsConfirmed, 1);
  assert.equal(result.supporting.meetingsCompleted, 1);
  assert.equal(result.supporting.meetingCalendarDownloads, 2);
  assert.equal(result.supporting.meetingProjectsWithCalendarDownload, 1);
  assert.equal(result.supporting.meetingChangesSubmitted, 2);
  assert.equal(result.supporting.meetingChangesPending, 1);
  assert.equal(result.supporting.meetingChangesApproved, 1);
  assert.deepEqual(
    result.acquisitionChannels.find((item) => item.channel === "linkedin"),
    {
      channel: "linkedin",
      events: 27,
      inquiries: 1,
      qualified: 1,
      sampleDiscussion: 1,
      quoted: 1,
      quoteAccepted: 0,
      orderSetupRequested: 1,
      orders: 0,
      inquiryToQualifiedRate: 100,
      inquiryToQuotedRate: 100,
    },
  );
  assert.deepEqual(result.workspace.collectionJourneys[0], {
    slug: "wide-toe-box",
    views: 1,
    productOpens: 1,
    quoteHandoffs: 1,
    inquiries: 1,
    qualified: 1,
    sampleDiscussion: 1,
    quoted: 1,
    orders: 0,
  });
  assert.deepEqual(
    result.acquisitionChannels.find((item) => item.channel === "direct"),
    {
      channel: "direct",
      events: 0,
      inquiries: 1,
      qualified: 0,
      sampleDiscussion: 0,
      quoted: 0,
      quoteAccepted: 0,
      orderSetupRequested: 0,
      orders: 0,
      inquiryToQualifiedRate: 0,
      inquiryToQuotedRate: 0,
    },
  );
  assert.equal(result.workspace.accessRequests, 3);
  assert.equal(result.workspace.linksSent, 1);
  assert.equal(result.workspace.deliveryFailures, 1);
  assert.equal(result.workspace.unknownRequests, 1);
  assert.equal(result.workspace.linkRedemptions, 1);
  assert.equal(result.workspace.uniqueActiveBuyers, 1);
  assert.equal(result.workspace.workspaceLoads, 1);
  assert.equal(result.workspace.projectSummaryOpens, 1);
  assert.equal(result.workspace.privateProjectHandoffs, 1);
  assert.equal(result.workspace.linkDeliveryRate, 50);
  assert.equal(result.workspace.linkRedemptionRate, 100);
  assert.equal(result.workspace.projects[0].reference, "BQ-20260823-AAA");
  assert.equal(
    JSON.stringify(result.workspace).includes("a".repeat(64)),
    false,
  );
  assert.deepEqual(result.salesExecution.response, {
    cohort: 2,
    exactMeasured: 1,
    dateOnlyRecorded: 0,
    awaitingFirstResponse: 0,
    exactCoverageRate: 50,
    recordedContactRate: 50,
    medianHours: 6,
    within24Hours: 1,
    within24HourRate: 100,
  });
  assert.equal(result.salesExecution.pipeline.active, 2);
  assert.equal(result.salesExecution.pipeline.ownerCoverageRate, 50);
  assert.equal(result.salesExecution.pipeline.actionCoverageRate, 50);
  assert.equal(result.salesExecution.pipeline.buyerRepliesAwaiting, 1);
  assert.equal(result.salesExecution.stageRates.quoted, 50);
  assert.match(
    result.salesExecution.definition,
    /not a same-week causal sequence or revenue forecast/i,
  );
});

test("protects commercial analytics with the configured admin token", async () => {
  let reads = 0;
  const handler = createAdminAnalyticsHandler({
    getStoreImpl: () => {
      reads += 1;
      return {};
    },
  });
  const request = new Request(
    "https://www.beiqiang.online/api/admin/analytics?days=30",
    { headers: { Authorization: "Bearer wrong" } },
  );
  const result = await handler({
    request,
    env: { INQUIRY_ADMIN_TOKEN: "correct" },
  });
  assert.equal(result.status, 401);
  assert.equal(reads, 0);
});

test("separates exact first-response timing from date-only contact evidence", () => {
  const cohort = [
    {
      reference: "BQ-R1",
      receivedAt: "2026-08-20T08:00:00.000Z",
      status: "qualified",
      messages: [{ sender: "sales", sentAt: "2026-08-20T10:00:00.000Z" }],
    },
    {
      reference: "BQ-R2",
      receivedAt: "2026-08-20T08:00:00.000Z",
      status: "qualified",
      messages: [{ sender: "sales", sentAt: "2026-08-22T08:00:00.000Z" }],
    },
    {
      reference: "BQ-R3",
      receivedAt: "2026-08-20T08:00:00.000Z",
      status: "qualified",
      lastContactedAt: "2026-08-21",
    },
    {
      reference: "BQ-R4",
      receivedAt: "2026-08-20T08:00:00.000Z",
      status: "new",
      messages: [{ sender: "sales", sentAt: "2026-08-19T08:00:00.000Z" }],
    },
  ];
  const result = buildCommercialAnalytics([], cohort, {
    days: 30,
    now: new Date("2026-08-23T12:00:00.000Z"),
  });
  assert.deepEqual(result.salesExecution.response, {
    cohort: 4,
    exactMeasured: 2,
    dateOnlyRecorded: 1,
    awaitingFirstResponse: 1,
    exactCoverageRate: 50,
    recordedContactRate: 75,
    medianHours: 25,
    within24Hours: 1,
    within24HourRate: 50,
  });
});

test("tracks human sourcing reviews from submission through shortlist issuance", () => {
  const result = buildCommercialAnalytics([], [
    { reference: "BQ-HR-1", receivedAt: "2026-08-22T08:00:00.000Z", status: "new", context: "sourcing_review", finderBrief: { mode: "human_review" } },
    { reference: "BQ-HR-2", receivedAt: "2026-08-21T08:00:00.000Z", status: "qualified", context: "sourcing_review", finderBrief: { mode: "human_review" }, recommendationSets: [{ id: "REC-1", status: "issued", issuedAt: "2026-08-23T09:00:00.000Z" }] },
  ], { days: 30, now: new Date("2026-08-23T12:00:00.000Z") });
  assert.equal(result.supporting.humanSourcingReviewsSubmitted, 2);
  assert.equal(result.supporting.humanSourcingReviewsAwaitingShortlist, 1);
  assert.equal(result.supporting.humanSourcingReviewsShortlisted, 1);
});

test("returns only an aggregated analytics summary", async () => {
  const datasets = {
    "beiqiang-events": Object.fromEntries(
      events
        .slice(0, 10)
        .map((value, index) => [`events/2026-08-23/08/${index}.json`, value]),
    ),
    "beiqiang-inquiries": { "inquiries/2026-08-23/BQ.json": inquiries[0] },
    "beiqiang-buyer-access": Object.fromEntries(
      workspaceActivity.map((value, index) => [
        `activity/2026-08-23/08/${index}.json`,
        value,
      ]),
    ),
  };
  const handler = createAdminAnalyticsHandler({
    getStoreImpl: (name) => ({
      list: async ({ prefix }) => ({
        blobs: Object.keys(datasets[name])
          .filter((key) => key.startsWith(prefix))
          .map((key) => ({ key })),
      }),
      get: async (key) => datasets[name][key],
    }),
  });
  const request = new Request(
    "https://www.beiqiang.online/api/admin/analytics?days=30",
    { headers: { Authorization: "Bearer correct" } },
  );
  const result = await handler({
    request,
    env: { INQUIRY_ADMIN_TOKEN: "correct" },
  });
  const body = await result.json();
  assert.equal(result.status, 200);
  assert.equal(body.analytics.funnel.inquiries, 1);
  assert.equal(body.analytics.coverage.eventsLoaded, 10);
  assert.equal(
    body.analytics.coverage.workspaceActivityLoaded,
    workspaceActivity.length,
  );
  assert.equal(body.analytics.workspace.linksSent, 1);
  assert.equal(body.analytics.salesExecution.response.medianHours, 6);
  assert.equal(JSON.stringify(body).includes("Buyer Co"), false);
  assert.equal(JSON.stringify(body).includes("jane"), false);
  assert.equal(JSON.stringify(body).includes("a".repeat(64)), false);
});
