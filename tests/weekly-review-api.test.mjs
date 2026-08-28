import assert from "node:assert/strict";
import test from "node:test";
import {
  createWeeklyReviewHandlers,
  sanitizeWeeklyReviewSnapshot,
} from "../edgeone-deploy/cloud-functions/api/admin/weekly-review.js";

const execution = {
  response: {
    cohort: 4,
    exactMeasured: 2,
    dateOnlyRecorded: 1,
    awaitingFirstResponse: 1,
    exactCoverageRate: 50,
    recordedContactRate: 75,
    medianHours: 25,
    within24Hours: 1,
    within24HourRate: 50,
  },
  pipeline: {
    active: 3,
    ownerAssigned: 2,
    ownerCoverageRate: 66.7,
    actionScheduled: 2,
    actionCoverageRate: 66.7,
    overdue: 1,
    overdueRate: 33.3,
    buyerRepliesAwaiting: 1,
    stale14Days: 1,
    staleRate: 33.3,
  },
  stageRates: {
    qualified: 75,
    sampleDiscussion: 50,
    quoted: 25,
    quoteAccepted: 0,
    orderSetupRequested: 0,
    orders: 0,
  },
  definition: "Aggregate definition.",
};
const funnel = {
  productViews: 10,
  quoteAdds: 3,
  quoteRequests: 2,
  inquiries: 4,
  qualified: 3,
  sampleDiscussion: 2,
  quoted: 1,
  quoteAccepted: 0,
  orderSetupRequested: 0,
  orders: 0,
};
const analytics = {
  period: { days: 30, from: "2026-07-29", to: "2026-08-27" },
  salesExecution: execution,
  funnel,
  acquisitionChannels: [
    {
      channel: "linkedin",
      events: 10,
      inquiries: 4,
      qualified: 3,
      sampleDiscussion: 2,
      quoted: 1,
      quoteAccepted: 0,
      orderSetupRequested: 0,
      orders: 0,
      inquiryToQualifiedRate: 75,
      inquiryToQuotedRate: 25,
    },
    { channel: "Buyer Name", events: 1, inquiries: 1 },
  ],
  products: [
    {
      code: "BQ009",
      views: 8,
      comparisonShares: 2,
      comparisonOpens: 1,
      comparisonPrints: 1,
      inquiries: 1,
    },
    { code: "BuyerName", views: 1, inquiries: 1 },
  ],
  comparisonJourneys: [
    { codes: "BQ009 · BQ001", shares: 2, opens: 1, prints: 1 },
    { codes: "BuyerName · BQ001", shares: 1, opens: 1, prints: 1 },
  ],
  supporting: {
    resourceViews: 2,
    comparisonShares: 2,
    comparisonOpens: 1,
    meetingRequestsSubmitted: 3,
    meetingsPending: 1,
    meetingsConfirmed: 1,
    meetingsCompleted: 1,
    meetingCalendarDownloads: 2,
    meetingProjectsWithCalendarDownload: 1,
    meetingChangesSubmitted: 2,
    meetingChangesPending: 1,
    meetingChangesApproved: 1,
    orderConfirmationsIssued: 2,
    orderConfirmationsAwaitingBuyer: 1,
    orderConfirmationsAccepted: 1,
    orderConfirmationsRevisionRequested: 1,
  },
  coverage: {
    eventsLoaded: 10,
    inquiriesLoaded: 4,
    workspaceActivityLoaded: 2,
    truncated: false,
  },
  buyerEmail: "must-not-store@example.com",
};

analytics.workspace = {
  collectionJourneys: [
    {
      slug: "wide-toe-box",
      views: 4,
      productOpens: 2,
      quoteHandoffs: 1,
      inquiries: 1,
      qualified: 1,
      sampleDiscussion: 0,
      quoted: 0,
      orders: 0,
    },
  ],
};

function memoryStore(seed = new Map()) {
  return {
    values: seed,
    list: async ({ prefix }) => ({
      blobs: [...seed.keys()]
        .filter((key) => key.startsWith(prefix))
        .map((key) => ({ key })),
    }),
    get: async (key) => seed.get(key) || null,
    setJSON: async (key, value, options) => {
      if (options?.onlyIfNew && seed.has(key)) throw new Error("exists");
      seed.set(key, structuredClone(value));
    },
  };
}

test("weekly review endpoints reject invalid admin access before storage", async () => {
  let reads = 0;
  const handlers = createWeeklyReviewHandlers({
    getStoreImpl: () => {
      reads += 1;
      return memoryStore();
    },
  });
  const result = await handlers.onRequestGet({
    request: new Request(
      "https://www.beiqiang.online/api/admin/weekly-review",
      { headers: { Authorization: "Bearer wrong" } },
    ),
    env: { INQUIRY_ADMIN_TOKEN: "correct" },
  });
  assert.equal(result.status, 401);
  assert.equal(reads, 0);
});

