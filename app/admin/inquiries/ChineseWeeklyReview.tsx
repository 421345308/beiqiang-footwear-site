"use client";

export type SalesExecution = {
  response: { cohort: number; exactMeasured: number; dateOnlyRecorded: number; awaitingFirstResponse: number; exactCoverageRate: number; recordedContactRate: number; medianHours: number | null; within24Hours: number; within24HourRate: number };
  pipeline: { active: number; ownerAssigned: number; ownerCoverageRate: number; actionScheduled: number; actionCoverageRate: number; overdue: number; overdueRate: number; buyerRepliesAwaiting: number; stale14Days: number; staleRate: number };
  stageRates: { qualified: number; sampleDiscussion: number; quoted: number; quoteAccepted: number; orderSetupRequested: number; orders: number };
  definition: string;
};

type Props = { data: SalesExecution | null; days: number };

function metric(value: number | null, suffix = "") { return value === null ? "暂无法计算" : `${value}${suffix}`; }

export default function ChineseWeeklyReview({ data, days }: Props) {
  const actions = data ? [
    data.pipeline.buyerRepliesAwaiting > 0 ? { level: "紧急", title: `回复 ${data.pipeline.buyerRepliesAwaiting} 个买家最新消息`, note: "逐条打开完整项目，先处理买家明确问题和决定，不用通用群发覆盖原消息。" } : null,
    data.response.awaitingFirstResponse > 0 ? { level: "紧急", title: `承接 ${data.response.awaitingFirstResponse} 个尚无首次联系记录的本期询盘`, note: "先核对联系方式和采购资料，再发送一个明确下一动作；站外联系后同步日期。" } : null,
    data.pipeline.overdue > 0 ? { level: "高优先", title: `清理 ${data.pipeline.overdue} 个逾期下一动作`, note: "完成、重排或按事实关闭，不能只修改日期来隐藏逾期。" } : null,
    data.pipeline.ownerCoverageRate < 100 ? { level: "补基础", title: `为 ${data.pipeline.active - data.pipeline.ownerAssigned} 个活跃项目指定负责人`, note: "负责人必须能实际承接下一次回复、样品、报价或订单动作。" } : null,
    data.pipeline.actionCoverageRate < 100 ? { level: "补基础", title: `为 ${data.pipeline.active - data.pipeline.actionScheduled} 个活跃项目补齐下一动作与日期`, note: "下一动作应具体到询问信息、发样、签发报价或书面订单承接。" } : null,
    data.pipeline.stale14Days > 0 ? { level: "复核", title: `复核 ${data.pipeline.stale14Days} 个14天无记录活动项目`, note: "判断继续跟进、等待买家、失单或归档，并记录原因。" } : null,
  ].filter(Boolean).slice(0, 5) as { level: string; title: string; note: string }[] : [];

  return <section className="admin-weekly-review"><div className="admin-weekly-review-heading"><div><p className="eyebrow">中文经营复盘</p><h2>销售执行与管道健康</h2><p>{data ? `当前选择最近${days}天询盘；管道健康使用全部真实活跃项目。` : "加载询盘后，系统会从真实项目记录计算回复、逾期和阶段推进。"}</p></div><span>不是收入预测或成交概率</span></div>{data ? <><div className="weekly-review-grid"><article><small>精确首次回复覆盖</small><strong>{data.response.exactMeasured}/{data.response.cohort}</strong><span>{data.response.exactCoverageRate}% · 另有{data.response.dateOnlyRecorded}条仅记录联系日期</span></article><article><small>首次回复中位时长</small><strong>{metric(data.response.medianHours, "小时")}</strong><span>只统计有站内业务员消息时间戳的询盘</span></article><article><small>24小时内回复</small><strong>{metric(data.response.within24HourRate, "%")}</strong><span>{data.response.within24Hours}/{data.response.exactMeasured}条可精确计时回复</span></article><article className={data.response.awaitingFirstResponse ? "needs-attention" : ""}><small>本期尚无首次联系记录</small><strong>{data.response.awaitingFirstResponse}</strong><span>不含已记录日期但无法精确计时的触达</span></article></div><div className="weekly-review-pipeline"><div><h3>当前活跃管道</h3><div><article><small>活跃项目</small><strong>{data.pipeline.active}</strong></article><article><small>负责人覆盖</small><strong>{data.pipeline.ownerCoverageRate}%</strong><span>{data.pipeline.ownerAssigned}/{data.pipeline.active}</span></article><article><small>下一动作覆盖</small><strong>{data.pipeline.actionCoverageRate}%</strong><span>{data.pipeline.actionScheduled}/{data.pipeline.active}</span></article><article><small>逾期项目</small><strong>{data.pipeline.overdue}</strong><span>{data.pipeline.overdueRate}%</span></article><article><small>待回买家消息</small><strong>{data.pipeline.buyerRepliesAwaiting}</strong></article><article><small>14天无记录活动</small><strong>{data.pipeline.stale14Days}</strong><span>{data.pipeline.staleRate}%</span></article></div></div><div><h3>本期询盘当前推进率</h3><div>{[["进入合格", data.stageRates.qualified], ["进入样品阶段及以后", data.stageRates.sampleDiscussion], ["已签发报价", data.stageRates.quoted], ["报价已接受", data.stageRates.quoteAccepted], ["已申请正式建单", data.stageRates.orderSetupRequested], ["已确认正式订单", data.stageRates.orders]].map(([label, value]) => <article key={String(label)}><small>{label}</small><strong>{value}%</strong></article>)}</div></div></div><section className="weekly-review-actions"><h3>本周先做什么</h3>{actions.length ? <ol>{actions.map((action) => <li key={action.title}><span>{action.level}</span><div><strong>{action.title}</strong><p>{action.note}</p></div></li>)}</ol> : <p>当前记录未发现紧急执行缺口；继续核对真实买家回复、样品、报价和订单推进，不因面板为零而停止开发客户。</p>}</section><small className="weekly-review-definition">{data.definition}</small></> : <div className="admin-weekly-review-empty">请先使用管理员访问口令加载真实询盘与经营数据。</div>}</section>;
}
