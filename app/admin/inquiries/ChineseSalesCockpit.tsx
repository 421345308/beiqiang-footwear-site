"use client";

import { useMemo, useState } from "react";
import { buildBuyerReplyDraft, buildSalesTask, type SalesReadiness, type SalesRecord, type SalesTask } from "../../lib/sales-priority";

type Props = { records: SalesRecord[]; readinessByReference: Map<string, SalesReadiness> };
type Lane = "all" | "internal" | "waiting_buyer" | "monitor";

function laneLabel(lane: SalesTask["lane"]) { return lane === "internal" ? "贝强待处理" : lane === "waiting_buyer" ? "等待买家" : "持续观察"; }

export default function ChineseSalesCockpit({ records, readinessByReference }: Props) {
  const [lane, setLane] = useState<Lane>("all");
  const [expanded, setExpanded] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const rows = useMemo(() => records.map((record) => { const readiness = readinessByReference.get(record.reference) || { score: 0, level: "early", missing: [] }; return { record, readiness, task: buildSalesTask(record, readiness) }; }).sort((a, b) => b.task.score - a.task.score || b.record.receivedAt.localeCompare(a.record.receivedAt)), [records, readinessByReference]);
  const visible = lane === "all" ? rows : rows.filter((row) => row.task.lane === lane);
  const counts = { internal: rows.filter((row) => row.task.lane === "internal").length, waiting: rows.filter((row) => row.task.lane === "waiting_buyer").length, critical: rows.filter((row) => row.task.urgency === "critical").length, monitor: rows.filter((row) => row.task.lane === "monitor").length };

  async function copyDraft(record: SalesRecord, task: SalesTask, readiness: SalesReadiness) {
    try { await navigator.clipboard.writeText(buildBuyerReplyDraft(record, task, readiness)); setCopyStatus(`${record.reference} 英文草稿已复制；请核对事实后再发送。`); }
    catch { setCopyStatus("浏览器未允许复制，请展开草稿后手动复制。 "); }
  }

  return <section className="admin-sales-cockpit"><div className="admin-sales-cockpit-heading"><div><p className="eyebrow">中文经营视图</p><h2>今日成交工作台</h2><p>按可验证项目状态排序，不预测成交概率。优先处理买家新消息、贝强内部承接、等待买家决定和逾期事项。</p></div><div className="admin-sales-cockpit-counts"><article><small>紧急</small><strong>{counts.critical}</strong></article><article><small>贝强待处理</small><strong>{counts.internal}</strong></article><article><small>等待买家</small><strong>{counts.waiting}</strong></article><article><small>持续观察</small><strong>{counts.monitor}</strong></article></div></div><div className="admin-sales-cockpit-tabs" role="group" aria-label="成交待办筛选">{[["all", `全部 ${rows.length}`], ["internal", `贝强待处理 ${counts.internal}`], ["waiting_buyer", `等待买家 ${counts.waiting}`], ["monitor", `持续观察 ${counts.monitor}`]].map(([value, label]) => <button key={value} type="button" className={lane === value ? "active" : ""} onClick={() => setLane(value as Lane)}>{label}</button>)}</div>{records.length ? <div className="admin-sales-cockpit-list">{visible.slice(0, 20).map(({ record, readiness, task }) => { const open = expanded === record.reference; const draft = buildBuyerReplyDraft(record, task, readiness); return <article key={record.reference} className={`sales-task sales-task-${task.urgency}`}><div className="sales-task-rank"><strong>{task.score}</strong><small>运营优先级</small></div><div className="sales-task-main"><div><span>{laneLabel(task.lane)}</span><span>{task.urgency === "critical" ? "紧急" : task.urgency === "high" ? "高优先" : "正常"}</span></div><h3>{task.title}</h3><p>{task.reason}</p><p><b>下一步：</b>{task.nextStep}</p><small>期限：{task.due} · 资料完整度 {readiness.score}/100</small></div><div className="sales-task-account"><strong>{record.company || "公司待确认"}</strong><span>{record.name || "联系人待确认"} · {record.buyerType || "买家类型待确认"}</span><span>{record.reference} · {record.styleCode || "款号待确认"}</span><span>{record.bulkQuantity || record.quantity || "数量待确认"}</span><a href={`#${record.reference}`}>打开完整项目记录 ↓</a></div><div className="sales-task-actions"><button type="button" onClick={() => setExpanded(open ? "" : record.reference)}>{open ? "收起回复草稿" : "查看英文回复草稿"}</button><button type="button" onClick={() => copyDraft(record, task, readiness)}>复制草稿</button></div>{open ? <div className="sales-task-draft"><div><strong>发送前人工核对</strong><span>核对收件人、款号、原消息、阶段和正式文件；草稿不会自动发送。</span></div><pre>{draft}</pre><div><small>排序依据：{task.evidence.join(" · ") || "项目阶段"}</small><button type="button" onClick={() => copyDraft(record, task, readiness)}>复制英文草稿</button></div></div> : null}</article>; })}{visible.length > 20 && <p className="admin-sales-cockpit-more">当前显示前20项；使用下方完整台账继续查看其余项目。</p>}</div> : <div className="admin-sales-cockpit-empty"><strong>请先使用管理员访问口令加载询盘。</strong><p>加载后这里只显示真实业务询盘，内部测试默认排除。</p></div>}<p className="admin-sales-cockpit-status" aria-live="polite">{copyStatus}</p><small className="admin-sales-cockpit-boundary">运营优先级只说明“先处理什么”，不是成交概率、客户价值评分或自动决策。英文草稿必须由业务员核对后复制到私密项目消息、邮箱或WhatsApp；价格、MOQ、材料、库存、交期和交易条款不能由草稿自动确认。</small></section>;
}
