"use client";

import { useState } from "react";
import Link from "next/link";
import InquiryForm from "./components/InquiryForm";
import ProductCard from "./components/ProductCard";
import SiteFooter from "./components/SiteFooter";
import SiteHeader from "./components/SiteHeader";
import { collections, products } from "./data/products";
import { trackEvent } from "./lib/tracking";

const featuredCodes = ["BQ009", "BQ001", "BQ002", "BQ024", "BQ004", "BQ012"];
const featured = featuredCodes.map((code) => products.find((product) => product.code === code)!).filter(Boolean);

const faqItems = [
  { question: "Are you a factory or a trading company?", answer: "Beiqiang is a footwear factory supplier in Quanzhou, Fujian, China. We focus on casual walking shoes, verified wide toe box styles, lightweight slip-ons and textile footwear for overseas B2B buyers." },
  { question: "Can I request samples before a bulk order?", answer: "Sample availability is discussed style by style. The sample stage is used to confirm product, color, size, material and packing requirements before final bulk-order terms." },
  { question: "Can colors and sizes be mixed?", answer: "Mixed colors and sizes can be discussed according to the selected style, current availability and order quantity. The actual size and color matrix is confirmed before quotation." },
  { question: "Do you support OEM or ODM projects?", answer: "OEM/ODM requirements can be discussed after a base style or product brief is selected. Logo, color, material and packing requests are checked against the product and quantity before confirmation." },
];

