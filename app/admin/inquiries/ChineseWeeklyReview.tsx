"use client";

import { useEffect, useMemo, useState } from "react";
import { buildWeeklyActions, buildWeeklyReviewMarkdown, type WeeklyReviewAnalytics, type WeeklyReviewSnapshot, type WeeklySalesExecution } from "../../lib/weekly-review-export";

export type SalesExecution = WeeklySalesExecution;
type Props = { analytics: WeeklyReviewAnalytics | null; days: number; token: string };

function metric(value: number | null, suffix = "") { return value === null ? "暂无法计算" : `${value}${suffix}`; }
function signed(value: number) { const rounded = Math.round(value * 10) / 10; return `${rounded > 0 ? "+" : ""}${rounded}`; }

export default function ChineseWeeklyReview({ analytics, days, token }: Props) {
  const data = analytics?.salesExecution || null;
  const [snapshots, setSnapshots] = useState<WeeklyReviewSnapshot[]>([]);
  const [historyStatus, setHistoryStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const actions = useMemo(() => data ? buildWeeklyActions(data) : [], [data]);
  const comparable = snapshots.find((item) => item.period.days === days && item.period.to !== analytics?.period.to) || null;

  useEffect(() => {
    if (!data || !token) return;
    let active = true;
    void fetch("/api/admin/weekly-review?limit=12", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }).then(async (response) => { const result = await response.json().catch(() => ({})); if (!response.ok || !result.ok) throw new Error(result.message || "历史快照无法加载。"); if (active) setSnapshots(result.snapshots || []); }).catch((error) => { if (active) setHistoryStatus(error instanceof Error ? error.message : "历史快照无法加载。"); });
    return () => { active = false; };
  }, [data, token]);

  async function saveSnapshot() {
    if (!data || !token) return; setSaving(true); setHistoryStatus("正在按服务器当前聚合数据保存…");
    try { const response = await fetch(`/api/admin/weekly-review?days=${days}`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }); const result = await response.json().catch(() => ({})); if (!response.ok || !result.ok) throw new Error(result.message || "快照保存失败。"); setSnapshots((current) => [result.snapshot, ...current.filter((item) => item.id !== result.snapshot.id)]); setHistoryStatus("今日聚合快照已保存；不会覆盖其他日期的历史。"); }
    catch (error) { setHistoryStatus(error instanceof Error ? error.message : "快照保存失败。"); }
    finally { setSaving(false); }
  }

  function downloadReport() {
    if (!analytics) return; const markdown = buildWeeklyReviewMarkdown({ analytics, previous: comparable }); const url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" })); const link = document.createElement("a"); link.href = url; link.download = `beiqiang-website-review-${analytics.period.to}-${days}d.md`; link.click(); URL.revokeObjectURL(url); setHistoryStatus("中文Markdown周报已生成；请核对真实订单与站外触达后归档。");
  }

  return <section className="admin-weekly-review"><div className="admin-weekly-review-heading"><div><p className="eyebrow">中文经营复盘</p><h2>销售执行与管道健康</h2><p>{data ? `当前选择最近${days}天询盘；管道健康使用全部真实活跃项目。` : "加载询盘后，系统会从真实项目记录计算回复、逾期和阶段推进。"}</p></div><span>不是收入预测或成交概率</span></div>{data ? <><div className="weekly-review-tools"><div><button type="button" onClick={saveSnapshot} disabled={saving}>{saving ? "正在保存…" : "保存今日聚合快照"}</button><button type="button" onClick={downloadReport}>下载中文Markdown周报</button></div><small>同一天、同一7/30/90天周期只保存一份；快照不可覆盖，不包含客户身份或业务正文。</small></div><div className="weekly-review-grid"><article><small>精确首次回复覆盖</small><strong>{data.response.exactMeasured}/{data.response.cohort}</strong><span>{data.response.exactCoverageRate}% · 另有{data.response.dateOnlyRecorded}条仅记录联系日期</span></article><article><small>首次回复中位时长</small><strong>{metric(data.response.medianHours, "小时")}</strong><span>只统计有站内业务员消息时间戳的询盘</span></article><article><small>24小时内回复</small><strong>{metric(data.response.within24HourRate, "%")}</strong><span>{data.response.within24Hours}/{data.response.exactMeasured}条可精确计时回复</span></article><article className={data.response.awaitingFirstResponse ? "needs-attention" : ""}><small>本期尚无首次联系记录</small><strong>{data.response.awaitingFirstResponse}</strong><span>不含已记录日期但无法精确计时的触达</span></article></div><div className="weekly-review-pipeline"><div><h3>当前活跃管道</h3><div><article><small>活跃项目</small><strong>{data.pipeline.active}</strong></article><article><small>负责人覆盖</small><strong>{data.pipeline.ownerCoverageRate}%</strong><span>{data.pipeline.ownerAssigned}/{data.pipeline.active}</span></article><article><small>下一动作覆盖</small><strong>{data.pipeline.actionCoverageRate}%</strong><span>{data.pipeline.actionScheduled}/{data.pipeline.active}</span></article><article><small>逾期项目</small><strong>{data.pipeline.overdue}</strong><span>{data.pipeline.overdueRate}%</span></article><article><small>待回买家消息</small><strong>{data.pipeline.buyerRepliesAwaiting}</strong></article><article><small>14天无记录活动</small><strong>{data.pipeline.stale14Days}</strong><span>{data.pipeline.staleRate}%</span></article></div></div><div><h3>本期询盘当前推进率</h3><div>{[["进入合格", data.stageRates.qualified], ["进入样品阶段及以后", data.stageRates.sampleDiscussion], ["已签发报价", data.stageRates.quoted], ["报价已接受", data.stageRates.quoteAccepted], ["已申请正式建单", data.stageRates.orderSetupRequested], ["已确认正式订单", data.stageRates.orders]].map(([label, value]) => <article key={String(label)}><small>{label}</small><strong>{value}%</strong></article>)}</div></div></div><section className="weekly-review-comparison"><div><h3>与上次同周期快照比较</h3><small>{comparable ? `${new Date(comparable.capturedAt).toLocaleString()} · ${comparable.period.from}至${comparable.period.to}` : "尚无可比较快照"}</small></div>{comparable ? <div><article><small>负责人覆盖</small><strong>{signed(data.pipeline.ownerCoverageRate - comparable.salesExecution.pipeline.ownerCoverageRate)}<i>个百分点</i></strong></article><article><small>下一动作覆盖</small><strong>{signed(data.pipeline.actionCoverageRate - comparable.salesExecution.pipeline.actionCoverageRate)}<i>个百分点</i></strong></article><article><small>逾期项目</small><strong>{signed(data.pipeline.overdue - comparable.salesExecution.pipeline.overdue)}<i>个，减少为改善</i></strong></article><article><small>报价阶段率</small><strong>{signed(data.stageRates.quoted - comparable.salesExecution.stageRates.quoted)}<i>个百分点</i></strong></article><article><small>正式订单阶段率</small><strong>{signed(data.stageRates.orders - comparable.salesExecution.stageRates.orders)}<i>个百分点</i></strong></article></div> : <p>先在一个固定复盘日保存当前聚合快照；下次选择相同周期即可看到变化。</p>}</section><section className="weekly-review-actions"><h3>本周先做什么</h3>{actions.length ? <ol>{actions.map((action) => <li key={action.title}><span>{action.level}</span><div><strong>{action.title}</strong><p>{action.note}</p></div></li>)}</ol> : <p>当前记录未发现紧急执行缺口；继续核对真实买家回复、样品、报价和订单推进，不因面板为零而停止开发客户。</p>}</section><section className="weekly-review-history"><div><h3>聚合快照历史</h3><span>{snapshots.length}份</span></div>{snapshots.length ? <div>{snapshots.slice(0, 8).map((item) => <article key={`${item.id}-${item.capturedAt}`}><strong>{item.period.days}天 · {item.period.to}</strong><span>{new Date(item.capturedAt).toLocaleString()}</span><small>询盘 {item.funnel.inquiries} · 报价 {item.funnel.quoted} · 正式订单 {item.funnel.orders} · 逾期 {item.salesExecution.pipeline.overdue}</small></article>)}</div> : <p>尚未保存聚合快照。历史不会从测试样本自动生成。</p>}<p aria-live="polite">{historyStatus}</p></section><small className="weekly-review-definition">{data.definition}</small></> : <div className="admin-weekly-review-empty">请先使用管理员访问口令加载真实询盘与经营数据。</div>}</section>;
}
