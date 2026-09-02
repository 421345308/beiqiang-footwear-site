"use client";

import { useMemo, useState } from "react";
import { buildQuoteBriefText, type QuoteBriefInput } from "../lib/quote-brief";
import { printWithBodyClass } from "../lib/print-mode";

export default function QuoteBriefReview({ input, locale = "en" }: { input: QuoteBriefInput; locale?: "en" | "zh" }) {
  const zh = locale === "zh";
  const [message, setMessage] = useState("");
  const text = useMemo(() => buildQuoteBriefText(input, locale), [input, locale]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setMessage(zh ? "采购简报已复制，可发给同事审核。" : "Sourcing brief copied for internal review.");
    } catch {
      setMessage(zh ? "浏览器未允许自动复制；可展开简报后手动选择文字。" : "Copy was blocked. Open the brief and select the text manually.");
    }
  }

  function print() {
    try {
      printWithBodyClass("quote-brief-printing");
    } catch {
      setMessage(zh ? "浏览器未能打开打印，请使用复制功能保存简报。" : "Printing was unavailable. Use copy to save the brief instead.");
    }
  }

  return <section className="quote-brief-review" aria-labelledby={`quote-brief-title-${locale}`}>
    <header>
      <div>
        <p className="eyebrow eyebrow-light">{zh ? "提交前内部审核" : "PRE-SUBMISSION BUYING-TEAM REVIEW"}</p>
        <h3 id={`quote-brief-title-${locale}`}>{zh ? "先让同事核对这份采购简报" : "Review the sourcing brief before you submit"}</h3>
      </div>
      <span>{input.lines.length}{zh ? "款" : input.lines.length === 1 ? " style" : " styles"}</span>
    </header>
    <p>{zh ? "复制文字或打印为PDF，用于采购、运营或管理团队核对款号、数量和项目目标。该动作不会提交表单。" : "Copy the text or print it to PDF so purchasing, operations or management can check styles, quantities and project targets. These actions do not submit the form."}</p>
    <details>
      <summary>{zh ? "展开采购简报" : "Open sourcing brief"}</summary>
      <pre>{text}</pre>
    </details>
    <div className="quote-brief-actions">
      <button type="button" onClick={() => void copy()}>{zh ? "复制简报" : "Copy brief"}</button>
      <button type="button" onClick={print}>{zh ? "打印 / 保存PDF" : "Print / save PDF"}</button>
    </div>
    <small>{zh ? "这是买家草稿，不是报价、库存确认、样品批准、订单、付款请求或生产可行性确认。正式提交后才会发送给贝强。" : "This buyer draft is not a quotation, stock confirmation, sample approval, order, payment request or feasibility confirmation. It reaches Beiqiang only after formal submission."}</small>
    <p className="quote-brief-message" aria-live="polite">{message}</p>
  </section>;
}