export default function Home() {
  const [selectedCode, setSelectedCode] = useState("BQ009");
  const selected = products.find((product) => product.code === selectedCode) ?? products[0];
  const selectedLabel = `${selected.code} — ${selected.name}`;
  const brief = `Hello Beiqiang, I am interested in ${selectedLabel}. Please discuss sample availability and quotation requirements.`;
  const whatsappHref = `https://wa.me/8618959805256?text=${encodeURIComponent(brief)}`;

  function selectProduct(code: string) {
    setSelectedCode(code);
    trackEvent("product_select", { context: "homepage", styleCode: code });
    document.getElementById("inquiry")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <main>
      <SiteHeader />
      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">FACTORY DIRECT · PRODUCT-PROOF FIRST</p>
          <h1>A complete walking-shoe range for your next market test.</h1>
          <p className="hero-lead">Explore 30 documented styles across wide toe box, easy-on knit, breathable lace-up, athletic and seasonal directions—then shortlist samples against your market, quantity and target specification.</p>
          <div className="hero-actions"><Link className="button" href="/products/">Explore all 30 styles</Link><a className="text-link" href={whatsappHref} target="_blank" rel="noreferrer">WhatsApp a sourcing brief <span aria-hidden="true">→</span></a></div>
          <dl className="hero-facts"><div><dt>30</dt><dd>Product packages in one catalogue</dd></div><div><dt>03</dt><dd>Buyer-intent collections</dd></div><div><dt>01</dt><dd>Inquiry trail for every style</dd></div></dl>
        </div>
        <div className="hero-visual">
          <div className="hero-image-wrap"><img src="/catalog/bq009/01_main.jpg" alt="BQ009 L1026 mesh thick-sole athletic walking shoe" /></div>
          <div className="floating-card floating-card-top"><span className="dot" /><div><small>CURRENT LEAD STYLE</small><strong>BQ009 / L1026</strong></div></div>
          <div className="floating-card floating-card-bottom"><small>BUYER WORKFLOW</small><strong>Shortlist · Sample · Confirm</strong><span>No unsupported claims</span></div>
        </div>
      </section>

      <section className="assurance" aria-label="Supply highlights"><span>Real product evidence</span><span>Style-by-style specifications</span><span>Sample-before-bulk workflow</span><span>Factory-side checking and packing</span></section>

      <section className="section collection-entry" id="collections">
        <div className="section-heading"><div><p className="eyebrow">SHOP BY BUYER INTENT</p><h2>Start with the problem your range needs to solve.</h2></div><p>These collections group products by a real sourcing purpose. Only BQ001 and BQ002 are presented as verified wide toe box styles.</p></div>
        <div className="collection-grid">{collections.map((collection) => <Link key={collection.slug} href={`/collections/${collection.slug}/`}><span>{collection.name}</span><h3>{collection.title}</h3><p>{collection.description}</p><strong>Explore collection →</strong></Link>)}</div>
      </section>

      <section className="section collections">
        <div className="section-heading"><div><p className="eyebrow">PRIORITY SHORTLIST</p><h2>Six styles to begin a buyer conversation.</h2></div><p>Priority reflects current traffic evidence, range role and product differentiation—not invented sales volume.</p></div>
        <div className="product-grid">{featured.map((product) => <ProductCard key={product.code} product={product} />)}</div>
        <div className="section-cta"><Link className="button" href="/products/">View the complete catalogue</Link></div>
      </section>

      <section className="proof-section" id="proof">
        <div className="proof-image"><img src="/factory/batch-check.jpg" alt="Footwear batch checking and sorting before packing" /></div>
        <div className="proof-copy"><p className="eyebrow eyebrow-light">FACTORY PROOF, NOT GENERIC PROMISES</p><h2>See the product. Check the details. Reduce sourcing risk.</h2><p>Our buyer workflow is based on real shoe photos, style-by-style specification confirmation and sample checking before bulk-order discussion.</p><ul><li><span>01</span> Product and color selection</li><li><span>02</span> Material, size and packing confirmation</li><li><span>03</span> Sample check before final bulk terms</li></ul><a className="button button-light" href="#inquiry">Prepare your inquiry</a></div>
      </section>

      <section className="section trust-entry">
        <div className="section-heading"><div><p className="eyebrow">VERIFY BEFORE YOU BUY</p><h2>Four answers behind every serious sourcing decision.</h2></div><p>Review real evidence, understand what still needs confirmation, and enter the sample discussion with a useful brief.</p></div>
        <div className="trust-entry-grid">
          <Link href="/factory/"><span>01</span><h3>Factory</h3><p>See real workshop evidence and how a product direction becomes a checkable project.</p><strong>Review factory evidence →</strong></Link>
          <Link href="/quality-packing/"><span>02</span><h3>Quality &amp; packing</h3><p>Understand the order details behind checking, sorting and carton preparation.</p><strong>See the checking path →</strong></Link>
          <Link href="/oem-odm/"><span>03</span><h3>OEM / ODM</h3><p>Choose a base-style or development path without assuming feasibility in advance.</p><strong>Build a project brief →</strong></Link>
          <Link href="/sample-order-process/"><span>04</span><h3>Sample &amp; order process</h3><p>Know which decision comes next from shortlist through shipping coordination.</p><strong>Follow the order path →</strong></Link>
        </div>
      </section>

      <section className="section process"><div className="section-heading compact"><div><p className="eyebrow">A QUALIFIED SOURCING PATH</p><h2>From catalogue to quotation in three steps.</h2></div></div><div className="process-grid"><article><span>01</span><h3>Build a shortlist</h3><p>Compare product code, closure, size direction, colors and real gallery evidence.</p></article><article><span>02</span><h3>Send order context</h3><p>Share target market, quantity, size ratio, colors, packing and timing.</p></article><article><span>03</span><h3>Confirm by sample</h3><p>Verify high-impact specifications before final price and bulk-order terms.</p></article></div></section>

      <section className="section faq-section"><div className="section-heading compact"><div><p className="eyebrow">BUYER FAQ</p><h2>Answers before you request a sample.</h2></div></div><div className="faq-list">{faqItems.map((item) => <details key={item.question}><summary>{item.question}<span aria-hidden="true">+</span></summary><p>{item.answer}</p></details>)}</div></section>

      <section className="inquiry-section" id="inquiry">
        <div className="inquiry-intro"><p className="eyebrow eyebrow-light">REQUEST A MATCHED SAMPLE</p><h2>Tell us what you want to source.</h2><p>Select any catalogue style. Your inquiry is stored with its product code so the team can respond with the right product context.</p><label className="homepage-style-picker"><span>SELECTED STYLE</span><select value={selectedCode} onChange={(event) => selectProduct(event.target.value)}>{products.map((product) => <option key={product.code} value={product.code}>{product.code} / {product.sourceModel} — {product.name}</option>)}</select></label><div className="contact-links"><a className="button button-light" href={whatsappHref} target="_blank" rel="noreferrer">Send via WhatsApp</a><a className="contact-text-link" href="mailto:421345308@qq.com">Email 421345308@qq.com</a><a className="contact-text-link" href="https://cn1576227362luzl.m.en.alibaba.com/" target="_blank" rel="noreferrer">View Alibaba.com store</a></div></div>
        <InquiryForm styleCode={selected.code} styleLabel={selectedLabel} context="homepage" />
      </section>
      <SiteFooter />
      <a className="whatsapp-float" href={whatsappHref} target="_blank" rel="noreferrer">WhatsApp sourcing brief</a>
    </main>
  );
}
