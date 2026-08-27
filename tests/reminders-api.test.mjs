import assert from "node:assert/strict";
import test from "node:test";
import {
  buildReminderSummary,
  createAdminReminderHandlers,
} from "../edgeone-deploy/cloud-functions/api/admin/reminders.js";

const today = "2026-08-23";
const records = [
  {
    reference: "BQ-A",
    company: "Buyer A",
    owner: "Sales A",
    status: "quoted",
    nextActionDue: "2026-08-22",
    nextAction: "Confirm sample address",
    recommendationSets: [
      {
        id: "REC-ABCDEF012345",
        status: "issued",
        issuedAt: "2026-08-21T15:00:00.000Z",
        items: [{ code: "BQ001" }, { code: "BQ009" }],
        followUps: [],
      },
    ],
    quotations: [
      { quoteNumber: "BQ-A-Q1", status: "issued", validUntil: "2026-08-24" },
    ],
  },
  {
    reference: "BQ-B",
    company: "Buyer B",
    owner: "Sales B",
    status: "order_confirmed",
    orderHandoff: {
      orderReference: "TA-B",
      paymentCurrency: "USD",
      paymentMilestones: [
        {
          label: "Balance",
          amount: "2000",
          status: "due",
          dueDate: "2026-08-22",
        },
      ],
    },
    orderChangeRequests: [
      {
        id: "OCR-ABCDEF012345",
        status: "awaiting_buyer",
        createdAt: "2026-08-21T10:00:00.000Z",
        baseVersion: 1,
        changedFields: ["quantitySizeRatio"],
        reason: "Revised PO quantity",
        notificationStatus: "sent",
      },
    ],
    fulfillmentCases: [
      {
        id: "FLC-ABCDEF012345",
        status: "awaiting_buyer",
        category: "logistics",
        title: "Shipment timing",
        responseDue: "2026-08-24",
        createdAt: "2026-08-23T10:00:00.000Z",
      },
    ],
  },
  {
    reference: "BQ-TEST",
    company: "Beiqiang Internal Test",
    name: "Internal",
    status: "quoted",
    nextActionDue: "2026-01-01",
    quotations: [
      { quoteNumber: "TEST-Q1", status: "issued", validUntil: "2026-08-23" },
    ],
  },
  {
    reference: "BQ-CLOSED",
    company: "Closed",
    status: "lost",
    nextActionDue: "2026-01-01",
  },
];
records[1].repeatOrderOpportunities = [
  {
    id: "ROP-ABCDEF012345",
    status: "submitted",
    intent: "repeat_same_order",
    styleCodes: ["BQ009"],
    indicativeQuantity: "1,000 pairs",
    sourceOrderReference: "TA-B",
    nextAction: "Qualify replenishment request",
    nextActionDue: "2026-08-23",
  },
];

test("builds one internal action list for follow-up, shortlist, quote and payment timing", () => {
  const summary = buildReminderSummary(records, today);
  assert.deepEqual(summary.counts, {
    followUps: 1,
    recommendations: 1,
    quotes: 1,
    meetings: 0,
    orderChanges: 1,
    fulfillmentCases: 1,
    repeatOrders: 1,
    payments: 1,
    total: 7,
  });
  assert.equal(summary.followUps[0].reference, "BQ-A");
  assert.equal(summary.recommendations[0].stage, "selection_check");
  assert.equal(summary.recommendations[0].timing, "due_today");
  assert.equal(summary.quotes[0].timing, "expiring");
  assert.equal(summary.orderChanges[0].changeId, "OCR-ABCDEF012345");
  assert.equal(summary.orderChanges[0].timing, "due_today");
  assert.equal(summary.fulfillmentCases[0].caseId, "FLC-ABCDEF012345");
  assert.equal(summary.repeatOrders[0].opportunityId, "ROP-ABCDEF012345");
  assert.equal(summary.payments[0].timing, "overdue");
  assert.equal(JSON.stringify(summary).includes("BQ-TEST"), false);
});

