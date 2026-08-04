import type { Metadata } from "next";
import ProductInquiry from "./ProductInquiry";

const SITE_URL = "https://www.beiqiang.online";

export const metadata: Metadata = {
  title: "BQ001 Men's Wide Toe Box Slip-On Walking Shoes | Beiqiang",
  description: "Review BQ001 wide toe box slip-on walking shoes with stretch knit upper, EVA sole, EU 36-46 size direction and three color options. Request a sample or B2B quotation from Beiqiang Footwear.",
  alternates: { canonical: `${SITE_URL}/products/bq001` },
  openGraph: {
    title: "BQ001 Wide Toe Box Knit Slip-On | Beiqiang Footwear",
    description: "A B2B product page for importers, wholesalers, online sellers and private-label buyers sourcing comfort walking shoes.",
    url: `${SITE_URL}/products/bq001`,
    type: "website",
    images: [{ url: `${SITE_URL}/products/bq001/white-angle.jpg`, width: 750, height: 1000, alt: "BQ001 white wide toe box knit slip-on walking shoe" }],
  },
};

const faq = [
  { question: "Which BQ001 details are currently confirmed?", answer: "The current product record and photo package support a slip-on construction, stretch knit textile upper, EVA midsole and outsole, EU 36-46 size direction, and white, black/white and all-black color directions." },
  { question: "Can I request a BQ001 sample before a bulk order?", answer: "Sample availability can be discussed before bulk-order terms. The sample stage is used to confirm the product, color, size, material and packing requirements." },
  { question: "What determines the final BQ001 quotation?", answer: "Final price and order terms depend on quantity, size ratio, colors, material requirements, logo or packing requests, target timing and trade requirements." },
];

