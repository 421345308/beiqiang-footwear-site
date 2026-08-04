"use client";

import { useEffect, useMemo, useState } from "react";

const ALIBABA_STORE = "https://cn1576227362luzl.m.en.alibaba.com/";

export default function ProductInquiry() {
  const [company, setCompany] = useState("");
  const [buyerType, setBuyerType] = useState("Importer / wholesaler");
  const [market, setMarket] = useState("");
  const [quantity, setQuantity] = useState("");
  const [requirements, setRequirements] = useState("");
  const [source, setSource] = useState("Direct / website");
  const [copyStatus, setCopyStatus] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sourceParts = [params.get("utm_source"), params.get("utm_medium"), params.get("utm_campaign")].filter(Boolean);
    if (sourceParts.length) setSource(sourceParts.join(" / "));
  }, []);

  const inquiryBrief = useMemo(
    () =>
      [
        "Beiqiang BQ001 sample / quotation request",
        "Style: BQ-001 wide toe box knit slip-on walking shoe",
        `Company: ${company || "To be provided"}`,
        `Buyer type: ${buyerType}`,
        `Target market: ${market || "To be provided"}`,
        `Expected quantity: ${quantity || "To be discussed"}`,
        `Requirements: ${requirements || "Please confirm sample, colors, size ratio, packing and timing."}`,
        `Source: ${source}`,
      ].join("\n"),
    [buyerType, company, market, quantity, requirements, source],
  );

  const whatsappHref = `https://wa.me/8618959805256?text=${encodeURIComponent(inquiryBrief)}`;
  const emailHref = `mailto:421345308@qq.com?subject=${encodeURIComponent("BQ001 sample / quotation request")}&body=${encodeURIComponent(inquiryBrief)}`;

  async function copyInquiry() {
    try {
      await navigator.clipboard.writeText(inquiryBrief);
      setCopyStatus("Inquiry brief copied. You can now send it through your preferred sourcing channel.");
    } catch {
      setCopyStatus("Please select and copy the inquiry brief below.");
    }
  }

  return (
    <div className="product-inquiry-grid">
      <div className="product-inquiry-copy">
        <p className="eyebrow eyebrow-light">BQ001 SAMPLE REQUEST</p>
        <h2>Move from product review to a useful quotation.</h2>
        <p>Share the market, expected quantity and the details that matter to your order. Sample availability and final commercial terms are confirmed after the specification is checked.</p>
        <div className="contact-links" aria-label="Contact Beiqiang Footwear about BQ001">
          <a className="button button-light" href={whatsappHref} target="_blank" rel="noreferrer">Send BQ001 brief on WhatsApp</a>
          <a className="contact-text-link" href={emailHref}>Email 421345308@qq.com</a>
          <a className="contact-text-link" href={ALIBABA_STORE} target="_blank" rel="noreferrer">Continue on Alibaba.com</a>
        </div>
      </div>
      <div className="inquiry-form" aria-label="BQ001 sample inquiry brief builder">
        <label>Company name<input value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Your company" /></label>
        <label>Buyer type<select value={buyerType} onChange={(event) => setBuyerType(event.target.value)}><option>Importer / wholesaler</option><option>Amazon / TikTok seller</option><option>Brand / private label</option><option>Sourcing agent</option></select></label>
        <label>Target market<input value={market} onChange={(event) => setMarket(event.target.value)} placeholder="Country / sales channel" /></label>
        <label>Expected quantity<input value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="Trial or bulk quantity" /></label>
        <label>Requirements<textarea value={requirements} onChange={(event) => setRequirements(event.target.value)} placeholder="Colors, size ratio, logo, packing, timing..." rows={4} /></label>
        <button className="button button-light form-button" type="button" onClick={copyInquiry}>Copy BQ001 inquiry brief</button>
        <p className="form-note" aria-live="polite">{copyStatus || "No final price, MOQ or delivery promise is made until order details are confirmed."}</p>
        <pre>{inquiryBrief}</pre>
      </div>
    </div>
  );
}