test("turns meeting review, preparation, notification, time-zone and outcome gaps into internal actions", () => {
  const base = { company: "Buyer Co", owner: "Sales A", status: "qualified" };
  const meetingRecords = [
    {
      ...base,
      reference: "BQ-M1",
      meetingRequests: [
        {
          id: "BMR-111111111111",
          status: "pending",
          meetingType: "sourcing_review",
          submittedAt: "2026-08-21T09:00:00.000Z",
          timezone: "Europe/Berlin",
          preferredChannel: "video_call",
        },
      ],
    },
    {
      ...base,
      reference: "BQ-M2",
      meetingRequests: [
        {
          id: "BMR-222222222222",
          status: "confirmed",
          meetingType: "quotation_review",
          confirmedSlot: "2026-08-24T10:00",
          timezone: "Europe/Berlin",
          confirmedChannel: "video_call",
          durationMinutes: 45,
          notificationStatus: "sent",
        },
      ],
    },
    {
      ...base,
      reference: "BQ-M3",
      meetingRequests: [
        {
          id: "BMR-333333333333",
          status: "confirmed",
          meetingType: "sample_review",
          confirmedSlot: "2026-08-23T09:00",
          timezone: "UTC",
          confirmedChannel: "phone",
          durationMinutes: 30,
          notificationStatus: "sent",
        },
      ],
    },
    {
      ...base,
      reference: "BQ-M4",
      meetingRequests: [
        {
          id: "BMR-444444444444",
          status: "confirmed",
          meetingType: "order_handoff",
          confirmedSlot: "2026-08-25T10:00",
          timezone: "UTC",
          confirmedChannel: "video_call",
          notificationStatus: "delivery_failed",
        },
      ],
    },
    {
      ...base,
      reference: "BQ-M5",
      meetingRequests: [
        {
          id: "BMR-555555555555",
          status: "confirmed",
          meetingType: "technical_development",
          confirmedSlot: "2026-08-24T10:00",
          timezone: "Somewhere nearby",
          confirmedChannel: "video_call",
          notificationStatus: "sent",
        },
      ],
    },
    {
      ...base,
      reference: "BQ-M6",
      meetingRequests: [
        {
          id: "BMR-666666666666",
          status: "confirmed",
          meetingType: "sourcing_review",
          confirmedSlot: "2026-09-05T10:00",
          timezone: "UTC",
          confirmedChannel: "video_call",
          notificationStatus: "sent",
        },
      ],
    },
    {
      ...base,
      reference: "BQ-M7",
      meetingRequests: [
        {
          id: "BMR-777777777777",
          status: "confirmed",
          meetingType: "quotation_review",
          confirmedSlot: "2026-09-05T10:00",
          timezone: "UTC",
          confirmedChannel: "video_call",
          notificationStatus: "sent",
          changeRequests: [
            { id: "BMC-777777777777", status: "pending", action: "reschedule", submittedAt: "2026-08-21T10:00:00.000Z" },
          ],
        },
      ],
    },
  ];
  const summary = buildReminderSummary(
    meetingRecords,
    today,
    new Date("2026-08-23T10:00:00.000Z"),
  );
  assert.equal(summary.counts.meetings, 6);
  assert.equal(summary.counts.total, 6);
  assert.deepEqual(
    new Set(summary.meetings.map((item) => item.action)),
    new Set([
      "review_request",
      "prepare_meeting",
      "record_outcome",
      "verify_notification",
      "reconfirm_timezone",
      "review_change",
    ]),
  );
  assert.equal(
    summary.meetings.find((item) => item.requestId === "BMR-222222222222")
      .timing,
    "within_24_hours",
  );
  assert.equal(
    summary.meetings.some((item) => item.requestId === "BMR-666666666666"),
    false,
  );
});

