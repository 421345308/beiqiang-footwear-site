import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";
import CommercialStartingPoints from "../components/CommercialStartingPoints";

export const metadata: Metadata = {
  title: "B2B Footwear Buying Guide | Beiqiang Footwear",
  description: "Follow Beiqiang's B2B footwear sourcing path from product shortlist and sample review to quotation, Trade Assurance or contract, packing and shipping handover.",
  alternates: { canonical: "https://www.beiqiang.online/buyer-guide/", languages: { en: "https://www.beiqiang.online/buyer-guide/", "zh-CN": "https://www.beiqiang.online/zh/buyer-guide/", "x-default": "https://www.beiqiang.online/buyer-guide/" } },
};

const buyingSteps = [
  ["Shortlist", "Compare documented styles, images, product codes and open confirmation items."],
  ["Define the brief", "Share market, channel, quantity, colors, sizes, branding, packing and target timing."],
  ["Review a sample", "Agree what the sample must validate, including material, construction, fit and appearance."],
  ["Confirm quotation", "Align unit price, quantity, size ratio, packing, trade term, validity and lead time in writing."],
  ["Create the order", "Use a verified Alibaba Trade Assurance order or an agreed bilateral contract after specifications are accepted."],
  ["Follow fulfillment", "Track the agreed order through payment references, sampling or production, checking, packing and shipping handover."],
] as const;

const tradeTerms = [
  ["Not sure yet", "Share the destination, quantity, packing direction and urgency. We can identify what must be quoted before choosing a term."],
  ["EXW", "Product is made available at the agreed pickup point. The buyer's appointed logistics party normally manages onward arrangements, subject to the written agreement."],
  ["FOB", "Used for sea or inland-waterway shipment to an agreed port of loading. Main freight, destination charges and import arrangements are not included unless written otherwise."],
  ["FCA", "Useful when delivery is handed to the buyer's nominated carrier at an agreed place, including many air or multimodal arrangements."],
  ["DDP quote request", "Requires the exact destination, quantity, carton data, packing and timing. Duty, tax, clearance and local delivery are included only when a forwarder confirms the written quote."],
] as const;

const faqs = [
  ["Can I receive one final price from product photos?", "Not reliably. Final price depends on the selected style, confirmed materials, quantity, size ratio, packing, customization and trade requirements."],
  ["How are samples normally delivered?", "Express or courier is commonly discussed for samples. Receiver country, postal code, sample quantity and address details are needed before confirming the arrangement or cost."],
  ["Can you quote delivery to Amazon FBA?", "It can be reviewed after the warehouse country or code, quantity, packing method, carton size, gross weight and requested timing are available. No customs-clearance result is guaranteed in advance."],
  ["Does accepting a quotation create an order?", "No. A quotation records a commercial proposal. The order starts only after both sides confirm the required documents and establish the verified Trade Assurance or contract transaction."],
] as const;

export default function BuyerGuidePage() {
  return <main>
    <SiteHeader chineseHref="/zh/buyer-guide/" />
    <section className="buyer-guide-hero"><div><p className="eyebrow">B2B FOOTWEAR BUYING GUIDE</p><h1>Know every decision before a bulk order starts.</h1><p>Use one evidence-led path from product discovery to sample, quotation, transaction and shipping handover. Each commercial term is confirmed for the selected project rather than assumed from a catalogue page.</p><div className="hero-actions"><Link className="button" href="/request-quote/">Build a shipping-ready quote brief</Link><Link className="text-link" href="/products/">Compare all products →</Link></div></div><aside><small>USEFUL FIRST MESSAGE</small><strong>Product code + target market + sample and bulk quantity + sizes/colors + delivery destination.</strong><p>This gives the factory enough context to answer the next commercial question instead of sending a generic price.</p></aside></section>
    <CommercialStartingPoints />

    <section className="section buyer-guide-steps"><div className="section-heading"><div><p className="eyebrow">FROM SHORTLIST TO HANDOVER</p><h2>Six decisions, one traceable sourcing record.</h2></div><p>The website keeps product evidence, messages, quotation versions, transaction references and buyer-safe progress connected to the original inquiry.</p></div><div>{buyingSteps.map(([title, copy], index) => <article key={title}><span>{String(index + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></section>

    <section className="buyer-guide-brief"><div><p className="eyebrow eyebrow-light">BEFORE ASKING FOR FREIGHT</p><h2>Send the facts that change a logistics quotation.</h2><p>A target market is not always the delivery destination. Give the actual country, city, port, postal code or FBA warehouse direction when available.</p></div><ul><li>Selected style codes and quantities</li><li>Sample or bulk shipment</li><li>Destination and delivery type</li><li>Size ratio and packing direction</li><li>Requested shipping window</li><li>Buyer forwarder or factory-arranged quote</li></ul></section>

    <section className="section buyer-guide-terms"><div className="section-heading compact"><div><p className="eyebrow">TRADE-TERM STARTING POINTS</p><h2>Choose a preference, then confirm the named place.</h2></div></div><div className="trade-term-table"><div><strong>Preference</strong><strong>What it means for the first review</strong></div>{tradeTerms.map(([term, explanation]) => <div key={term}><strong>{term}</strong><p>{explanation}</p></div>)}</div><p className="buyer-guide-boundary">These summaries support an initial inquiry and do not replace the final Incoterm, named place, forwarder instruction, customs advice or signed commercial document.</p></section>

    <section className="buyer-guide-transaction"><article><p className="eyebrow eyebrow-light">TRANSACTION PATH</p><h2>Move payment into a verified order channel.</h2><p>After sample/specification and commercial terms are confirmed, the transaction is recorded through Alibaba Trade Assurance or an agreed bilateral contract. The website does not collect card details, bank passwords or verification codes.</p><Link className="button button-light" href="/sample-order-process/">Review the sample and order process</Link></article><article><p className="eyebrow">BUYER CONTROL</p><h2>Keep the reference and private status code.</h2><p>Each saved request receives a reference and private access code. Use them to review buyer-safe progress, messages, issued quotation versions, transaction documents and fulfillment updates.</p><Link className="text-link" href="/inquiry-status/">Open private request status →</Link></article></section>

    <section className="section buyer-guide-faq"><div className="section-heading compact"><div><p className="eyebrow">COMMERCIAL FAQ</p><h2>Questions to settle before the order document.</h2></div></div><div>{faqs.map(([question, answer]) => <details key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div></section>

    <section className="section capability-closing"><div><p className="eyebrow">NEXT STEP</p><h2>Turn your shortlist into one complete buying brief.</h2><p>Add the styles, quantities, colors and sizes you are considering, then state the destination and preferred trade term. Beiqiang will review what can be confirmed next.</p></div><div className="hero-actions"><Link className="button" href="/request-quote/">Prepare quote request</Link><a className="text-link" href="https://wa.me/8618959805256" target="_blank" rel="noreferrer">Discuss on WhatsApp →</a></div></section>
    <SiteFooter />
  </main>;
}
