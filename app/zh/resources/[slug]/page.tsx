import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ChineseProductCard from "../../../components/ChineseProductCard";
import ChineseSiteHeader from "../../../components/ChineseSiteHeader";
import ChineseSiteFooter from "../../../components/ChineseSiteFooter";
import { ResourceCta, ResourceProductLink, ResourceView } from "../../../components/ResourceTracking";
import { products } from "../../../data/products";
import { chineseBuyerResources, getChineseBuyerResource } from "../../../data/resources-zh";

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return chineseBuyerResources.map((resource) => ({ slug: resource.slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resource = getChineseBuyerResource((await params).slug);
  if (!resource) return {};
  const canonical = `https://www.beiqiang.online/zh/resources/${resource.slug}/`;
  const english = `https://www.beiqiang.online/resources/${resource.slug}/`;
  return { title: `${resource.title} | 贝强鞋业`, description: resource.description, alternates: { canonical, languages: { "zh-CN": canonical, en: english, "x-default": english } }, openGraph: { title: resource.title, description: resource.description, url: canonical, type: "article", locale: "zh_CN" } };
}

export default async function ChineseResourcePage({ params }: Props) {
  const resource = getChineseBuyerResource((await params).slug);
  if (!resource) notFound();
  const relatedProducts = resource.relatedProductCodes.map((code) => products.find((product) => product.code === code)).filter((product) => product !== undefined);
  const url = `https://www.beiqiang.online/zh/resources/${resource.slug}/`;
  const structuredData = { "@context": "https://schema.org", "@graph": [
    { "@type": "Article", headline: resource.title, description: resource.description, datePublished: "2026-08-28", dateModified: resource.updated, mainEntityOfPage: url, inLanguage: "zh-CN", author: { "@type": "Organization", name: "Quanzhou Beiqiang Footwear & Apparel Co., Ltd." }, publisher: { "@type": "Organization", name: "Quanzhou Beiqiang Footwear & Apparel Co., Ltd." } },
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "中文首页", item: "https://www.beiqiang.online/zh/" }, { "@type": "ListItem", position: 2, name: "采购知识", item: "https://www.beiqiang.online/zh/resources/" }, { "@type": "ListItem", position: 3, name: resource.title, item: url }] },
  ] };
  const quoteHref = `/zh/request-quote/?resource=${resource.slug}`;
  return <main><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /><ResourceView slug={resource.slug} /><ChineseSiteHeader englishHref={`/resources/${resource.slug}/`} />
    <div className="resource-breadcrumb"><Link href="/zh/resources/">采购知识</Link><span>›</span><span>{resource.title}</span></div>
    <article className="resource-article"><header><p className="eyebrow">{resource.eyebrow}</p><h1>{resource.title}</h1><p>{resource.description}</p><div><span>{resource.audience}</span><span>{resource.readingTime}</span><span>更新于 {resource.updated}</span></div></header>
      <section className="resource-article-opening"><p>{resource.introduction}</p><strong>{resource.outcome}</strong></section>
      <div className="resource-article-layout"><div className="resource-article-body">{resource.sections.map((section) => <section key={section.heading}><h2>{section.heading}</h2>{section.copy.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{section.bullets?.length ? <ul>{section.bullets.map((item) => <li key={item}>{item}</li>)}</ul> : null}</section>)}</div><aside className="resource-checklist"><small>买家清单</small><h2>下一次审核前请准备</h2><ol>{resource.checklist.map((item) => <li key={item}>{item}</li>)}</ol><p>未知项可以标记为待确认；不要猜测技术或商业事实。</p><ResourceCta slug={resource.slug} href={quoteHref}>把清单用于采购询价</ResourceCta></aside></div>
    </article>
    <section className="section resource-products"><div className="section-heading"><div><p className="eyebrow">已有资料的产品参考</p><h2>把指南应用到真实采购候选。</h2></div><p>每个产品页都把已知方向与报价前待确认内容分开。</p></div><div className="product-grid catalog-grid">{relatedProducts.map((product) => <div key={product.code} className="resource-product-wrapper"><ChineseProductCard product={product} /><ResourceProductLink slug={resource.slug} href={`/zh/products/${product.slug}/`} styleCode={product.code}>查看{product.code}证据 →</ResourceProductLink></div>)}</div></section>
    <section className="resource-article-close"><div><p className="eyebrow eyebrow-light">下一商业步骤</p><h2>{resource.nextStep}</h2><p>网站提交只会启动审核；价格、样品、生产和付款仍需书面确认，并进入双方约定的正式交易渠道。</p></div><div><ResourceCta slug={resource.slug} href={quoteHref} className="button button-light">建立这份采购需求</ResourceCta><Link href="/zh/resources/">比较全部采购指南 →</Link></div></section>
    <section className="section resource-hub-intro resource-related-guides"><div className="section-heading"><div><p className="eyebrow">继续阅读</p><h2>按你下一步要解决的问题接着看。</h2></div><p>每篇指南对应采购流程里一个容易失去清晰度的地方，选与你当前阶段相符的那一篇。</p></div><div className="resource-card-grid">{chineseBuyerResources.filter((item) => item.slug !== resource.slug).map((item, index) => <article key={item.slug}><span>{String(index + 1).padStart(2, "0")}</span><small>{item.eyebrow}</small><h3>{item.title}</h3><p>{item.description}</p><div><b>{item.audience}</b><i>{item.readingTime}</i></div><Link href={`/zh/resources/${item.slug}/`}>查看指南 <span aria-hidden="true">→</span></Link></article>)}</div></section>
    <ChineseSiteFooter />
  </main>;
}
