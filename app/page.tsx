"use client";

import { useState } from "react";
import InquiryForm from "./components/InquiryForm";
import { trackEvent } from "./lib/tracking";

const products = [
  {
    code: "BQ001",
    name: "Wide Toe Box Knit Slip-On",
    detail: "Roomy toe shape · Knitted upper · EVA sole · EU 36–46",
    image: "/products/bq001.jpg",
    tag: "Core wide-toe style",
    buyerFit: "Comfort-footwear importers",
    facts: ["Slip-on", "EU 36–46", "Knit upper"],
    href: "/products/bq001",
  },
  {
    code: "BQ002",
    name: "Extra Wide Toe Box Knit Slip-On",
    detail: "Roomy toe shape · Knitted textile · EU 36–46 · 3 grey directions",
    image: "/products/bq002.jpg",
    tag: "Core wide-toe style",
    buyerFit: "Comfort-footwear buyers",
    facts: ["Wide toe", "EU 36–46", "Slip-on"],
    href: "/products/bq002",
  },
  {
    code: "BQ004",
    name: "Lightweight Knit Slip-On",
    detail: "Knitted upper · EVA sole · EU 35–45 · 5 color directions",
    image: "/products/bq004.jpg",
    tag: "Online seller friendly",
    buyerFit: "Marketplace assortment testing",
    facts: ["Slip-on", "EU 35–45", "Breathable knit"],
  },
  {
    code: "BQ011",
    name: "Men’s Daily Walking Slip-On",
    detail: "Textile upper · Cushion sole · EU 39–45 · Easy-on profile",
    image: "/products/bq011.jpg",
    tag: "Men’s walking line",
    buyerFit: "Men’s casual footwear buyers",
    facts: ["Slip-on", "EU 39–45", "3 colors"],
  },
  {
    code: "BQ014",
    name: "Autumn Winter Stretch Slip-On",
    detail: "Stretch textile · Optional fleece discussion · EU 35–45",
    image: "/products/bq014.jpg",
    tag: "Seasonal option",
    buyerFit: "Autumn and winter collections",
    facts: ["Slip-on", "EU 35–45", "Stretch textile"],
  },
  {
    code: "BQ009",
    name: "Mesh Thick-Sole Athletic Walking Shoe",
    detail: "Mesh-textile appearance · Lace-up · EU 35–45 · 4 color directions",
    image: "/products/bq009/black-white-side.jpg",
    tag: "A-level traffic candidate",
    buyerFit: "Athletic footwear and online channels",
    facts: ["Lace-up", "EU 35–45", "Thick sole profile"],
    href: "/products/bq009",
  },
];

const buyerTypes = [
  {
    title: "Importers & wholesalers",
    body: "Build a practical walking-shoe line with size, color, packing and repeat-order details discussed style by style.",
  },
  {
    title: "Amazon & TikTok sellers",
    body: "Select visually clear product angles, request samples and confirm the sellable colors and size range before launch.",
  },
  {
    title: "Brand & private-label buyers",
    body: "Discuss logo, color and packing requirements against a chosen base style, then verify details through samples.",
  },
];

const faqItems = [
  {
    question: "Are you a factory or a trading company?",
    answer: "Beiqiang is a footwear factory supplier in Quanzhou, Fujian, China. We focus on casual walking shoes, roomy-toe styles, lightweight slip-ons and textile footwear for overseas B2B buyers.",
  },
  {
    question: "Can I request samples before a bulk order?",
    answer: "Sample availability can be discussed style by style. We use the sample stage to confirm the product, color, size, material and packing requirements before final bulk-order terms.",
  },
  {
    question: "Can colors and sizes be mixed?",
    answer: "Mixed colors and mixed sizes can be discussed according to the selected style, available stock and order quantity. We confirm the actual size and color matrix before quotation.",
  },
  {
    question: "Do you support OEM or ODM projects?",
    answer: "OEM/ODM requirements can be discussed after a base style or product brief is selected. Logo, color, material and packing requests must be checked against the product and quantity before confirmation.",
  },
  {
    question: "What information is needed for an accurate quotation?",
    answer: "Please share the style code, target market, expected quantity, size ratio, colors, material requirements, packing method and target timing. Final price depends on the confirmed specification and trade requirements.",
  },
];

