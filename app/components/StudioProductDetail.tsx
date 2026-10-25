/* eslint-disable @next/next/no-img-element */
import { productMediaUrl } from "../lib/product-media-url";
import Link from "next/link";
import type { Product } from "../data/products";
import { products } from "../data/products";
import { productNameZh, productSummaryZh, factZh, closureZh, colorZh } from "../data/products-zh";
import { supplyMode } from "../data/published-product-codes";
import { localizedPath, siteOrigin, type PublicLocale } from "../lib/public-locales";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import ChineseSiteHeader from "./ChineseSiteHeader";
import ChineseSiteFooter from "./ChineseSiteFooter";
import ProductGallery from "./ProductGallery";
import StudioProductCard from "./StudioProductCard";
import AddToQuoteButton from "./AddToQuoteButton";
import PrintProductSheetButton from "./PrintProductSheetButton";
import ProductShareActions from "./ProductShareActions";
import ProductInquiry from "./ProductInquiry";
import ProductBuyingGuide from "./ProductBuyingGuide";
import { getRelatedProducts } from "../lib/product-buying-guide";
import ProductColourOptions from "./ProductColourOptions";

export default function StudioProductDetail({ product, locale = "en" }: { product: Product; locale?: PublicLocale }) {
  const zh=locale === "zh";
  const t=(en: string, cn: string) => zh ? cn : en;
  const href=(path: string) => localizedPath(path,locale);
  const name=zh ? productNameZh(product) : product.name;
  const external=supplyMode(product.code)==="partner-sourced";
  const fact=(value: string) => zh ? factZh(value) : value;
  const productFact=(value: string) => fact(value)
    .replace(/Mesh lining recorded in Alibaba trunk for the listed configuration/gi, "Mesh lining for the listed configuration")
    .replace(/Mesh lining recorded in Alibaba trunk/gi, "Mesh lining for the listed configuration")
    .replace(/EVA sole recorded in the source package/gi, "EVA sole")
    .replace(/Alibaba在售配置已记录网布内里|Alibaba线上正本已记录网布内里/g, "所列配置采用网布内里")
    .replace(/来源资料已记录EVA鞋底/g, "EVA鞋底");
  const details=product.highlights.map(productFact).filter(value=>!zh || /[\u4e00-\u9fff]/.test(value));
  const sole=product.sole.startsWith("Cushion-profile") ? t("Material to be confirmed", "材质待确认") : fact(product.sole);
  const description=external ? (zh ? productSummaryZh(product) : product.shortDescription) : t(`${product.name}. Available in ${product.colors.length} colours, ${product.size}. Colour-size combinations and custom requirements are confirmed for each order.`,productSummaryZh(product));
  const related=getRelatedProducts(product, products, 4);
  const schema={"@context":"https://schema.org","@type":"Product",name,sku:product.code,model:product.sourceModel,description,url:`${siteOrigin}${href(`/products/${product.slug}`)}`,image:product.images.map(img=>`${siteOrigin}${productMediaUrl(img)}`),...(!external ? {manufacturer:{"@type":"Organization",name:"Quanzhou Beiqiang Footwear & Apparel Co., Ltd."}} : {})};
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
        <div className="studio-supply"><span className="supply-dot" /><p>{external ? t("Supplied by Beiqiang through a manufacturing partner.","由贝强通过合作供应商提供。") : t("A Beiqiang factory style.","贝强自有工厂鞋款。")}<small>{t("Availability, specifications and delivery are confirmed with your order.","可供色码、具体规格及交付安排按订单确认。")}</small></p></div>
        <div className="studio-product-actions"><AddToQuoteButton product={product} locale={locale} /><a className="button button-secondary" href="#inquiry">{t("Enquire about this style","咨询此款产品")} ↗</a></div>
        <p className="studio-commercial-note">{t("Pricing depends on quantity, colour-size mix, branding and packaging.","报价根据数量、色码配比、品牌及包装要求确定。")}</p>
        <div className="studio-secondary-actions"><PrintProductSheetButton styleCode={product.code} locale={locale} /><ProductShareActions product={product} code={product.code} name={name} url={schema.url} locale={locale} /></div>
      </div>
    </section>
    <aside className="studio-product-proof"><div><p className="eyebrow">{t("YOUR SUPPLY PARTNER","产品与供货")}</p><h2>{external ? t("Sourcing support from Beiqiang","由贝强协调供货与采购") : t("Meet the factory behind the collection","了解产品背后的贝强工厂")}</h2><p>{external ? t("This style is sourced through a manufacturing partner. Beiqiang coordinates specification review, sample requirements and the quotation for your selected configuration.","本款通过合作供应商供货。贝强根据所选配置，协调规格确认、样品要求与报价。") : t("See Beiqiang’s production footage and company profile, then discuss samples and branding requirements for this style.","查看贝强生产实拍与公司介绍，再结合本款讨论样品及品牌定制要求。")}</p></div><div>{!external && <Link className="studio-text-link" href={href("/factory")}>{t("Factory & production","查看工厂与生产")} ↗</Link>}<a className="studio-text-link" href="#inquiry">{t(`Discuss ${product.code} samples`, `咨询 ${product.code} 样品`)} ↗</a></div></aside>
    <section className="studio-order-details">
      <div><p className="eyebrow">{t("PRODUCT & ORDER DETAILS","产品与订单信息")}</p><h2>{t("From selection to specification.","从选款到订单确认")}</h2></div>
      <div className="studio-accordions">
        <details open><summary>{t("Product specifications","产品规格")}<span>+</span></summary><p>{t("Style reference","产品款号")}: {product.code} · {t("Original model","原款型号")}: {product.sourceModel}.</p><p>{product.fitEvidence==="wide_toe_verified" ? t("This style has a wide toe box. Toe-box space does not specify overall last width; confirm the required fit and size grading on a sample.","本款为宽鞋头结构。鞋头空间不等于整鞋宽楦规格，具体合脚程度与尺码级放按样品确认。") : t("Confirm fit, lining and exact material specifications for the selected colour and size before ordering.","所选颜色和尺码的合脚程度、内里及准确材料规格在订单前确认。")}</p></details>
        <details><summary>{t("Construction & order checks","产品细节与确认事项")}<span>+</span></summary><ul>{details.map(item=><li key={item}>{item}</li>)}</ul><h3>{t("Confirm before quotation or order","报价与订单前确认")}</h3><ul>{product.confirmBeforeQuote.map(item=><li key={item}>{fact(item)}</li>)}</ul></details>
        <details><summary>{t("Branding & packaging","品牌与包装")}<span>+</span></summary><p>{t("Submit your logo placement, colour and packaging brief. Feasibility, minimum quantities and sample costs are assessed for this specific style.","提供商标位置、配色和包装要求。改动可行性、起订量及样品费用按本款具体方案评估。")}</p><Link href={href("/sourcing-review")}>{t("Submit a customization brief","提交定制需求")} ↗</Link></details>
        <details><summary>{t("Samples & delivery","样品与交付")}<span>+</span></summary><p>{t("Include the required colours, sizes, quantities and destination in your inquiry. The quotation will specify sample availability, charges and the proposed delivery schedule.","询盘请注明颜色、尺码、数量和目的地。样品可供情况、费用及预计交付安排将在报价中列明。")}</p></details>
        <details><summary>{t("Sample evaluation guide","样品评估要点")}<span>+</span></summary><ProductBuyingGuide product={product} locale={locale} /></details>
      </div>
    </section>
    <section className="inquiry-section studio-inquiry" id="inquiry"><ProductInquiry product={product} code={product.code} label={`${product.code} — ${name}`} productName={product.name} alibabaProductId={product.alibabaProductId} locale={locale} /></section>
    <section className="studio-section"><div className="studio-section-heading"><div><p className="eyebrow">{t("EXPLORE THE COLLECTION","更多鞋款")}</p><h2>{t("Related styles","相关产品")}</h2></div><Link className="text-link" href={href("/products")}>{t("All products","全部产品")} ↗</Link></div><div className="studio-product-grid">{related.map(item=><StudioProductCard key={item.code} product={item} locale={locale} />)}</div></section>
    <section className="product-print-sheet" aria-label={t("Product specification sheet","产品资料表")}>
      <header><p>BEIQIANG FOOTWEAR</p><h1>{name}</h1><p>{product.code} · {product.sourceModel}</p></header>
      <div className="studio-print-body"><img src={productMediaUrl(product.images[0])} alt={name} /><div><p>{description}</p><dl className="studio-specs"><div><dt>{t("Upper","鞋面")}</dt><dd>{fact(product.upper)}</dd></div><div><dt>{t("Sole","鞋底")}</dt><dd>{sole}</dd></div><div><dt>{t("Sizes","尺码")}</dt><dd>{product.size}{product.sizeNote && <small className="studio-size-note">{fact(product.sizeNote)}</small>}</dd></div><div><dt>{t("Colours","配色")}</dt><dd>{product.colors.map(c=>zh ? colorZh(c) : c).join(" · ")}</dd></div></dl><p>{external ? t("Supplied through a manufacturing partner.","通过合作供应商供货。") : t("Beiqiang factory style.","贝强自有工厂鞋款。")}</p></div></div>
      <p>{t("Product reference only. This sheet is not a quotation or order confirmation. Confirm specifications, quantities, prices, sample terms and delivery in the written quotation.","本资料仅供选型，不构成报价或订单确认。具体规格、数量、价格、样品及交付要求以书面报价为准。")}</p><p>Quanzhou Beiqiang Footwear & Apparel Co., Ltd. · shepeiqiang@gmail.com · +86 189 5980 5256</p><p>{schema.url}</p>
    </section>
    {zh ? <ChineseSiteFooter /> : <SiteFooter />}
  </main>;
}
