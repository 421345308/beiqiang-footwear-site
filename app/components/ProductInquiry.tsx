"use client";

import { useEffect } from "react";
import InquiryForm from "./InquiryForm";
import { trackEvent } from "../lib/tracking";
import type { Product } from "../data/products";
import { useProductColour } from "./ProductColourOptions";

const ALIBABA_STORE = "https://cn1576227362luzl.m.en.alibaba.com/";

type ProductInquiryProps = {
  product: Product;
  locale?: "en" | "zh";
  code: string;
  label: string;
  productName: string;
  alibabaProductId?: string;
};

export default function ProductInquiry({ product, code, label, productName, alibabaProductId, locale = "en" }: ProductInquiryProps) {
  const { colour } = useProductColour(product);
  const zh = locale === "zh";
  const context = `${code.toLowerCase()}_inquiry`;

  useEffect(() => {
    trackEvent("product_view", { context: "product", styleCode: code });
  }, [code]);

  const brief = `Hello Beiqiang, I am interested in ${code} ${productName}.${colour ? ` Requested colour: ${colour.name}.` : ""} Please discuss sample availability and quotation requirements.`;
  const whatsappHref = `https://wa.me/8618959805256?text=${encodeURIComponent(brief)}`;
  const emailHref = `mailto:shepeiqiang@gmail.com?subject=${encodeURIComponent(`${code} sample / quotation request`)}&body=${encodeURIComponent(brief)}`;
  const productSlug = productName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const alibabaHref = alibabaProductId ? `https://www.alibaba.com/product-detail/${productSlug}_${alibabaProductId}.html` : ALIBABA_STORE;

  return (
    <div className="product-inquiry-grid">
      <div className="product-inquiry-copy">
        <p className="eyebrow eyebrow-light">{code} · {zh ? "产品咨询" : "PRODUCT INQUIRY"}</p>
        <h2>{zh ? "咨询样品与报价" : "Samples & wholesale enquiries"}</h2>
        <p>{zh ? "请注明目标市场、预计数量及具体要求，我们将确认本款样品与报价方案。" : "Provide your target market, estimated quantity and specifications. We will confirm sample options and prepare a quotation for this style."}</p>
        <div className="contact-links" aria-label={`Contact Beiqiang Footwear about ${code}`}>
          <a className="button button-light" href={whatsappHref} target="_blank" rel="noreferrer" onClick={() => trackEvent("whatsapp_click", { context, styleCode: code })}>{zh ? "通过 WhatsApp 咨询" : "Enquire on WhatsApp"} · {code}</a>
          <a className="contact-text-link" href={emailHref} onClick={() => trackEvent("email_click", { context, styleCode: code })}>Email shepeiqiang@gmail.com</a>
          <a className="contact-text-link" href={alibabaHref} target="_blank" rel="noreferrer" onClick={() => trackEvent("alibaba_click", { context, styleCode: code, linkType: alibabaProductId ? "product" : "store" })}>{alibabaProductId ? (zh ? `查看 ${code} 国际站商品` : `View ${code} on Alibaba.com`) : (zh ? "查看贝强国际站店铺" : "Visit our Alibaba.com store")}</a>
        </div>
      </div>
      <InquiryForm styleCode={code} styleLabel={label} context="product" locale={locale} selectedColour={colour?.name || ""} />
    </div>
  );
}
