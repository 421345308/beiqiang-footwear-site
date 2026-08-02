"use client";

import { useMemo, useState } from "react";

const products = [
  {
    code: "BQ001",
    name: "Wide Toe Box Knit Slip-On",
    detail: "Roomy toe shape · Knitted upper · EVA sole · EU 36–46",
    image: "/products/bq001.jpg",
    tag: "Core wide-toe style",
  },
  {
    code: "BQ002",
    name: "Lightweight Travel Slip-On",
    detail: "Knitted upper · EVA sole · EU 36–46 · 3 color directions",
    image: "/products/bq002.jpg",
    tag: "Travel & commuting",
  },
  {
    code: "BQ004",
    name: "Wide Fit Casual Loafer",
    detail: "Textile upper · EVA sole · EU 35–45 · Slip-on construction",
    image: "/products/bq004.jpg",
    tag: "Online seller friendly",
  },
  {
    code: "BQ011",
    name: "Men’s Daily Walking Slip-On",
    detail: "Textile upper · Cushion sole · EU 39–45 · Easy-on profile",
    image: "/products/bq011.jpg",
    tag: "Men’s walking line",
  },
  {
    code: "BQ014",
    name: "Autumn Winter Stretch Slip-On",
    detail: "Stretch textile · Optional fleece discussion · EU 35–45",
    image: "/products/bq014.jpg",
    tag: "Seasonal option",
  },
  {
    code: "BQ029",
    name: "High-Top Sock Walking Shoe",
    detail: "Textile upper · EVA sole · EU 35–45 · Slip-on profile",
    image: "/products/bq029.jpg",
    tag: "Distinctive silhouette",
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

export default function Home() {
  const [selectedStyle, setSelectedStyle] = useState("BQ001 — Wide Toe Box Knit Slip-On");
  const [company, setCompany] = useState("");
  const [market, setMarket] = useState("");
  const [quantity, setQuantity] = useState("");
  const [requirements, setRequirements] = useState("");
  const [copyStatus, setCopyStatus] = useState("");

  const inquiryBrief = useMemo(
    () =>
      [
        "Beiqiang sample / quotation request",
        `Style: ${selectedStyle}`,
        `Company: ${company || "To be provided"}`,
        `Target market: ${market || "To be provided"}`,
        `Expected quantity: ${quantity || "To be discussed"}`,
        `Requirements: ${requirements || "Please confirm sample, colors, size range and packing options."}`,
      ].join("\n"),
    [company, market, quantity, requirements, selectedStyle],
  );

  const emailHref = `mailto:421345308@qq.com?subject=${encodeURIComponent("Beiqiang footwear sample / quotation request")}&body=${encodeURIComponent(inquiryBrief)}`;
  const whatsappHref = `https://wa.me/8618959805256?text=${encodeURIComponent(inquiryBrief)}`;
  const alibabaStoreHref = "https://cn1576227362luzl.m.en.alibaba.com/?spm=a2700.details.0.0.49d669685pzyZm&wx_navbar_transparent=true&wx_screen_direc=portrait&productId=1601839050756&from=detail_company_card";

  function chooseStyle(code: string, name: string) {
    setSelectedStyle(`${code} — ${name}`);
    setCopyStatus("");
    document.getElementById("inquiry")?.scrollIntoView({ behavior: "smooth" });
  }

  async function copyInquiry() {
    try {
      await navigator.clipboard.writeText(inquiryBrief);
      setCopyStatus("Inquiry brief copied. Send it through the Alibaba, LinkedIn, email or WhatsApp channel where you reached us.");
    } catch {
      setCopyStatus("Please select and copy the inquiry brief shown below.");
    }
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
            <a className="button" href="#collections">Explore 6 lead styles</a>
            <a className="text-link" href="#proof">See how orders are checked <span aria-hidden="true">→</span></a>
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
              <button type="button" onClick={() => chooseStyle(product.code, product.name)}>
                Add to sample inquiry <span aria-hidden="true">↗</span>
              </button>
            </article>
          ))}
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

      <section className="inquiry-section" id="inquiry">
        <div className="inquiry-intro">
          <p className="eyebrow eyebrow-light">REQUEST A MATCHED SAMPLE</p>
          <h2>Tell us what you want to source.</h2>
          <p>Start with one style and a few order details. We will use them to discuss sample availability and prepare an accurate quotation after specifications are confirmed.</p>
          <div className="selected-style"><small>SELECTED STYLE</small><strong>{selectedStyle}</strong></div>
          <div className="contact-links" aria-label="Contact Beiqiang Footwear">
            <a className="button button-light" href={whatsappHref} target="_blank" rel="noreferrer">Send via WhatsApp</a>
            <a className="contact-text-link" href={emailHref}>Email 421345308@qq.com</a>
            <a className="contact-text-link" href={alibabaStoreHref} target="_blank" rel="noreferrer">View Alibaba.com store</a>
          </div>
        </div>
        <div className="inquiry-form" aria-label="Sample inquiry brief builder">
          <label>Company name<input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Your company" /></label>
          <label>Target market<input value={market} onChange={(e) => setMarket(e.target.value)} placeholder="Country / sales channel" /></label>
          <label>Expected quantity<input value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Trial or bulk quantity" /></label>
          <label>Requirements<textarea value={requirements} onChange={(e) => setRequirements(e.target.value)} placeholder="Sizes, colors, logo, packing, timing..." rows={4} /></label>
          <button className="button button-light form-button" type="button" onClick={copyInquiry}>Copy inquiry brief</button>
          <p className="form-note" aria-live="polite">{copyStatus || "Choose WhatsApp, email or the Alibaba.com storefront to continue the sourcing conversation."}</p>
          <pre>{inquiryBrief}</pre>
        </div>
      </section>

      <footer>
        <div className="brand footer-brand"><span className="brand-mark">BQ</span><span><strong>BEIQIANG</strong><small>FOOTWEAR SUPPLY</small></span></div>
        <p>Quanzhou Beiqiang Footwear & Apparel Co., Ltd.<br />Quanzhou, Fujian, China<br /><a href="mailto:421345308@qq.com">421345308@qq.com</a> · <a href="https://wa.me/8618959805256" target="_blank" rel="noreferrer">WhatsApp +86 189 5980 5256</a></p>
        <p>Wide toe box · Comfort walking · Lightweight slip-on · OEM/ODM discussion</p>
      </footer>
    </main>
  );
}
