"use client";

import { useEffect, useState } from "react";
import InquiryForm from "./InquiryForm";
import { buyerTypeFromFinder, clearProductFinderBrief, finderBriefLabels, readProductFinderBrief, salesChannelFromFinder, type ProductFinderBrief } from "../lib/product-finder-brief";

export default function SourcingReviewForm({ locale = "en" }: { locale?: "en" | "zh" }) {
  const zh = locale === "zh";
  const [brief, setBrief] = useState<ProductFinderBrief | null | undefined>(undefined);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = readProductFinderBrief();
      setBrief(saved?.mode === "human_review" ? saved : null);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (brief === undefined) return <div className="sourcing-review-loading" aria-live="polite">{zh ? "正在载入选款条件……" : "Loading sourcing criteria…"}</div>;

  const labels = brief ? finderBriefLabels(brief, locale) : null;
  const selected = brief?.styleCodes.length ? brief.styleCodes.join(zh ? "、" : ", ") : (zh ? "无强行推荐款号" : "No forced candidate codes");
  const requirements = labels
    ? (zh
      ? `请人工复核选款。买家目标：${labels.priority}；穿脱偏好：${labels.closure}；自动候选：${selected}。请结合目标市场、预计数量、尺码、颜色、包装和样品要求，给出有事实依据的候选款及待确认项。`
      : `Please review the product selection manually. Buyer target: ${labels.priority}; closure preference: ${labels.closure}; automated candidates: ${selected}. Please recommend evidence-supported candidates and list pending confirmations after reviewing market, quantity, sizes, colors, packing and sample needs.`)
    : (zh ? "请根据目标市场、预计数量、尺码、颜色、包装和样品要求，人工推荐2至4款有事实依据的候选鞋款，并列出报价前待确认项。" : "Please recommend 2–4 evidence-supported candidate styles after reviewing target market, quantity, sizes, colors, packing and sample needs, and list what remains to confirm before quotation.");

  return <div className="sourcing-review-form-wrap">
    {labels ? <section className="finder-brief-handoff">
      <p className="eyebrow">{zh ? "已带入的买家目标" : "IMPORTED BUYER TARGET"}</p>
      <h3>{zh ? "业务员将从这些条件开始人工复核。" : "Sales will start the human review from these criteria."}</h3>
      <dl><div><dt>{zh ? "买家／渠道" : "Buyer / channel"}</dt><dd>{labels.buyer}</dd></div><div><dt>{zh ? "产品方向" : "Product direction"}</dt><dd>{labels.priority}</dd></div><div><dt>{zh ? "穿脱结构" : "Closure"}</dt><dd>{labels.closure}</dd></div><div><dt>{zh ? "自动候选" : "Automated candidates"}</dt><dd>{selected}</dd></div></dl>
      <p>{zh ? "这些是买家目标，不是库存、价格、生产可行性或产品能力确认。" : "These are buyer targets, not confirmation of stock, price, manufacturing feasibility or product capability."}</p>
      <button type="button" onClick={() => { clearProductFinderBrief(); setBrief(null); }}>{zh ? "清除这些条件" : "Clear these criteria"}</button>
    </section> : <section className="finder-brief-handoff"><p className="eyebrow">{zh ? "直接人工复核" : "DIRECT HUMAN REVIEW"}</p><h3>{zh ? "没有自动筛选条件也可以提交。" : "You can submit without automated finder criteria."}</h3><p>{zh ? "请在表单中说明市场、数量和希望解决的产品问题。" : "Use the form to explain your market, quantity and the product problem you need to solve."}</p></section>}
    <InquiryForm
      key={brief ? `${brief.buyerChannel}-${brief.priority}-${brief.closure}-${brief.styleCodes.join("-")}` : "direct"}
      styleCode="CATALOG-2026"
      styleLabel={zh ? "人工选款复核需求" : "Human product shortlist review"}
      context="sourcing_review"
      locale={locale}
      initialBuyerType={brief ? buyerTypeFromFinder(brief.buyerChannel) : undefined}
      initialMarket={brief ? salesChannelFromFinder(brief.buyerChannel) : undefined}
      initialRequirements={requirements}
      finderBrief={brief}
    />
  </div>;
}
