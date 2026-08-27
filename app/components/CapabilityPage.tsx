import Link from "next/link";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import FactoryEvidenceVideo from "./FactoryEvidenceVideo";

export type CapabilityPageData = {
  eyebrow: string;
  title: string;
  introduction: string;
  primaryCta: string;
  primaryHref?: string;
  proofLabel: string;
  proofTitle: string;
  proofCopy: string;
  images: { src: string; alt: string; caption: string }[];
  evidenceVideo?: boolean;
  stepsTitle: string;
  steps: { title: string; copy: string }[];
  confirmedTitle: string;
  confirmed: string[];
  confirmTitle: string;
  confirm: string[];
  closingTitle: string;
  closingCopy: string;
};

export default function CapabilityPage({ data }: { data: CapabilityPageData }) {
  const webImage = (src: string) => src.startsWith("/factory/") ? src.replace("/factory/", "/factory-web/").replace(/\.(?:jpe?g|png)$/i, ".webp") : src;
  return (
    <main>
      <SiteHeader />
      <section className="capability-hero">
        <div>
          <p className="eyebrow">{data.eyebrow}</p>
          <h1>{data.title}</h1>
          <p className="hero-lead">{data.introduction}</p>
          <div className="hero-actions">
            <Link className="button" href={data.primaryHref || "/#inquiry"}>{data.primaryCta}</Link>
            <Link className="text-link" href="/products/">Shortlist products <span aria-hidden="true">→</span></Link>
          </div>
        </div>
        <aside className="capability-brief">
          <small>FOR A USEFUL FIRST REPLY</small>
          <strong>Share your market, channel, style references, expected quantity and target timing.</strong>
          <p>We confirm high-impact specifications and commercial terms style by style.</p>
        </aside>
      </section>

      <section className="section capability-proof">
        <div className="section-heading">
          <div><p className="eyebrow">{data.proofLabel}</p><h2>{data.proofTitle}</h2></div>
          <p>{data.proofCopy}</p>
        </div>
        {data.evidenceVideo && <FactoryEvidenceVideo />}
        <div className="capability-gallery">
          {data.images.map((image, index) => (
            <figure key={image.src} className={index === 0 ? "capability-gallery-lead" : ""}>
              <img src={webImage(image.src)} alt={image.alt} loading={index > 0 ? "lazy" : undefined} decoding="async" />
              <figcaption>{image.caption}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="section capability-process">
        <div className="section-heading compact"><div><p className="eyebrow">BUYER WORKFLOW</p><h2>{data.stepsTitle}</h2></div></div>
        <div className="capability-step-grid">
          {data.steps.map((step, index) => <article key={step.title}><span>{String(index + 1).padStart(2, "0")}</span><h3>{step.title}</h3><p>{step.copy}</p></article>)}
        </div>
      </section>

      <section className="capability-checks">
        <article><p className="eyebrow eyebrow-light">EVIDENCE AVAILABLE</p><h2>{data.confirmedTitle}</h2><ul>{data.confirmed.map((item) => <li key={item}>{item}</li>)}</ul></article>
        <article><p className="eyebrow">ORDER-BY-ORDER CHECK</p><h2>{data.confirmTitle}</h2><ul>{data.confirm.map((item) => <li key={item}>{item}</li>)}</ul></article>
      </section>

      <section className="section capability-closing">
        <div><p className="eyebrow">NEXT STEP</p><h2>{data.closingTitle}</h2><p>{data.closingCopy}</p></div>
        <div className="hero-actions"><Link className="button" href={data.primaryHref || "/#inquiry"}>Send sourcing requirements</Link><a className="text-link" href="https://wa.me/8618959805256" target="_blank" rel="noreferrer">Discuss on WhatsApp <span aria-hidden="true">→</span></a></div>
      </section>
      <SiteFooter />
    </main>
  );
}
