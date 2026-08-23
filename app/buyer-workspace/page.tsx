import type { Metadata } from "next";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import BuyerWorkspace from "./BuyerWorkspace";

export const metadata: Metadata = {
  title: "Buyer Workspace | Beiqiang Footwear",
  description: "Request a secure email link to review Beiqiang sourcing projects associated with your business email.",
  robots: { index: false, follow: false },
};

export default function BuyerWorkspacePage() {
  return <main><SiteHeader /><BuyerWorkspace /><SiteFooter /></main>;
}
