"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import InquiryAttachmentUploader from "../../components/InquiryAttachmentUploader";
import WorkspaceAccessRequest from "../../components/WorkspaceAccessRequest";
import ChineseTransactionCenter, { type ChineseProjectRequest } from "./ChineseTransactionCenter";

const stages = ["已收到需求", "需求审核", "样品讨论", "报价阶段", "商务沟通", "订单已确认"];
const statusLabels: Record<string, string> = {
  new: "已收到需求",
  qualified: "需求已核实",
  sample_discussion: "样品讨论中",
  quoted: "报价已发出",
  commercial_discussion: "商务沟通中",
  order_confirmed: "订单已确认",
  closed: "项目已关闭",
};

function safeDate(value: string) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toLocaleString("zh-CN") : "待确认";
}

function stateLabel(value = "") {
  const labels: Record<string, string> = {
    issued: "等待买家处理",
    buyer_accepted: "买家已接受",
    buyer_revision_requested: "买家已要求修改",
    buyer_declined: "买家已拒绝本版本",
    buyer_review: "等待买家审核",
    approved: "已批准",
    revision_requested: "已要求修改",
    submitted: "已提交",
    qualified: "已核实",
    awaiting_buyer: "等待买家决定",
    production: "生产中",
    shipped: "已发货",
    delivered: "已送达",
  };
  return labels[value] || value.replaceAll("_", " ") || "待确认";
}

