import type { Metadata } from "next";
import Link from "next/link";
import ProductInquiry from "../../components/ProductInquiry";

const SITE_URL = "https://www.beiqiang.online";

export const metadata: Metadata = {
  title: "BQ002 Extra Wide Toe Box Knit Slip-On Walking Shoes | Beiqiang",
  description: "Review BQ002 grey knit slip-on walking shoes with a roomy toe shape, EU 36-46 size direction and three grey-based color directions. Request a B2B sample or quotation.",
  alternates: { canonical: `${SITE_URL}/products/bq002` },
  openGraph: {
    title: "BQ002 Wide Toe Box Knit Slip-On | Beiqiang Footwear",
    description: "A verified B2B product page for importers, wholesalers, online sellers and private-label buyers sourcing roomy-toe walking shoes.",
    url: `${SITE_URL}/products/bq002`,
    type: "website",
    images: [{ url: `${SITE_URL}/products/bq002/grey-white-angle.jpg`, width: 750, height: 1000, alt: "BQ002 grey knit wide toe box slip-on walking shoe" }],
  },
};

const faq = [
  { question: "Which BQ002 details are currently supported?", answer: "The product record and photo package support a wide-toe slip-on direction, knitted textile upper, EU 36-46 size direction and grey/white, grey/black and grey/khaki color directions." },
  { question: "Can I request a BQ002 sample before a bulk order?", answer: "Sample availability can be discussed before bulk-order terms. The sample stage is used to confirm the product, color, size, sole material, packing and order requirements." },
  { question: "What determines the final BQ002 quotation?", answer: "Final price and order terms depend on quantity, size ratio, colors, confirmed materials, logo or packing requests, target timing and trade requirements." },
];

