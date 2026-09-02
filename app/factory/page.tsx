import type { Metadata } from "next";
import CapabilityPage, {
  type CapabilityPageData,
} from "../components/CapabilityPage";
import { productCount } from "../data/catalog-meta";

export const metadata: Metadata = {
  title: "Footwear Factory in Quanzhou | Beiqiang Footwear",
  description:
    "Review real Beiqiang workshop, product handling and packing evidence before discussing walking shoe samples and B2B supply requirements.",
  alternates: {
    canonical: "https://www.beiqiang.online/factory/",
    languages: {
      en: "https://www.beiqiang.online/factory/",
      "zh-CN": "https://www.beiqiang.online/zh/factory/",
      "x-default": "https://www.beiqiang.online/factory/",
    },
  },
};

const data: CapabilityPageData = {
  chineseHref: "/zh/factory/",
  factoryReviewPackProductCount: productCount,
  eyebrow: "QUANZHOU FOOTWEAR SUPPLY",
  title: "A factory-side sourcing conversation built on visible evidence.",
  introduction:
    "Beiqiang supplies casual walking shoes, textile footwear and selected verified wide toe box styles from Quanzhou, Fujian. Buyers can review real product packages and working-area evidence before moving into sample and order discussions.",
  primaryCta: "Send a sourcing brief",
  proofLabel: "REAL WORKING-AREA EVIDENCE",
  proofTitle: "Look beyond a generic factory claim.",
  proofCopy:
    "These images come from Beiqiang's verified company material library. They show working areas, footwear handling and carton preparation without unsupported scale or customer-brand claims.",
  images: [
    {
      src: "/factory/workshop.png",
      alt: "Beiqiang footwear workshop area in Quanzhou",
      caption: "Workshop area",
    },
    {
      src: "/factory/workshop-line.png",
      alt: "Footwear workshop line and working tables",
      caption: "Working line",
    },
    {
      src: "/factory/workshop-area.png",
      alt: "Additional footwear workshop area",
      caption: "Factory workspace",
    },
  ],
  evidenceVideo: true,
  stepsTitle: "How we turn a product direction into a checkable project.",
  steps: [
    {
      title: "Shortlist a base style",
      copy: "Start from the current online product selection or send a clear reference for feasibility discussion.",
    },
    {
      title: "Define the market need",
      copy: "Share target country, buyer type, channel, quantity direction and key product requirements.",
    },
    {
      title: "Check specifications",
      copy: "Confirm material, size ratio, colors, construction and packing requirements before final terms.",
    },
    {
      title: "Validate by sample",
      copy: "Use the agreed sample to review the product direction before a bulk-order decision.",
    },
  ],
  confirmedTitle: "What you can review now",
  confirmed: [
    "An expanding selection of organized product packages",
    "Real product galleries and source model references",
    "Workshop, checking and packing images",
    "Direct email, WhatsApp and Alibaba.com contact paths",
  ],
  confirmTitle: "What is confirmed after your brief",
  confirm: [
    "Exact material and construction",
    "Available size and color matrix",
    "Sample arrangement and customization feasibility",
    "MOQ, price, packing, lead time and trade terms",
  ],
  closingTitle: "Start with the style and market, not a vague price request.",
  closingCopy:
    "A useful brief helps us match a product direction, identify missing specifications and prepare a more relevant sample or quotation discussion.",
};
export default function FactoryPage() {
  return <CapabilityPage data={data} />;
}
