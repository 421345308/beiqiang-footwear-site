import type { Metadata } from "next";
import Link from "next/link";
import ProductCatalog from "../components/ProductCatalog";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";
import { products } from "../data/products";

export const metadata: Metadata = {
  title: "Walking Shoe Product Catalogue | Beiqiang Footwear",
  description: "Browse 30 documented Beiqiang walking shoe styles by product code, source model, closure, size direction and verified product evidence.",
  alternates: { canonical: "https://www.beiqiang.online/products/" },
};

export default function ProductsPage() {
  return (
    <main>
      <SiteHeader />
      <section className="catalog-hero"><p className="eyebrow">COMPLETE PRODUCT RANGE</p><h1>Compare all 30 documented styles.</h1><p>Use product code, source model or closure to narrow the range. Each page connects real gallery evidence to a product-specific sample and quotation inquiry.</p><div className="catalog-summary"><span><strong>{products.length}</strong> product packages</span><span><strong>{products.filter((p) => p.closure === "Slip-On").length}</strong> slip-on styles</span><span><strong>{products.filter((p) => p.closure === "Lace-Up").length}</strong> lace-up styles</span></div></section>
      <section className="section catalog-section"><ProductCatalog products={products} /></section>
      <section className="catalog-help"><div><p className="eyebrow eyebrow-light">NEED A SHORTLIST?</p><h2>Send your market, sales channel and target price direction.</h2><p>We will use the catalogue as a starting point, then confirm the product, quantity, size ratio, colors, materials, packing and timing before quotation.</p></div><Link className="button button-light" href="/#inquiry">Request a matched shortlist</Link></section>
      <SiteFooter />
    </main>
  );
}
