import type { Metadata } from "next";
import BuyerLineSheet from "../components/BuyerLineSheet";
import { productCount } from "../data/catalog-meta";
export const metadata: Metadata = {
  title: "Selected Casual Footwear & Full Catalogue | Beiqiang",
  description: `Preview eight selected casual styles, our factory and cooperation options. Browse the full ${productCount}-style footwear catalogue and choose your next range.`,
  alternates: { canonical: "/line-sheet/", languages: { en: "https://www.beiqiang.online/line-sheet/", "zh-CN": "https://www.beiqiang.online/zh/line-sheet/", "x-default": "https://www.beiqiang.online/line-sheet/" } },
  openGraph: { title: "Beiqiang Selected Casual Footwear", description: "Explore the selected collection and full product catalogue.", url: "/line-sheet/" },
};
export default function LineSheetPage() { return <BuyerLineSheet locale="en" />; }
