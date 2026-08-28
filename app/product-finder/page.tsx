import type { Metadata } from "next";
import ProductFinder from "../components/ProductFinder";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";

export const metadata: Metadata = { title: "B2B Shoe Product Finder | Beiqiang Footwear", description: "Build a 2–4 style shortlist from Beiqiang's documented walking and casual shoe catalogue, then compare evidence or continue to a structured RFQ.", alternates: { canonical: "https://www.beiqiang.online/product-finder/", languages: { en: "https://www.beiqiang.online/product-finder/", "zh-CN": "https://www.beiqiang.online/zh/product-finder/", "x-default": "https://www.beiqiang.online/product-finder/" } } };

export default function ProductFinderPage() { return <main><SiteHeader chineseHref="/zh/product-finder/" /><section className="finder-hero"><p className="eyebrow">B2B PRODUCT FINDER</p><h1>Move from 30 styles to a reviewable shortlist.</h1><p>Choose your buyer channel, product direction and closure preference. The result explains why each documented style matched and what still needs confirmation before quotation.</p></section><section className="section"><ProductFinder /></section><SiteFooter /></main>; }
