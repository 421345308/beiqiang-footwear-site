"use client";

import { useEffect } from "react";
import InquiryForm from "../../components/InquiryForm";
import { trackEvent } from "../../lib/tracking";

const ALIBABA_STORE = "https://cn1576227362luzl.m.en.alibaba.com/";

export default function ProductInquiry() {
  useEffect(() => {
    trackEvent("product_view", { context: "product", styleCode: "BQ001" });
  }, []);

  const brief = "Hello Beiqiang, I am interested in BQ-001 wide toe box knit slip-on walking shoes. Please discuss sample availability and quotation requirements.";
  const whatsappHref = `https://wa.me/8618959805256?text=${encodeURIComponent(brief)}`;
  const emailHref = `mailto:421345308@qq.com?subject=${encodeURIComponent("BQ001 sample / quotation request")}&body=${encodeURIComponent(brief)}`;

  return (
    <div className="product-inquiry-grid">
      <div className="product-inquiry-copy">
        <p className="eyebrow eyebrow-light">BQ001 SAMPLE REQUEST</p>
        <h2>Move from product review to a useful quotation.</h2>
        <p>Share the market, expected quantity and the details that matter to your order. Sample availability and final commercial terms are confirmed after the specification is checked.</p>
        <div className="contact-links" aria-label="Contact Beiqiang Footwear about BQ001">
          <a className="button button-light" href={whatsappHref} target="_blank" rel="noreferrer" onClick={() => trackEvent("whatsapp_click", { context: "bq001_inquiry", styleCode: "BQ001" })}>Send BQ001 brief on WhatsApp</a>
          <a className="contact-text-link" href={emailHref} onClick={() => trackEvent("email_click", { context: "bq001_inquiry", styleCode: "BQ001" })}>Email 421345308@qq.com</a>
          <a className="contact-text-link" href={ALIBABA_STORE} target="_blank" rel="noreferrer" onClick={() => trackEvent("alibaba_click", { context: "bq001_inquiry", styleCode: "BQ001" })}>Continue on Alibaba.com</a>
        </div>
      </div>
      <InquiryForm styleCode="BQ001" styleLabel="BQ001 — Wide Toe Box Knit Slip-On" context="product" />
    </div>
  );
}
