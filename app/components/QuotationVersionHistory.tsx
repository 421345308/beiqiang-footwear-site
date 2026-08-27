"use client";

import { quotationChanges, quotationTotal, type BuyerSafeQuotation } from "../lib/quotation-history";
export type { BuyerSafeQuotation } from "../lib/quotation-history";

export default function QuotationVersionHistory({ quotations, currentQuoteNumber, locale = "en" }: { quotations: BuyerSafeQuotation[]; currentQuoteNumber: string; locale?: "en" | "zh" }) {
  if (quotations.length < 2) return null;
  const ordered = [...quotations].sort((a, b) => (Number(a.version) || 0) - (Number(b.version) || 0));
  const previous = ordered.filter((quote) => quote.quoteNumber !== currentQuoteNumber).reverse();
  if (!previous.length) return null;
  const zh = locale === "zh";
  return <details className="buyer-quotation-history">
    <summary>{zh ? `查看报价版本历史（${ordered.length}版）` : `Review quotation version history (${ordered.length} versions)`}</summary>
    <p>{zh ? "历史版本用于核对议价过程；只有页面上标记为当前版本的报价可以接受或要求修改。" : "Use prior versions to verify the negotiation trail. Only the quotation marked as current on this page can receive a decision."}</p>
    <div>{previous.map((quote) => {
      const position = ordered.findIndex((item) => item.quoteNumber === quote.quoteNumber);
      const next = ordered[position + 1];
      const changes = next ? quotationChanges(quote, next, locale) : [];
      const status = zh ? ({ superseded: "已被新版替代", buyer_accepted: "买家曾接受", buyer_revision_requested: "买家曾要求修改", buyer_declined: "买家曾拒绝", issued: "已签发" }[quote.status] || quote.status.replaceAll("_", " ")) : quote.status.replaceAll("_", " ");
      return <article key={quote.quoteNumber}>
        <div><strong>{quote.quoteNumber} · V{quote.version}</strong><span>{status}</span></div>
        <p>{quote.tradeTerm || (zh ? "贸易术语待确认" : "Trade term to confirm")} · {quote.currency} {quotationTotal(quote).toFixed(2)} · {zh ? "签发" : "issued"} {quote.issuedAt ? new Date(quote.issuedAt).toLocaleString(zh ? "zh-CN" : "en-US") : (zh ? "时间待确认" : "date to confirm")}</p>
        <small>{zh ? "产品行" : "Lines"}: {quote.lines.map((line) => `${line.code} · ${line.quantity} · ${quote.currency} ${line.unitPrice}`).join(" | ")}</small>
        {changes.length ? <small><b>{zh ? "下一版变更字段：" : "Fields changed in the next version: "}</b>{changes.join(zh ? "、" : ", ")}</small> : null}
        {quote.buyerDecision ? <small><b>{zh ? "买家当时的决定：" : "Buyer response on this version: "}</b>{quote.buyerDecision.replaceAll("_", " ")}{quote.buyerNote ? ` · ${quote.buyerNote}` : ""}</small> : null}
      </article>;
    })}</div>
    <small>{zh ? "版本历史是买家安全的沟通记录，不取代正式报价文件、Alibaba Trade Assurance订单或双方签署合同。" : "This buyer-safe history supports review. It does not replace the issued quotation document, Alibaba Trade Assurance order or signed bilateral contract."}</small>
  </details>;
}
