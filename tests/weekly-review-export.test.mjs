import assert from "node:assert/strict";
import test from "node:test";
import {
  buildWeeklyActions,
  buildWeeklyReviewMarkdown,
} from "../app/lib/weekly-review-export.ts";

const execution = {
  response: {
    cohort: 5,
    exactMeasured: 2,
    dateOnlyRecorded: 1,
    awaitingFirstResponse: 2,
    exactCoverageRate: 40,
    recordedContactRate: 60,
    medianHours: 8,
    within24Hours: 2,
    within24HourRate: 100,
  },
  pipeline: {
    active: 4,
    ownerAssigned: 3,
    ownerCoverageRate: 75,
    actionScheduled: 2,
    actionCoverageRate: 50,
    overdue: 2,
    overdueRate: 50,
    buyerRepliesAwaiting: 1,
    stale14Days: 1,
    staleRate: 25,
  },
  stageRates: {
    qualified: 60,
    sampleDiscussion: 40,
    quoted: 20,
    quoteAccepted: 0,
    orderSetupRequested: 0,
    orders: 0,
  },
  definition: "Not a revenue forecast.",
};
const analytics = {
  period: { days: 30, from: "2026-07-29", to: "2026-08-27" },
  funnel: {
    productViews: 12,
    quoteAdds: 3,
    quoteRequests: 2,
    inquiries: 5,
    qualified: 3,
    sampleDiscussion: 2,
    quoted: 1,
    quoteAccepted: 0,
    orderSetupRequested: 0,
    orders: 0,
  },
  salesExecution: execution,
  supporting: {
    resourceViews: 4,
    resourceProductOpens: 2,
    resourceCtas: 1,
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
  },
  comparisonJourneys: [
    { codes: "BQ001 · BQ009", shares: 2, opens: 1, prints: 1 },
  ],
  acquisitionChannels: [
    {
      channel: "linkedin",
      events: 12,
      inquiries: 3,
      qualified: 2,
      sampleDiscussion: 1,
      quoted: 1,
      quoteAccepted: 0,
      orderSetupRequested: 0,
      orders: 0,
      inquiryToQualifiedRate: 66.7,
      inquiryToQuotedRate: 33.3,
    },
  ],
  products: [
    {
      code: "BQ009",
      views: 8,
      compares: 1,
      specSheets: 1,
      shares: 1,
      comparisonShares: 2,
      comparisonOpens: 1,
      comparisonPrints: 1,
      quoteAdds: 2,
      inquiries: 0,
    },
  ],
};

test("builds a bounded action list from verified execution gaps", () => {
  const actions = buildWeeklyActions(execution);
  assert.equal(actions.length, 5);
  assert.match(actions[0].title, /回复 1 个买家/);
  assert.match(actions[1].title, /2 个尚无首次联系记录/);
  assert.equal(
    actions.some((item) => /成交概率|收入/.test(item.title)),
    false,
  );
});

test("exports a Chinese weekly report with evidence and non-prediction boundaries", () => {
  const previous = {
    version: 2,
    id: "WR-P",
    capturedAt: "2026-08-20T09:00:00.000Z",
    period: analytics.period,
    salesExecution: {
      ...execution,
      pipeline: {
        ...execution.pipeline,
        ownerCoverageRate: 50,
        actionCoverageRate: 25,
        overdue: 3,
      },
      stageRates: { ...execution.stageRates, quoted: 10 },
    },
    funnel: analytics.funnel,
    acquisitionChannels: [
      {
        ...analytics.acquisitionChannels[0],
        inquiries: 1,
        qualified: 1,
        quoted: 0,
      },
    ],
    coverage: {
      eventsLoaded: 0,
      inquiriesLoaded: 0,
      workspaceActivityLoaded: 0,
      truncated: false,
    },
    dataBoundary: "Aggregate only",
  };
  const report = buildWeeklyReviewMarkdown({
    analytics,
    previous,
    generatedAt: "2026-08-27T10:00:00.000Z",
  });
  assert.match(report, /# 贝强独立站销售经营周报/);
  assert.match(report, /负责人覆盖变化：\+25个百分点/);
  assert.match(report, /LinkedIn：12次可选分析事件、3条询盘/);
  assert.match(report, /较上次同周期询盘\+2、Qualified\+1、报价\+1/);
  assert.match(report, /产品组合分享证据/);
  assert.match(
    report,
    /BQ001 · BQ009：2次分享动作、1次分享链接打开、1次打印\/PDF动作/,
  );
  assert.match(report, /采购会议执行证据/);
  assert.match(report, /日历文件下载：2次，覆盖1个项目/);
  assert.match(report, /会议变更申请：2；当前待审核：1；已批准：1/);
  assert.match(report, /BQ009：8次产品查看/);
  assert.match(report, /Search Console/);
  assert.match(report, /正式订单、付款和收入必须与Alibaba Trade Assurance/);
  assert.doesNotMatch(report, /buyer@example|guaranteed revenue|预测成交率/i);
});
