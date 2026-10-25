import type { Metadata } from "next";
import CatalogPage from "../components/CatalogPage";
import { pageAlternates } from "../lib/public-locales";
export const metadata: Metadata = {
  title: "Casual & Walking Shoe Collection | Beiqiang Footwear",
  description: "Explore knit slip-ons, lace-up casual shoes and wide toe box styles. Compare specifications and enquire about wholesale or private-label requirements.",
  alternates: pageAlternates("/products", "en"),
};
export default function ProductsPage() { return <CatalogPage locale="en" />; }
