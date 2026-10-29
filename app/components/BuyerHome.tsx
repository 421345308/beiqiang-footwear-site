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
import SelectedStyles from "./SelectedStyles";
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
        <h1>{t("Everyday casual footwear.","日常休闲鞋系列")}<br/><em>{t("Build your next range.","为下一批采购选款")}</em></h1>
        <p className="studio-hero-lead">{t("Factory styles and selected sourcing for importers, wholesalers and established brands. Start with a focused casual range, then plan the samples and order that fit your market.","面向进口商、批发商与已有销售的品牌，提供本厂休闲系列和精选配套货源。从适合市场的款式开始，再明确样品与订单方案。")}</p>
        <div className="studio-hero-actions"><Link className="button" href="#selected-styles">{t("Browse selected styles","浏览精选款式")} ↗</Link><Link className="studio-text-link" href={href("/sample-order-process")}>{t("Plan a sample","了解选样路径")} →</Link></div>
        <div className="studio-hero-foot"><span>{t("OEM / ODM","OEM / ODM 开发")}</span><span>{t("Private label","品牌贴牌")}</span><span>{t("Wholesale supply","鞋类批发")}</span></div>
      </div>
      <HeroProductPreview product={products.find(p => p.code === "BQ008")!} locale={locale} />
    </section>
    <div className="studio-intro-strip"><p>{t("From product selection to brand development.","从产品选型，到品牌开发。")}</p><span>{t("A manufacturing and sourcing partner in Quanzhou.","立足泉州，连接制造与采购。")}</span></div>
    <SelectedStyles locale={locale} />
    <HomeProductDiscovery products={products} locale={locale} />
    <section className="studio-factory" id="factory"><div className="studio-factory-video"><FactoryEvidenceVideo locale={locale} /></div><div className="studio-factory-copy"><p className="eyebrow">{t("INSIDE THE FACTORY","工厂与生产")}</p><h2>{t("A closer look at the work.","看见每一道工序")}</h2><p>{t("Established in Quanzhou in 2015, Beiqiang has a manufacturing base of over 3,000 square metres and an annual output of 200,000 pairs. See material preparation, upper stitching, shoe finishing and packing in our factory footage.","贝强于2015年在泉州成立，制造场地超过3000平方米，年产20万双。通过真实工厂画面，了解材料准备、鞋面车缝、鞋品整理与包装。")}</p><dl><div><dt>{t("Location","生产所在地")}</dt><dd>{t("Quanzhou, Fujian, China","中国 · 福建 · 泉州")}</dd></div><div><dt>{t("Business","合作业务")}</dt><dd>OEM / ODM · {t("Private label · Wholesale","品牌贴牌 · 批发")}</dd></div></dl><Link className="studio-text-link" href={href("/factory")}>{t("Factory & company profile","工厂与公司介绍")} ↗</Link></div></section>
    <section className="studio-section studio-custom" id="customization"><div className="studio-section-heading"><div><p className="eyebrow">{t("OEM / ODM & PRIVATE LABEL","OEM / ODM 与品牌定制")}</p><h2>{t("Choose your starting point.","选择适合的合作起点")}</h2></div><p>{t("Existing styles, adaptations and new constructions need different sample plans. Tell us what you want to evaluate, and we will define the next step with you.","现款取样、现款改样和新结构开发，需要不同的样品方案。先明确要评估什么，再确定下一步交付。")}</p></div>
      <div className="studio-custom-grid">{[
        ["01",t("Select an existing style","现款选样"),t("Choose the style, colour and size. Receive a sample proposal with applicable charges, timing and the version to review.","选择款式、颜色和尺码，按对应版本明确样品费用、时间和评估内容。"),productMediaUrl("/catalog-thumbs/bq018.webp")],
        ["02",t("Adapt a factory style","现款改样"),t("Share your branding, colour or packaging brief. Review feasible changes, sample scope and the cost difference for your chosen style.","提供品牌、配色或包装要求，结合所选款式评估可做调整、样品范围与成本变化。"),"/factory-video-stills/stitching-line.webp"],
        ["03",t("Explore a new construction","新结构开发评估"),t("Start with a feasibility review of the design, tooling, materials and tests. Agree the scope and sample acceptance criteria before development.","先评估设计、模具、材料与测试要求，明确开发范围及样品验收条件后再推进。"),"/factory-video-stills/material-cutting.webp"],
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
