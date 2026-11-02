import Link from "next/link";
import { products } from "../data/products";
import { selectedAssortment } from "../data/selected-assortment";
import { localizedPath, type LegacyLocale } from "../lib/public-locales";
import StudioProductCard from "./StudioProductCard";

export default function SelectedStyles({ locale }: { locale: LegacyLocale }) {
  const zh = locale === "zh";
  return <section className="studio-section selected-styles" id="selected-styles" aria-labelledby="selected-title">
    <div className="studio-section-heading">
      <div><p className="eyebrow">{zh ? "日常休闲精选" : "SELECTED EVERYDAY CASUALS"}</p><h2 id="selected-title">{zh ? "从三个不同方向开始选款。" : "Three starting points for your range."}</h2></div>
      <p>{zh ? "精选系列的三种选择：拼接轮廓、简洁纺织和宽鞋头针织。按您的市场、配色与尺码需求进一步筛选。" : "Three choices from our collection: layered mesh, clean textile and wide-toe knit. Explore the colour and size options that fit your market."}</p>
    </div>
    <div className="studio-product-grid">{selectedAssortment.map(item => <div key={item.code}>
      <p className="selected-style-role">{zh ? item.zh : item.en}</p>
      <StudioProductCard product={products.find(p => p.code === item.code)!} locale={locale} />
    </div>)}</div>
    <div className="discovery-bottom"><p>{zh ? "精选册还包含针织套脚、宽鞋头系带及季节补充款。" : "The selected catalogue also features knit slip-ons, wide-toe lace-ups and seasonal styles."}</p>
      <Link className="studio-text-link" href={localizedPath("/line-sheet", locale)}>{zh ? "浏览与下载精选册" : "Browse the selected catalogue"} ↗</Link>
    </div>
  </section>;
}
