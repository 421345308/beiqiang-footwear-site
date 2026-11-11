import type { Metadata } from "next";
import BuyerLineSheet from "../../components/BuyerLineSheet";
import { lineSheetProductCount } from "../../data/line-sheet-selection";
export const metadata: Metadata = {
  title: "日常休闲鞋精选与完整目录｜贝强B2B供应",
  description: `浏览8款精选、工厂介绍和合作方式，或打开${lineSheetProductCount}款中文PDF产品册；最新款式可在网站查看。`,
  alternates: { canonical: "https://www.beiqiang.online/zh/line-sheet/", languages: { en: "https://www.beiqiang.online/line-sheet/", "zh-CN": "https://www.beiqiang.online/zh/line-sheet/", "x-default": "https://www.beiqiang.online/line-sheet/" } },
};
export default function ChineseLineSheetPage() { return <BuyerLineSheet locale="zh" />; }
