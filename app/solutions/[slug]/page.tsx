import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "../../components/ProductCard";
import SiteFooter from "../../components/SiteFooter";
import SiteHeader from "../../components/SiteHeader";
import {
  SourcingProgramCta,
  SourcingProgramView,
} from "../../components/SourcingProgramTracking";
import { products } from "../../data/products";
import {
  getSourcingProgram,
  sourcingPrograms,
} from "../../data/sourcing-programs";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return sourcingPrograms.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const program = getSourcingProgram((await params).slug);
  if (!program) return {};
  const canonical = `https://www.beiqiang.online/solutions/${program.slug}/`;
  return {
    title: `${program.title} | Beiqiang Footwear`,
    description: program.description,
    alternates: {
      canonical,
      languages: {
        en: canonical,
        "zh-CN": `https://www.beiqiang.online/zh/solutions/${program.slug}/`,
      },
    },
    openGraph: {
      title: program.title,
      description: program.description,
      url: canonical,
      type: "website",
    },
  };
}

export default async function SourcingProgramPage({ params }: Props) {
  const program = getSourcingProgram((await params).slug);
  if (!program) notFound();
  const selectedProducts = program.productCodes
    .map((code) => products.find((product) => product.code === code))
    .filter((product) => product !== undefined);
  const quoteHref = `/request-quote/?program=${program.slug}&path=${program.projectPath}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: program.title,
        description: program.description,
        provider: {
          "@type": "Organization",
          name: "Quanzhou Beiqiang Footwear & Apparel Co., Ltd.",
        },
        areaServed: ["United States", "Europe"],
        serviceType: program.pathLabel,
        url: `https://www.beiqiang.online/solutions/${program.slug}/`,
      },
      {
        "@type": "FAQPage",
        mainEntity: program.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://www.beiqiang.online/",
          },
          { "@type": "ListItem", position: 2, name: "Sourcing programs" },
          {
            "@type": "ListItem",
            position: 3,
            name: program.title,
            item: `https://www.beiqiang.online/solutions/${program.slug}/`,
          },
        ],
      },
    ],
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <SourcingProgramView slug={program.slug} />
      <SiteHeader chineseHref={`/zh/solutions/${program.slug}/`} />
      <section className="sourcing-program-hero">
        <div>
          <p className="eyebrow">{program.eyebrow}</p>
          <h1>{program.title}</h1>
          <p>{program.description}</p>
          <div className="hero-actions">
            <SourcingProgramCta slug={program.slug} href={quoteHref}>
              Build a project brief
            </SourcingProgramCta>
            <Link className="text-link" href="/products/">
              Browse current online selection <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
        <aside>
          <small>BEST FIT</small>
          <strong>{program.buyerIntent}</strong>
          <span>{program.pathLabel}</span>
        </aside>
      </section>

      <section className="section sourcing-program-value">
        <div className="section-heading">
          <div>
            <p className="eyebrow">COMMERCIAL STARTING POINT</p>
            <h2>Turn product interest into a decision-ready inquiry.</h2>
          </div>
          <p>{program.evidenceBoundary}</p>
        </div>
        <div>
          {program.benefits.map((benefit, index) => (
            <article key={benefit.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{benefit.title}</h3>
              <p>{benefit.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="sourcing-program-brief">
        <div>
          <p className="eyebrow eyebrow-light">WHAT TO PREPARE</p>
          <h2>A complete first brief reduces quotation delays.</h2>
          <p>
            You do not need every answer before contacting us. Mark unknown
            items clearly so the next reply can separate confirmed facts from
            open decisions.
          </p>
        </div>
        <ul>
          {program.briefItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">RELEVANT PRODUCT REFERENCES</p>
            <h2>Start with six documented directions.</h2>
          </div>
          <p>
            Open each product page for the real gallery, current documented
            facts and the exact items that still require confirmation.
          </p>
        </div>
        <div className="product-grid catalog-grid">
          {selectedProducts.map((product) => (
            <ProductCard key={product.code} product={product} />
          ))}
        </div>
      </section>

      <section className="section sourcing-program-workflow">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">BUYER WORKFLOW</p>
            <h2>Three controlled decisions before an order.</h2>
          </div>
        </div>
        <div>
          {program.workflow.map((step, index) => (
            <article key={step.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section sourcing-program-faq">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">BUYER QUESTIONS</p>
            <h2>Commercial boundaries before you submit.</h2>
          </div>
        </div>
        <div>
          {program.faq.map((item) => (
            <details key={item.question}>
              <summary>
                {item.question}
                <span aria-hidden="true">+</span>
              </summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="sourcing-program-close">
        <div>
          <p className="eyebrow eyebrow-light">NEXT COMMERCIAL STEP</p>
          <h2>Send one brief that sales can actually review.</h2>
          <p>
            Choose products first or begin with your project requirements.
            Quotations, sample terms and order terms are confirmed in writing.
          </p>
        </div>
        <div>
          <SourcingProgramCta
            slug={program.slug}
            href={quoteHref}
            className="button button-light"
          >
            Start this sourcing path
          </SourcingProgramCta>
          <a
            href="https://wa.me/8618959805256"
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp +86 189 5980 5256 →
          </a>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