export default function ChineseInquiryStatusLookup() {
  const [reference, setReference] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [message, setMessage] = useState("请输入询盘编号和私密查询码。查询码只用于当前项目，请勿公开转发。");
  const [request, setRequest] = useState<ChineseProjectRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const queryReference = new URLSearchParams(window.location.search).get("reference")?.trim().toUpperCase() || "";
    let saved: { reference?: string; accessCode?: string } | null = null;
    try { saved = JSON.parse(localStorage.getItem("beiqiang_last_inquiry_access") || "null"); } catch { /* manual entry remains available */ }
    const timer = window.setTimeout(() => {
      setReference(queryReference || saved?.reference || "");
      if (!queryReference || saved?.reference === queryReference) setAccessCode(saved?.accessCode || "");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function loadRequest(clear = true) {
    setLoading(true);
    if (clear) setRequest(null);
    setMessage("正在安全查询项目……");
    try {
      const response = await fetch(`/api/inquiry-status?reference=${encodeURIComponent(reference)}&accessCode=${encodeURIComponent(accessCode)}`, { cache: "no-store" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.message || "没有找到对应项目，请核对编号和查询码。");
      setRequest(result.request);
      setMessage("项目已找到。以下仅显示经项目验证的买家信息。");
      localStorage.setItem("beiqiang_last_inquiry_access", JSON.stringify({ reference: result.request.reference, accessCode }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "查询失败，请稍后再试。");
    } finally { setLoading(false); }
  }

  async function lookup(event: React.FormEvent) {
    event.preventDefault();
    await loadRequest();
  }

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    if (!request || newMessage.trim().length < 2) { setMessage("请先填写需要贝强回复的问题或更新。"); return; }
    setSending(true); setMessage("正在保存项目消息……");
    try {
      const response = await fetch("/api/inquiry-messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reference, accessCode, message: newMessage }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.message || "消息未能保存。");
      setNewMessage(""); setMessage("消息已保存，贝强业务团队可以在该项目中查看并回复。"); await loadRequest(false);
    } catch (error) { setMessage(error instanceof Error ? error.message : "消息未能保存。"); }
    finally { setSending(false); }
  }

  return <>
    <section className="status-lookup-hero"><div><p className="eyebrow">买家项目查询</p><h1>用私密查询码查看采购项目进度。</h1><p>询盘编号用于识别项目，20位私密查询码用于保护报价、样品、文件、消息和订单资料。旧询盘如没有查询码，请直接联系贝强。</p></div><form onSubmit={lookup}><label>询盘编号<input required value={reference} onChange={(event) => setReference(event.target.value.toUpperCase())} placeholder="BQ-20260823-XXXXXXXX" /></label><label>私密查询码<input required value={accessCode} onChange={(event) => setAccessCode(event.target.value.toUpperCase())} placeholder="20位私密查询码" /></label><button className="button button-light" type="submit" disabled={loading}>{loading ? "查询中……" : "查询项目"}</button><p aria-live="polite">{message}</p></form></section>
    {request ? <section className="section buyer-status-result">
      <div className="buyer-status-heading"><div><p className="eyebrow">{request.reference}</p><h2>{statusLabels[request.status.code] || request.status.label}</h2><p>收到时间 {safeDate(request.receivedAt)} · 更新时间 {safeDate(request.updatedAt)}</p></div><span>{statusLabels[request.status.code] || stateLabel(request.status.code)}</span></div>
      {request.status.step > 0 ? <ol className="buyer-status-timeline">{stages.map((label, index) => <li key={label} className={index + 1 <= request.status.step ? "complete" : ""}><span>{String(index + 1).padStart(2, "0")}</span><strong>{label}</strong></li>)}</ol> : <p className="buyer-status-closed">该项目已关闭。如需继续，请携询盘编号联系贝强。</p>}
      {request.sourcingReview ? <section className="buyer-status-items" id="sourcing-review-status"><p className="eyebrow">人工选款复核</p><h3>{request.sourcingReview.status === "awaiting_shortlist" ? "您的采购条件正在由业务员审核" : "本项目已有可查看的产品候选"}</h3><div><strong>{request.sourcingReview.priority.replaceAll("_", " ")}</strong><span>买家／渠道：{request.sourcingReview.buyerChannel.replaceAll("_", " ")}</span><span>穿脱结构：{request.sourcingReview.closure.replaceAll("_", " ")}</span><span>起始候选：{request.sourcingReview.startingStyles.join("、") || "未强行匹配目录产品"}</span></div><p>{request.sourcingReview.status === "awaiting_shortlist" ? "贝强将签发有证据支持的候选，或说明当前目录缺口并索取继续审核所需的参考图或规格。" : "请在下方查看已经签发的产品推荐，并保存需要继续的款式或提出更换条件。"}</p><small>此状态只确认需求已收到及审核进度，不确认库存、价格、MOQ、材料执行、样品时间或生产可行性。</small></section> : null}
      <div className="buyer-status-grid"><article><small>产品方向</small><h3>{request.styleCode}</h3><p>{request.styleLabel}</p><p>{request.quantity || "数量待讨论"}</p></article><article><small>项目与交付</small><h3>{request.projectPath?.replaceAll("_", " ") || "常规采购询盘"}</h3><p>{request.sampleQuantity ? `样品方向：${request.sampleQuantity}` : "样品安排按所选产品和项目要求审核。"}</p><p>贸易术语偏好：{request.preferredTradeTerm?.toUpperCase() || "待讨论"}</p><p>{request.deliveryDestination ? `目的地：${request.deliveryDestination}` : "目的地待讨论"}{request.deliveryTiming ? ` · ${request.deliveryTiming}` : ""}</p></article><article><small>买家可见更新</small><h3>最新项目说明</h3><p>{request.buyerUpdate || "贝强正在审核项目资料。"}</p></article></div>
      {request.adaptationBrief ? <section className="buyer-status-items"><p className="eyebrow">已提交的调整目标</p><h3>您的现有款调整简报</h3><div><strong>{request.adaptationBrief.intent.replaceAll("_", " ")}</strong><span>图稿准备：{request.adaptationBrief.artworkStatus.replaceAll("_", " ")}</span><span>{request.adaptationBrief.brandingPlacement || "品牌标识位置待讨论"}</span><span>{request.adaptationBrief.colorDirection || "颜色／材料方向待讨论"}</span></div><p>{request.adaptationBrief.packingLabeling || "包装／标签方向待讨论。"}</p><small>以上是买家提交的目标，不代表产品规格或生产可行性已经确认；贝强会在打样或报价前完成审核。</small></section> : null}
      {request.items?.length ? <div className="buyer-status-items"><h3>已提交产品行</h3>{request.items.map((item, index) => <div key={`${item.code}-${index}`}><strong>{item.code || "待确认"}</strong><span>{item.quantity || "数量待讨论"}</span><span>{item.colors || "颜色待讨论"}</span><span>{item.sizes || "尺码待讨论"}</span></div>)}</div> : null}
      <section className="workspace-preview-body">
        <section><div className="workspace-preview-heading"><div><p className="eyebrow">商务里程碑</p><h4>项目当前已记录内容</h4></div><span>摘要视图</span></div><div className="workspace-milestones">
          {request.buyerRecommendation && <article><small>产品推荐</small><strong>{stateLabel(request.buyerRecommendation.status)}</strong><p>{request.buyerRecommendation.title}</p></article>}
          {request.sampleProgram && <article><small>样品 · {request.sampleProgram.sampleReference || "编号待确认"}</small><strong>{stateLabel(request.sampleProgram.status)}</strong><p>{request.sampleProgram.styleCodes || request.styleCode} · {request.sampleProgram.quantity || "数量待确认"}</p></article>}
          {request.buyerQuotation && <article><small>报价 · {request.buyerQuotation.quoteNumber}{request.buyerQuotation.version ? ` · V${request.buyerQuotation.version}` : ""}</small><strong>{stateLabel(request.buyerQuotation.status)}</strong><p>{[request.buyerQuotation.currency, request.buyerQuotation.tradeTerm, request.buyerQuotation.validUntil ? `有效至 ${request.buyerQuotation.validUntil}` : ""].filter(Boolean).join(" · ")}</p></article>}
          {request.orderHandoff && <article><small>正式订单 · {request.orderHandoff.orderReference}</small><strong>{stateLabel(request.orderHandoff.fulfillmentStatus)}</strong><p>{request.orderHandoff.method === "alibaba_trade_assurance" ? "Alibaba Trade Assurance" : "双方合同"}</p></article>}
        </div>{!request.buyerRecommendation && !request.sampleProgram && !request.buyerQuotation && !request.orderHandoff ? <p className="workspace-preview-empty">项目进入推荐、样品、报价或正式订单阶段后，将在这里显示摘要。</p> : null}</section>
      </section>
      <ChineseTransactionCenter request={request} reference={reference} accessCode={accessCode} onSaved={() => loadRequest(false)} onStatus={setMessage} />
      <section className="buyer-message-center" id="buyer-message-center"><div><p className="eyebrow">私密项目消息</p><h3>把问题保留在对应采购项目中。</h3><p>消息仅供您和贝强授权团队查看。请勿发送邮箱密码、银行卡密码、短信验证码或支付凭证。</p></div><div className="buyer-message-thread">{request.messages?.length ? request.messages.map((item) => <article key={item.id} className={`buyer-message buyer-message-${item.sender}`}><div><strong>{item.sender === "sales" ? "贝强" : "您"}</strong><time>{safeDate(item.sentAt)}</time></div><p>{item.body}</p></article>) : <p className="buyer-message-empty">暂无消息。可在这里询问产品、样品、报价或订单问题。</p>}</div>{request.status.code !== "closed" ? <form onSubmit={sendMessage}><label>项目消息<textarea required minLength={2} maxLength={2000} rows={4} value={newMessage} onChange={(event) => setNewMessage(event.target.value)} placeholder="例如：请确认BQ009黑色、EU 42是否可以安排样品。" /></label><div><small>{newMessage.length}/2000</small><button className="button" type="submit" disabled={sending}>{sending ? "发送中……" : "发送项目消息"}</button></div></form> : null}</section>
      {request.status.code !== "closed" ? <InquiryAttachmentUploader reference={reference} accessCode={accessCode} tone="dark" locale="zh" onUploaded={() => loadRequest(false)} /> : null}
      {request.status.code !== "closed" ? <WorkspaceAccessRequest reference={reference} accessCode={accessCode} requests={request.workspaceAccessRequests || []} locale="zh" onSaved={() => loadRequest(false)} /> : null}
      <div className="buyer-status-boundary"><strong>本页不自动确认的事项</strong><p>价格、MOQ、样品安排、交期、材料、技术目标、付款和订单条款均需另行书面确认。“已收到需求”不是已接受订单；正式交易以Alibaba Trade Assurance订单或双方签署合同为准。</p></div>
      <div className="hero-actions"><a className="button" href={`mailto:421345308@qq.com?subject=${encodeURIComponent(`跟进项目 ${request.reference}`)}`}>邮件联系并附项目编号</a><a className="text-link" href={`https://wa.me/8618959805256?text=${encodeURIComponent(`您好，贝强鞋业。我想跟进项目 ${request.reference}。`)}`} target="_blank" rel="noreferrer">WhatsApp跟进 →</a></div>
    </section> : <section className="section status-help"><p className="eyebrow">请保护两项信息</p><h2>询盘编号识别项目，私密查询码保护项目。</h2><p>不要公开发布查询码。贝强不会在此页面索取您的邮箱密码、付款密码或内部管理员口令。</p><Link className="text-link" href="/zh/request-quote/">建立新的采购询价 →</Link></section>}
  </>;
}
