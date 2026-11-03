import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import { buyerResources } from "../data/resources";

export const metadata: Metadata = {
  title: "Footwear Sourcing Resources for B2B Buyers | Beiqiang",
  description:
    "Practical footwear RFQ, sample approval and private-label sourcing guides for importers, wholesalers, online sellers and brand buyers.",
  alternates: {
    canonical: "https://www.beiqiang.online/resources/",
    languages: {
      en: "https://www.beiqiang.online/resources/",
      "zh-CN": "https://www.beiqiang.online/zh/resources/",
      "x-default": "https://www.beiqiang.online/resources/",
    },
  },
  openGraph: {
    title: "Footwear Sourcing Resources for B2B Buyers",
    description:
      "Build clearer RFQs, control sample approval and move private-label footwear projects toward a formal order.",
    url: "https://www.beiqiang.online/resources/",
    type: "website",
  },
};

export default function ResourcesPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Beiqiang Footwear Sourcing Resources",
    description: metadata.description,
    url: "https://www.beiqiang.online/resources/",
    hasPart: buyerResources.map((resource) => ({
      "@type": "Article",
      headline: resource.title,
      url: `https://www.beiqiang.online/resources/${resource.slug}/`,
    })),
  };
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <SiteHeader chineseHref="/zh/resources/" />
      <section className="resource-hub-hero">
        <div>
          <p className="eyebrow">B2B FOOTWEAR SOURCING RESOURCES</p>
          <h1>Footwear sourcing and private-label guides.</h1>
          <p>
            Prepare for each stage of sourcing, from selecting styles and
            reviewing samples to discussing quotations and packaging.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/request-quote/">
              Build a quote request
            </Link>
            <Link className="text-link" href="/products/">
              Browse current online selection <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
        <aside>
          <strong>Plan your purchase</strong>
          <span>Styles and colours</span>
          <span>Samples and quotations</span>
          <span>Branding and packaging</span>
        </aside>
      </section>
      <section className="section resource-hub-intro">
        <div className="section-heading">
          <div>
            <p className="eyebrow">BUYER GUIDES</p>
            <h2>
              Find the information you need at each stage.
            </h2>
          </div>
          <p>
            Explore practical advice on product selection, sample reviews and
            private-label preparation.
          </p>
        </div>
        <div className="resource-card-grid">
          {buyerResources.map((resource, index) => (
            <article key={resource.slug}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <small>{resource.eyebrow}</small>
              <h3>{resource.title}</h3>
              <p>{resource.description}</p>
              <div>
                <b>{resource.audience}</b>
                <i>{resource.readingTime}</i>
              </div>
              <Link href={`/resources/${resource.slug}/`}>
                Open buyer guide <span aria-hidden="true">→</span>
              </Link>
            </article>
          ))}
        </div>
      </section>
      <section className="resource-evidence-strip">
        <div>
          <p className="eyebrow eyebrow-light">WORK WITH BEIQIANG</p>
          <h2>Start with the styles that fit your range.</h2>
        </div>
        <p>
          Tell us your market, preferred styles, quantities and branding needs.
          We will help you discuss samples and a quotation.
        </p>
      </section>
      <section className="section resource-route-grid">
        <article>
          <small>EXISTING PRODUCT</small>
          <h3>Compare documented styles</h3>
          <p>
            Browse product images, size ranges and construction details.
          </p>
          <Link href="/products/">Open product catalogue →</Link>
        </article>
        <article>
          <small>PRIVATE LABEL</small>
          <h3>Prepare customization scope</h3>
          <p>
            Separate logo and packing requests from changes that require
            feasibility review or sampling.
          </p>
          <Link href="/solutions/private-label-walking-shoes/">
            Open private-label path →
          </Link>
        </article>
        <article>
          <small>TECHNICAL DEVELOPMENT</small>
          <h3>Define buyer targets safely</h3>
          <p>
            Controlled values, new tooling and tests require a development
            brief, not an instant promise.
          </p>
          <Link href="/request-quote/?path=technical_development">
            Start technical brief →
          </Link>
        </article>
      </section>
      <SiteFooter />
    </main>
  );
}
