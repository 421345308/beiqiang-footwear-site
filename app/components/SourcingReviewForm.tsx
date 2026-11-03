"use client";

import { useEffect, useState } from "react";
import InquiryForm from "./InquiryForm";
import ResourceInquiryContext from "./ResourceInquiryContext";
import { buyerResources } from "../data/resources";
import { chineseBuyerResources } from "../data/resources-zh";
import { findInquiryResource } from "../lib/resource-inquiry";
import { buyerTypeFromFinder, clearProductFinderBrief, finderBriefLabels, readProductFinderBrief, type ProductFinderBrief } from "../lib/product-finder-brief";

export default function SourcingReviewForm({ locale = "en" }: { locale?: "en" | "zh" }) {
  const zh = locale === "zh";
  const [resourceSlug, setResourceSlug] = useState("");
  const resource = findInquiryResource(resourceSlug, zh ? chineseBuyerResources : buyerResources);
  const [brief, setBrief] = useState<ProductFinderBrief | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setResourceSlug(new URLSearchParams(window.location.search).get("resource") || "");
      const saved = readProductFinderBrief();
      setBrief(saved?.mode === "human_review" ? saved : null);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const labels = brief ? finderBriefLabels(brief, locale) : null;
  const selected = brief?.styleCodes.length ? brief.styleCodes.join(zh ? "、" : ", ") : (zh ? "暂未选款" : "No style selected yet");
  const requirements = labels
    ? (zh
      ? `希望获得选款建议。产品方向：${labels.priority}；穿脱偏好：${labels.closure}；感兴趣的款式：${selected}。请结合目标市场、数量、尺码、颜色、包装和样品要求推荐合适的鞋款。`
      : `Please help with our shoe selection. Product direction: ${labels.priority}; fastening preference: ${labels.closure}; styles of interest: ${selected}. Please recommend suitable options for our market, quantities, sizes, colors, packing and sample needs.`)
    : "";

  return <div className="sourcing-review-form-wrap">
    <ResourceInquiryContext resource={resource} locale={locale} />
    {labels ? <section className="finder-brief-handoff">
      <p className="eyebrow">{zh ? "已带入的买家目标" : "IMPORTED BUYER TARGET"}</p>
      <h3>{zh ? "我们会参考您选好的条件。" : "We will start with the preferences you selected."}</h3>
      <dl><div><dt>{zh ? "买家／渠道" : "Buyer / channel"}</dt><dd>{labels.buyer}</dd></div><div><dt>{zh ? "产品方向" : "Product direction"}</dt><dd>{labels.priority}</dd></div><div><dt>{zh ? "穿脱结构" : "Closure"}</dt><dd>{labels.closure}</dd></div><div><dt>{zh ? "感兴趣的款式" : "Styles of interest"}</dt><dd>{selected}</dd></div></dl>
      <p>{zh ? "补充您的市场、数量和样品要求，我们将据此推荐鞋款。" : "Share your market, quantities and sample needs so we can recommend suitable styles."}</p>
      <button type="button" onClick={() => { clearProductFinderBrief(); setBrief(null); }}>{zh ? "清除这些条件" : "Clear these criteria"}</button>
    </section> : <section className="finder-brief-handoff"><p className="eyebrow">{zh ? "还没选好款也可以咨询" : "NO PRODUCT CODE NEEDED"}</p><h3>{zh ? "说说您想找什么鞋。" : "Tell us about the shoes you need."}</h3><p>{zh ? "可在需求中粘贴参考链接，说明用途和想修改的地方。提交后可以私密上传图片；保密文件请先沟通保密协议。" : "Include a reference link, intended use and any changes you want. You can upload images privately after submitting. Please discuss NDA terms before sharing confidential files."}</p></section>}
    <InquiryForm
      key={brief ? `${brief.buyerChannel}-${brief.priority}-${brief.closure}-${brief.styleCodes.join("-")}` : "direct"}
      styleCode="CATALOG-2026"
      styleLabel={zh ? "选款与定制咨询" : "Footwear sourcing consultation"}
      context="sourcing_review"
      sourcingProgram={resource ? `resource-${resource.slug}` : ""}
      locale={locale}
      initialBuyerType={brief ? buyerTypeFromFinder(brief.buyerChannel) : undefined}
      initialRequirements={requirements}
      finderBrief={brief}
    />
  </div>;
}
