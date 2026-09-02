import type { Metadata } from "next";
import Link from "next/link";
import ChineseProductCatalog from "../../components/ChineseProductCatalog";
import ChineseSiteFooter from "../../components/ChineseSiteFooter";
import ChineseSiteHeader from "../../components/ChineseSiteHeader";
import { products } from "../../data/products";
import { productCount } from "../../data/catalog-meta";

export const metadata: Metadata = { title: `当前在线${productCount}款鞋类产品｜贝强鞋业`, description: `查看贝强鞋业当前已制作在线详情页的${productCount}款B2B鞋类产品；这不是工厂全部产品，可另行索取最新选款资料或提交参考款。`, alternates: { canonical: "https://www.beiqiang.online/zh/products/", languages: { en: "https://www.beiqiang.online/products/", "zh-CN": "https://www.beiqiang.online/zh/products/", "x-default": "https://www.beiqiang.online/products/" } }, openGraph: { title: `当前在线${productCount}款鞋类产品｜贝强鞋业`, description: "比较当前在线产品资料，并向工厂索取更广的选款范围。", url: "https://www.beiqiang.online/zh/products/", locale: "zh_CN", images: ["https://www.beiqiang.online/og.jpg"] }, twitter: { card: "summary_large_image", title: `当前在线${productCount}款鞋类产品｜贝强鞋业`, description: "比较当前在线产品资料，并向工厂索取更广的选款范围。", images: ["https://www.beiqiang.online/og.jpg"] } };

export default function ChineseProductsPage() {
  return <main><ChineseSiteHeader englishHref="/products/" /><section className="catalog-hero"><p className="eyebrow">当前在线选款</p><h1>比较当前已制作详情页的{products.length}款产品。</h1><p>这里是网站已整理上线的选款，不是贝强工厂全部产品。可按款号、源款号或穿脱结构筛选；若没有目标款，请索取最新选款资料或发送参考图与采购要求。</p><div className="catalog-summary"><span><strong>{products.length}</strong>个当前在线产品页</span><span><strong>{products.filter((product) => product.closure === "Slip-On").length}</strong>款套穿鞋</span><span><strong>{products.filter((product) => product.closure === "Lace-Up").length}</strong>款系带鞋</span></div><div className="hero-actions"><Link className="button" href="/zh/line-sheet/">索取当前产品资料</Link><Link className="text-link" href="/zh/request-quote/?program=reference-style">提交其他款式方向 →</Link></div></section><section className="section catalog-section"><ChineseProductCatalog products={products} /></section><section className="catalog-help"><div><p className="eyebrow eyebrow-light">需要更广的选款范围？</p><h2>先生成候选清单，或直接发送目标款。</h2><p>选款助手基于当前在线产品。其他工厂款式可结合目标市场、数量与参考图由业务进一步审核。</p></div><Link className="button button-light" href="/zh/product-finder/">使用B2B采购选款助手</Link></section><ChineseSiteFooter /></main>;
}
