/* eslint-disable @next/next/no-img-element */
import { productMediaUrl } from "../lib/product-media-url";
import Link from "next/link";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import ChineseSiteHeader from "./ChineseSiteHeader";
import ChineseSiteFooter from "./ChineseSiteFooter";
import FactoryEvidenceVideo from "./FactoryEvidenceVideo";
import HeroProductPreview from "./HeroProductPreview";
import HomeProductDiscovery from "./HomeProductDiscovery";
import { products } from "../data/products";
import { localizedPath, type LegacyLocale } from "../lib/public-locales";
import { factoryVideoSchema } from "../lib/factory-video-schema";

export default function BuyerHome({ locale = "en" }: { locale?: LegacyLocale }) {
  const zh=locale === "zh";
  const t=(en: string, cn: string) => zh ? cn : en;
  const href=(path: string) => localizedPath(path,locale);

  return <main lang={zh ? "zh-CN" : "en"} className="studio-page studio-home">
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(factoryVideoSchema(locale))}} />
    {zh ? <ChineseSiteHeader englishHref="/" /> : <SiteHeader chineseHref="/zh/" />}
    <section className="studio-hero" id="top">
      <div className="studio-hero-copy">
        <p className="eyebrow"><span className="studio-rule" /> {t("BEIQIANG · QUANZHOU, CHINA","贝强鞋业 · 中国泉州")}</p>
        <h1>{t("Footwear manufacturing.","专注鞋履制造")}<br/><em>{t("Made for your brand.","服务品牌定制")}</em></h1>
        <p className="studio-hero-lead">{t("Casual and walking shoes for brands, importers and wholesalers. Explore our collection, factory and OEM/ODM services.","面向品牌商、进口商及批发客户，提供休闲鞋、步行鞋与 OEM/ODM 服务。了解贝强工厂，浏览现有款式，开展品牌定制。")}</p>
        <div className="studio-hero-actions"><Link className="button" href="#collections">{t("Find your product","按需求浏览产品")} ↗</Link><Link className="studio-text-link" href={href("/sourcing-review")}>{t("Discuss customization","咨询品牌定制")} →</Link></div>
        <div className="studio-hero-foot"><span>{t("OEM / ODM","OEM / ODM 开发")}</span><span>{t("Private label","品牌贴牌")}</span><span>{t("Wholesale supply","鞋类批发")}</span></div>
      </div>
      <HeroProductPreview product={products.find(p => p.code === "BQ003")!} locale={locale} />
    </section>
    <div className="studio-intro-strip"><p>{t("From product selection to brand development.","从产品选型，到品牌开发。")}</p><span>{t("A manufacturing and sourcing partner in Quanzhou.","立足泉州，连接制造与采购。")}</span></div>
    <HomeProductDiscovery products={products} locale={locale} />
    <section className="studio-factory" id="factory"><div className="studio-factory-video"><FactoryEvidenceVideo locale={locale} /></div><div className="studio-factory-copy"><p className="eyebrow">{t("INSIDE THE FACTORY","工厂与生产")}</p><h2>{t("A closer look at the work.","看见每一道工序")}</h2><p>{t("Quanzhou Beiqiang Footwear & Apparel Co., Ltd. is based in Fujian, China. Our factory footage follows material preparation, upper stitching, shoe finishing and packing.","泉州贝强鞋业服饰有限公司位于福建泉州。通过工厂实拍，了解材料准备、鞋面车缝、鞋品整理与包装等实际工作环节。")}</p><dl><div><dt>{t("Location","生产所在地")}</dt><dd>{t("Quanzhou, Fujian, China","中国 · 福建 · 泉州")}</dd></div><div><dt>{t("Business","合作业务")}</dt><dd>OEM / ODM · {t("Private label · Wholesale","品牌贴牌 · 批发")}</dd></div></dl><Link className="studio-text-link" href={href("/factory")}>{t("Factory & company profile","工厂与公司介绍")} ↗</Link></div></section>
    <section className="studio-section studio-custom" id="customization"><div className="studio-section-heading"><div><p className="eyebrow">{t("OEM / ODM & PRIVATE LABEL","OEM / ODM 与品牌定制")}</p><h2>{t("Your brand. The right details.","从产品细节，建立品牌识别")}</h2></div><p>{t("Start with an existing style or a development brief. Each specification is reviewed against the selected shoe and order requirements.","以现有鞋款或开发需求为起点，按选定产品和订单要求评估定制方案。")}</p></div>
      <div className="studio-custom-grid">{[
        ["01",t("Branding & identity","商标与品牌标识"),t("Define logo placement, insole artwork and label requirements for the chosen style.","结合选定款式，评估商标位置、鞋垫图案及标签要求。"),productMediaUrl("/catalog-thumbs/bq018.webp")],
        ["02",t("Materials & construction","材料与结构开发"),t("Review upper materials, colours and construction against your design or reference sample.","依据设计或参考样，评估鞋面材料、配色与结构要求。"),"/factory-video-stills/stitching-line.webp"],
        ["03",t("Packaging & presentation","包装与交付呈现"),t("Prepare shoe-box, label and carton-mark specifications for your sales channel.","结合销售渠道，确定鞋盒、标签及外箱标识方案。"),"/factory-video-stills/packing-preparation.webp"],
      ].map(([number,title,copy,img])=><article key={number}><div className="studio-custom-image"><img src={img} alt={title} width={640} height={430} loading="lazy" /><span>{number}</span></div><h3>{title}</h3><p>{copy}</p></article>)}</div>
      <div className="studio-custom-foot"><p>{t("Feasibility, sample scope, quantities and costs are agreed before development.","开发前明确可行性、样品范围、数量与费用。")}</p><Link className="button button-secondary" href={href("/oem-odm")}>{t("Explore customization","了解定制服务")} ↗</Link></div>
    </section>
    <section className="studio-process"><div><p className="eyebrow">{t("WORKING WITH BEIQIANG","合作流程")}</p><h2>{t("Clear steps. Defined specifications.","明确要求，有序推进")}</h2></div><ol>{[
      [t("Product brief","需求评估"),t("Styles, market and quantity","款式、市场与数量")],
      [t("Sample review","样品确认"),t("Fit, materials and details","合脚程度、材料与细节")],
      [t("Order agreement","订单确认"),t("Specifications, price and timing","规格、报价与排期")],
      [t("Checks & delivery","检查与交付"),t("Product checks, packing and shipment","产品检查、包装与运输")],
    ].map(([title,copy],i)=><li key={title}><span>0{i+1}</span><h3>{title}</h3><p>{copy}</p></li>)}</ol><Link className="studio-text-link" href={href("/sample-order-process")}>{t("Sample & order process","查看样品与订单流程")} ↗</Link></section>
    <section className="studio-contact-band" id="inquiry"><div><p className="eyebrow">{t("START A PROJECT","产品合作")}</p><h2>{t("Let’s develop your next collection.","开启下一季产品合作")}</h2><p>{t("Share a style reference, target market and expected quantity. We will review the product and customization requirements.","提供款式参考、目标市场和预计数量，我们将评估产品与定制要求。")}</p></div><div><Link className="button button-light" href={href("/sourcing-review")}>{t("Discuss your project","提交合作需求")} ↗</Link><a className="studio-contact-email" href="mailto:shepeiqiang@gmail.com">shepeiqiang@gmail.com</a></div></section>
    {zh ? <ChineseSiteFooter /> : <SiteFooter />}
  </main>;
}
