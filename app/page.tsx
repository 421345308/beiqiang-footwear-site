"use client";

import { useState } from "react";
import Link from "next/link";
import InquiryForm from "./components/InquiryForm";
import SiteFooter from "./components/SiteFooter";
import SiteHeader from "./components/SiteHeader";
import FactoryEvidenceVideo from "./components/FactoryEvidenceVideo";
import { collections, products } from "./data/products";
import { factoryVideoSchema } from "./lib/factory-video-schema";
import { trackEvent } from "./lib/tracking";

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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(factoryVideoSchema("en")) }} />
      <SiteHeader />
      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">QUANZHOU FOOTWEAR FACTORY · B2B SUPPLY</p>
          <h1>A footwear factory for wholesale, private-label and OEM projects.</h1>
          <p className="hero-lead">Beiqiang helps importers, wholesalers, marketplace sellers and brand buyers move from a product direction to a reviewable sample and commercial quotation. Start with the current online selection or send your own reference for a wider factory-range review.</p>
          <div className="hero-actions"><Link className="button" href="/request-quote/">Discuss a sourcing project</Link><Link className="button button-secondary" href="/factory/">See factory &amp; process</Link><Link className="text-link" href="/products/">Browse current product selection <span aria-hidden="true">→</span></Link></div>
          <dl className="hero-facts"><div><dt>B2B</dt><dd>Wholesale and private-label supply</dd></div><div><dt>OEM</dt><dd>Project requirements reviewed style by style</dd></div><div><dt>CN</dt><dd>Quanzhou, Fujian, China</dd></div></dl>
        </div>
        <div className="hero-visual">
          <FactoryEvidenceVideo compact />
        </div>
      </section>

      <section className="assurance" aria-label="Supply highlights"><span>Factory-side project review</span><span>Real product and process visuals</span><span>Sample-before-bulk workflow</span><span>Written specification confirmation</span></section>

      <section className="section factory-home-intro">
        <div className="section-heading"><div><p className="eyebrow">START WITH THE SUPPLIER</p><h2>See how Beiqiang supports a sourcing decision.</h2></div><p>The website is a buyer workspace: it introduces the factory, helps narrow product directions and captures the details needed for a useful B2B response. It is not a retail checkout or a claim that every request is already feasible.</p></div>
        <div className="trust-entry-grid"><Link href="/factory/"><span>01</span><h3>Factory &amp; working areas</h3><p>Review current factory footage and the project path from direction to sample discussion.</p><strong>Visit the factory page →</strong></Link><Link href="/quality-packing/"><span>02</span><h3>Checking &amp; packing</h3><p>Understand which product, assortment and carton details are confirmed for an order.</p><strong>Review quality &amp; packing →</strong></Link><Link href="/oem-odm/"><span>03</span><h3>OEM / ODM review</h3><p>Submit branding, material, color or development targets for feasibility review.</p><strong>Prepare an OEM brief →</strong></Link><Link href="/sample-order-process/"><span>04</span><h3>Sample to formal order</h3><p>Follow the decisions from shortlist and sample through confirmed commercial terms.</p><strong>See the buyer process →</strong></Link></div>
      </section>

      <section className="section collection-entry" id="collections">
        <div className="section-heading"><div><p className="eyebrow">CURRENT PRODUCT DIRECTIONS</p><h2>Browse by sourcing need, not by one promoted shoe.</h2></div><p>These categories are entry points into the current online selection, not the full factory range. If your target is not shown, send a reference or request the latest line sheet.</p></div>
        <div className="collection-grid">{collections.map((collection) => <Link key={collection.slug} href={`/collections/${collection.slug}/`}><span>{collection.name}</span><h3>{collection.title}</h3><p>{collection.description}</p><strong>Explore collection →</strong></Link>)}</div>
        <div className="section-cta"><Link className="button button-secondary" href="/products/">Browse current online selection</Link><Link className="text-link" href="/line-sheet/">Request current line sheet →</Link></div>
      </section>

      <section className="section sourcing-program-entry">
        <div className="section-heading"><div><p className="eyebrow">CHOOSE YOUR SOURCING PATH</p><h2>Start with the commercial decision you need to make.</h2></div><p>Dedicated buyer pages explain what to prepare, which products to review and which facts remain open before quotation.</p></div>
        <div className="sourcing-program-entry-grid">
          <Link href="/solutions/wholesale-walking-shoes/" onClick={() => trackEvent("sourcing_program_cta", { context: "homepage_wholesale" })}><span>01 · STOCK RANGE</span><h3>Wholesale walking shoes</h3><p>Build a multi-style assortment for importing, distribution or marketplace testing.</p><strong>Open wholesale path →</strong></Link>
          <Link href="/solutions/private-label-walking-shoes/" onClick={() => trackEvent("sourcing_program_cta", { context: "homepage_private_label" })}><span>02 · BASE STYLE</span><h3>Private-label walking shoes</h3><p>Start from a documented product and review logo, color, labeling and packing changes.</p><strong>Open private-label path →</strong></Link>
          <Link href="/solutions/oem-knit-shoes/" onClick={() => trackEvent("sourcing_program_cta", { context: "homepage_oem" })}><span>03 · DEVELOPMENT</span><h3>OEM knit-shoe project</h3><p>Structure a technical brief without presenting buyer targets as existing capability.</p><strong>Open OEM path →</strong></Link>
        </div>
      </section>

      <section className="section resource-home-entry">
        <div className="section-heading"><div><p className="eyebrow">BUYER SOURCING LIBRARY</p><h2>Prepare the decisions that make a quotation useful.</h2></div><p>Practical guides connect product discovery to a complete RFQ, controlled sample approval and a formal private-label order path.</p></div>
        <div className="resource-home-grid"><Link href="/resources/footwear-rfq-checklist/"><span>RFQ CHECKLIST</span><h3>What a footwear supplier needs before quoting</h3><p>Style, quantity, size ratio, materials, packing, destination, timing and sample scope.</p><strong>Build a clearer buying brief →</strong></Link><Link href="/resources/shoe-sample-approval-checklist/"><span>SAMPLE CONTROL</span><h3>Approve one physical sample without hidden assumptions</h3><p>Freeze the reference, review scope, acceptance criteria, exclusions and next revision.</p><strong>Open sample checklist →</strong></Link><Link href="/resources/private-label-walking-shoes-sourcing-guide/"><span>PRIVATE LABEL</span><h3>Move from shortlist to formal transaction</h3><p>Separate customization feasibility, sample evidence, quotation and order confirmation.</p><strong>Open buyer path →</strong></Link></div>
        <div className="section-cta"><Link className="button button-secondary" href="/resources/">View all sourcing resources</Link></div>
      </section>

      <section className="proof-section" id="proof">
        <div className="proof-image"><img src="/factory-web/batch-check.webp" alt="Footwear batch checking and preparation before packing at Beiqiang" loading="lazy" decoding="async" /></div>
        <div className="proof-copy"><p className="eyebrow eyebrow-light">FROM FACTORY REVIEW TO A COMMERCIAL RESPONSE</p><h2>Turn a sourcing direction into details the factory can check.</h2><p>The current website product pages are a practical starting set—not the limit of Beiqiang&apos;s range. The team can also review a reference image, target market and expected quantity before recommending the next step.</p><ul><li><span>01</span> Product direction or reference</li><li><span>02</span> Material, size, color and packing requirements</li><li><span>03</span> Sample and written commercial confirmation</li></ul><a className="button button-light" href="#inquiry">Prepare your inquiry</a></div>
      </section>

      <section className="section process"><div className="section-heading compact"><div><p className="eyebrow">A QUALIFIED SOURCING PATH</p><h2>From catalogue to quotation in three steps.</h2></div></div><div className="process-grid"><article><span>01</span><h3>Build a shortlist</h3><p>Compare product code, closure, size direction, colors and real gallery evidence.</p></article><article><span>02</span><h3>Send order context</h3><p>Share target market, quantity, size ratio, colors, packing and timing.</p></article><article><span>03</span><h3>Confirm by sample</h3><p>Verify high-impact specifications before final price and bulk-order terms.</p></article></div></section>

      <section className="section faq-section"><div className="section-heading compact"><div><p className="eyebrow">BUYER FAQ</p><h2>Answers before you request a sample.</h2></div></div><div className="faq-list">{faqItems.map((item) => <details key={item.question}><summary>{item.question}<span aria-hidden="true">+</span></summary><p>{item.answer}</p></details>)}</div></section>

      <section className="inquiry-section" id="inquiry">
        <div className="inquiry-intro"><p className="eyebrow eyebrow-light">START A FACTORY REVIEW</p><h2>Tell us what you want to source.</h2><p>Choose a current website style or use the full request form to describe another product direction. The product code is a reference for the conversation—not a limit on what you may ask the factory to review.</p><label className="homepage-style-picker"><span>STARTING WEBSITE STYLE</span><select value={selectedCode} onChange={(event) => selectProduct(event.target.value)}>{products.map((product) => <option key={product.code} value={product.code}>{product.code} / {product.sourceModel} — {product.name}</option>)}</select></label><div className="contact-links"><Link className="button button-light" href="/request-quote/?program=reference-style">Describe another style</Link><a className="contact-text-link" href={whatsappHref} target="_blank" rel="noreferrer">Send via WhatsApp</a><a className="contact-text-link" href="mailto:421345308@qq.com">Email 421345308@qq.com</a><a className="contact-text-link" href="https://cn1576227362luzl.m.en.alibaba.com/" target="_blank" rel="noreferrer">View Alibaba.com store</a></div></div>
        <InquiryForm styleCode={selected.code} styleLabel={selectedLabel} context="homepage" />
      </section>
      <SiteFooter />
      <a className="whatsapp-float" href={whatsappHref} target="_blank" rel="noreferrer">WhatsApp sourcing brief</a>
    </main>
  );
}
