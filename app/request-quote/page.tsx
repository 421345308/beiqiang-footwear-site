import type { Metadata } from "next";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import QuoteRequestBuilder from "./QuoteRequestBuilder";

export const metadata: Metadata = {
  title: "Build a Footwear Quote List | Beiqiang Footwear",
  description: "Select multiple Beiqiang footwear styles, add quantity, color, size and development requirements, then submit one qualified B2B quote request.",
  alternates: { canonical: "https://www.beiqiang.online/request-quote/", languages: { en: "https://www.beiqiang.online/request-quote/", "zh-CN": "https://www.beiqiang.online/zh/request-quote/", "x-default": "https://www.beiqiang.online/request-quote/" } },
};

export default function RequestQuotePage() {
  return <main><SiteHeader /><QuoteRequestBuilder /><SiteFooter /></main>;
}
