import type { Metadata } from "next";
import Link from "next/link";
import ChineseProductCatalog from "../../components/ChineseProductCatalog";
import ChineseSiteFooter from "../../components/ChineseSiteFooter";
import ChineseSiteHeader from "../../components/ChineseSiteHeader";
import { products, type CollectionSlug } from "../../data/products";
import { productCount } from "../../data/catalog-meta";
import {
  type CatalogDirection,
  productMatchesCatalogDirection,
} from "../../lib/catalog-filtering";

const chineseDirections: Array<{
  key: CatalogDirection;
  slug: CollectionSlug;
  title: string;
  copy: string;
}> = [
  {
    key: "wide-toe-box",
    slug: "wide-toe-box",
    title: "宽鞋头舒适步行鞋",
    copy: "查看已经确认宽鞋头结构的款式，适合舒适鞋采购与系列选款。",
  },
  {
    key: "knit-slip-on",
    slug: "knit-slip-on",
    title: "针织易穿步行鞋",
    copy: "适合关注穿脱便利、日常步行与系列广度的采购项目。",
  },
  {
    key: "breathable-lace-up",
    slug: "breathable-lace-up",
    title: "透气系带步行鞋",
    copy: "查看针织、网布和织物系带鞋的不同轮廓与颜色方向。",
  },
  { key: "high_top", slug: "high-top-shoes", title: "高帮与袜套款", copy: "集中查看适合季节性或差异化选款的较高鞋帮轮廓。" },
  { key: "kids", slug: "kids-shoes", title: "儿童鞋", copy: "把当前已整理的儿童鞋款集中到同一采购入口。" },
  { key: "large_size", slug: "extended-size-shoes", title: "扩展尺码方向", copy: "查看资料中尺码方向延伸至较大欧码的现有款式。" },
  { key: "fleece", slug: "fleece-lined-shoes", title: "加绒选项", copy: "查看颜色资料中已经记录可选加绒方向的款式。" },
];

export const metadata: Metadata = {
  title: `当前在线${productCount}款鞋类产品｜贝强鞋业`,
  description: `查看贝强鞋业当前已制作在线详情页的${productCount}款B2B鞋类产品；这不是工厂全部产品，可另行索取最新选款资料或提交参考款。`,
  alternates: {
    canonical: "https://www.beiqiang.online/zh/products/",
    languages: {
      en: "https://www.beiqiang.online/products/",
      "zh-CN": "https://www.beiqiang.online/zh/products/",
      "x-default": "https://www.beiqiang.online/products/",
    },
  },
  openGraph: {
    title: `当前在线${productCount}款鞋类产品｜贝强鞋业`,
    description: "比较当前在线产品资料，并向工厂索取更广的选款范围。",
    url: "https://www.beiqiang.online/zh/products/",
    locale: "zh_CN",
    images: ["https://www.beiqiang.online/og.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: `当前在线${productCount}款鞋类产品｜贝强鞋业`,
    description: "比较当前在线产品资料，并向工厂索取更广的选款范围。",
    images: ["https://www.beiqiang.online/og.jpg"],
  },
};

export default function ChineseProductsPage() {
  return (
    <main>
      <ChineseSiteHeader englishHref="/products/" />
      <section className="catalog-hero">
        <p className="eyebrow">当前在线选款</p>
        <h1>比较当前已制作详情页的{products.length}款产品。</h1>
        <p>
          这里是网站已整理上线的选款，不是贝强工厂全部产品。可按款号、源款号或穿脱结构筛选；若没有目标款，请索取最新选款资料或发送参考图与采购要求。
        </p>
        <div className="catalog-summary">
          <span>
            <strong>{products.length}</strong>个当前在线产品页
          </span>
          <span>
            <strong>
              {
                products.filter((product) => product.closure === "Slip-On")
                  .length
              }
            </strong>
            款套穿鞋
          </span>
          <span>
            <strong>
              {
                products.filter((product) => product.closure === "Lace-Up")
                  .length
              }
            </strong>
            款系带鞋
          </span>
        </div>
        <div className="hero-actions">
          <Link className="button" href="/zh/line-sheet/">
            索取当前产品资料
          </Link>
          <Link
            className="text-link"
            href="/zh/request-quote/?program=reference-style"
          >
            提交其他款式方向 →
          </Link>
        </div>
      </section>
      <section
        className="catalog-directions"
        aria-labelledby="catalog-direction-title"
      >
        <div>
          <p className="eyebrow">先按采购方向查看</p>
          <h2 id="catalog-direction-title">先看产品方向，再看具体款式。</h2>
          <p>
            选择最接近目标市场的产品系列，再使用目录筛选器缩小当前在线选款。
          </p>
        </div>
        <div className="catalog-direction-grid">
          {chineseDirections.map((direction) => (
            <Link
              key={direction.key}
              href={`/zh/collections/${direction.slug}/`}
            >
              <span>
                {
                  products.filter((product) =>
                    productMatchesCatalogDirection(product, direction.key),
                  ).length
                }
                款当前产品
              </span>
              <h3>{direction.title}</h3>
              <p>{direction.copy}</p>
              <strong>打开采购系列 →</strong>
            </Link>
          ))}
        </div>
      </section>
      <section className="section catalog-section" id="catalog">
        <ChineseProductCatalog products={products} />
      </section>
      <section className="catalog-help">
        <div>
          <p className="eyebrow eyebrow-light">需要更广的选款范围？</p>
          <h2>先生成候选清单，或直接发送目标款。</h2>
          <p>
            选款助手基于当前在线产品。其他工厂款式可结合目标市场、数量与参考图由业务进一步审核。
          </p>
        </div>
        <Link className="button button-light" href="/zh/product-finder/">
          使用B2B采购选款助手
        </Link>
      </section>
      <ChineseSiteFooter />
    </main>
  );
}