test("schedules the second shortlist follow-up four days later and stops after two", () => {
  const recommendation = {
    id: "REC-ABCDEF012345",
    status: "issued",
    issuedAt: "2026-08-01T00:00:00.000Z",
    items: [{ code: "BQ001" }],
    followUps: [
      { stage: "selection_check", sentAt: "2026-08-22T18:00:00.000Z" },
    ],
  };
  const second = buildReminderSummary(
    [
      {
        reference: "BQ-D",
        company: "Buyer D",
        status: "qualified",
        recommendationSets: [recommendation],
      },
    ],
    today,
  );
  assert.equal(second.recommendations[0].dueDate, "2026-08-26");
  assert.equal(second.recommendations[0].stage, "sample_or_quote");
  const complete = buildReminderSummary(
    [
      {
        reference: "BQ-D",
        company: "Buyer D",
        status: "qualified",
        recommendationSets: [
          {
            ...recommendation,
            followUps: [
              ...recommendation.followUps,
              { stage: "sample_or_quote", sentAt: "2026-08-26T00:00:00.000Z" },
            ],
          },
        ],
      },
    ],
    today,
  );
  assert.equal(complete.counts.recommendations, 0);
});

test("protects the reminder center with the admin token", async () => {
  let reads = 0;
  const handlers = createAdminReminderHandlers({
    getStoreImpl: () => {
      reads += 1;
      return {};
    },
  });
  const request = new Request(
    "https://www.beiqiang.online/api/admin/reminders",
    { headers: { Authorization: "Bearer wrong" } },
  );
  const result = await handlers.onRequestGet({
    request,
    env: { INQUIRY_ADMIN_TOKEN: "correct" },
  });
  assert.equal(result.status, 401);
  assert.equal(reads, 0);
});

test("sends at most one reserved reminder digest per calendar day", async () => {
  const inquiryData = Object.fromEntries(
    records.map((record, index) => [
      `inquiries/${today}/${index}.json`,
      record,
    ]),
  );
  let reminderRecord = null;
  const mails = [];
  const inquiryStore = {
    list: async () => ({
      blobs: Object.keys(inquiryData).map((key) => ({ key })),
    }),
    get: async (key) => inquiryData[key],
  };
  const reminderStore = {
    get: async () => reminderRecord,
    setJSON: async (key, value, options = {}) => {
      if (options.onlyIfNew && reminderRecord) throw new Error("exists");
      reminderRecord = value;
    },
    delete: async () => {
      reminderRecord = null;
    },
  };
  const handlers = createAdminReminderHandlers({
    getStoreImpl: (name) =>
      name === "beiqiang-inquiries" ? inquiryStore : reminderStore,
    createTransportImpl: () => ({
      sendMail: async (mail) => {
        mails.push(mail);
      },
    }),
    nowImpl: () => new Date("2026-08-23T10:00:00.000Z"),
  });
  const request = () =>
    new Request("https://www.beiqiang.online/api/admin/reminders", {
      method: "POST",
      headers: { Authorization: "Bearer correct" },
    });
  const env = { INQUIRY_ADMIN_TOKEN: "correct", SMTP_PASS: "test" };
  const first = await handlers.onRequestPost({ request: request(), env });
  const body = await first.json();
  assert.equal(first.status, 200);
  assert.equal(body.summary.counts.total, 7);
  assert.equal(reminderRecord.status, "sent");
  assert.equal(mails.length, 1);
  assert.match(mails[0].text, /product shortlist follow-ups/i);
  assert.match(mails[0].text, /sourcing-meeting actions/i);
  assert.match(mails[0].text, /confirmed-order changes awaiting buyer/i);
  assert.match(mails[0].text, /fulfillment exceptions/i);
  assert.match(mails[0].text, /repeat-order \/ next-project actions/i);
  assert.match(mails[0].text, /not proof of payment/i);
  const duplicate = await handlers.onRequestPost({ request: request(), env });
  assert.equal(duplicate.status, 409);
  assert.equal(mails.length, 1);
});
