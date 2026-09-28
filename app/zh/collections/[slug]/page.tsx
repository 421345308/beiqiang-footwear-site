import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ChineseProductCard from "../../../components/ChineseProductCard";
import ChineseSiteFooter from "../../../components/ChineseSiteFooter";
import ChineseSiteHeader from "../../../components/ChineseSiteHeader";
import {
  CollectionQuoteLink,
  CollectionView,
} from "../../../components/CollectionTracking";
import {
  chineseCollections,
  getChineseCollection,
} from "../../../data/collections-zh";
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
    alternates: {
      canonical,
      languages: { en: english, "zh-CN": canonical, "x-default": english },
    },
    openGraph: {
      title: `${collection.title}｜贝强鞋业`,
      description: collection.description,
      url: canonical,
      locale: "zh_CN",
      images: ["https://www.beiqiang.online/og.jpg"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${collection.title}｜贝强鞋业`,
      description: collection.description,
      images: ["https://www.beiqiang.online/og.jpg"],
    },
  };
}

export default async function ChineseCollectionPage({ params }: Props) {
  const collection = getChineseCollection((await params).slug);
  if (!collection) notFound();
  const items = productsInCollection(collection.slug);
  const canonical = `https://www.beiqiang.online/zh/collections/${collection.slug}/`;
  const faq = collection.faq ?? [
    {
      question: "这个集合页等于现货或最终订单条件吗？",
      answer: "不等于。集合页只是把当前产品资料归到一起，方便您更快完成选款。可用状态、准确材料、尺码、颜色、MOQ、价格、包装和交期，都要按所选款式和数量确认。",
    },
    {
      question: "可以指定混合颜色或尺码吗？",
      answer: "可以在多款询价中写明需要的颜色与尺码配比。贝强会结合所选款式、数量与当前供应条件审核后，再给出书面报价。",
    },
    {
      question: "选好款式之后下一步是什么？",
      answer: "先保存相关款号，提供目标市场、销售渠道和预计数量，再沟通样品范围与书面商业条款，之后才进入正式订单。",
    },
  ];
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
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
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "首页", item: "https://www.beiqiang.online/zh/" },
          { "@type": "ListItem", position: 2, name: "产品", item: "https://www.beiqiang.online/zh/products/" },
          { "@type": "ListItem", position: 3, name: collection.title, item: canonical },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
  };

  return (
    <main>
      <CollectionView slug={collection.slug} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <ChineseSiteHeader englishHref={`/collections/${collection.slug}/`} />
      <section className="collection-hero">
        <p className="eyebrow">按采购方向选款</p>
        <h1>{collection.title}</h1>
        <p>{collection.description}</p>
        <div className="collection-intent">
          <span>适合买家</span>
          <strong>{collection.buyerIntent}</strong>
        </div>
      </section>
      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{items.length}款当前产品</p>
            <h2>先比较产品信息，再决定需要哪些样品。</h2>
          </div>
          <p>
            每个产品页展示当前资料、真实图库和报价前待确认项；把候选款加入询价单后，可一次提交数量、颜色和尺码需求。
          </p>
        </div>
        <div className="product-grid catalog-grid">
          {items.map((product) => (
            <ChineseProductCard
              key={product.code}
              product={product}
              collectionSlug={collection.slug}
            />
          ))}
        </div>
      </section>
      <section className="proof-section">
        <div className="proof-copy">
          <p className="eyebrow eyebrow-light">证据边界</p>
          <h2>集合帮助选款，不替代逐款确认。</h2>
          <p>{collection.proofBoundary}</p>
          <ul>
            <li>
              <span>01</span> 保存准确款号和候选颜色
            </li>
            <li>
              <span>02</span> 提交市场、数量与尺码配比
            </li>
            <li>
              <span>03</span> 审核样品、报价和正式订单条款
            </li>
          </ul>
          {collection.guideSlug ? (
            <p>
              <Link href={`/zh/resources/${collection.guideSlug}/`}>
                {collection.guideAnchor ?? "阅读该方向的采购指南"} →
              </Link>
            </p>
          ) : null}
        </div>
        <div className="proof-copy">
          <p className="eyebrow eyebrow-light">下一商业步骤</p>
          <h2>建立可由业务人员审核的多款询价。</h2>
          <p>
            网站用于选款和需求整理；正式价格、MOQ、材料、包装、交期与交易方式均需书面确认。
          </p>
          <CollectionQuoteLink
            slug={collection.slug}
            className="button button-light"
            href={`/zh/request-quote/?program=collection-${collection.slug}`}
          >
            建立多款询价
          </CollectionQuoteLink>
        </div>
      </section>
      <section className="section resource-article">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">买家常见问题</p>
            <h2>从产品方向走到可审核的采购需求。</h2>
          </div>
        </div>
        <div className="faq-list">
          {faq.map((item) => (
            <details key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
      <ChineseSiteFooter />
    </main>
  );
}
