import type { Metadata } from "next";
import CapabilityPage, { type CapabilityPageData } from "../components/CapabilityPage";
export const metadata: Metadata = { title: "Footwear Sample & Order Process | Beiqiang Footwear", description: "Understand Beiqiang's B2B footwear path from product shortlist and specification check to sample, order confirmation, packing and shipping coordination.", alternates: { canonical: "https://www.beiqiang.online/sample-order-process/", languages: { en: "https://www.beiqiang.online/sample-order-process/", "zh-CN": "https://www.beiqiang.online/zh/sample-order-process/", "x-default": "https://www.beiqiang.online/sample-order-process/" } } };
const data: CapabilityPageData = {
  chineseHref: "/zh/sample-order-process/",
  eyebrow: "SAMPLE-BEFORE-BULK WORKFLOW", title: "Try the sample before you commit to a bulk order.", introduction: "You can start with a few catalogue styles or a reference of your own. We first discuss what you need, then confirm whether a suitable sample can be arranged, what it costs and what you should check.", primaryCta: "Build a quote list", primaryHref: "/request-quote/",
  proofLabel: "FROM SELECTION TO ORDER", proofTitle: "Photos help you choose. A sample helps you decide.", proofCopy: "Use the product photos to narrow your selection. With a sample, you can assess fit, feel and finish against an agreed specification. A sample order and a bulk order are separate decisions.",
  images: [{ src: "/catalog/bq002/01_main.jpg", alt: "BQ002 product evidence for sample selection", caption: "Product shortlist" }, { src: "/factory/sole-check.jpg", alt: "Footwear sole checking during product review", caption: "Specification check" }, { src: "/factory/stock-boxes.jpg", alt: "Footwear stock boxes and order handling", caption: "Order preparation" }],
  stepsTitle: "Your next steps, from first inquiry to shipment.", steps: [
  {
    "title": "Share your starting point",
    "copy": "Send style codes or a reference link, your target market and an estimated quantity. Undecided details can be discussed."
  },
  {
    "title": "Confirm the specification",
    "copy": "Agree materials, sizes, colors and any branding or packing changes. We check what is feasible for the selected style."
  },
  {
    "title": "Arrange a sample",
    "copy": "Confirm availability, sample charge, shipping cost and timing before payment. Agree whether it is a base-style sample or a sample with requested changes."
  },
  {
    "title": "Review and place the bulk order",
    "copy": "Check the sample and resolve any changes first. Then agree the quantity, size breakdown, price, payment terms and production schedule in writing."
  },
  {
    "title": "Check and prepare shipment",
    "copy": "Use the agreed sample and order details as the reference for checking and packing. Confirm shipping documents and handover arrangements."
  }
],
  confirmedTitle: "You can get started on this website", confirmed: [
  "Browse and compare catalogue styles",
  "Ask about one style or send a multi-style quote request",
  "Save your inquiry reference for private follow-up",
  "Contact us through email, WhatsApp or Alibaba.com"
], confirmTitle: "Before paying for a sample", confirm: [
  "Which style, size and color the sample will use",
  "Whether requested changes are included or still to be developed",
  "Sample charge, shipping cost and any agreed terms",
  "Sample preparation and delivery estimates"
],
  closingTitle: "Not ready to choose a style yet?", closingCopy: "Tell us who you sell to and the shoe you are looking for. We can discuss suitable starting styles before you decide what to sample.",
};
export default function SampleOrderProcessPage() { return <CapabilityPage data={data} />; }
