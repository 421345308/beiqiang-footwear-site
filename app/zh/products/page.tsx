import type { Metadata } from "next";
import Link from "next/link";
import ChineseProductCatalog from "../../components/ChineseProductCatalog";
import ChineseSiteFooter from "../../components/ChineseSiteFooter";
import ChineseSiteHeader from "../../components/ChineseSiteHeader";
import { products } from "../../data/products";
import { productCount } from "../../data/catalog-meta";

export const metadata: Metadata = { title: `${productCount}款步行鞋产品目录｜贝强鞋业`, description: `按款号、源款号、套穿或系带结构查看贝强鞋业${productCount}款B2B产品资料，并建立多款样品与报价询价单。`, alternates: { canonical: "https://www.beiqiang.online/zh/products/", languages: { en: "https://www.beiqiang.online/products/", "zh-CN": "https://www.beiqiang.online/zh/products/", "x-default": "https://www.beiqiang.online/products/" } }, openGraph: { title: `${productCount}款步行鞋产品目录｜贝强鞋业`, description: "比较真实产品图片、逐款规格与报价前待确认项。", url: "https://www.beiqiang.online/zh/products/", locale: "zh_CN", images: ["https://www.beiqiang.online/og.jpg"] }, twitter: { card: "summary_large_image", title: `${productCount}款步行鞋产品目录｜贝强鞋业`, description: "比较真实产品图片、逐款规格与报价前待确认项。", images: ["https://www.beiqiang.online/og.jpg"] } };

export default function ChineseProductsPage() {
  return <main><ChineseSiteHeader englishHref="/products/" /><section className="catalog-hero"><p className="eyebrow">完整产品范围</p><h1>比较全部30款已整理产品。</h1><p>可按款号、源款号或穿脱结构筛选。每个产品页把真实图片、产品事实、报价前待确认项与询盘连接起来。</p><div className="catalog-summary"><span><strong>{products.length}</strong>个产品资料包</span><span><strong>{products.filter((product) => product.closure === "Slip-On").length}</strong>款套穿鞋</span><span><strong>{products.filter((product) => product.closure === "Lace-Up").length}</strong>款系带鞋</span></div></section><section className="section catalog-section"><ChineseProductCatalog products={products} /></section><section className="catalog-help"><div><p className="eyebrow eyebrow-light">需要帮助选款？</p><h2>先生成2至4款有依据的候选清单。</h2><p>按采购渠道、产品方向和穿脱结构缩小目录，再比较产品，并补充数量、尺码、颜色、市场与包装要求。</p></div><Link className="button button-light" href="/zh/product-finder/">使用B2B采购选款助手</Link></section><ChineseSiteFooter /></main>;
}
