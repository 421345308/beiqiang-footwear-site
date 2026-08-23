import type { Metadata } from "next";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import InquiryStatusLookup from "./InquiryStatusLookup";

export const metadata: Metadata = {
  title: "Check Sourcing Request | Beiqiang Footwear",
  description: "Use your Beiqiang inquiry reference and private status access code to review the buyer-safe progress of a sourcing request.",
  robots: { index: false, follow: false },
};

export default function InquiryStatusPage() { return <main><SiteHeader /><InquiryStatusLookup /><SiteFooter /></main>; }
