import Link from "next/link";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import ChineseSiteHeader from "./ChineseSiteHeader";
import ChineseSiteFooter from "./ChineseSiteFooter";
import ProductCatalog from "./ProductCatalog";
import ChineseProductCatalog from "./ChineseProductCatalog";
import { products } from "../data/products";
import { localizedPath, type LegacyLocale } from "../lib/public-locales";

export default function CatalogPage({ locale = "en" }: { locale?: LegacyLocale }) {
  const zh=locale === "zh";
  const t=(en: string, cn: string) => zh ? cn : en;
  return <main lang={zh ? "zh-CN" : "en"} className="studio-page studio-catalog">
    {zh ? <ChineseSiteHeader englishHref="/products/" /> : <SiteHeader chineseHref="/zh/products/" />}
    <section className="studio-catalog-intro">
      <div><p className="eyebrow">{t("THE FOOTWEAR COLLECTION", "贝强产品系列")}</p><h1>{t("Find your next collection.", "鞋履产品系列")}</h1><p>{t("Explore styles, compare specifications and build a quotation list for your market.", "浏览鞋款、比较规格，为您的品牌或销售渠道整理采购清单。")}</p></div>
      <div className="catalog-intro-aside"><span>{products.length.toString().padStart(2,"0")}</span><p>{t("styles in the collection", "款产品可供选型")}</p><Link href={localizedPath("/sourcing-review",locale)}>{t("Custom development", "咨询产品定制")} ↗</Link></div>
    </section>
    <section className="studio-catalog-body" id="catalog">{zh ? <ChineseProductCatalog products={products} /> : <ProductCatalog products={products} />}</section>
    <section className="studio-contact-band"><div><p className="eyebrow">{t("YOUR PRODUCT BRIEF", "产品与定制需求")}</p><h2>{t("A different style in mind?", "有其他鞋款或开发需求？")}</h2><p>{t("Share a reference, target market and quantity. We will assess the product and supply options.", "提供参考款、目标市场和预计数量，我们将评估产品与供货方案。")}</p></div><Link className="button button-light" href={localizedPath("/sourcing-review",locale)}>{t("Discuss your requirements", "提交定制需求")} ↗</Link></section>
    {zh ? <ChineseSiteFooter /> : <SiteFooter />}
  </main>;
}
