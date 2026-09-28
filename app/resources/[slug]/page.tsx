import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import { ResourceCta, ResourceProductLink, ResourceView } from "../../components/ResourceTracking";
import ProductCard from "../../components/ProductCard";
import { products } from "../../data/products";
import { buyerResources, getBuyerResource } from "../../data/resources";

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return buyerResources.map((resource) => ({ slug: resource.slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resource = getBuyerResource((await params).slug); if (!resource) return {};
  const canonical = `https://www.beiqiang.online/resources/${resource.slug}/`;
  return { title: `${resource.title} | Beiqiang Footwear`, description: resource.description, alternates: { canonical, languages: { en: canonical, "zh-CN": `https://www.beiqiang.online/zh/resources/${resource.slug}/`, "x-default": canonical } }, openGraph: { title: resource.title, description: resource.description, url: canonical, type: "article" } };
}

export default async function ResourcePage({ params }: Props) {
  const resource = getBuyerResource((await params).slug); if (!resource) notFound();
  const relatedProducts = resource.relatedProductCodes.map((code) => products.find((product) => product.code === code)).filter((product) => product !== undefined);
  const url = `https://www.beiqiang.online/resources/${resource.slug}/`;
  const structuredData = { "@context": "https://schema.org", "@graph": [
    { "@type": "Article", headline: resource.title, description: resource.description, datePublished: "2026-08-24", dateModified: resource.updated, mainEntityOfPage: url, author: { "@type": "Organization", name: "Quanzhou Beiqiang Footwear & Apparel Co., Ltd." }, publisher: { "@type": "Organization", name: "Quanzhou Beiqiang Footwear & Apparel Co., Ltd." } },
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: "https://www.beiqiang.online/" }, { "@type": "ListItem", position: 2, name: "Sourcing resources", item: "https://www.beiqiang.online/resources/" }, { "@type": "ListItem", position: 3, name: resource.title, item: url }] },
  ] };
  const quoteHref = `/request-quote/?resource=${resource.slug}`;
  return <main><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /><ResourceView slug={resource.slug} /><SiteHeader chineseHref={`/zh/resources/${resource.slug}/`} />
    <div className="resource-breadcrumb"><Link href="/resources/">Sourcing resources</Link><span>›</span><span>{resource.title}</span></div>
    <article className="resource-article">
      <header><p className="eyebrow">{resource.eyebrow}</p><h1>{resource.title}</h1><p>{resource.description}</p><div><span>{resource.audience}</span><span>{resource.readingTime}</span><span>Updated {resource.updated}</span></div></header>
      <section className="resource-article-opening"><p>{resource.introduction}</p><strong>{resource.outcome}</strong></section>
      <div className="resource-article-layout"><div className="resource-article-body">{resource.sections.map((section) => <section key={section.heading}><h2>{section.heading}</h2>{section.copy.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{section.bullets?.length ? <ul>{section.bullets.map((item) => <li key={item}>{item}</li>)}</ul> : null}</section>)}</div><aside className="resource-checklist"><small>BUYER CHECKLIST</small><h2>Prepare before the next review</h2><ol>{resource.checklist.map((item) => <li key={item}>{item}</li>)}</ol><p>Unknown items can be marked for confirmation. Do not guess technical or commercial facts.</p><ResourceCta slug={resource.slug} href={quoteHref}>Use this in a quote request</ResourceCta></aside></div>
    </article>
    <section className="section resource-products"><div className="section-heading"><div><p className="eyebrow">DOCUMENTED PRODUCT REFERENCES</p><h2>Apply the guide to real sourcing candidates.</h2></div><p>Each page separates known product direction from what must still be confirmed before quotation.</p></div><div className="product-grid catalog-grid">{relatedProducts.map((product) => <div key={product.code} className="resource-product-wrapper"><ProductCard product={product} /><ResourceProductLink slug={resource.slug} href={`/products/${product.slug}/`} styleCode={product.code}>Review {product.code} evidence →</ResourceProductLink></div>)}</div></section>
    <section className="resource-article-close"><div><p className="eyebrow eyebrow-light">NEXT COMMERCIAL STEP</p><h2>{resource.nextStep}</h2><p>A website request starts review. Price, samples, production and payment still require written confirmation and the agreed formal transaction channel.</p></div><div><ResourceCta slug={resource.slug} href={quoteHref} className="button button-light">Build this buying brief</ResourceCta><Link href="/resources/">Compare all buyer guides →</Link></div></section>
    <section className="section resource-hub-intro resource-related-guides"><div className="section-heading"><div><p className="eyebrow">MORE BUYER GUIDES</p><h2>Continue with the next decision.</h2></div><p>Each guide covers one point where a sourcing project usually loses clarity. Open the one that matches your next step.</p></div><div className="resource-card-grid">{buyerResources.filter((item) => item.slug !== resource.slug).map((item, index) => <article key={item.slug}><span>{String(index + 1).padStart(2, "0")}</span><small>{item.eyebrow}</small><h3>{item.title}</h3><p>{item.description}</p><div><b>{item.audience}</b><i>{item.readingTime}</i></div><Link href={`/resources/${item.slug}/`}>Open buyer guide <span aria-hidden="true">→</span></Link></article>)}</div></section>
    <SiteFooter />
  </main>;
}
