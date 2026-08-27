import type { Metadata } from "next";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import InquiryStatusLookup from "./InquiryStatusLookup";

export const metadata: Metadata = {
  title: "Check Sourcing Request | Beiqiang Footwear",
  description: "Use your Beiqiang inquiry reference and private status access code to review the buyer-safe progress of a sourcing request.",
  robots: { index: false, follow: false, noarchive: true, nocache: true },
  alternates: { canonical: "https://www.beiqiang.online/inquiry-status/", languages: { en: "https://www.beiqiang.online/inquiry-status/", "zh-CN": "https://www.beiqiang.online/zh/inquiry-status/" } },
};

export default function InquiryStatusPage() { return <main><SiteHeader chineseHref="/zh/inquiry-status/" /><InquiryStatusLookup /><SiteFooter /></main>; }
