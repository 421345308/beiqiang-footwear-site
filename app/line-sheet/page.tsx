import type { Metadata } from "next";
import BuyerLineSheet from "../components/BuyerLineSheet";
import { lineSheetProductCount } from "../data/line-sheet-selection";
export const metadata: Metadata = {
  title: "Selected Casual Footwear & Full Catalogue | Beiqiang",
  description: `Preview eight selected casual styles, our factory and cooperation options. Browse the ${lineSheetProductCount}-style PDF catalogue and find the latest styles online.`,
  alternates: { canonical: "/line-sheet/", languages: { en: "https://www.beiqiang.online/line-sheet/", "zh-CN": "https://www.beiqiang.online/zh/line-sheet/", "x-default": "https://www.beiqiang.online/line-sheet/" } },
  openGraph: { title: "Beiqiang Selected Casual Footwear", description: "Explore the selected collection and PDF catalogue.", url: "/line-sheet/" },
};
export default function LineSheetPage() { return <BuyerLineSheet locale="en" />; }
