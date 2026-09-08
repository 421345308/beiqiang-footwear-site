"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import OptionalInquiryDetails from "./OptionalInquiryDetails";
import { getAttribution, trackEvent } from "../lib/tracking";
import InquiryAttachmentUploader from "./InquiryAttachmentUploader";
import ContactPreferenceFields, { EMPTY_CONTACT_PREFERENCES, type ContactPreferences } from "./ContactPreferenceFields";
import type { ProductFinderBrief } from "../lib/product-finder-brief";

type InquiryFormProps = {
  styleCode: string;
  styleLabel: string;
  context: "homepage" | "product" | "sourcing_review";
  locale?: "en" | "zh";
  initialBuyerType?: string;
  initialMarket?: string;
  initialRequirements?: string;
  finderBrief?: ProductFinderBrief | null;
};

type FormStatus = { kind: "idle" | "sending" | "success" | "error"; message: string };

export default function InquiryForm({ styleCode, styleLabel, context, locale = "en", initialBuyerType = "Importer / wholesaler", initialMarket = "", initialRequirements = "", finderBrief = null }: InquiryFormProps) {
  const zh = locale === "zh";
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [buyerType, setBuyerType] = useState(initialBuyerType);
  const [market, setMarket] = useState(initialMarket);
  const [quantity, setQuantity] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [contactPreferences, setContactPreferences] = useState<ContactPreferences>(EMPTY_CONTACT_PREFERENCES);
  const [requirements, setRequirements] = useState(initialRequirements);
  const [website, setWebsite] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<FormStatus>({ kind: "idle", message: zh ? "提交后系统会保存需求并生成唯一询盘编号和私密查询码。" : "Your request will be saved and assigned a reference number." });
  const [accessDetails, setAccessDetails] = useState<{ reference: string; accessCode: string } | null>(null);
  const startedAt = useRef(0);
  const formStartedTracked = useRef(false);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const inquiryBrief = useMemo(
    () => [
      zh ? `贝强 ${styleCode} 样品 / 报价需求` : `Beiqiang ${styleCode} sample / quotation request`,
      zh ? `款式：${styleLabel}` : `Style: ${styleLabel}`,
      zh ? `联系人：${name || "待提供"}` : `Contact: ${name || "To be provided"}`,
      zh ? `公司：${company || "待提供"}` : `Company: ${company || "To be provided"}`,
      zh ? `买家类型：${buyerType}` : `Buyer type: ${buyerType}`,
      zh ? `目标市场：${market || "待提供"}` : `Target market: ${market || "To be provided"}`,
      zh ? `预计数量：${quantity || "待讨论"}` : `Expected quantity: ${quantity || "To be discussed"}`,
      `Email: ${email || (zh ? "未提供" : "Not provided")}`,
      `WhatsApp: ${whatsapp || (zh ? "未提供" : "Not provided")}`,
      zh ? `其他要求：${requirements || "请确认样品、颜色、尺码配比、包装和时间。"}` : `Requirements: ${requirements || "Please confirm sample, colors, size ratio, packing and timing."}`,
    ].join("\n"),
    [buyerType, company, email, market, name, quantity, requirements, styleCode, styleLabel, whatsapp, zh],
  );

  function markStarted() {
    if (!startedAt.current) startedAt.current = Date.now();
    if (formStartedTracked.current) return;
    formStartedTracked.current = true;
    trackEvent("form_start", { context, styleCode });
  }

  async function submitInquiry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() && !whatsapp.trim()) {
      setStatus({ kind: "error", message: zh ? "请至少提供邮箱或WhatsApp号码，方便团队回复。" : "Please provide an email address or WhatsApp number so our team can reply." });
      return;
    }

    setStatus({ kind: "sending", message: zh ? "正在保存采购需求……" : "Saving your sourcing request…" });
    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, company, buyerType, market, quantity, email, whatsapp, requirements, ...contactPreferences,
          website, consent, styleCode, styleLabel, context, finderBrief,
          formStartedAt: startedAt.current,
          attribution: getAttribution(),
          page: window.location.pathname,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.message || (zh ? "询盘暂时无法保存。" : "The request could not be saved."));

      setAccessDetails({ reference: result.reference, accessCode: result.accessCode || "" });
      if (result.accessCode) localStorage.setItem("beiqiang_last_inquiry_access", JSON.stringify({ reference: result.reference, accessCode: result.accessCode }));
      setStatus({ kind: "success", message: zh ? `询盘已保存。编号：${result.reference}。私密查询码：${result.accessCode || "将另行发送"}。请保存这两项信息。` : `Request saved. Reference: ${result.reference}. Private status code: ${result.accessCode || "sent separately"}. Save both values.` });
      trackEvent("form_submit", { context, styleCode, reference: result.reference });
    } catch (error) {
      setStatus({ kind: "error", message: error instanceof Error ? error.message : (zh ? "询盘暂时无法保存，请改用WhatsApp或邮件。" : "The request could not be saved. Please use WhatsApp or email below.") });
    }
  }

  return (
    <form className="inquiry-form" aria-label={zh ? `${styleCode}样品和报价需求` : `${styleCode} sample and quotation request`} onSubmit={submitInquiry} onFocus={markStarted}>
      <p className="form-instructions">{zh ? "姓名、公司、市场和预计数量为必填；数量未定可写“待讨论”。邮箱与WhatsApp至少填写一项。" : "Name, company, market and estimated quantity are required; you can write “To discuss” for quantity. Please add either email or WhatsApp."}</p>
      <label>{zh ? "联系人姓名" : "Contact name"}<input required value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" maxLength={100} placeholder={zh ? "您的姓名" : "Your name"} /></label>
      <label>{zh ? "公司名称" : "Company name"}<input required value={company} onChange={(event) => setCompany(event.target.value)} autoComplete="organization" maxLength={160} placeholder={zh ? "公司或品牌名称" : "Your company or brand"} /></label>
      <label>{zh ? "买家类型" : "Buyer type"}<select value={buyerType} onChange={(event) => setBuyerType(event.target.value)}><option value="Importer / wholesaler">{zh ? "进口商 / 批发商" : "Importer / wholesaler"}</option><option value="Amazon / TikTok seller">{zh ? "Amazon / TikTok卖家" : "Amazon / TikTok seller"}</option><option value="Brand / private label">{zh ? "品牌 / 私标买家" : "Brand / private label"}</option><option value="Sourcing agent">{zh ? "采购代理" : "Sourcing agent"}</option></select></label>
      <label>{zh ? "目标市场" : "Target market"}<input required value={market} onChange={(event) => setMarket(event.target.value)} maxLength={120} placeholder={zh ? "国家 / 销售渠道" : "Country / sales channel"} /></label>
      <label>{zh ? "预计数量" : "Expected quantity"}<input required value={quantity} onChange={(event) => setQuantity(event.target.value)} maxLength={80} placeholder={zh ? "例如300双，或填写“待讨论”" : "e.g. 300 pairs, or To discuss"} /></label>
      <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" maxLength={180} placeholder="name@company.com" /></label>
      <label className="form-full">WhatsApp<input value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} autoComplete="tel" maxLength={80} placeholder="Country code + number" /></label>
      <OptionalInquiryDetails title={zh ? "联系时间与回复方式（选填）" : "Contact time and response preferences (optional)"}><ContactPreferenceFields locale={locale} value={contactPreferences} onChange={setContactPreferences} /></OptionalInquiryDetails>
      <label className="form-full">{zh ? "采购要求" : "Requirements"}<textarea value={requirements} onChange={(event) => setRequirements(event.target.value)} maxLength={2000} placeholder={zh ? "尺码、颜色、Logo、包装、时间、参考款……" : "Sizes, colors, logo, packing, timing, reference style..."} rows={4} /></label>
      <label className="form-honeypot" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} /></label>
      <label className="form-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} required /><span>{zh ? "我同意贝强使用以上信息联系我并回复本次采购需求。" : "I agree that Beiqiang may use these details to respond to this sourcing request."}</span></label>
      <button className="button button-light form-button" type="submit" disabled={status.kind === "sending" || status.kind === "success"}>{status.kind === "sending" ? (zh ? "正在保存……" : "Saving request…") : status.kind === "success" ? (zh ? "询盘已保存" : "Request saved") : (zh ? "提交样品 / 报价需求" : "Submit sample / quotation request")}</button>
      <p className={`form-note form-note-${status.kind}`} aria-live="polite">{status.message}</p>
      {status.kind === "success" && accessDetails?.accessCode && <><Link className="inquiry-status-link" href={zh ? "/zh/inquiry-status/" : "/inquiry-status/"}>{zh ? "查看项目进度 →" : "Check this request status →"}</Link><InquiryAttachmentUploader reference={accessDetails.reference} accessCode={accessDetails.accessCode} locale={locale} /></>}
      <details className="inquiry-preview"><summary>{zh ? "检查询盘摘要" : "Review inquiry brief"}</summary><pre>{inquiryBrief}</pre></details>
    </form>
  );
}
