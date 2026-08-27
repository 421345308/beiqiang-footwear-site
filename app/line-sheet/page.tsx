import type { Metadata } from "next";
import LineSheetLeadForm from "../components/LineSheetLeadForm";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";
import { products } from "../data/products";
import { productCount } from "../data/catalog-meta";

export const metadata: Metadata = {
  title: `${productCount}-Style Footwear Line Sheet | Beiqiang B2B Supply`,
  description: `Request Beiqiang's ${productCount}-style B2B footwear line sheet for walking, casual, knit, slip-on and lace-up sourcing.`,
  alternates: { canonical: "/line-sheet/", languages: { en: "https://www.beiqiang.online/line-sheet/", "zh-CN": "https://www.beiqiang.online/zh/line-sheet/", "x-default": "https://www.beiqiang.online/line-sheet/" } },
  openGraph: { title: `Beiqiang ${productCount}-Style Footwear Line Sheet`, description: `Build a B2B footwear shortlist from ${productCount} documented styles.`, url: "/line-sheet/" },
};

export default function LineSheetPage() {
  const preview = [products[0], products[8], products[23]];
  return (
    <main>
      <SiteHeader chineseHref="/zh/line-sheet/" />
      <section className="line-sheet-hero">
        <div><p className="eyebrow">B2B PRODUCT DISCOVERY</p><h1>{productCount} styles.<br />One buyer-ready shortlist.</h1><p>Review walking, casual, knit, slip-on and lace-up directions before choosing samples. Every unknown remains open for confirmation.</p><div className="line-sheet-hero-facts"><span>{productCount} documented styles</span><span>Buyer-safe facts</span><span>Direct product-page links</span><span>Printable A4 PDF</span></div></div>
        <div className="line-sheet-preview" aria-label="Line sheet preview">{preview.map((product) => <article key={product.code}><img src={`/catalog-thumbs/${product.slug}.webp`} alt={`${product.code} ${product.name}`} loading="lazy" decoding="async" width={640} height={640} /><div><strong>{product.code}</strong><span>{product.name}</span></div></article>)}</div>
      </section>
      <section className="line-sheet-value">
        <div><p className="eyebrow">WHAT IS INSIDE</p><h2>A commercial shortlist tool, not a generic brochure.</h2></div>
        <div className="line-sheet-value-grid"><article><strong>01</strong><h3>Product direction</h3><p>Style code, source model, closure, upper, size direction, colors and buyer fit.</p></article><article><strong>02</strong><h3>Evidence boundary</h3><p>Product-specific highlights plus the material, quantity and commercial items still requiring confirmation.</p></article><article><strong>03</strong><h3>Next action</h3><p>Clickable product pages and a clear shortlist-to-sample-to-order sourcing path.</p></article></div>
      </section>
      <section className="line-sheet-access"><div className="line-sheet-access-copy"><p className="eyebrow">REQUEST THE CURRENT EDITION</p><h2>Turn browsing into a sourcing brief.</h2><p>Tell us your market and volume direction. The request is saved in the same private follow-up system used for product inquiries, so your team and ours can continue with one reference.</p><ul><li>No retail checkout or automatic order</li><li>No invented price, capacity or certification</li><li>No store-wide wide-toe claim</li><li>Samples and specifications confirmed before bulk order</li></ul></div><LineSheetLeadForm /></section>
      <SiteFooter />
    </main>
  );
}
