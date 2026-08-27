"use client";

type MeetingMetrics = {
  meetingRequestsSubmitted?: number;
  meetingsPending?: number;
  meetingsConfirmed?: number;
  meetingsCompleted?: number;
  meetingCalendarDownloads?: number;
  meetingProjectsWithCalendarDownload?: number;
  meetingChangesSubmitted?: number;
  meetingChangesPending?: number;
  meetingChangesApproved?: number;
};

export default function MeetingPerformancePanel({
  metrics,
  days,
}: {
  metrics?: MeetingMetrics | null;
  days: number;
}) {
  if (!metrics) return null;
  const values = [
    [
      "周期内会议申请",
      metrics.meetingRequestsSubmitted || 0,
      "买家真实提交，不等于确认",
    ],
    ["当前待审核", metrics.meetingsPending || 0, "需人工核对候选时间与议题"],
    ["当前已确认", metrics.meetingsConfirmed || 0, "仍需准备、通知和会后留痕"],
    ["周期内已完成", metrics.meetingsCompleted || 0, "必须包含事实结果记录"],
    [
      "日历文件下载",
      metrics.meetingCalendarDownloads || 0,
      "真实下载次数，可重复",
    ],
    [
      "已下载项目数",
      metrics.meetingProjectsWithCalendarDownload || 0,
      "周期内至少下载一次的项目",
    ],
    [
      "周期内变更申请",
      metrics.meetingChangesSubmitted || 0,
      "改期或取消，不会自动生效",
    ],
    [
      "当前待审变更",
      metrics.meetingChangesPending || 0,
      "需在原会议前人工处理",
    ],
    [
      "周期内批准变更",
      metrics.meetingChangesApproved || 0,
      "批准改期或取消的数量",
    ],
  ] as const;
  return (
    <section className="admin-meeting-performance">
      <div>
        <p className="eyebrow">会议执行证据</p>
        <h2>采购会议不是成交，先看是否被正确执行</h2>
        <p>最近{days}天的申请、完成和日历使用，加上当前待处理存量。</p>
      </div>
      <div>
        {values.map(([label, value, note]) => (
          <article key={label}>
            <small>{label}</small>
            <strong>{value}</strong>
            <span>{note}</span>
          </article>
        ))}
      </div>
      <small>
        日历下载不证明买家出席；会议完成不证明报价接受或订单成立。下一步必须回到样品、报价、书面订单或履约记录。
      </small>
    </section>
  );
}