test("saves one immutable aggregate snapshot per day and period", async () => {
  const store = memoryStore();
  const handlers = createWeeklyReviewHandlers({
    getStoreImpl: () => store,
    analyticsHandlerImpl: async () =>
      new Response(JSON.stringify({ ok: true, analytics }), { status: 200 }),
    nowImpl: () => new Date("2026-08-27T09:00:00.000Z"),
  });
  const request = () =>
    new Request("https://www.beiqiang.online/api/admin/weekly-review?days=30", {
      method: "POST",
      headers: { Authorization: "Bearer correct" },
    });
  const first = await handlers.onRequestPost({
    request: request(),
    env: { INQUIRY_ADMIN_TOKEN: "correct" },
  });
  const body = await first.json();
  assert.equal(first.status, 201);
  assert.equal(body.snapshot.id, "WR-20260827-30D");
  assert.equal(body.snapshot.salesExecution.response.medianHours, 25);
  assert.equal(store.values.size, 1);
  assert.equal(JSON.stringify(body).includes("must-not-store"), false);
  assert.match(body.snapshot.dataBoundary, /No buyer identity/i);
  assert.equal(body.snapshot.version, 7);
  assert.equal(body.snapshot.supporting.meetingCalendarDownloads, 2);
  assert.equal(body.snapshot.supporting.meetingChangesPending, 1);
  assert.equal(body.snapshot.acquisitionChannels[0].channel, "linkedin");
  assert.equal(body.snapshot.acquisitionChannels[1].channel, "other");
  assert.deepEqual(
    body.snapshot.products.map((item) => item.code),
    ["BQ009"],
  );
  assert.deepEqual(
    body.snapshot.collectionJourneys[0],
    analytics.workspace.collectionJourneys[0],
  );
  assert.deepEqual(body.snapshot.comparisonJourneys, [
    { codes: "BQ001 · BQ009", shares: 2, opens: 1, prints: 1 },
  ]);
  const duplicate = await handlers.onRequestPost({
    request: request(),
    env: { INQUIRY_ADMIN_TOKEN: "correct" },
  });
  assert.equal(duplicate.status, 409);
  assert.equal(store.values.size, 1);
});

test("history returns only the aggregate snapshot whitelist", async () => {
  const safe = sanitizeWeeklyReviewSnapshot({
    version: 4,
    id: "WR-1",
    capturedAt: "2026-08-26T09:00:00.000Z",
    period: analytics.period,
    salesExecution: execution,
    funnel,
    acquisitionChannels: analytics.acquisitionChannels,
    products: analytics.products,
    comparisonJourneys: analytics.comparisonJourneys,
    collectionJourneys: analytics.workspace.collectionJourneys,
    supporting: analytics.supporting,
    coverage: analytics.coverage,
  });
  const store = memoryStore(
    new Map([
      [
        "weekly-reviews/2026-08-26/30.json",
        { ...safe, buyerEmail: "hidden@example.com", messages: ["hidden"] },
      ],
    ]),
  );
  const handlers = createWeeklyReviewHandlers({ getStoreImpl: () => store });
  const result = await handlers.onRequestGet({
    request: new Request(
      "https://www.beiqiang.online/api/admin/weekly-review?limit=8",
      { headers: { Authorization: "Bearer correct" } },
    ),
    env: { INQUIRY_ADMIN_TOKEN: "correct" },
  });
  const body = await result.json();
  assert.equal(result.status, 200);
  assert.equal(body.snapshots.length, 1);
  assert.equal(body.snapshots[0].funnel.inquiries, 4);
  assert.equal(JSON.stringify(body).includes("hidden@example.com"), false);
  assert.equal(JSON.stringify(body).includes("messages"), false);
  assert.equal(body.snapshots[0].acquisitionChannels[1].channel, "other");
  assert.deepEqual(
    body.snapshots[0].products.map((item) => item.code),
    ["BQ009"],
  );
  assert.equal(body.snapshots[0].collectionJourneys[0].slug, "wide-toe-box");
  assert.deepEqual(body.snapshots[0].comparisonJourneys, [
    { codes: "BQ001 · BQ009", shares: 2, opens: 1, prints: 1 },
  ]);
  assert.equal(JSON.stringify(body).includes("BuyerName"), false);
});

test("snapshot sanitizer rejects incomplete records and normalizes numeric fields", () => {
  assert.equal(
    sanitizeWeeklyReviewSnapshot({ capturedAt: "2026-08-27" }),
    null,
  );
  const result = sanitizeWeeklyReviewSnapshot({
    id: "WR-X",
    capturedAt: "2026-08-27T09:00:00.000Z",
    period: { days: 14, from: "2026-08-01", to: "2026-08-27" },
    salesExecution: {
      response: { cohort: "4" },
      pipeline: {},
      stageRates: {},
      definition: "x",
    },
    funnel: {},
    coverage: {},
  });
  assert.equal(result.period.days, 30);
  assert.equal(result.salesExecution.response.cohort, 4);
  assert.equal(result.salesExecution.response.medianHours, null);
});
