import type { Metadata } from "next";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";
import SourcingReviewForm from "../components/SourcingReviewForm";

export const metadata: Metadata = { title: "Footwear Sourcing & Custom Shoe Inquiry | Beiqiang", description: "Ask Beiqiang for help selecting wholesale shoes or discussing a custom reference. Share your market and quantity to explore suitable styles and sample options.", alternates: { canonical: "https://www.beiqiang.online/sourcing-review/", languages: { en: "https://www.beiqiang.online/sourcing-review/", "zh-CN": "https://www.beiqiang.online/zh/sourcing-review/", "x-default": "https://www.beiqiang.online/sourcing-review/" } } };

export default function SourcingReviewPage() { return <main>
  <SiteHeader chineseHref="/zh/sourcing-review/" />
  <section className="finder-hero"><p className="eyebrow">FOOTWEAR SOURCING HELP</p><h1>Looking for a shoe you have not found yet?</h1><p>Tell us who you sell to, the style you have in mind and your estimated quantity. You do not need a catalogue code or a finished specification to start. Reference links are welcome.</p></section>
  <section className="section sourcing-review-layout">
    <aside><p className="eyebrow">WHAT HAPPENS NEXT</p><h2>First, we work out whether there is a suitable starting point.</h2>
      <ol><li><strong>Review your requirements</strong><span>We compare your needs with our existing styles. If there is no suitable match, we explain that rather than substitute a different shoe.</span></li>
      <li><strong>Discuss styles and changes</strong><span>Where suitable options exist, we can suggest 2–4 candidates and discuss what would need to change. A reference is not a promise we can produce it.</span></li>
      <li><strong>Agree the next step</strong><span>We confirm what is needed for a sample or quotation, including costs and timing before you commit.</span></li></ol>
      <small>This is an inquiry, not an order. Availability, customization, price and timing require written confirmation. You can attach reference images privately after submitting; discuss NDA terms before sharing confidential files.</small>
    </aside>
    <SourcingReviewForm />
  </section><SiteFooter />
</main>; }