export default function Home() {
  const [selectedStyle, setSelectedStyle] = useState("BQ001 — Wide Toe Box Knit Slip-On");
  const selectedCode = selectedStyle.split(" — ")[0];
  const contactBrief = `Hello Beiqiang, I am interested in ${selectedStyle}. Please discuss sample availability and quotation requirements.`;
  const emailHref = `mailto:421345308@qq.com?subject=${encodeURIComponent("Beiqiang footwear sample / quotation request")}&body=${encodeURIComponent(contactBrief)}`;
  const whatsappHref = `https://wa.me/8618959805256?text=${encodeURIComponent(contactBrief)}`;
  const alibabaStoreHref = "https://cn1576227362luzl.m.en.alibaba.com/?spm=a2700.details.0.0.49d669685pzyZm&wx_navbar_transparent=true&wx_screen_direc=portrait&productId=1601839050756&from=detail_company_card";

  function chooseStyle(code: string, name: string) {
    setSelectedStyle(`${code} — ${name}`);
    trackEvent("product_select", { context: "homepage", styleCode: code });
    document.getElementById("inquiry")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <main>
      <div className="top-note">
        <span>QUANZHOU FOOTWEAR FACTORY SUPPLIER</span>
        <span>Samples can be discussed before bulk orders</span>
      </div>

      <header className="site-header">
        <a className="brand" href="#top" aria-label="Beiqiang Footwear home">
          <span className="brand-mark">BQ</span>
          <span>
            <strong>BEIQIANG</strong>
            <small>FOOTWEAR SUPPLY</small>
          </span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#collections">Collections</a>
          <a href="#proof">Factory proof</a>
          <a href="#sourcing">Sourcing options</a>
          <a href="#process">How we work</a>
        </nav>
        <a className="button button-small" href="#inquiry">Request a sample</a>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">FACTORY DIRECT · OEM/ODM DISCUSSION</p>
          <h1>Comfort walking shoes built for your market.</h1>
          <p className="hero-lead">
            Wide toe box, lightweight slip-on and breathable textile footwear for importers, wholesalers, online sellers and brand buyers in the US and Europe.
          </p>
          <div className="hero-actions">
            <a className="button" href="#collections">Explore ready styles</a>
            <a className="text-link" href={whatsappHref} target="_blank" rel="noreferrer" onClick={() => trackEvent("whatsapp_click", { context: "hero", styleCode: selectedCode })}>WhatsApp a sourcing brief <span aria-hidden="true">→</span></a>
          </div>
          <dl className="hero-facts">
            <div><dt>01</dt><dd>Choose a market-fit style</dd></div>
            <div><dt>02</dt><dd>Confirm sample & specifications</dd></div>
            <div><dt>03</dt><dd>Discuss bulk-order details</dd></div>
          </dl>
        </div>
        <div className="hero-visual">
          <div className="hero-image-wrap">
            <img src="/products/bq001.jpg" alt="BQ001 white wide toe box knit slip-on walking shoe" />
          </div>
          <div className="floating-card floating-card-top">
            <span className="dot" />
            <div><small>PRODUCT FOCUS</small><strong>Roomy toe shape</strong></div>
          </div>
          <div className="floating-card floating-card-bottom">
            <small>STYLE BQ001</small>
            <strong>Knit upper · EVA sole</strong>
            <span>EU 36–46</span>
          </div>
        </div>
      </section>

      <section className="assurance" aria-label="Supply highlights">
        <span>Real product photography</span>
        <span>Sample-before-bulk workflow</span>
        <span>Mixed colors & sizes discussed by order</span>
        <span>Factory-side checking & packing</span>
      </section>

      <section className="section collections" id="collections">
        <div className="section-heading">
          <div><p className="eyebrow">START WITH A SHORTLIST</p><h2>Six styles for buyer discussion.</h2></div>
          <p>We keep the first selection focused. Material, size, colors, packing, quantity and delivery requirements are confirmed before a final quotation.</p>
        </div>
        <div className="product-grid">
          {products.map((product) => (
            <article className="product-card" key={product.code}>
              <div className="product-image"><img src={product.image} alt={`${product.code} ${product.name}`} /></div>
              <div className="product-meta">
                <span className="product-tag">{product.tag}</span>
                <span className="product-code">{product.code}</span>
              </div>
              <h3>{product.name}</h3>
              <p>{product.detail}</p>
              <ul className="product-facts" aria-label={`${product.code} key facts`}>
                {product.facts.map((fact) => <li key={fact}>{fact}</li>)}
              </ul>
              <small className="buyer-fit">Best fit: {product.buyerFit}</small>
              {product.href ? (
                <a className="product-detail-link" href={product.href}>View verified product details <span aria-hidden="true">↗</span></a>
              ) : (
                <button type="button" onClick={() => chooseStyle(product.code, product.name)}>
                  Add to sample inquiry <span aria-hidden="true">↗</span>
                </button>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="section sourcing-section" id="sourcing">
        <div className="section-heading">
          <div><p className="eyebrow">CHOOSE THE RIGHT SOURCING PATH</p><h2>Start from a proven style or a product brief.</h2></div>
          <p>Top footwear buyers separate fast assortment sourcing from product development. Choose the path that matches your launch stage, then confirm the real scope through samples.</p>
        </div>
        <div className="sourcing-grid">
          <article>
            <span className="path-number">01</span>
            <p className="path-label">READY-STYLE DISCUSSION</p>
            <h3>Shortlist an existing style.</h3>
            <p>Best for importers, wholesalers and online sellers who want to compare real product photos, available colors and size ranges before a trial order.</p>
            <ul><li>Select a style code</li><li>Confirm colors and size ratio</li><li>Discuss sample and packing</li></ul>
            <a className="text-link" href="#collections">Browse the shortlist <span aria-hidden="true">→</span></a>
          </article>
          <article>
            <span className="path-number">02</span>
            <p className="path-label">OEM / ODM DISCUSSION</p>
            <h3>Start with your market brief.</h3>
            <p>Best for brand and private-label buyers who have a reference style, target price direction, color plan or packaging requirement.</p>
            <ul><li>Share reference and target market</li><li>Review feasible product changes</li><li>Confirm development scope by sample</li></ul>
            <a className="text-link" href="#inquiry">Send a product brief <span aria-hidden="true">→</span></a>
          </article>
        </div>
      </section>

      <section className="proof-section" id="proof">
        <div className="proof-image"><img src="/factory/batch-check.jpg" alt="Footwear batch checking and sorting before packing" /></div>
        <div className="proof-copy">
          <p className="eyebrow eyebrow-light">FACTORY PROOF, NOT GENERIC PROMISES</p>
          <h2>See the product. Check the details. Reduce sourcing risk.</h2>
          <p>Our buyer workflow is based on real shoe photos, style-by-style specification confirmation and sample checking before bulk-order discussion.</p>
          <ul>
            <li><span>01</span> Product and color selection</li>
            <li><span>02</span> Material, size and packing confirmation</li>
            <li><span>03</span> Sample check before final bulk terms</li>
          </ul>
          <a className="button button-light" href="#inquiry">Prepare your inquiry</a>
        </div>
      </section>

      <section className="section process" id="process">
        <div className="section-heading compact">
          <div><p className="eyebrow">A CLEAR SOURCING PATH</p><h2>From style to sample in three conversations.</h2></div>
        </div>
        <div className="process-grid">
          <article><span>01</span><h3>Share your market</h3><p>Tell us your country, sales channel, buyer type and the style you are interested in.</p></article>
          <article><span>02</span><h3>Confirm the product</h3><p>Align quantity, material, size ratio, colors, logo, packing and target timing.</p></article>
          <article><span>03</span><h3>Check a sample</h3><p>Arrange a sample for quality checking before final bulk-order pricing and terms.</p></article>
        </div>
      </section>

      <section className="factory-gallery" aria-label="Factory and order process photos">
        <figure className="gallery-large"><img src="/factory/workshop.png" alt="Beiqiang footwear workshop" /><figcaption>Workshop view</figcaption></figure>
        <figure><img src="/factory/carton-ready.png" alt="Footwear cartons prepared for order packing" /><figcaption>Order packing support</figcaption></figure>
      </section>

      <section className="section buyer-section">
        <div className="section-heading compact">
          <div><p className="eyebrow">BUILT AROUND B2B BUYERS</p><h2>Different buyers need different proof.</h2></div>
        </div>
        <div className="buyer-grid">
          {buyerTypes.map((buyer, index) => (
            <article key={buyer.title}><span>0{index + 1}</span><h3>{buyer.title}</h3><p>{buyer.body}</p></article>
          ))}
        </div>
      </section>

      <section className="section quote-section">
        <div className="quote-card">
          <div><p className="eyebrow eyebrow-light">FASTER, MORE ACCURATE QUOTATIONS</p><h2>Five details move a sourcing conversation forward.</h2></div>
          <ol>
            <li><span>01</span><strong>Style code</strong><small>Which product should we check?</small></li>
            <li><span>02</span><strong>Target market</strong><small>Country and sales channel</small></li>
            <li><span>03</span><strong>Quantity</strong><small>Trial or bulk-order direction</small></li>
            <li><span>04</span><strong>Size and colors</strong><small>Required assortment ratio</small></li>
            <li><span>05</span><strong>Packing and timing</strong><small>Requirements to confirm</small></li>
          </ol>
        </div>
      </section>

      <section className="section faq-section" id="faq">
        <div className="section-heading compact">
          <div><p className="eyebrow">BUYER FAQ</p><h2>Answers before you request a sample.</h2></div>
        </div>
        <div className="faq-list">
          {faqItems.map((item) => (
            <details key={item.question}>
              <summary>{item.question}<span aria-hidden="true">+</span></summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="inquiry-section" id="inquiry">
        <div className="inquiry-intro">
          <p className="eyebrow eyebrow-light">REQUEST A MATCHED SAMPLE</p>
          <h2>Tell us what you want to source.</h2>
          <p>Start with one style and a few order details. We will use them to discuss sample availability and prepare an accurate quotation after specifications are confirmed.</p>
          <div className="selected-style"><small>SELECTED STYLE</small><strong>{selectedStyle}</strong></div>
          <div className="contact-links" aria-label="Contact Beiqiang Footwear">
            <a className="button button-light" href={whatsappHref} target="_blank" rel="noreferrer" onClick={() => trackEvent("whatsapp_click", { context: "homepage_inquiry", styleCode: selectedCode })}>Send via WhatsApp</a>
            <a className="contact-text-link" href={emailHref} onClick={() => trackEvent("email_click", { context: "homepage_inquiry", styleCode: selectedCode })}>Email 421345308@qq.com</a>
            <a className="contact-text-link" href={alibabaStoreHref} target="_blank" rel="noreferrer" onClick={() => trackEvent("alibaba_click", { context: "homepage_inquiry", styleCode: selectedCode })}>View Alibaba.com store</a>
          </div>
        </div>
        <InquiryForm styleCode={selectedCode} styleLabel={selectedStyle} context="homepage" />
      </section>

      <footer>
        <div className="brand footer-brand"><span className="brand-mark">BQ</span><span><strong>BEIQIANG</strong><small>FOOTWEAR SUPPLY</small></span></div>
        <p>Quanzhou Beiqiang Footwear & Apparel Co., Ltd.<br />Quanzhou, Fujian, China<br /><a href="mailto:421345308@qq.com">421345308@qq.com</a> · <a href="https://wa.me/8618959805256" target="_blank" rel="noreferrer">WhatsApp +86 189 5980 5256</a></p>
        <p>Wide toe box · Comfort walking · Lightweight slip-on · OEM/ODM discussion</p>
      </footer>
      <a className="whatsapp-float" href={whatsappHref} target="_blank" rel="noreferrer" aria-label="Send Beiqiang a sourcing brief on WhatsApp" onClick={() => trackEvent("whatsapp_click", { context: "floating", styleCode: selectedCode })}>WhatsApp sourcing brief</a>
    </main>
  );
}
