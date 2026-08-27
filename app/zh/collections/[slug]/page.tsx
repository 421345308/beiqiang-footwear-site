import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ChineseProductCard from "../../../components/ChineseProductCard";
import ChineseSiteFooter from "../../../components/ChineseSiteFooter";
import ChineseSiteHeader from "../../../components/ChineseSiteHeader";
import { CollectionQuoteLink, CollectionView } from "../../../components/CollectionTracking";
import { chineseCollections, getChineseCollection } from "../../../data/collections-zh";
import { productsInCollection } from "../../../data/products";
import { productNameZh } from "../../../data/products-zh";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return chineseCollections.map((collection) => ({ slug: collection.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const collection = getChineseCollection((await params).slug);
  if (!collection) return {};
  const canonical = `https://www.beiqiang.online/zh/collections/${collection.slug}/`;
  const english = `https://www.beiqiang.online/collections/${collection.slug}/`;
  return {
    title: `${collection.title}｜贝强鞋业`,
    description: collection.description,
    alternates: { canonical, languages: { en: english, "zh-CN": canonical, "x-default": english } },
    openGraph: { title: `${collection.title}｜贝强鞋业`, description: collection.description, url: canonical, locale: "zh_CN", images: ["https://www.beiqiang.online/og.jpg"] },
    twitter: { card: "summary_large_image", title: `${collection.title}｜贝强鞋业`, description: collection.description, images: ["https://www.beiqiang.online/og.jpg"] },
  };
}

export default async function ChineseCollectionPage({ params }: Props) {
  const collection = getChineseCollection((await params).slug);
  if (!collection) notFound();
  const items = productsInCollection(collection.slug);
  const canonical = `https://www.beiqiang.online/zh/collections/${collection.slug}/`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: collection.title,
    description: collection.description,
    url: canonical,
    inLanguage: "zh-CN",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListElement: items.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: `${product.code} ${productNameZh(product)}`,
        url: `https://www.beiqiang.online/zh/products/${product.slug}/`,
      })),
    },
  };

  return <main>
    <CollectionView slug={collection.slug} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    <ChineseSiteHeader englishHref={`/collections/${collection.slug}/`} />
    <section className="collection-hero"><p className="eyebrow">按采购方向选款</p><h1>{collection.title}</h1><p>{collection.description}</p><div className="collection-intent"><span>适合买家</span><strong>{collection.buyerIntent}</strong></div></section>
    <section className="section"><div className="section-heading"><div><p className="eyebrow">{items.length}款已有资料候选</p><h2>先比较产品证据，再决定需要哪些样品。</h2></div><p>每个产品页展示已整理事实、真实图库和报价前待确认项；把候选款加入询价单后，可一次提交数量、颜色和尺码需求。</p></div><div className="product-grid catalog-grid">{items.map((product) => <ChineseProductCard key={product.code} product={product} collectionSlug={collection.slug} />)}</div></section>
    <section className="proof-section"><div className="proof-copy"><p className="eyebrow eyebrow-light">证据边界</p><h2>集合帮助选款，不替代逐款确认。</h2><p>{collection.proofBoundary}</p><ul><li><span>01</span> 保存准确款号和候选颜色</li><li><span>02</span> 提交市场、数量与尺码配比</li><li><span>03</span> 审核样品、报价和正式订单条款</li></ul></div><div className="proof-copy"><p className="eyebrow eyebrow-light">下一商业步骤</p><h2>建立可由业务人员审核的多款询价。</h2><p>网站用于选款和需求整理；正式价格、MOQ、材料、包装、交期与交易方式均需书面确认。</p><CollectionQuoteLink slug={collection.slug} className="button button-light" href={`/zh/request-quote/?program=collection-${collection.slug}`}>建立多款询价</CollectionQuoteLink></div></section>
    <ChineseSiteFooter />
  </main>;
}
