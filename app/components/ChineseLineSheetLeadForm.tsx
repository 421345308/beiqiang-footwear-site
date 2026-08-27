"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { productCount } from "../data/catalog-meta";
import { getAttribution, trackEvent } from "../lib/tracking";
import ContactPreferenceFields, { EMPTY_CONTACT_PREFERENCES, type ContactPreferences } from "./ContactPreferenceFields";

const DOWNLOAD_PATH = "/downloads/beiqiang-footwear-line-sheet-zh-2026.pdf";
type FormStatus = { kind: "idle" | "sending" | "success" | "error"; message: string };

export default function ChineseLineSheetLeadForm() {
  const [name, setName] = useState(""); const [company, setCompany] = useState(""); const [buyerType, setBuyerType] = useState("进口商 / 批发商");
  const [market, setMarket] = useState(""); const [direction, setDirection] = useState("多品类选款"); const [quantity, setQuantity] = useState("");
  const [email, setEmail] = useState(""); const [whatsapp, setWhatsapp] = useState(""); const [notes, setNotes] = useState(""); const [website, setWebsite] = useState("");
  const [contactPreferences, setContactPreferences] = useState<ContactPreferences>(EMPTY_CONTACT_PREFERENCES); const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<FormStatus>({ kind: "idle", message: `提交一次即可下载当前${productCount}款英文产品目录，并建立后续参考号。` });
  const [access, setAccess] = useState<{ reference: string; accessCode: string } | null>(null); const startedAt = useRef(0); const startedTracked = useRef(false);
  useEffect(() => { startedAt.current = Date.now(); }, []);
  function markStarted() { if (!startedAt.current) startedAt.current = Date.now(); if (!startedTracked.current) { startedTracked.current = true; trackEvent("line_sheet_form_start", { context: "line_sheet_zh" }); } }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() && !whatsapp.trim()) { setStatus({ kind: "error", message: "请填写Email或WhatsApp，以便采购团队回复。" }); return; }
    setStatus({ kind: "sending", message: "正在保存产品目录需求……" });
    try {
      const response = await fetch("/api/inquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, company, buyerType, market, quantity, email, whatsapp, website, consent, ...contactPreferences, styleCode: "CATALOG-2026", styleLabel: `贝强${productCount}款鞋类产品目录`, context: "line_sheet", projectPath: "base_style_adaptation", requirements: `产品方向：${direction}。${notes || `买家申请查看当前${productCount}款产品目录。`}`, formStartedAt: startedAt.current, attribution: getAttribution(), page: window.location.pathname }) });
      const result = await response.json().catch(() => ({})); if (!response.ok || !result.ok) throw new Error(result.message || "产品目录需求未能保存。");
      const details = { reference: result.reference, accessCode: result.accessCode || "" }; setAccess(details); if (details.accessCode) localStorage.setItem("beiqiang_last_inquiry_access", JSON.stringify(details));
      setStatus({ kind: "success", message: `产品目录已开放。参考号：${details.reference}。请保存下方私密访问码用于后续查询。` }); trackEvent("line_sheet_request", { context: "line_sheet_zh", reference: details.reference });
    } catch (error) { setStatus({ kind: "error", message: error instanceof Error ? error.message : "产品目录需求未能保存。" }); }
  }
  return <form className="line-sheet-form" onSubmit={submit} onFocus={markStarted} aria-label="申请贝强鞋类产品目录"><div className="line-sheet-form-heading"><p className="eyebrow">买家获取</p><h2>说明您要采购什么。</h2><p>这些资料只用于交付并跟进本次B2B产品需求。</p></div><div className="line-sheet-form-grid">
    <label>联系人<input required value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" maxLength={100} placeholder="您的姓名" /></label><label>公司名称<input required value={company} onChange={(event) => setCompany(event.target.value)} autoComplete="organization" maxLength={160} placeholder="公司或品牌" /></label>
    <label>买家类型<select value={buyerType} onChange={(event) => setBuyerType(event.target.value)}><option>进口商 / 批发商</option><option>Amazon / TikTok卖家</option><option>品牌 / 私标买家</option><option>采购代理</option></select></label><label>目标市场<input required value={market} onChange={(event) => setMarket(event.target.value)} maxLength={120} placeholder="国家 / 销售渠道" /></label>
    <label>产品方向<select value={direction} onChange={(event) => setDirection(event.target.value)}><option>多品类选款</option><option>宽鞋头步行鞋</option><option>针织 / 纺织套穿鞋</option><option>透气系带鞋</option><option>儿童休闲步行鞋</option><option>OEM / ODM开发</option></select></label><label>预计数量<input required value={quantity} onChange={(event) => setQuantity(event.target.value)} maxLength={80} placeholder="试单或大货数量" /></label>
    <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" maxLength={180} placeholder="name@company.com" /></label><label>WhatsApp<input value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} autoComplete="tel" maxLength={80} placeholder="国家代码 + 电话" /></label>
    <ContactPreferenceFields locale="zh" value={contactPreferences} onChange={setContactPreferences} /><label className="form-full">采购说明<textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={1200} rows={3} placeholder="候选款、尺码、颜色、样品时间或定制方向" /></label><label className="form-honeypot" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} /></label><label className="form-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} required /><span>我同意贝强使用这些资料交付并跟进本次采购需求。</span></label>
  </div><button className="button" type="submit" disabled={status.kind === "sending" || status.kind === "success"}>{status.kind === "sending" ? "正在保存……" : status.kind === "success" ? "产品目录已开放" : `获取${productCount}款产品目录`}</button><p className={`form-note form-note-${status.kind}`} aria-live="polite">{status.message}</p>{status.kind === "success" && access ? <div className="line-sheet-download"><a className="button button-light" href={DOWNLOAD_PATH} download onClick={() => trackEvent("line_sheet_download", { context: "line_sheet_zh", reference: access.reference, linkType: "pdf_zh" })}>下载中文PDF产品目录</a><p><strong>私密访问码：</strong>{access.accessCode || "将另行发送"}</p><Link href="/zh/inquiry-status/">查询后续进度 →</Link></div> : null}<small>PDF用于产品发现，不是报价。库存、材料、码比、MOQ、价格、包装和交期均需书面确认。</small></form>;
}
