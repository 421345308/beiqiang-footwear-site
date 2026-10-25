import type { Metadata } from "next";
import Link from "next/link";
import { discoveryCategories } from "../../data/product-discovery";
import { notFound } from "next/navigation";
import ProductCard from "../../components/ProductCard";
import SiteFooter from "../../components/SiteFooter";
import SiteHeader from "../../components/SiteHeader";
import {
  CollectionQuoteLink,
  CollectionView,
} from "../../components/CollectionTracking";
import {
  collections,
  getCollection,
  productsInCollection,
} from "../../data/products";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return collections.map((collection) => ({ slug: collection.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const collection = getCollection((await params).slug);
  if (!collection) return {};
  const canonical = `https://www.beiqiang.online/collections/${collection.slug}/`;
  const chinese = `https://www.beiqiang.online/zh/collections/${collection.slug}/`;
  return {
    title: `${collection.title} | Beiqiang Footwear`,
    description: collection.description,
    alternates: {
      canonical,
      languages: { en: canonical, "zh-CN": chinese, "x-default": canonical },
    },
    openGraph: {
      title: `${collection.title} | Beiqiang Footwear`,
      description: collection.description,
      url: canonical,
      locale: "en_US",
      images: ["https://www.beiqiang.online/og.jpg"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${collection.title} | Beiqiang Footwear`,
      description: collection.description,
      images: ["https://www.beiqiang.online/og.jpg"],
    },
  };
}

export default async function CollectionPage({ params }: Props) {
  const collection = getCollection((await params).slug);
  if (!collection) notFound();
  const items = productsInCollection(collection.slug);
  const canonical = `https://www.beiqiang.online/collections/${collection.slug}/`;
  const faq = collection.faq ?? [
    {
      question: "Does this collection confirm current stock or final order terms?",
      answer: "No. It groups current product records for a faster sourcing review. Availability, exact materials, sizes, colors, MOQ, price, packing and timing are confirmed for the selected project.",
    },
    {
      question: "Can I request mixed colors or sizes?",
      answer: "You can include the requested color and size ratio in the multi-style inquiry. Beiqiang reviews it against the selected styles, quantity and current supply conditions before quotation.",
    },
    {
      question: "What is the next step after choosing styles?",
      answer: "Save the relevant product codes, provide your target market, channel and expected quantity, then discuss sample scope and written commercial terms before any formal order.",
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
        inLanguage: "en",
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: items.length,
          itemListElement: items.map((product, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: `${product.code} ${product.name}`,
            url: `https://www.beiqiang.online/products/${product.slug}/`,
          })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.beiqiang.online/" },
          { "@type": "ListItem", position: 2, name: "Products", item: "https://www.beiqiang.online/products/" },
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
    <main lang="en" className="studio-page studio-collection">
      <CollectionView slug={collection.slug} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <SiteHeader chineseHref={`/zh/collections/${collection.slug}/`} />
      <section className="collection-hero">
        <p className="eyebrow">FOOTWEAR COLLECTION</p>
        <h1>{collection.title}</h1>
        <p>{collection.description}</p>

      </section>

      <nav className="collection-switcher" aria-label="Product collections"><Link href="/products/">All products</Link>{discoveryCategories.map(item => <Link key={item.slug} href={`/collections/${item.slug}/`} aria-current={item.slug === collection.slug ? "page" : undefined}>{item.en}</Link>)}</nav>
      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{items.length} DOCUMENTED OPTIONS</p>
            <h2>Explore the styles.</h2>
          </div>
          <p>Each product page shows reviewed facts, real gallery assets and the items that must be confirmed before quotation.</p>
        </div>
        <div className="product-grid catalog-grid studio-product-grid">
          {items.map((product) => (
            <ProductCard key={product.code} product={product} collectionSlug={collection.slug} />
          ))}
        </div>
      </section>

      <section className="proof-section">
        <div className="proof-copy">
          <p className="eyebrow eyebrow-light">ABOUT THIS COLLECTION</p>
          <h2>Product selection notes.</h2>
          <p>{collection.selectionBasis}</p>
          <ul>
            <li><span>01</span> Compare documented construction and silhouette</li>
            <li><span>02</span> Check product-level size and color directions</li>
            <li><span>03</span> Shortlist styles for a sample discussion</li>
          </ul>
          {collection.guideSlug ? (
            <p>
              <Link href={`/resources/${collection.guideSlug}/`}>
                {collection.guideAnchor ?? "Read the sourcing guide for this direction"} →
              </Link>
            </p>
          ) : null}
        </div>
        <div className="proof-copy">
          <p className="eyebrow eyebrow-light">ORDER REQUIREMENTS</p>
          <h2>Confirm the details for your order.</h2>
          <p>{collection.proofBoundary}</p>
          <p>Price, MOQ, current availability, packing, lead time and trade terms require written confirmation for the selected products and quantity.</p>
        </div>
      </section>

      <section className="section resource-article">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">BUYER QUESTIONS</p>
            <h2>Questions about this collection.</h2>
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

      <section className="catalog-help">
        <div>
          <p className="eyebrow eyebrow-light">BUILD A MARKET-FIT SHORTLIST</p>
          <h2>Tell us your buyer, channel and expected quantity.</h2>
          <p>Include your selected style codes, colours and sizes so we can review samples and prepare a quotation.</p>
        </div>
        <CollectionQuoteLink
          slug={collection.slug}
          className="button button-light"
          href={`/request-quote/?program=collection-${collection.slug}`}
        >
          Build a multi-style request
        </CollectionQuoteLink>
      </section>
      <SiteFooter />
    </main>
  );
}