export default function BQ001Page() {
  const whatsappHref = `https://wa.me/8618959805256?text=${encodeURIComponent("Hello Beiqiang, I am interested in BQ-001 wide toe box knit slip-on walking shoes. Please discuss sample availability and quotation requirements.")}`;
  const productData = {
    "@context": "https://schema.org", "@type": "Product", name: "BQ001 Men's Wide Toe Box Knit Slip-On Walking Shoes", sku: "BQ-001",
    brand: { "@type": "Brand", name: "Beiqiang" }, manufacturer: { "@type": "Organization", name: "Quanzhou Beiqiang Footwear & Apparel Co., Ltd." },
    description: "Wide toe box slip-on walking shoe for B2B sourcing discussions, with stretch knit textile upper and EVA sole construction.",
    material: "Stretch knit textile upper; EVA midsole and outsole",
    image: [`${SITE_URL}/products/bq001/white-angle.jpg`, `${SITE_URL}/products/bq001/white-top.jpg`, `${SITE_URL}/products/bq001/white-outsole.jpg`],
    additionalProperty: [
      { "@type": "PropertyValue", name: "Size direction", value: "EU 36-46" },
      { "@type": "PropertyValue", name: "Closure", value: "Slip-on" },
      { "@type": "PropertyValue", name: "Color directions", value: "White, black/white, all black" },
    ],
  };
  const faqData = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }} />
      <div className="top-note"><span>QUANZHOU FOOTWEAR FACTORY SUPPLIER</span><span>BQ001 · SAMPLE BEFORE BULK DISCUSSION</span></div>
      <header className="site-header">
        <a className="brand" href="/" aria-label="Beiqiang Footwear home"><span className="brand-mark">BQ</span><span><strong>BEIQIANG</strong><small>FOOTWEAR SUPPLY</small></span></a>
        <nav aria-label="Product navigation"><a href="/#collections">All styles</a><a href="#specifications">Specifications</a><a href="#evidence">Product proof</a><a href="#inquiry">Request sample</a></nav>
        <a className="button button-small" href="#inquiry">Request BQ001 sample</a>
      </header>

      <section className="product-hero">
        <div className="product-hero-gallery">
          <div className="product-hero-main"><img src="/products/bq001/white-angle.jpg" alt="BQ001 white wide toe box knit slip-on walking shoe side angle" /></div>
          <div className="product-hero-thumbs"><img src="/products/bq001/white-top.jpg" alt="BQ001 white knit upper and slip-on opening top view" /><img src="/products/bq001/white-outsole.jpg" alt="BQ001 white EVA outsole pattern" /></div>
        </div>
        <div className="product-hero-copy">
          <p className="breadcrumb"><a href="/">Home</a> / <a href="/#collections">Walking shoes</a> / BQ001</p>
          <p className="eyebrow">STYLE BQ-001 · B2B PRODUCT PAGE</p>
          <h1>Men&apos;s wide toe box knit slip-on walking shoes.</h1>
          <p className="hero-lead">A roomy-toe, easy-on walking-shoe direction for importers, wholesalers and online sellers building comfort, commuting and travel assortments.</p>
          <ul className="product-hero-points">
            <li><strong>Roomy toe shape</strong><span>Wide-toe positioning supported by the product record and photo package.</span></li>
            <li><strong>Stretch knit textile upper</strong><span>Flexible one-piece appearance with a slip-on opening.</span></li>
            <li><strong>EVA sole construction</strong><span>Current product record lists EVA for both midsole and outsole.</span></li>
          </ul>
          <div className="hero-actions"><a className="button" href="#inquiry">Build a sample request</a><a className="text-link" href={whatsappHref} target="_blank" rel="noreferrer">Ask about BQ001 on WhatsApp <span aria-hidden="true">↗</span></a></div>
          <p className="commercial-note">MOQ, final price, sample timing, production lead time and packing are confirmed against the buyer&apos;s order requirements.</p>
        </div>
      </section>

      <section className="product-fact-strip" aria-label="BQ001 sourcing highlights"><div><small>STYLE</small><strong>BQ-001</strong></div><div><small>SIZE DIRECTION</small><strong>EU 36–46</strong></div><div><small>COLOR DIRECTIONS</small><strong>3 shown</strong></div><div><small>CONSTRUCTION</small><strong>Slip-on</strong></div></section>

      <section className="section product-spec-section" id="specifications">
        <div className="section-heading"><div><p className="eyebrow">VERIFIED PRODUCT DIRECTION</p><h2>Specifications buyers can use for a first review.</h2></div><p>These points come from the current BQ001 product record and local photo package. Order-specific availability is reconfirmed before quotation.</p></div>
        <div className="spec-layout">
          <dl className="spec-table">
            <div><dt>Style code</dt><dd>BQ-001</dd></div><div><dt>Product direction</dt><dd>Men&apos;s wide toe box casual walking shoe</dd></div><div><dt>Closure</dt><dd>Slip-on / easy-on profile</dd></div><div><dt>Upper direction</dt><dd>Stretch knit textile / flyknit appearance</dd></div><div><dt>Midsole</dt><dd>EVA in current product record</dd></div><div><dt>Outsole</dt><dd>EVA with textured tread pattern</dd></div><div><dt>Size direction</dt><dd>EU 36–46 in current product record</dd></div><div><dt>Colors shown</dt><dd>White, black with white sole, all black</dd></div>
          </dl>
          <aside className="confirmation-card"><p className="eyebrow">CONFIRM BEFORE QUOTATION</p><h3>Commercial details stay order-specific.</h3><ul><li>Requested quantity and size ratio</li><li>Color mix and availability</li><li>Logo, material or packing requirements</li><li>Sample arrangement and target timing</li><li>Trade term and delivery destination</li></ul><a className="text-link" href="#inquiry">Prepare these details <span aria-hidden="true">→</span></a></aside>
        </div>
      </section>

      <section className="product-evidence" id="evidence">
        <div className="product-evidence-heading"><p className="eyebrow eyebrow-light">REAL PRODUCT PHOTOGRAPHY</p><h2>Review shape, upper and outsole before requesting a sample.</h2></div>
        <div className="evidence-grid">
          <figure className="evidence-large"><img src="/products/bq001/white-pair.jpg" alt="BQ001 white walking shoe pair showing side and outsole views" /><figcaption><strong>White direction</strong><span>Side profile and outsole view from the product package.</span></figcaption></figure>
          <figure><img src="/products/bq001/black-white-pair.jpg" alt="BQ001 black knit upper with white EVA sole pair" /><figcaption><strong>Black / white direction</strong><span>Contrasting sole direction for assortment discussion.</span></figcaption></figure>
          <figure><img src="/products/bq001/black-pair.jpg" alt="BQ001 all black knit slip-on walking shoe pair" /><figcaption><strong>All-black direction</strong><span>Monochrome option shown in the current photo package.</span></figcaption></figure>
        </div>
      </section>

      <section className="section buyer-use-section"><div className="section-heading compact"><div><p className="eyebrow">BUYER USE CASES</p><h2>Where BQ001 can fit a footwear assortment.</h2></div></div><div className="buyer-grid"><article><span>01</span><h3>Comfort footwear importers</h3><p>Use BQ001 as a roomy-toe slip-on direction, then verify the exact size ratio, colors and packing for the target market.</p></article><article><span>02</span><h3>Online marketplace sellers</h3><p>Test the clear wide-toe, knit-upper and easy-on product story through samples before committing to a bulk assortment.</p></article><article><span>03</span><h3>Brand and private-label buyers</h3><p>Start from BQ001 as a base style and discuss feasible logo, color, material and packing changes against quantity requirements.</p></article></div></section>
      <section className="section faq-section product-faq" id="faq"><div className="section-heading compact"><div><p className="eyebrow">BQ001 BUYER FAQ</p><h2>What we can confirm before quotation.</h2></div></div><div className="faq-list">{faq.map((item) => <details key={item.question}><summary>{item.question}<span aria-hidden="true">+</span></summary><p>{item.answer}</p></details>)}</div></section>
      <section className="product-inquiry-section" id="inquiry"><ProductInquiry /></section>
      <footer><div className="brand footer-brand"><span className="brand-mark">BQ</span><span><strong>BEIQIANG</strong><small>FOOTWEAR SUPPLY</small></span></div><p>Quanzhou Beiqiang Footwear & Apparel Co., Ltd.<br />Quanzhou, Fujian, China<br /><a href="mailto:421345308@qq.com">421345308@qq.com</a> · <a href="https://wa.me/8618959805256" target="_blank" rel="noreferrer">WhatsApp +86 189 5980 5256</a></p><p>BQ001 · Wide toe box · Stretch knit upper · EVA sole · B2B sourcing discussion</p></footer>
      <a className="whatsapp-float" href={whatsappHref} target="_blank" rel="noreferrer" aria-label="Ask Beiqiang about BQ001 on WhatsApp">Ask about BQ001</a>
    </main>
  );
}
