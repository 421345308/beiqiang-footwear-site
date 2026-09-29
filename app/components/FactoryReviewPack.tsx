"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { buildFactoryReviewPackText } from "../lib/factory-review-pack";
import { printWithBodyClass } from "../lib/print-mode";

export default function FactoryReviewPack({ productCount, locale = "en" }: { productCount: number; locale?: "en" | "zh" }) {
  const zh = locale === "zh";
  const [message, setMessage] = useState("");
  const reviewText = useMemo(() => buildFactoryReviewPackText(productCount, locale), [productCount, locale]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(reviewText);
      setMessage(zh ? "供应商评审简报已复制，可发给采购团队。" : "Supplier-review brief copied for your buying team.");
    } catch {
      setMessage(zh ? "浏览器未允许自动复制；可展开简报后手动选择文字。" : "Copy was blocked. Open the brief and select the text manually.");
    }
  }

  function print() {
    try {
      printWithBodyClass("factory-review-pack-printing");
    } catch {
      setMessage(zh ? "浏览器未能打开打印，请使用复制功能保存简报。" : "Printing was unavailable. Use copy to save the brief instead.");
    }
  }

  const now = zh
    ? ["真实工作区域、鞋品处理、检查与包装图片和视频", "当前产品图库、源款号与逐款公开资料", "样品、报价、订单准备和履约协作路径", "Email、WhatsApp和Alibaba.com联系入口"]
    : ["Real working-area, footwear handling, checking and packing media", "Current product galleries, source-model references and style-level details", "Sample, quotation, order-preparation and fulfillment collaboration paths", "Email, WhatsApp and Alibaba.com contact routes"];
  const later = zh
    ? ["准确材料、结构、尺码与颜色组合", "样品可行性、范围、费用与时间", "MOQ、价格、包装、交期与贸易条款", "买家点名文件的可提供情况"]
    : ["Exact materials, construction, size and color matrix", "Sample feasibility, scope, cost and timing", "MOQ, price, packing, lead time and trade terms", "Availability of buyer-named company, compliance or test documents"];
  const checklist = zh
    ? ["目标市场与销售渠道", "参考款、图片或现有网站款号", "预计样品与大货数量", "尺码、颜色、Logo与包装方向", "目的地、目标时间及指定审核文件"]
    : ["Target market and sales channel", "Reference style, image or current website code", "Expected sample and bulk quantity", "Size, color, logo and packing direction", "Destination, target timing and named review documents"];

  return <section className="section factory-review-pack" aria-labelledby={`factory-review-pack-title-${locale}`}>
    <header className="factory-review-pack-heading">
      <div>
        <p className="eyebrow">{zh ? "买家供应商评审" : "BUYING-TEAM SUPPLIER REVIEW"}</p>
        <h2 id={`factory-review-pack-title-${locale}`}>{zh ? "把一份可核对的工厂简报带进采购会议。" : "Bring a checkable factory brief into your sourcing meeting."}</h2>
        <p>{zh ? "先审核当前能看到的资料，再列出具体项目必须补充确认的内容。这样采购团队不需要从商品墙或零散聊天中猜测工厂能力。" : "Review what is visible now, then list what your specific project still needs confirmed. Your team should not have to infer factory capability from a product wall or scattered messages."}</p>
      </div>
      <div className="factory-review-pack-actions">
        <button type="button" onClick={() => void copy()}>{zh ? "复制评审简报" : "Copy review brief"}</button>
        <button type="button" onClick={print}>{zh ? "打印 / 保存PDF" : "Print / save PDF"}</button>
      </div>
    </header>

    <div className="factory-review-snapshot">
      <article><small>{zh ? "供应商" : "SUPPLIER"}</small><strong>{zh ? "泉州贝强鞋业服饰有限公司" : "Quanzhou Beiqiang Footwear & Apparel Co., Ltd."}</strong><span>{zh ? "中国福建泉州｜鞋类OEM/ODM与批发" : "Quanzhou, Fujian, China | Footwear OEM/ODM and wholesale"}</span></article>
      <article><small>{zh ? "当前网站选款" : "CURRENT WEBSITE SELECTION"}</small><strong>{productCount}{zh ? "款已整理产品页" : " organized product pages"}</strong><span>{zh ? "不是工厂全部产品范围" : "Not the factory's full product range"}</span></article>
      <article><small>{zh ? "适合的买家" : "BUYER FIT"}</small><strong>{zh ? "进口、批发、电商与品牌团队" : "Import, wholesale, ecommerce and brand teams"}</strong><span>{zh ? "按具体项目审核与确认" : "Reviewed project by project"}</span></article>
    </div>

    <div className="factory-review-columns">
      <article><p className="eyebrow eyebrow-light">{zh ? "现在可审核" : "AVAILABLE NOW"}</p><h3>{zh ? "先看真实资料" : "Review visible materials"}</h3><ul>{now.map((item) => <li key={item}>{item}</li>)}</ul></article>
      <article><p className="eyebrow">{zh ? "按项目确认" : "PROJECT CONFIRMATION"}</p><h3>{zh ? "收到需求后逐项核对" : "Confirm after the brief"}</h3><ul>{later.map((item) => <li key={item}>{item}</li>)}</ul></article>
      <article><p className="eyebrow">{zh ? "买家准备清单" : "BUYER CHECKLIST"}</p><h3>{zh ? "首次沟通请带上这些资料" : "Bring these to the first review"}</h3><ul>{checklist.map((item) => <li key={item}>{item}</li>)}</ul></article>
    </div>

    <details className="factory-review-text"><summary>{zh ? "展开可复制的完整简报" : "Open the complete copyable brief"}</summary><pre>{reviewText}</pre></details>
    <div className="factory-review-pack-footer">
      <p>{zh ? "本简报不是第三方审厂报告、认证、产能证明、报价、库存确认、样品批准、合同、订单或付款请求。所有项目事实需按具体款式和书面文件确认。" : "This is not a third-party factory audit, certificate, capacity proof, quotation, stock confirmation, sample approval, contract, order or payment request. Confirm every project fact against the specific style and written documents."}</p>
      <div className="hero-actions"><Link className="button" href={zh ? "/zh/request-quote/" : "/request-quote/"}>{zh ? "提交采购需求" : "Send a sourcing brief"}</Link><a className="text-link" href="mailto:shepeiqiang@gmail.com">shepeiqiang@gmail.com</a></div>
    </div>
    <p className="factory-review-pack-message" aria-live="polite">{message}</p>
  </section>;
}