export default function BQ002Page() {
  const label = "BQ002 — Extra Wide Toe Box Knit Slip-On";
  const productData = {
    "@context": "https://schema.org", "@type": "Product", name: "BQ002 Extra Wide Toe Box Knit Slip-On Walking Shoes", sku: "BQ-002",
    brand: { "@type": "Brand", name: "Beiqiang" }, manufacturer: { "@type": "Organization", name: "Quanzhou Beiqiang Footwear & Apparel Co., Ltd." },
    description: "Grey knitted textile slip-on walking shoe with a roomy toe shape for B2B sourcing discussions.",
    material: "Knitted textile upper; sole material reconfirmed before quotation",
    image: [`${SITE_URL}/products/bq002/grey-white-angle.jpg`, `${SITE_URL}/products/bq002/grey-white-top.jpg`, `${SITE_URL}/products/bq002/grey-white-outsole.jpg`],
    additionalProperty: [
      { "@type": "PropertyValue", name: "Size direction", value: "EU 36-46" },
      { "@type": "PropertyValue", name: "Closure", value: "Slip-on" },
      { "@type": "PropertyValue", name: "Color directions", value: "Grey/white, grey/black, grey/khaki" },
    ],
  };
  const faqData = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) };
  const whatsappHref = `https://wa.me/8618959805256?text=${encodeURIComponent("Hello Beiqiang, I am interested in BQ002 wide toe box knit slip-on walking shoes. Please discuss sample availability and quotation requirements.")}`;

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }} />
      <div className="top-note"><span>QUANZHOU FOOTWEAR FACTORY SUPPLIER</span><span>BQ002 · SAMPLE BEFORE BULK DISCUSSION</span></div>
      <header className="site-header">
        <Link className="brand" href="/" aria-label="Beiqiang Footwear home"><span className="brand-mark">BQ</span><span><strong>BEIQIANG</strong><small>FOOTWEAR SUPPLY</small></span></Link>
        <nav aria-label="Product navigation"><Link href="/#collections">All styles</Link><a href="#specifications">Specifications</a><a href="#evidence">Product proof</a><a href="#inquiry">Request sample</a></nav>
        <a className="button button-small" href="#inquiry">Request BQ002 sample</a>
      </header>

      <section className="product-hero">
        <div className="product-hero-gallery">
          <div className="product-hero-main"><img src="/products/bq002/grey-white-angle.jpg" alt="BQ002 grey white knit wide toe box slip-on walking shoe" /></div>
          <div className="product-hero-thumbs"><img src="/products/bq002/grey-white-top.jpg" alt="BQ002 knitted upper and roomy toe shape top view" /><img src="/products/bq002/grey-white-outsole.jpg" alt="BQ002 grey white shoe outsole pattern" /></div>
        </div>
        <div className="product-hero-copy">
          <p className="breadcrumb"><Link href="/">Home</Link> / <Link href="/#collections">Walking shoes</Link> / BQ002</p>
          <p className="eyebrow">STYLE BQ-002 · CORE WIDE-TOE DIRECTION</p>
          <h1>Extra wide toe box knit slip-on walking shoes.</h1>
          <p className="hero-lead">A grey-based, easy-on comfort direction for importers, wholesalers and online sellers building daily walking, commuting and travel assortments.</p>
          <ul className="product-hero-points">
            <li><strong>Roomy toe profile</strong><span>Wide-toe positioning is supported by the current product record and product shape.</span></li>
            <li><strong>Knitted textile upper</strong><span>Breathable-looking knit structure with an easy-on opening.</span></li>
            <li><strong>Three grey directions</strong><span>Grey/white, grey/black and grey/khaki options support a coherent assortment discussion.</span></li>
          </ul>
          <div className="hero-actions"><a className="button" href="#inquiry">Build a sample request</a><a className="text-link" href={whatsappHref} target="_blank" rel="noreferrer">Ask about BQ002 on WhatsApp <span aria-hidden="true">↗</span></a></div>
          <p className="commercial-note">MOQ, sole material, final price, sample timing, lead time and packing are reconfirmed against the buyer&apos;s order requirements.</p>
        </div>
      </section>

      <section className="product-fact-strip" aria-label="BQ002 sourcing highlights"><div><small>STYLE</small><strong>BQ-002</strong></div><div><small>SIZE DIRECTION</small><strong>EU 36–46</strong></div><div><small>COLOR DIRECTIONS</small><strong>3 shown</strong></div><div><small>CONSTRUCTION</small><strong>Slip-on</strong></div></section>
      <section className="section product-spec-section" id="specifications">
        <div className="section-heading"><div><p className="eyebrow">VERIFIED PRODUCT DIRECTION</p><h2>Specifications for a first sourcing review.</h2></div><p>These points come from the current BQ002 record and real photo package. Order-specific availability and materials are reconfirmed before quotation.</p></div>
        <div className="spec-layout">
          <dl className="spec-table"><div><dt>Style code</dt><dd>BQ-002</dd></div><div><dt>Product direction</dt><dd>Extra wide toe box casual walking shoe</dd></div><div><dt>Closure</dt><dd>Slip-on / easy-on profile</dd></div><div><dt>Upper direction</dt><dd>Grey knitted textile</dd></div><div><dt>Sole direction</dt><dd>Lightweight thick-sole profile; material to reconfirm</dd></div><div><dt>Toe</dt><dd>Roomy wide-toe profile</dd></div><div><dt>Size direction</dt><dd>EU 36–46</dd></div><div><dt>Colors shown</dt><dd>Grey/white, grey/black, grey/khaki</dd></div></dl>
          <aside className="confirmation-card"><p className="eyebrow">CONFIRM BEFORE QUOTATION</p><h3>Turn the product direction into an order brief.</h3><ul><li>Requested quantity and size ratio</li><li>Color mix and current availability</li><li>Sole, lining and insole materials</li><li>Logo and packing requirements</li><li>Sample, timing and trade term</li></ul><a className="text-link" href="#inquiry">Prepare these details <span aria-hidden="true">→</span></a></aside>
        </div>
      </section>
      <section className="product-evidence" id="evidence"><div className="product-evidence-heading"><p className="eyebrow eyebrow-light">REAL PRODUCT PHOTOGRAPHY</p><h2>Review the toe shape, knit structure and color direction.</h2></div><div className="evidence-grid"><figure className="evidence-large"><img src="/products/bq002/grey-white-side.jpg" alt="BQ002 grey white slip-on walking shoe side view" /><figcaption><strong>Grey / white direction</strong><span>Clean side profile from the real product package.</span></figcaption></figure><figure><img src="/products/bq002/grey-white-top.jpg" alt="BQ002 knitted textile upper top view" /><figcaption><strong>Upper and toe profile</strong><span>Top view for knit texture and forefoot-shape review.</span></figcaption></figure><figure><img src="/products/bq002/grey-black-pair.jpg" alt="BQ002 grey black slip-on shoe pair" /><figcaption><strong>Grey / black direction</strong><span>A darker sole option for assortment discussion.</span></figcaption></figure></div></section>
      <section className="section buyer-use-section"><div className="section-heading compact"><div><p className="eyebrow">BUYER USE CASES</p><h2>Where BQ002 can fit a footwear line.</h2></div></div><div className="buyer-grid"><article><span>01</span><h3>Comfort-footwear importers</h3><p>Use BQ002 as a roomy-toe slip-on direction, then confirm the size ratio, colors and packing for the target market.</p></article><article><span>02</span><h3>Online marketplace sellers</h3><p>Test the clear knit, wide-toe and easy-on product story through samples before a bulk assortment.</p></article><article><span>03</span><h3>Brand and private-label buyers</h3><p>Start from the existing shape and discuss feasible logo, color, material and packing changes against quantity.</p></article></div></section>
      <section className="section faq-section product-faq"><div className="section-heading compact"><div><p className="eyebrow">BQ002 BUYER FAQ</p><h2>What to confirm before quotation.</h2></div></div><div className="faq-list">{faq.map((item) => <details key={item.question}><summary>{item.question}<span aria-hidden="true">+</span></summary><p>{item.answer}</p></details>)}</div></section>
      <section className="product-inquiry-section" id="inquiry"><ProductInquiry code="BQ002" label={label} productName="extra wide toe box knit slip-on walking shoes" /></section>
      <footer><div className="brand footer-brand"><span className="brand-mark">BQ</span><span><strong>BEIQIANG</strong><small>FOOTWEAR SUPPLY</small></span></div><p>Quanzhou Beiqiang Footwear & Apparel Co., Ltd.<br />Quanzhou, Fujian, China<br /><a href="mailto:421345308@qq.com">421345308@qq.com</a> · <a href="https://wa.me/8618959805256" target="_blank" rel="noreferrer">WhatsApp +86 189 5980 5256</a></p><p>BQ002 · Wide toe box · Knitted textile · Slip-on · B2B sourcing discussion</p></footer>
    </main>
  );
}
