import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import { buyerResources } from "../data/resources";

export const metadata: Metadata = {
  title: "Footwear Sourcing Resources for B2B Buyers | Beiqiang",
  description: "Practical footwear RFQ, sample approval and private-label sourcing guides for importers, wholesalers, online sellers and brand buyers.",
  alternates: { canonical: "https://www.beiqiang.online/resources/", languages: { en: "https://www.beiqiang.online/resources/", "zh-CN": "https://www.beiqiang.online/zh/resources/" } },
  openGraph: { title: "Footwear Sourcing Resources for B2B Buyers", description: "Build clearer RFQs, control sample approval and move private-label footwear projects toward a formal order.", url: "https://www.beiqiang.online/resources/", type: "website" },
};

export default function ResourcesPage() {
  const structuredData = { "@context": "https://schema.org", "@type": "CollectionPage", name: "Beiqiang Footwear Sourcing Resources", description: metadata.description, url: "https://www.beiqiang.online/resources/", hasPart: buyerResources.map((resource) => ({ "@type": "Article", headline: resource.title, url: `https://www.beiqiang.online/resources/${resource.slug}/` })) };
  return <main><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /><SiteHeader chineseHref="/zh/resources/" />
    <section className="resource-hub-hero"><div><p className="eyebrow">B2B FOOTWEAR SOURCING RESOURCES</p><h1>Turn product interest into a brief your supplier can review.</h1><p>Practical buyer guides for footwear quotation, sample approval and private-label order preparation—written around decisions, evidence and commercial boundaries.</p><div className="hero-actions"><Link className="button" href="/request-quote/">Build a quote request</Link><Link className="text-link" href="/products/">Compare 30 documented styles <span aria-hidden="true">→</span></Link></div></div><aside><strong>Built for B2B decisions</strong><span>No retail checkout</span><span>No invented factory claims</span><span>No automatic production order</span></aside></section>
    <section className="section resource-hub-intro"><div className="section-heading"><div><p className="eyebrow">CHOOSE THE CURRENT DECISION</p><h2>Use one guide at the point where projects usually lose clarity.</h2></div><p>Each resource connects to documented products and a structured next step. Unknown specifications stay visible until confirmed.</p></div><div className="resource-card-grid">{buyerResources.map((resource, index) => <article key={resource.slug}><span>{String(index + 1).padStart(2, "0")}</span><small>{resource.eyebrow}</small><h3>{resource.title}</h3><p>{resource.description}</p><div><b>{resource.audience}</b><i>{resource.readingTime}</i></div><Link href={`/resources/${resource.slug}/`}>Open buyer guide <span aria-hidden="true">→</span></Link></article>)}</div></section>
    <section className="resource-evidence-strip"><div><p className="eyebrow eyebrow-light">EVIDENCE BOUNDARY</p><h2>A guide improves the brief. It does not confirm the product.</h2></div><p>Material, size ratio, price, MOQ, sample arrangement, lead time, packing, testing, availability and formal order terms remain subject to product- and project-specific written confirmation.</p></section>
    <section className="section resource-route-grid"><article><small>EXISTING PRODUCT</small><h3>Compare documented styles</h3><p>Review real galleries, size direction, construction and open confirmation items.</p><Link href="/products/">Open product catalogue →</Link></article><article><small>PRIVATE LABEL</small><h3>Prepare customization scope</h3><p>Separate logo and packing requests from changes that require feasibility review or sampling.</p><Link href="/solutions/private-label-walking-shoes/">Open private-label path →</Link></article><article><small>TECHNICAL DEVELOPMENT</small><h3>Define buyer targets safely</h3><p>Controlled values, new tooling and tests require a development brief, not an instant promise.</p><Link href="/request-quote/?path=technical_development">Start technical brief →</Link></article></section>
    <SiteFooter />
  </main>;
}
