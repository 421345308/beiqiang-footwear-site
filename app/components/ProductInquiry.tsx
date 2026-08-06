"use client";

import { useEffect } from "react";
import InquiryForm from "./InquiryForm";
import { trackEvent } from "../lib/tracking";

const ALIBABA_STORE = "https://cn1576227362luzl.m.en.alibaba.com/";

type ProductInquiryProps = {
  code: string;
  label: string;
  productName: string;
};

export default function ProductInquiry({ code, label, productName }: ProductInquiryProps) {
  const context = `${code.toLowerCase()}_inquiry`;

  useEffect(() => {
    trackEvent("product_view", { context: "product", styleCode: code });
  }, [code]);

  const brief = `Hello Beiqiang, I am interested in ${code} ${productName}. Please discuss sample availability and quotation requirements.`;
  const whatsappHref = `https://wa.me/8618959805256?text=${encodeURIComponent(brief)}`;
  const emailHref = `mailto:421345308@qq.com?subject=${encodeURIComponent(`${code} sample / quotation request`)}&body=${encodeURIComponent(brief)}`;

  return (
    <div className="product-inquiry-grid">
      <div className="product-inquiry-copy">
        <p className="eyebrow eyebrow-light">{code} SAMPLE REQUEST</p>
        <h2>Move from product review to a useful quotation.</h2>
        <p>Share the market, expected quantity and the details that matter to your order. Sample availability and final commercial terms are confirmed after the specification is checked.</p>
        <div className="contact-links" aria-label={`Contact Beiqiang Footwear about ${code}`}>
          <a className="button button-light" href={whatsappHref} target="_blank" rel="noreferrer" onClick={() => trackEvent("whatsapp_click", { context, styleCode: code })}>Send {code} brief on WhatsApp</a>
          <a className="contact-text-link" href={emailHref} onClick={() => trackEvent("email_click", { context, styleCode: code })}>Email 421345308@qq.com</a>
          <a className="contact-text-link" href={ALIBABA_STORE} target="_blank" rel="noreferrer" onClick={() => trackEvent("alibaba_click", { context, styleCode: code })}>Continue on Alibaba.com</a>
        </div>
      </div>
      <InquiryForm styleCode={code} styleLabel={label} context="product" />
    </div>
  );
}
