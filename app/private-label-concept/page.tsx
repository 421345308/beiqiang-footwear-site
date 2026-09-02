import type { Metadata } from "next";
import PrivateLabelConceptStudio from "../components/PrivateLabelConceptStudio";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";

export const metadata: Metadata = {
  title: "Private-Label Shoe Concept Studio | Beiqiang Footwear",
  description:
    "Choose a documented Beiqiang shoe style, place a buyer-supplied logo concept, download a visual brief and continue into a structured B2B RFQ.",
  alternates: {
    canonical: "https://www.beiqiang.online/private-label-concept/",
    languages: {
      en: "https://www.beiqiang.online/private-label-concept/",
      "zh-CN": "https://www.beiqiang.online/zh/private-label-concept/",
      "x-default": "https://www.beiqiang.online/private-label-concept/",
    },
  },
};

export default function PrivateLabelConceptPage() {
  return (
    <main>
      <SiteHeader chineseHref="/zh/private-label-concept/" />
      <section className="concept-hero">
        <p className="eyebrow">PRIVATE-LABEL BUYER TOOL</p>
        <h1>Turn one real shoe style into a clearer branding brief.</h1>
        <p>
          Select a documented Beiqiang style, add a logo or brand text, mark the
          intended placement and carry the buyer target into a structured
          quotation request. The preview is a discussion aid—not manufacturing
          approval.
        </p>
      </section>
      <section className="section concept-studio">
        <PrivateLabelConceptStudio />
      </section>
      <section className="concept-process">
        <article>
          <span>01</span>
          <h2>Choose evidence</h2>
          <p>
            Start from a current documented product code instead of an
            unidentified reference.
          </p>
        </article>
        <article>
          <span>02</span>
          <h2>Define the buyer target</h2>
          <p>
            Record artwork readiness, intended placement and notes without
            claiming production feasibility.
          </p>
        </article>
        <article>
          <span>03</span>
          <h2>Submit for review</h2>
          <p>
            Continue into the RFQ, then upload the downloaded concept through
            the protected buyer project when needed.
          </p>
        </article>
      </section>
      <SiteFooter />
    </main>
  );
}
