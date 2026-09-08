import type { Metadata } from "next";
import CapabilityPage, { type CapabilityPageData } from "../components/CapabilityPage";
export const metadata: Metadata = { title: "Footwear Checking & Packing | Beiqiang Footwear", description: "See real footwear checking, sorting and carton preparation evidence, plus the specifications buyers should confirm before bulk orders.", alternates: { canonical: "https://www.beiqiang.online/quality-packing/", languages: { en: "https://www.beiqiang.online/quality-packing/", "zh-CN": "https://www.beiqiang.online/zh/quality-packing/", "x-default": "https://www.beiqiang.online/quality-packing/" } } };
const data: CapabilityPageData = {
  chineseHref: "/zh/quality-packing/",
  eyebrow: "PRODUCT CHECKING & PACKING", title: "Agree the checks before your shoes are packed.", introduction: "For a wholesale order, the right shoes need to arrive in the right sizes, colors and packaging. Share your requirements early so the product checks and packing instructions can be agreed before an order is placed.", primaryCta: "Prepare an order brief",
  proofLabel: "CHECKING & PACKING", proofTitle: "See how shoes are handled before packing.", proofCopy: "These scenes from our factory video show shoe handling and packing preparation. For your order, we agree the inspection points and packaging details separately; a workshop video is not a test report.",
  images: [{ src: "/factory-video-stills/shoe-packing.webp", alt: "A worker handling a finished pair before packing", caption: "Pair handling before packing" }, { src: "/factory-video-stills/packing-preparation.webp", alt: "Shoe-box wrapping and packing preparation", caption: "Shoe-box packing preparation" }, { src: "/factory-video-stills/assembly-line.webp", alt: "Shoes moving through a production-line handling station", caption: "Production-line handling" }],
  stepsTitle: "What to put on your order checklist.", steps: [
  {
    "title": "Agree the reference",
    "copy": "Use the approved sample and written specification to define the style, materials, colors and finish."
  },
  {
    "title": "Set the size and color breakdown",
    "copy": "List pairs by size and color, then check that the totals match your order. Specify any assortment or labeling requirements."
  },
  {
    "title": "Specify the checks",
    "copy": "Tell us the defects, tolerances or tests that matter to you. Any testing or third-party inspection must be agreed before booking or production."
  },
  {
    "title": "Confirm the packing instructions",
    "copy": "Agree shoe boxes, labels, outer cartons and shipping marks. Confirm packing data and the handover arrangements before shipment."
  }
],
  confirmedTitle: "What you can see here", confirmed: [
  "Manual handling and checking of shoes",
  "Shoes being organized for packing",
  "Shoe boxes and carton preparation",
  "Photos of the individual catalogue styles"
], confirmTitle: "Details to include in your order", confirm: ["Inspection criteria and tolerances", "Pair, box, label and carton requirements", "Size ratio and color allocation", "Carton marks, shipping documents and handover timing"],
  closingTitle: "Have a packing guide or inspection checklist?", closingCopy: "Mention it with your selected styles. After submitting the inquiry, you can attach the file privately using your inquiry reference and access code.",
};
export default function QualityPackingPage() { return <CapabilityPage data={data} />; }
