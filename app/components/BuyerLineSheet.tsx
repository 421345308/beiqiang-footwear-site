/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { products } from "../data/products";
import { productCount } from "../data/catalog-meta";
import { selectedAssortment, selectedCatalogue } from "../data/selected-assortment";
import { productNameZh } from "../data/products-zh";
import { productMediaUrl } from "../lib/product-media-url";
import { localizedPath, type LegacyLocale } from "../lib/public-locales";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import ChineseSiteHeader from "./ChineseSiteHeader";
import ChineseSiteFooter from "./ChineseSiteFooter";
import LineSheetLeadForm from "./LineSheetLeadForm";
import ChineseLineSheetLeadForm from "./ChineseLineSheetLeadForm";

export default function BuyerLineSheet({ locale }: { locale: LegacyLocale }) {
  const zh = locale === "zh";
  const t = (en: string, cn: string) => zh ? cn : en;
  const href = (path: string) => localizedPath(path, locale);
  const fullPdf = `/downloads/beiqiang-footwear-line-sheet-${zh ? "zh-" : ""}2026.pdf`;
  return <main className="buyer-catalogue" lang={zh ? "zh-CN" : "en"}>
    {zh ? <ChineseSiteHeader englishHref="/line-sheet/" /> : <SiteHeader chineseHref="/zh/line-sheet/" />}
    <section className="line-sheet-hero">
      <div><p className="eyebrow">{t("SELECT YOUR NEXT RANGE", "为下一批采购选款")}</p>
        <h1>{t("Selected casuals.", "日常休闲精选。")}<br />{t("For your next range.", "从有区分的款式开始。")}</h1>
        <p>{t("Explore eight selected styles, compare the size ranges and meet our manufacturing process. Browse the catalogue now, then ask us about the styles that fit your business.", "先浏览8款精选、比较尺码与款型、了解真实生产过程。找到适合您业务的方向后，再讨论选款、样品与报价。")}</p>
        <div className="line-sheet-hero-facts"><span>{t("8 selected styles", "8款精选")}</span><span>{t("6-page English PDF", "6页英文精选册")}</span><span>{t("Factory & partner-sourced options", "本厂与合作来源")}</span></div>
        <div className="catalogue-download-actions"><a className="button" href={selectedCatalogue.path} target="_blank" rel="noreferrer">{t("Preview selected catalogue", "预览英文精选册")} ↗</a><a className="studio-text-link" href={selectedCatalogue.path} download>{t("Download PDF", "下载PDF")} ↓</a></div>
      </div>
      <div className="line-sheet-preview" aria-label={t("Selected style preview", "精选款预览")}>{selectedAssortment.map(item => {
        const product = products.find(p => p.code === item.code)!;
        return <article key={product.code}><Link href={href(`/products/${product.slug}`)}><img src={productMediaUrl(`/catalog-thumbs/${product.slug}.webp`)} alt={zh ? productNameZh(product) : product.name} loading="lazy" decoding="async" width={640} height={640} /></Link><div><strong>{product.code}</strong><span>{zh ? item.zh : item.en}</span></div></article>;
      })}</div>
    </section>
    <section className="line-sheet-value">
      <div><p className="eyebrow">{t("CHOOSE THE DETAIL YOU NEED", "按采购需要继续浏览")}</p><h2>{t("From a first look to a full shortlist.", "从首次了解，到具体选款。")}</h2></div>
      <div className="line-sheet-value-grid">
        <article><strong>01</strong><h3>{t("Selected collection", "精选系列")}</h3><p>{t("Eight styles with different assortment roles, size ranges and supply routes, alongside our factory and cooperation options.", "8款不同系列角色、尺码和供货来源，配合真实工厂介绍及合作方式。")}</p><a href={selectedCatalogue.path}>{t("Open the English selection", "打开英文精选册")} →</a></article>
        <article><strong>02</strong><h3>{t(`Full ${productCount}-style catalogue`, `${productCount}款完整目录`)}</h3><p>{t("Explore the wider range, then follow each style to its current product page for colours and specifications.", "深入浏览更多款式，并从目录进入对应产品页，查看配色与规格。")}</p><a href={fullPdf} target="_blank" rel="noreferrer">{t("Open full English PDF", "打开完整中文PDF")} →</a></article>
        <article><strong>03</strong><h3>{t("Build your shortlist", "组合您的采购清单")}</h3><p>{t("Compare products online and add the styles you want to one inquiry. Sample and quotation details follow your chosen versions.", "在线比较产品，把需要的款式放入同一询价清单，再按所选版本明确样品与报价。")}</p><Link href={href("/products")}>{t("Browse and compare styles", "浏览与比较产品")} →</Link></article>
      </div>
    </section>
    <section className="line-sheet-access" id="selection-help"><div className="line-sheet-access-copy"><p className="eyebrow">{t("OPTIONAL SELECTION HELP", "需要选款建议时再填写")}</p><h2>{t("Tell us what your range needs.", "告诉我们您的系列需要什么。")}</h2><p>{t("Share your market, quantity and preferred styles when you want a tailored response. We will review the selection and the next sample or quotation step with you.", "需要针对性的建议时，提供市场、数量和感兴趣的款式，我们将据此讨论选款及下一步样品或报价。")}</p><ul><li>{t("Regional wholesale and import assortments", "区域批发与进口系列")}</li><li>{t("Existing styles for private-label review", "从现款评估品牌化选择")}</li><li>{t("Version-specific samples and quotations", "针对所选版本安排样品与报价")}</li></ul></div>{zh ? <ChineseLineSheetLeadForm /> : <LineSheetLeadForm />}</section>
    {zh ? <ChineseSiteFooter /> : <SiteFooter />}
  </main>;
}
