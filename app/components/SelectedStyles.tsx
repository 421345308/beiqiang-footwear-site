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
      <p>{zh ? "本厂系列的三种选择：拼接轮廓、简洁纺织和宽鞋头针织。按您的市场、配色与尺码需求进一步筛选。" : "Three choices from our factory range: layered mesh, clean textile and wide-toe knit. Explore the colour and size options that fit your market."}</p>
    </div>
    <div className="studio-product-grid">{selectedAssortment.map(item => <div key={item.code}>
      <p className="selected-style-role">{zh ? item.zh : item.en}</p>
      <StudioProductCard product={products.find(p => p.code === item.code)!} locale={locale} />
    </div>)}</div>
    <div className="discovery-bottom"><p>{zh ? "精选册还包含针织套脚、白色低帮及季节补充款，并区分本厂与合作来源。" : "The selected catalogue adds knit slip-ons, white low-tops and seasonal options, with factory and partner-sourced styles clearly identified."}</p>
      <Link className="studio-text-link" href={localizedPath("/line-sheet", locale)}>{zh ? "浏览与下载精选册" : "Browse the selected catalogue"} ↗</Link>
    </div>
  </section>;
}
