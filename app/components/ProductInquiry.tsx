"use client";

import { useEffect } from "react";
import InquiryForm from "./InquiryForm";
import { trackEvent } from "../lib/tracking";

const ALIBABA_STORE = "https://cn1576227362luzl.m.en.alibaba.com/";

type ProductInquiryProps = {
  code: string;
  label: string;
  productName: string;
  alibabaProductId?: string;
};

export default function ProductInquiry({ code, label, productName, alibabaProductId }: ProductInquiryProps) {
  const context = `${code.toLowerCase()}_inquiry`;

  useEffect(() => {
    trackEvent("product_view", { context: "product", styleCode: code });
  }, [code]);

  const brief = `Hello Beiqiang, I am interested in ${code} ${productName}. Please discuss sample availability and quotation requirements.`;
  const whatsappHref = `https://wa.me/8618959805256?text=${encodeURIComponent(brief)}`;
  const emailHref = `mailto:421345308@qq.com?subject=${encodeURIComponent(`${code} sample / quotation request`)}&body=${encodeURIComponent(brief)}`;
  const productSlug = productName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const alibabaHref = alibabaProductId ? `https://www.alibaba.com/product-detail/${productSlug}_${alibabaProductId}.html` : ALIBABA_STORE;

  return (
    <div className="product-inquiry-grid">
      <div className="product-inquiry-copy">
        <p className="eyebrow eyebrow-light">{code} SAMPLE REQUEST</p>
        <h2>Interested in a sample or a quote for this style?</h2>
        <p>Tell us your sales market, estimated quantity and the questions you want answered. We will check the selected style before confirming sample arrangements and a quotation.</p>
        <div className="contact-links" aria-label={`Contact Beiqiang Footwear about ${code}`}>
          <a className="button button-light" href={whatsappHref} target="_blank" rel="noreferrer" onClick={() => trackEvent("whatsapp_click", { context, styleCode: code })}>Send {code} brief on WhatsApp</a>
          <a className="contact-text-link" href={emailHref} onClick={() => trackEvent("email_click", { context, styleCode: code })}>Email 421345308@qq.com</a>
          <a className="contact-text-link" href={alibabaHref} target="_blank" rel="noreferrer" onClick={() => trackEvent("alibaba_click", { context, styleCode: code, linkType: alibabaProductId ? "product" : "store" })}>{alibabaProductId ? `Open ${code} on Alibaba.com` : "View Beiqiang Alibaba.com store"}</a>
        </div>
      </div>
      <InquiryForm styleCode={code} styleLabel={label} context="product" />
    </div>
  );
}
