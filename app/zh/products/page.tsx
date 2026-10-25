import type { Metadata } from "next";
import CatalogPage from "../../components/CatalogPage";
import { pageAlternates } from "../../lib/public-locales";
export const metadata: Metadata = {
  title: "休闲鞋与步行鞋产品系列｜贝强鞋业",
  description: "浏览针织套穿、系带休闲及宽鞋头鞋款，比较材料、尺码与配色，咨询批发及品牌定制。",
  alternates: pageAlternates("/products", "zh"),
};
export default function ProductsPage() { return <CatalogPage locale="zh" />; }
