import { productMediaUrl } from "../lib/product-media-url";
import Link from "next/link";
import type { Product } from "../data/products";
import { products } from "../data/products";
import { productNameZh, productSummaryZh, factZh, closureZh } from "../data/products-zh";
import { localizedPath, siteOrigin, type LegacyLocale } from "../lib/public-locales";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import ChineseSiteHeader from "./ChineseSiteHeader";
import ChineseSiteFooter from "./ChineseSiteFooter";
import ProductGallery from "./ProductGallery";
import StudioProductPrintSheet from "./StudioProductPrintSheet";
import StudioProductCard from "./StudioProductCard";
import AddToQuoteButton from "./AddToQuoteButton";
import PrintProductSheetButton from "./PrintProductSheetButton";
import ProductShareActions from "./ProductShareActions";
import ProductInquiry from "./ProductInquiry";
import ProductBuyingGuide from "./ProductBuyingGuide";
import { getRelatedProducts } from "../lib/product-buying-guide";
import ProductColourOptions from "./ProductColourOptions";
import { productPresentation, productOrderCopy } from "../lib/product-presentation";

export default function StudioProductDetail({ product, locale = "en" }: { product: Product; locale?: LegacyLocale }) {
  const zh=locale === "zh";
  const t=(en: string, cn: string) => zh ? cn : en;
  const href=(path: string) => localizedPath(path,locale);
  const name=zh ? productNameZh(product) : product.name;
  const fact=(value: string) => zh ? factZh(value) : value;
  const productFact=(value: string) => fact(value)
    .replace(/Mesh lining recorded in Alibaba trunk for the listed configuration/gi, "Mesh lining for the listed configuration")
    .replace(/Mesh lining recorded in Alibaba trunk/gi, "Mesh lining for the listed configuration")
    .replace(/EVA sole recorded in the source package/gi, "EVA sole")
    .replace(/Alibaba在售配置已记录网布内里|Alibaba线上正本已记录网布内里/g, "所列配置采用网布内里")
    .replace(/来源资料已记录EVA鞋底/g, "EVA鞋底");
  const presentation=productPresentation(product, locale);
  const details=presentation?.highlights || product.highlights.filter(value=>!/hero direction|reviewed color|verified product-level/i.test(value)).map(productFact).filter(value=>!zh || /[\u4e00-\u9fff]/.test(value));
  const sole=product.sole.startsWith("Cushion-profile") ? t("Material to be confirmed", "材质待确认") : fact(product.sole);
  const description=presentation?.summary || (zh ? productSummaryZh(product) : product.shortDescription);
  const related=getRelatedProducts(product, products, 4);
  const schema={"@context":"https://schema.org","@type":"Product",name,sku:product.code,model:product.code,description,url:`${siteOrigin}${href(`/products/${product.slug}`)}`,image:product.images.map(img=>`${siteOrigin}${productMediaUrl(img)}`)};
  const breadcrumb={"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:[{ "@type":"ListItem",position:1,name:t("Home","首页"),item:`${siteOrigin}${href("/")}`},{"@type":"ListItem",position:2,name:t("Products","产品系列"),item:`${siteOrigin}${href("/products")}`},{"@type":"ListItem",position:3,name:product.code,item:schema.url}]};
  return <main lang={zh ? "zh-CN" : "en"} className="studio-page studio-product-page">
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema)}} /><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(breadcrumb)}} />
    {zh ? <ChineseSiteHeader englishHref={localizedPath(`/products/${product.slug}`,"en")} /> : <SiteHeader chineseHref={localizedPath(`/products/${product.slug}`,"zh")} />}
    <nav className="studio-breadcrumb" aria-label={t("Breadcrumb","当前位置")}><Link href={href("/")}>{t("Home","首页")}</Link><span>/</span><Link href={href("/products")}>{t("Products","产品系列")}</Link><span>/</span><span>{product.code}</span></nav>
    <section className="studio-product-hero product-detail-hero">
      <ProductGallery product={product} name={name} locale={locale} />
      <div className="studio-product-copy">
        <p className="eyebrow">{product.code} <span> / </span> {t("FOOTWEAR COLLECTION","产品系列")}</p>
        <h1>{name}</h1><p className="studio-product-description">{description}</p>
        <dl className="studio-specs"><div><dt>{t("Upper","鞋面")}</dt><dd>{fact(product.upper)}</dd></div><div><dt>{t("Sole","鞋底")}</dt><dd>{sole}</dd></div><div><dt>{t("Size range","尺码范围")}</dt><dd>{product.size}{product.sizeNote && <small className="studio-size-note">{fact(product.sizeNote)}</small>}</dd></div><div><dt>{t("Closure","穿脱结构")}</dt><dd>{zh ? closureZh(product.closure) : product.closure}</dd></div></dl>
        <ProductColourOptions product={product} locale={locale} detail />
        <div className="studio-supply"><span className="supply-dot" /><p>{t("Beiqiang footwear.","贝强鞋款。")}<small>{t("Availability, specifications and delivery are confirmed with your order.","可供色码、具体规格及交付安排按订单确认。")}</small></p></div>
        <div className="studio-product-actions"><AddToQuoteButton product={product} locale={locale} /><a className="button button-secondary" href="#inquiry">{t("Enquire about this style","咨询此款产品")} ↗</a></div>
        <p className="studio-commercial-note">{productOrderCopy[locale].text}</p>
        <div className="studio-secondary-actions"><PrintProductSheetButton styleCode={product.code} locale={locale} /><ProductShareActions product={product} code={product.code} name={name} url={schema.url} locale={locale} /></div>
      </div>
    </section>
    <aside className="studio-product-proof"><div><p className="eyebrow">{t("WORK WITH BEIQIANG","与贝强合作")}</p><h2>{t("Explore Beiqiang","了解贝强")}</h2><p>{t("See our company profile and production footage, then discuss samples and branding requirements for this style.","查看公司介绍与生产实拍，再结合本款讨论样品及品牌定制要求。")}</p></div><div><Link className="studio-text-link" href={href("/factory")}>{t("Factory & production","查看工厂与生产")} ↗</Link><a className="studio-text-link" href="#inquiry">{t(`Discuss ${product.code} samples`, `咨询 ${product.code} 样品`)} ↗</a></div></aside>
    <section className="studio-order-details">
      <div><p className="eyebrow">{t("PRODUCT & ORDER DETAILS","产品与订单信息")}</p><h2>{t("From selection to specification.","从选款到订单确认")}</h2></div>
      <div className="studio-accordions">
        <details open><summary>{t("Product specifications","产品规格")}<span>+</span></summary><p>{t("Style reference","产品款号")}: {product.code}.</p><p>{product.fitEvidence==="wide_toe_verified" ? t("This style has a wide toe box. Toe-box space does not specify overall last width; confirm the required fit and size grading on a sample.","本款为宽鞋头结构。鞋头空间不等于整鞋宽楦规格，具体合脚程度与尺码级放按样品确认。") : t("Confirm fit, lining and exact material specifications for the selected colour and size before ordering.","所选颜色和尺码的合脚程度、内里及准确材料规格在订单前确认。")}</p></details>
        <details><summary>{t("Construction & order checks","产品细节与确认事项")}<span>+</span></summary><ul>{details.map(item=><li key={item}>{item}</li>)}</ul><h3>{t("Confirm before quotation or order","报价与订单前确认")}</h3><ul>{product.confirmBeforeQuote.map(item=><li key={item}>{fact(item)}</li>)}</ul></details>
        <details><summary>{t("Branding & packaging","品牌与包装")}<span>+</span></summary><p>{t("Submit your logo placement, colour and packaging brief. Feasibility, minimum quantities and sample costs are assessed for this specific style.","提供商标位置、配色和包装要求。改动可行性、起订量及样品费用按本款具体方案评估。")}</p><Link href={href("/sourcing-review")}>{t("Submit a customization brief","提交定制需求")} ↗</Link></details>
        <details><summary>{t("Samples & delivery","样品与交付")}<span>+</span></summary><p>{t("Include the required colours, sizes, quantities and destination in your inquiry. The quotation will specify sample availability, charges and the proposed delivery schedule.","询盘请注明颜色、尺码、数量和目的地。样品可供情况、费用及预计交付安排将在报价中列明。")}</p></details>
        <details><summary>{t("Sample evaluation guide","样品评估要点")}<span>+</span></summary><ProductBuyingGuide product={product} locale={locale} /></details>
      </div>
    </section>
    <section className="inquiry-section studio-inquiry" id="inquiry"><ProductInquiry product={product} code={product.code} label={`${product.code} — ${name}`} productName={product.name} alibabaProductId={product.alibabaProductId} locale={locale} /></section>
    <section className="studio-section"><div className="studio-section-heading"><div><p className="eyebrow">{t("EXPLORE THE COLLECTION","更多鞋款")}</p><h2>{t("Related styles","相关产品")}</h2></div><Link className="text-link" href={href("/products")}>{t("All products","全部产品")} ↗</Link></div><div className="studio-product-grid">{related.map(item=><StudioProductCard key={item.code} product={item} locale={locale} />)}</div></section>
    <StudioProductPrintSheet product={product} name={name} description={description} upper={fact(product.upper)} sole={sole} sizeNote={product.sizeNote ? fact(product.sizeNote) : undefined} url={schema.url} locale={locale} />
    {zh ? <ChineseSiteFooter /> : <SiteFooter />}
  </main>;
}
