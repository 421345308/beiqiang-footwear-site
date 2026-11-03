import type { Metadata } from "next";
import ProductFinder from "../components/ProductFinder";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";

export const metadata: Metadata = {
  title: "B2B Shoe Product Finder | Beiqiang Footwear",
  description:
    "Find Beiqiang walking and casual shoes by sales channel, product direction and fastening, then build your wholesale shortlist.",
  alternates: {
    canonical: "https://www.beiqiang.online/product-finder/",
    languages: {
      en: "https://www.beiqiang.online/product-finder/",
      "zh-CN": "https://www.beiqiang.online/zh/product-finder/",
      "x-default": "https://www.beiqiang.online/product-finder/",
    },
  },
};

export default function ProductFinderPage() {
  return (
    <main>
      <SiteHeader chineseHref="/zh/product-finder/" />
      <section className="finder-hero">
        <p className="eyebrow">B2B PRODUCT FINDER</p>
        <h1>Find styles for your market.</h1>
        <p>
          Choose your sales channel, product direction and fastening. Explore
          matching styles and add your selection to an inquiry.
        </p>
      </section>
      <section className="section">
        <ProductFinder />
      </section>
      <SiteFooter />
    </main>
  );
}
