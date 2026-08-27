import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "../../components/ProductCard";
import SiteFooter from "../../components/SiteFooter";
import SiteHeader from "../../components/SiteHeader";
import { collections, getCollection, productsInCollection } from "../../data/products";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() { return collections.map((collection) => ({ slug: collection.slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const collection = getCollection((await params).slug);
  if (!collection) return {};
  const canonical = `https://www.beiqiang.online/collections/${collection.slug}/`;
  const chinese = `https://www.beiqiang.online/zh/collections/${collection.slug}/`;
  return { title: `${collection.title} | Beiqiang Footwear`, description: collection.description, alternates: { canonical, languages: { en: canonical, "zh-CN": chinese, "x-default": canonical } }, openGraph: { title: `${collection.title} | Beiqiang Footwear`, description: collection.description, url: canonical, locale: "en_US", images: ["https://www.beiqiang.online/og.jpg"] }, twitter: { card: "summary_large_image", title: `${collection.title} | Beiqiang Footwear`, description: collection.description, images: ["https://www.beiqiang.online/og.jpg"] } };
}

export default async function CollectionPage({ params }: Props) {
  const collection = getCollection((await params).slug);
  if (!collection) notFound();
  const items = productsInCollection(collection.slug);
  const canonical = `https://www.beiqiang.online/collections/${collection.slug}/`;
  const structuredData = { "@context": "https://schema.org", "@type": "CollectionPage", name: collection.title, description: collection.description, url: canonical, inLanguage: "en", mainEntity: { "@type": "ItemList", numberOfItems: items.length, itemListElement: items.map((product, index) => ({ "@type": "ListItem", position: index + 1, name: `${product.code} ${product.name}`, url: `https://www.beiqiang.online/products/${product.slug}/` })) } };
  return <main><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /><SiteHeader chineseHref={`/zh/collections/${collection.slug}/`} /><section className="collection-hero"><p className="eyebrow">BUYER-INTENT COLLECTION</p><h1>{collection.title}</h1><p>{collection.description}</p><div className="collection-intent"><span>BUYER INTENT</span><strong>{collection.buyerIntent}</strong></div></section><section className="section"><div className="section-heading"><div><p className="eyebrow">{items.length} DOCUMENTED OPTIONS</p><h2>Compare styles before you request samples.</h2></div><p>Each product page shows documented facts, real gallery assets and the items that must be confirmed before quotation.</p></div><div className="product-grid catalog-grid">{items.map((product) => <ProductCard key={product.code} product={product} />)}</div></section><section className="catalog-help"><div><p className="eyebrow eyebrow-light">BUILD A MARKET-FIT SHORTLIST</p><h2>Tell us your buyer, channel and expected quantity.</h2><p>We will compare these options and discuss the most suitable samples without forcing unsupported claims across the range.</p></div><Link className="button button-light" href="/request-quote/">Build a multi-style request</Link></section><SiteFooter /></main>;
}
